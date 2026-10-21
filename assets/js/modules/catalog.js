import { addPlant, getFavoriteSpecies, toggleFavoriteSpecies } from '../db.js';
import { PLANT_CATALOG } from './catalog-data.js';
import { renderUserPlants } from './UI.js';

const CATALOG_STORAGE_KEY = 'floraura-catalog-v1';
let favoriteIds = new Set();
let catalogOverrides = [];
let hiddenCatalogIds = new Set();

function normalizeSearchText(value) {
  return value.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function createIllustration(plant) {
  const namespace = 'http://www.w3.org/2000/svg';
  const illustration = document.createElementNS(namespace, 'svg');
  illustration.setAttribute('viewBox', '0 0 240 180');
  illustration.setAttribute('role', 'img');
  illustration.setAttribute('aria-label', `Ilustração decorativa de ${plant.name}`);

  const pot = document.createElementNS(namespace, 'path');
  pot.setAttribute('d', 'M82 125h76l-9 38H91z');
  pot.setAttribute('class', 'illustration-pot');

  const rim = document.createElementNS(namespace, 'path');
  rim.setAttribute('d', 'M77 120h86v11H77z');
  rim.setAttribute('class', 'illustration-rim');

  const stem = document.createElementNS(namespace, 'path');
  stem.setAttribute('d', 'M120 121V62m0 39L90 76m30 12 31-28m-31 48 32-20');
  stem.setAttribute('class', 'illustration-stem');

  const leaves = document.createElementNS(namespace, 'path');
  leaves.setAttribute('d', 'M117 67C89 62 83 45 88 30c17 1 30 12 29 37Zm7 5c2-24 18-38 36-39 4 17-7 34-36 39Zm-28 8c-20 1-33-9-35-25 14-7 30 0 35 25Zm30 21c4-21 18-30 34-29 3 15-10 28-34 29Z');
  leaves.setAttribute('class', 'illustration-leaves');

  illustration.append(leaves, stem, pot, rim);
  return illustration;
}

function createFavoriteButton(plant, favorites) {
  const button = document.createElement('button');
  const isFavorite = favorites.has(plant.id);
  button.type = 'button';
  button.className = 'favorite-btn';
  button.setAttribute('aria-pressed', String(isFavorite));
  button.setAttribute('aria-label', `${isFavorite ? 'Remover' : 'Adicionar'} ${plant.name} ${isFavorite ? 'dos' : 'aos'} favoritos`);
  button.textContent = isFavorite ? '♥' : '♡';

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const nextState = await toggleFavoriteSpecies(plant.id);
      favorites[nextState ? 'add' : 'delete'](plant.id);
      button.setAttribute('aria-pressed', String(nextState));
      button.setAttribute('aria-label', `${nextState ? 'Remover' : 'Adicionar'} ${plant.name} ${nextState ? 'dos' : 'aos'} favoritos`);
      button.textContent = nextState ? '♥' : '♡';
      if (!nextState && document.getElementById('favorites-filter')?.checked) {
        renderCatalog();
      }
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
      announceCatalogMessage('Não foi possível atualizar os favoritos. Tenta novamente.');
    } finally {
      button.disabled = false;
    }
  });

  return button;
}

function readCatalogState() {
  const stored = localStorage.getItem(CATALOG_STORAGE_KEY);
  if (stored === null) return { plants: [], hiddenIds: [] };

  const state = JSON.parse(stored);
  if (!state || !Array.isArray(state.plants) || !Array.isArray(state.hiddenIds)) {
    throw new Error('O catálogo guardado tem um formato inválido.');
  }
  return state;
}

function saveCatalogState() {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({
    plants: catalogOverrides,
    hiddenIds: [...hiddenCatalogIds]
  }));
}

function getCatalogPlants() {
  const plantsById = new Map(PLANT_CATALOG.map((plant) => [plant.id, plant]));
  catalogOverrides.forEach((plant) => plantsById.set(plant.id, plant));
  return [...plantsById.values()].filter((plant) => !hiddenCatalogIds.has(plant.id));
}

function openCatalogForm(plant = null) {
  const modal = document.getElementById('modal-catalog-plant');
  const form = document.getElementById('form-catalog-plant');
  const title = document.getElementById('catalog-form-title');
  const error = document.getElementById('catalog-form-error');
  if (!modal || !form || !title || !error) return;

  form.dataset.plantId = plant?.id ?? '';
  title.textContent = plant ? 'Editar planta do catálogo' : 'Adicionar planta ao catálogo';
  error.textContent = '';
  document.getElementById('catalog-plant-name').value = plant?.name ?? '';
  document.getElementById('catalog-plant-species').value = plant?.species ?? '';
  document.getElementById('catalog-plant-description').value = plant?.description ?? '';
  document.getElementById('catalog-plant-light').value = plant?.light ?? '';
  document.getElementById('catalog-plant-light-category').value = plant?.lightCategory ?? 'indirect';
  document.getElementById('catalog-plant-water').value = plant?.water ?? '';
  document.getElementById('catalog-plant-water-category').value = plant?.waterCategory ?? 'moderate';
  document.getElementById('catalog-plant-care').value = plant?.care ?? '';
  document.getElementById('catalog-plant-pet-note').value = plant?.petNote ?? '';
  modal.showModal();
}

function createCatalogManagement(plant) {
  const actions = document.createElement('div');
  actions.className = 'catalog-management';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'btn-secondary';
  editButton.textContent = 'Editar no catálogo';
  editButton.addEventListener('click', () => openCatalogForm(plant));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn-secondary delete-plant-btn';
  deleteButton.textContent = 'Eliminar do catálogo';
  deleteButton.addEventListener('click', () => {
    if (!window.confirm(`Queres eliminar ${plant.name} do catálogo? As plantas já adicionadas ao teu jardim não serão alteradas.`)) {
      return;
    }

    const previousOverrides = catalogOverrides;
    const previousHiddenIds = hiddenCatalogIds;
    try {
      hiddenCatalogIds = new Set(hiddenCatalogIds);
      hiddenCatalogIds.add(plant.id);
      catalogOverrides = catalogOverrides.filter((item) => item.id !== plant.id);
      saveCatalogState();
      renderCatalog();
      announceCatalogMessage(`${plant.name} foi eliminada do catálogo.`);
    } catch (err) {
      console.error('Erro ao eliminar planta do catálogo:', err);
      catalogOverrides = previousOverrides;
      hiddenCatalogIds = previousHiddenIds;
      announceCatalogMessage('Não foi possível eliminar a planta do catálogo.');
    }
  });

  actions.append(editButton, deleteButton);
  return actions;
}

function createCatalogCard(plant, favorites) {
  const card = document.createElement('article');
  card.className = 'catalog-card';

  const artwork = document.createElement('div');
  artwork.className = `species-art species-art--${plant.lightCategory}`;
  artwork.append(createIllustration(plant));
  artwork.append(createFavoriteButton(plant, favorites));

  const content = document.createElement('div');
  content.className = 'catalog-card-content';

  const heading = document.createElement('h3');
  heading.textContent = plant.name;

  const species = document.createElement('p');
  species.className = 'species-name';
  species.textContent = plant.species;

  const description = document.createElement('p');
  description.className = 'catalog-description';
  description.textContent = plant.description;

  const care = document.createElement('details');
  care.className = 'care-details';
  const summary = document.createElement('summary');
  summary.textContent = 'Ver cuidados e segurança';
  const careList = document.createElement('dl');
  careList.className = 'care-list';

  [
    ['Luz', plant.light],
    ['Rega', plant.water],
    ['Cuidados', plant.care],
    ['Animais de companhia', plant.petNote]
  ].forEach(([label, value]) => {
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    detail.textContent = value;
    careList.append(term, detail);
  });

  care.append(summary, careList);

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'btn-primary catalog-add-btn';
  addButton.textContent = 'Adicionar ao meu jardim';
  addButton.addEventListener('click', async () => {
    addButton.disabled = true;
    try {
      await addPlant({
        catalogId: plant.id,
        name: plant.name,
        species: plant.species,
        water: plant.water,
        light: plant.light,
        createdAt: new Date().toISOString()
      });
      await renderUserPlants();
      announceCatalogMessage(`${plant.name} foi adicionada ao teu jardim.`);
    } catch (err) {
      console.error('Erro ao adicionar planta do catálogo:', err);
      announceCatalogMessage('Não foi possível adicionar a planta. Tenta novamente.');
    } finally {
      addButton.disabled = false;
    }
  });

  content.append(heading, species, description, care, addButton, createCatalogManagement(plant));
  card.append(artwork, content);
  return card;
}

function announceCatalogMessage(message) {
  const status = document.getElementById('catalog-status');
  if (status) status.textContent = message;
}

function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  const count = document.getElementById('catalog-count');
  if (!grid) return;

  const query = normalizeSearchText(document.getElementById('search-input')?.value.trim() ?? '');
  const lightFilter = document.getElementById('light-filter')?.value ?? 'all';
  const waterFilter = document.getElementById('water-filter')?.value ?? 'all';
  const favoritesOnly = document.getElementById('favorites-filter')?.checked ?? false;

  const filteredPlants = getCatalogPlants().filter((plant) => {
    const searchText = normalizeSearchText(`${plant.name} ${plant.species} ${plant.description} ${plant.care}`);
    return (!query || searchText.includes(query))
      && (lightFilter === 'all' || plant.lightCategory === lightFilter)
      && (waterFilter === 'all' || plant.waterCategory === waterFilter)
      && (!favoritesOnly || favoriteIds.has(plant.id));
  });

  if (count) count.textContent = `${filteredPlants.length} ${filteredPlants.length === 1 ? 'espécie' : 'espécies'}`;
  if (filteredPlants.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = favoritesOnly
      ? 'Ainda não guardaste espécies favoritas com estes filtros.'
      : 'Não encontrámos espécies com estes critérios. Experimenta alterar a pesquisa ou os filtros.';
    grid.replaceChildren(empty);
    return;
  }

  grid.replaceChildren(...filteredPlants.map((plant) => createCatalogCard(plant, favoriteIds)));
}

export async function setupCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  try {
    favoriteIds = new Set(await getFavoriteSpecies());
  } catch (err) {
    console.error('Erro ao carregar favoritos:', err);
    announceCatalogMessage('Não foi possível carregar os favoritos guardados.');
    favoriteIds = new Set();
  }

  try {
    const catalogState = readCatalogState();
    catalogOverrides = catalogState.plants;
    hiddenCatalogIds = new Set(catalogState.hiddenIds);
  } catch (err) {
    console.error('Erro ao carregar catálogo pessoal:', err);
    announceCatalogMessage('Não foi possível carregar o catálogo pessoal guardado.');
  }

  document.getElementById('btn-add-catalog-plant')?.addEventListener('click', () => openCatalogForm());
  document.getElementById('btn-cancel-catalog-plant')?.addEventListener('click', () => {
    document.getElementById('modal-catalog-plant')?.close();
  });
  document.getElementById('form-catalog-plant')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formError = document.getElementById('catalog-form-error');
    const plantId = form.dataset.plantId;
    const existingPlant = getCatalogPlants().find((plant) => plant.id === plantId);
    const plant = {
      id: plantId || `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: document.getElementById('catalog-plant-name').value.trim(),
      species: document.getElementById('catalog-plant-species').value.trim() || 'Por identificar',
      description: document.getElementById('catalog-plant-description').value.trim(),
      light: document.getElementById('catalog-plant-light').value.trim(),
      lightCategory: document.getElementById('catalog-plant-light-category').value,
      water: document.getElementById('catalog-plant-water').value.trim(),
      waterCategory: document.getElementById('catalog-plant-water-category').value,
      care: document.getElementById('catalog-plant-care').value.trim(),
      petNote: document.getElementById('catalog-plant-pet-note').value.trim() || 'Sem informação sobre segurança para animais.'
    };

    const previousOverrides = catalogOverrides;
    const previousHiddenIds = hiddenCatalogIds;
    try {
      catalogOverrides = [...catalogOverrides];
      hiddenCatalogIds = new Set(hiddenCatalogIds);
      hiddenCatalogIds.delete(plant.id);
      catalogOverrides = catalogOverrides.filter((item) => item.id !== plant.id);
      catalogOverrides.push(plant);
      saveCatalogState();
      document.getElementById('modal-catalog-plant')?.close();
      renderCatalog();
      announceCatalogMessage(existingPlant ? `${plant.name} foi atualizada.` : `${plant.name} foi adicionada ao catálogo.`);
    } catch (err) {
      console.error('Erro ao guardar planta no catálogo:', err);
      catalogOverrides = previousOverrides;
      hiddenCatalogIds = previousHiddenIds;
      if (formError) formError.textContent = 'Não foi possível guardar a planta. Verifica o espaço disponível e tenta novamente.';
    }
  });

  document.getElementById('search-input')?.addEventListener('input', renderCatalog);
  ['light-filter', 'water-filter', 'favorites-filter'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', renderCatalog);
  });

  renderCatalog();
}
