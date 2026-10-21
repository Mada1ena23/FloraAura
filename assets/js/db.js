const DB_NAME = 'FloraAuraDB';
const DB_VERSION = 1;
const STORE_NAME = 'plants';
const FAVORITES_STORAGE_KEY = 'floraura-favorites-v1';

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