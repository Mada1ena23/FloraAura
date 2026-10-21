const DB_NAME = 'FloraAuraDB';
const DB_VERSION = 1;
const STORE_NAME = 'plants';
const FAVORITES_STORAGE_KEY = 'floraura-favorites-v1';
const CATALOG_STORAGE_KEY = 'floraura-catalog-v1';
const WATERING_NOTIFICATIONS_KEY = 'floraura-watering-notifications-v1';
const BACKUP_FORMAT = 'floraura-backup';
const BACKUP_VERSION = 1;

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

export async function addPlant(plantData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(plantData);
    let plantId;

    request.onsuccess = () => {
      plantId = request.result;
    };
    transaction.oncomplete = () => {
      db.close();
      resolve(plantId);
    };
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

export async function getAllPlants() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    let plants;

    request.onsuccess = () => {
      plants = request.result;
    };
    transaction.oncomplete = () => {
      db.close();
      resolve(plants);
    };
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

export async function updatePlant(plant) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const request = transaction.objectStore(STORE_NAME).put(plant);

    transaction.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
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

export async function deletePlant(plantId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const request = transaction.objectStore(STORE_NAME).delete(plantId);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
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

function readFavorites() {
  const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (stored === null) return [];

  const favorites = JSON.parse(stored);
  if (!Array.isArray(favorites) || favorites.some((id) => typeof id !== 'string')) {
    throw new Error('Os favoritos guardados têm um formato inválido.');
  }
  return favorites;
}

export async function getFavoriteSpecies() {
  return readFavorites();
}

export async function toggleFavoriteSpecies(speciesId) {
  const favorites = new Set(readFavorites());
  const isFavorite = !favorites.has(speciesId);
  if (isFavorite) {
    favorites.add(speciesId);
  } else {
    favorites.delete(speciesId);
  }
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]));
  return isFavorite;
}

export async function exportGardenBackup() {
  const plants = await getAllPlants();
  const catalogState = JSON.parse(localStorage.getItem(CATALOG_STORAGE_KEY) ?? '{"plants":[],"hiddenIds":[]}');
  const favorites = readFavorites();
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
  if (backup.favorites.some((id) => typeof id !== 'string')) {
    throw new Error('A lista de favoritos da cópia de segurança é inválida.');
  }
  const plantIds = new Set();
  backup.plants.forEach((plant) => {
    if (
      !plant ||
      typeof plant !== 'object' ||
      !Number.isSafeInteger(plant.id) ||
      plant.id < 1 ||
      typeof plant.name !== 'string' ||
      !plant.name.trim() ||
      plantIds.has(plant.id)
    ) {
      throw new Error('A cópia de segurança contém uma planta inválida.');
    }
    plantIds.add(plant.id);
  });

  const catalogState = backup.catalogState;
  if (
    !catalogState ||
    typeof catalogState !== 'object' ||
    !Array.isArray(catalogState.plants) ||
    !Array.isArray(catalogState.hiddenIds) ||
    catalogState.hiddenIds.some((id) => typeof id !== 'string') ||
    catalogState.plants.some((plant) => (
      !plant ||
      typeof plant !== 'object' ||
      typeof plant.id !== 'string' ||
      typeof plant.name !== 'string' ||
      !plant.name.trim()
    ))
  ) {
    throw new Error('O catálogo pessoal da cópia de segurança é inválido.');
  }
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

  const preferenceValues = {
    [FAVORITES_STORAGE_KEY]: JSON.stringify([...new Set(backup.favorites)]),
    [CATALOG_STORAGE_KEY]: JSON.stringify(backup.catalogState),
    [WATERING_NOTIFICATIONS_KEY]: JSON.stringify(backup.wateringNotifications ?? [])
  };
  const previousValues = Object.fromEntries(
    Object.keys(preferenceValues).map((key) => [key, localStorage.getItem(key)])
  );

  const db = await openDatabase();
  try {
    Object.entries(preferenceValues).forEach(([key, value]) => localStorage.setItem(key, value));
    await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      backup.plants.forEach((plant) => store.put(plant));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('A importação foi cancelada.'));
    });
  } catch (err) {
    try {
      restoreLocalStorageValues(previousValues);
    } catch (restoreError) {
      console.error('Não foi possível repor as preferências anteriores após falha na importação:', restoreError);
    }
    throw err;
  } finally {
    db.close();
  }
}