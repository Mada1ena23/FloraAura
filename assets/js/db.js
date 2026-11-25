import {
  collection,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';
import { auth, firestore } from './firebase.js';

const DB_NAME = 'FloraAuraDB';
const DB_VERSION = 1;
const STORE_NAME = 'plants';
const FAVORITES_STORAGE_KEY = 'floraura-favorites-v1';
const CATALOG_STORAGE_KEY = 'floraura-catalog-v1';
const WATERING_NOTIFICATIONS_KEY = 'floraura-watering-notifications-v1';
const MIGRATION_KEY = 'floraura-firebase-migration-v1';
const BACKUP_FORMAT = 'floraura-backup';
const BACKUP_VERSION = 1;
const FIRESTORE_BATCH_SIZE = 450;
const EMPTY_CATALOG_STATE = { plants: [], hiddenIds: [] };

function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Inicia sessão para aceder aos dados do jardim.');
  return user;
}

function isValidPlantId(plantId) {
  return Number.isSafeInteger(plantId) && plantId > 0
    || typeof plantId === 'string' && plantId.length > 0 && !plantId.includes('/');
}

function plantsCollection() {
  const { uid } = getCurrentUser();
  return collection(firestore, 'users', uid, 'plants');
}

function settingsDocument() {
  const { uid } = getCurrentUser();
  return doc(firestore, 'users', uid, 'settings', 'app');
}

function validateCatalogState(state) {
  if (
    !state ||
    typeof state !== 'object' ||
    !Array.isArray(state.plants) ||
    !Array.isArray(state.hiddenIds) ||
    state.hiddenIds.some((id) => typeof id !== 'string') ||
    state.plants.some((plant) => (
      !plant ||
      typeof plant !== 'object' ||
      typeof plant.id !== 'string' ||
      typeof plant.name !== 'string' ||
      !plant.name.trim()
    ))
  ) {
    throw new Error('O catálogo pessoal guardado tem um formato inválido.');
  }
  return state;
}

function validateFavorites(favorites) {
  if (!Array.isArray(favorites) || favorites.some((id) => typeof id !== 'string')) {
    throw new Error('Os favoritos guardados têm um formato inválido.');
  }
  return favorites;
}

function normalizeSettings(snapshot) {
  if (!snapshot.exists()) {
    return { favorites: [], catalogState: EMPTY_CATALOG_STATE };
  }

  const data = snapshot.data();
  return {
    favorites: data.favorites === undefined ? [] : validateFavorites(data.favorites),
    catalogState: data.catalogState === undefined
      ? EMPTY_CATALOG_STATE
      : validateCatalogState(data.catalogState)
  };
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

async function getLocalPlants() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || request.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || request.error);
    };
  });
}

function readLegacyFavorites() {
  const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (stored === null) return [];
  return validateFavorites(JSON.parse(stored));
}

function readLegacyCatalogState() {
  const stored = localStorage.getItem(CATALOG_STORAGE_KEY);
  if (stored === null) return EMPTY_CATALOG_STATE;
  return validateCatalogState(JSON.parse(stored));
}

async function commitOperations(operations) {
  for (let index = 0; index < operations.length; index += FIRESTORE_BATCH_SIZE) {
    const batch = writeBatch(firestore);
    operations.slice(index, index + FIRESTORE_BATCH_SIZE).forEach((operation) => {
      if (operation.type === 'delete') {
        batch.delete(operation.reference);
      } else {
        batch.set(operation.reference, operation.data);
      }
    });
    await batch.commit();
  }
}

export async function initializeUserData() {
  getCurrentUser();
  const settingsRef = settingsDocument();
  const migrationNeeded = localStorage.getItem(MIGRATION_KEY) !== 'complete';
  const [settingsSnapshot, localPlants] = await Promise.all([
    getDoc(settingsRef),
    migrationNeeded ? getLocalPlants() : Promise.resolve([])
  ]);
  const localFavorites = migrationNeeded ? readLegacyFavorites() : [];
  const localCatalog = migrationNeeded ? readLegacyCatalogState() : EMPTY_CATALOG_STATE;

  if (!settingsSnapshot.exists()) {
    await setDoc(settingsRef, {
      favorites: localFavorites,
      catalogState: localCatalog
    });
  } else {
    normalizeSettings(settingsSnapshot);
    const storedSettings = settingsSnapshot.data();
    const missingPreferences = {};
    if (storedSettings.favorites === undefined) missingPreferences.favorites = localFavorites;
    if (storedSettings.catalogState === undefined) missingPreferences.catalogState = localCatalog;
    if (Object.keys(missingPreferences).length > 0) {
      await setDoc(settingsRef, missingPreferences, { merge: true });
    }
  }

  if (migrationNeeded) {
    const plantsRef = plantsCollection();
    const remotePlants = await getDocs(plantsRef);
    const remoteIds = new Set(remotePlants.docs.map((plant) => plant.id));
    const migrationOperations = localPlants
      .filter((plant) => plant && (typeof plant.id === 'number' || typeof plant.id === 'string'))
      .map((plant) => {
        const id = `legacy-${plant.id}`;
        if (remoteIds.has(id)) return null;
        const reference = doc(plantsRef, id);
        return {
          type: 'set',
          reference,
          data: { ...plant, id }
        };
      })
      .filter(Boolean);
    await commitOperations(migrationOperations);
    localStorage.setItem(MIGRATION_KEY, 'complete');
  }
}

export async function addPlant(plantData) {
  const reference = doc(plantsCollection());
  const plant = { ...plantData, id: reference.id };
  await setDoc(reference, plant);
  return reference.id;
}

export async function getAllPlants() {
  const snapshot = await getDocs(plantsCollection());
  return snapshot.docs
    .map((plant) => ({ ...plant.data(), id: plant.id }))
    .sort((left, right) => String(left.createdAt ?? '').localeCompare(String(right.createdAt ?? '')));
}

export function watchUserPlants(onChange, onError) {
  return onSnapshot(
    plantsCollection(),
    (snapshot) => {
      const plants = snapshot.docs
        .map((plant) => ({ ...plant.data(), id: plant.id }))
        .sort((left, right) => String(left.createdAt ?? '').localeCompare(String(right.createdAt ?? '')));
      onChange(plants);
    },
    onError
  );
}

export async function updatePlant(plant) {
  if (!plant || !isValidPlantId(plant.id)) {
    throw new Error('A planta não tem um identificador válido.');
  }
  const reference = doc(plantsCollection(), String(plant.id));
  await setDoc(reference, { ...plant, id: String(plant.id) });
  return plant.id;
}

export async function deletePlant(plantId) {
  if (!isValidPlantId(plantId)) {
    throw new Error('A planta não tem um identificador válido.');
  }
  await deleteDoc(doc(plantsCollection(), String(plantId)));
}

export async function getFavoriteSpecies() {
  const snapshot = await getDoc(settingsDocument());
  return normalizeSettings(snapshot).favorites;
}

export async function toggleFavoriteSpecies(speciesId) {
  const reference = settingsDocument();
  const snapshot = await getDoc(reference);
  const nextState = !normalizeSettings(snapshot).favorites.includes(speciesId);
  await setDoc(reference, {
    favorites: nextState ? arrayUnion(speciesId) : arrayRemove(speciesId)
  }, { merge: true });
  return nextState;
}

export async function getCatalogState() {
  const snapshot = await getDoc(settingsDocument());
  return normalizeSettings(snapshot).catalogState;
}

export async function saveCatalogState(catalogState) {
  validateCatalogState(catalogState);
  await setDoc(settingsDocument(), { catalogState }, { merge: true });
}

export async function exportGardenBackup() {
  const [plants, favorites, catalogState] = await Promise.all([
    getAllPlants(),
    getFavoriteSpecies(),
    getCatalogState()
  ]);
  const wateringNotifications = JSON.parse(localStorage.getItem(WATERING_NOTIFICATIONS_KEY) ?? '[]');

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    plants,
    favorites,
    catalogState,
    wateringNotifications
  };
}

function validateGardenBackup(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw new Error('O ficheiro não contém uma cópia de segurança válida.');
  }
  if (backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) {
    throw new Error('O formato desta cópia de segurança não é compatível.');
  }
  if (!Array.isArray(backup.plants) || !Array.isArray(backup.favorites)) {
    throw new Error('A cópia de segurança não contém plantas e favoritos válidos.');
  }
  validateFavorites(backup.favorites);
  const plantIds = new Set();
  backup.plants.forEach((plant) => {
    if (
      !plant ||
      typeof plant !== 'object' ||
      !isValidPlantId(plant.id) ||
      typeof plant.name !== 'string' ||
      !plant.name.trim() ||
      plantIds.has(String(plant.id))
    ) {
      throw new Error('A cópia de segurança contém uma planta inválida.');
    }
    plantIds.add(String(plant.id));
  });

  validateCatalogState(backup.catalogState);
  if (
    backup.wateringNotifications !== undefined &&
    (!Array.isArray(backup.wateringNotifications) ||
      backup.wateringNotifications.some((key) => typeof key !== 'string'))
  ) {
    throw new Error('O estado dos lembretes da cópia de segurança é inválido.');
  }
}

function restoreLocalStorageValues(previousValues) {
  Object.entries(previousValues).forEach(([key, value]) => {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  });
}

export async function importGardenBackup(backup) {
  validateGardenBackup(backup);
  const plantsRef = plantsCollection();
  const existingPlants = await getDocs(plantsRef);
  const incomingIds = new Set(backup.plants.map((plant) => String(plant.id)));
  const operations = [
    ...backup.plants.map((plant) => ({
      type: 'set',
      reference: doc(plantsRef, String(plant.id)),
      data: { ...plant, id: String(plant.id) }
    })),
    ...existingPlants.docs
      .filter((plant) => !incomingIds.has(plant.id))
      .map((plant) => ({ type: 'delete', reference: plant.ref }))
  ];

  await commitOperations(operations);
  await setDoc(settingsDocument(), {
    favorites: [...new Set(backup.favorites)],
    catalogState: backup.catalogState
  }, { merge: true });

  const notificationValue = JSON.stringify(backup.wateringNotifications ?? []);
  const previousNotificationValue = localStorage.getItem(WATERING_NOTIFICATIONS_KEY);
  try {
    localStorage.setItem(WATERING_NOTIFICATIONS_KEY, notificationValue);
  } catch (error) {
    restoreLocalStorageValues({ [WATERING_NOTIFICATIONS_KEY]: previousNotificationValue });
    throw error;
  }
}
