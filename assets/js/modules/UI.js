import { getAllPlants, addPlant, updatePlant, deletePlant } from '../db.js';
import { PLANT_CATALOG } from './catalog-data.js';
import { getPlantPhotoUrl } from './plant-images.js';

const WATERING_NOTIFICATIONS_KEY = 'floraura-watering-notifications-v1';
const CATALOG_WATER_INTERVALS = new Map(
  PLANT_CATALOG.map((plant) => [plant.id, { low: 14, moderate: 7, frequent: 3 }[plant.waterCategory]])
);
let wateringNotificationInProgress = false;
let openPlantEditor;
let editingPlant = null;

export function setupNavigation() {
  const navBtns = document.querySelectorAll('.app-nav .nav-btn');
  const navActions = document.querySelectorAll('.nav-btn[data-target]');
  const tabs = document.querySelectorAll('.tab-content');

  navActions.forEach((btn) => {
    btn.addEventListener('click', () => {
      navBtns.forEach((b) => b.classList.remove('active'));
      tabs.forEach((t) => t.classList.remove('active'));

      const targetId = btn.getAttribute('data-target');
      const targetTab = document.getElementById(targetId);
      const targetNavBtn = document.querySelector(`.app-nav .nav-btn[data-target="${targetId}"]`);

      targetTab?.classList.add('active');
      targetNavBtn?.classList.add('active');
      navBtns.forEach((navBtn) => {
        if (navBtn === targetNavBtn) {
          navBtn.setAttribute('aria-current', 'page');
        } else {
          navBtn.removeAttribute('aria-current');
        }
      });
    });
  });
}

function updateGardenSummary(plants) {
  const plantCount = document.getElementById('plant-count');
  const speciesCount = document.getElementById('species-count');
  const species = new Set(
    plants
      .map((plant) => String(plant.species ?? '').trim().toLocaleLowerCase())
      .filter(Boolean)
  );

  if (plantCount) plantCount.textContent = String(plants.length);
  if (speciesCount) speciesCount.textContent = String(species.size);
}

function getPlantStatusState(plant) {
  const today = getLocalDateString(new Date());
  const nextWateringDate = plant.nextWatering ? new Date(`${plant.nextWatering}T12:00:00`) : null;
  const daysUntil = nextWateringDate ? Math.round((nextWateringDate - new Date(`${today}T12:00:00`)) / 86400000) : null;

  if (daysUntil !== null && daysUntil <= 0) {
    return { label: 'Urgente', className: 'is-urgent' };
  }

  if (daysUntil !== null && daysUntil <= 3) {
    return { label: 'Atenção', className: 'is-attention' };
  }

  return { label: 'Saudável', className: 'is-healthy' };
}

function createPlantStatusMeta(plant) {
  const status = document.createElement('div');
  status.className = 'plant-status';

  const indicator = document.createElement('span');
  indicator.className = 'status-icon';
  indicator.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5c2 3 5.5 5.8 5.5 10a5.5 5.5 0 1 1-11 0c0-4.2 3.5-7 5.5-10Z"/></svg>';

  const label = document.createElement('span');
  const state = getPlantStatusState(plant);
  label.textContent = state.label;
  status.classList.add(state.className);
  status.append(indicator, label);
  return status;
}

function createPlantMetaIcon(iconName) {
  const icons = {
    water: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8c2.8 3.2 7 6.6 7 11.2A7 7 0 1 1 5 14c0-4.6 4.2-8 7-11.2Z"/><path d="M12 10v4.5"/><path d="M9.8 13.3h4.4"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"/></svg>',
    health: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.2c5.1-3.4 8.5-6.2 8.5-10a4.2 4.2 0 0 0-7.3-2.9L12 8.1l-1.2-1.8A4.2 4.2 0 0 0 3.5 10.2c0 3.8 3.4 6.6 8.5 10Z"/></svg>'
  };

  const wrapper = document.createElement('span');
  wrapper.className = 'meta-icon';
  wrapper.innerHTML = icons[iconName] || icons.health;
  return wrapper;
}

function createPlantCareInformation(plant) {
  const section = document.createElement('section');
  section.className = 'plant-care-information';
  const heading = document.createElement('h4');
  heading.textContent = 'Cuidados desta planta';
  const list = document.createElement('dl');
  list.className = 'plant-care-list';

  const intervalDays = getWaterIntervalDays(plant);
  const wateringSchedule = intervalDays
    ? `A cada ${intervalDays} ${intervalDays === 1 ? 'dia' : 'dias'}`
    : 'Define um intervalo de rega nos detalhes.';
  [
    ['Rega', [plant.wateringAdvice, wateringSchedule].filter(Boolean).join(' ') || plant.water || 'Orientação não indicada.'],
    ['Luminosidade', plant.light || 'Não indicada.'],
    ['Solo / substrato', plant.soil || 'Não indicado. Edita a planta para acrescentar esta informação.'],
    ['Outros cuidados', plant.care || 'Não indicados. Edita a planta para acrescentar notas.'],
    ['Animais de companhia', plant.petNote || 'Sem informação registada.']
  ].forEach(([label, value]) => {
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    detail.textContent = value;
    list.append(term, detail);
  });

  section.append(heading, list);
  return section;
}

function createCareRoutines(plant, card) {
  const section = document.createElement('section');
  section.className = 'plant-routines';
  const heading = document.createElement('h4');
  heading.textContent = 'Rotina de cuidados';
  section.append(heading);

  const routines = Array.isArray(plant.routines) ? plant.routines : [];
  if (routines.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'routine-empty';
    empty.textContent = 'Ainda não criaste uma rotina para esta planta.';
    section.append(empty);
  }

  routines.forEach((routine) => {
    const item = document.createElement('article');
    item.className = 'routine-item';
    const title = document.createElement('strong');
    title.textContent = routine.name;
    const description = document.createElement('p');
    description.className = 'routine-meta';
    description.textContent = `A cada ${routine.intervalDays} ${routine.intervalDays === 1 ? 'dia' : 'dias'}`;

    const controls = document.createElement('div');
    controls.className = 'routine-controls';
    const nextDateLabel = document.createElement('label');
    nextDateLabel.textContent = 'Próxima data';
    const nextDateInput = document.createElement('input');
    nextDateInput.type = 'date';
    nextDateInput.required = true;
    nextDateInput.value = routine.nextDate;
    nextDateInput.setAttribute('aria-label', `Próxima data de ${routine.name} para ${plant.name}`);
    nextDateLabel.append(nextDateInput);

    const intervalLabel = document.createElement('label');
    intervalLabel.textContent = 'Intervalo (dias)';
    const intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.min = '1';
    intervalInput.max = '365';
    intervalInput.required = true;
    intervalInput.value = String(routine.intervalDays);
    intervalInput.setAttribute('aria-label', `Intervalo em dias de ${routine.name} para ${plant.name}`);
    intervalLabel.append(intervalInput);

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'btn-secondary';
    saveButton.textContent = 'Guardar alterações';
    saveButton.addEventListener('click', async () => {
      if (!nextDateInput.reportValidity() || !intervalInput.reportValidity()) return;
      const intervalDays = Number(intervalInput.value);
      if (!Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 365) return;
      await saveRoutines(plant, card, routines.map((itemRoutine) => (
        itemRoutine.id === routine.id
          ? { ...itemRoutine, intervalDays, nextDate: nextDateInput.value }
          : itemRoutine
      )), saveButton);
    });

    const doneButton = document.createElement('button');
    doneButton.type = 'button';
    doneButton.className = 'btn-primary';
    doneButton.textContent = 'Concluir hoje';
    doneButton.addEventListener('click', async () => {
      const completedOn = getLocalDateString(new Date());
      const nextDate = new Date(`${completedOn}T12:00:00`);
      nextDate.setDate(nextDate.getDate() + Number(routine.intervalDays));
      await saveRoutines(plant, card, routines.map((itemRoutine) => (
        itemRoutine.id === routine.id
          ? { ...itemRoutine, lastCompleted: completedOn, nextDate: getLocalDateString(nextDate) }
          : itemRoutine
      )), doneButton);
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn-secondary delete-plant-btn';
    removeButton.textContent = 'Eliminar rotina';
    removeButton.addEventListener('click', async () => {
      await saveRoutines(plant, card, routines.filter((itemRoutine) => itemRoutine.id !== routine.id), removeButton);
    });

    controls.append(nextDateLabel, intervalLabel, saveButton, doneButton, removeButton);
    item.append(title, description, controls);
    section.append(item);
  });

  const form = document.createElement('form');
  form.className = 'routine-form';
  const nameLabel = document.createElement('label');
  nameLabel.textContent = 'Cuidado';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.required = true;
  nameInput.maxLength = 80;
  nameInput.placeholder = 'Ex.: Regar, adubar, podar';
  nameLabel.append(nameInput);

  const intervalLabel = document.createElement('label');
  intervalLabel.textContent = 'Repetir a cada (dias)';
  const intervalInput = document.createElement('input');
  intervalInput.type = 'number';
  intervalInput.min = '1';
  intervalInput.max = '365';
  intervalInput.value = '7';
  intervalInput.required = true;
  intervalLabel.append(intervalInput);

  const dateLabel = document.createElement('label');
  dateLabel.textContent = 'Próxima data';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = getLocalDateString(new Date());
  dateInput.required = true;
  dateLabel.append(dateInput);

  const addButton = document.createElement('button');
  addButton.type = 'submit';
  addButton.className = 'btn-secondary';
  addButton.textContent = 'Criar rotina';
  form.append(nameLabel, intervalLabel, dateLabel, addButton);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const intervalDays = Number(intervalInput.value);
    if (!Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 365 || !dateInput.value) {
      intervalInput.reportValidity();
      return;
    }
    const newRoutine = {
      id: `routine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: nameInput.value.trim(),
      intervalDays,
      nextDate: dateInput.value
    };
    await saveRoutines(plant, card, [...routines, newRoutine], addButton);
  });
  section.append(form);
  return section;
}

async function saveRoutines(plant, card, routines, button) {
  button.disabled = true;
  try {
    await updatePlant({ ...plant, routines });
    await renderUserPlants();
  } catch (err) {
    console.error('Erro ao guardar a rotina de cuidados:', err);
    const error = document.createElement('p');
    error.className = 'form-error';
    error.setAttribute('role', 'alert');
    error.textContent = 'Não foi possível guardar a rotina. Tenta novamente.';
    card.append(error);
    button.disabled = false;
  }
}

function createPlantCard(plant) {
  const card = document.createElement('article');
  card.className = 'plant-card';
  card.dataset.plantId = String(plant.id);

  const cover = document.createElement('div');
  cover.className = 'plant-cover';

  const photo = document.createElement('div');
  photo.className = 'plant-photo';
  photo.setAttribute('aria-hidden', 'true');
  photo.style.backgroundImage = `linear-gradient(180deg, rgba(26, 42, 34, 0.05) 35%, rgba(12, 25, 21, 0.72)), url("${getPlantPhotoUrl(plant)}")`;
  photo.style.backgroundSize = 'cover';
  photo.style.backgroundPosition = 'center';

  const state = getPlantStatusState(plant);
  const badge = document.createElement('span');
  badge.className = `plant-cover-badge ${state.className}`;
  badge.textContent = state.label;

  const nameWrap = document.createElement('div');
  nameWrap.className = 'plant-cover-copy';
  const name = document.createElement('h3');
  name.textContent = String(plant.name ?? 'Planta sem nome');
  const species = document.createElement('p');
  species.textContent = plant.species || 'Espécie por identificar';
  nameWrap.append(name, species);

  cover.append(photo, badge, nameWrap);
  card.append(cover);

  const summary = document.createElement('div');
  summary.className = 'plant-summary';

  const nextWatering = document.createElement('div');
  nextWatering.className = 'plant-card-meta';
  const nextIcon = createPlantMetaIcon('water');
  const nextText = document.createElement('span');
  if (plant.nextWatering) {
    const today = getLocalDateString(new Date());
    const daysUntilWatering = Math.round(
      (new Date(`${plant.nextWatering}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000
    );
    nextText.textContent = `${daysUntilWatering < 0 ? 'Atrasada' : daysUntilWatering === 0 ? 'Hoje' : 'Próxima'}: ${formatCareDate(plant.nextWatering)}`;
    if (daysUntilWatering < 0) nextWatering.classList.add('is-overdue');
    if (daysUntilWatering === 0) nextWatering.classList.add('is-due');
  } else if (plant.lastWatered) {
    nextText.textContent = `Última rega: ${formatCareDate(plant.lastWatered)}`;
  } else {
    nextText.textContent = 'Sem regas registadas';
  }
  nextWatering.append(nextIcon, nextText);

  const lightNeed = document.createElement('div');
  lightNeed.className = 'plant-card-meta';
  const lightIcon = createPlantMetaIcon('sun');
  const lightText = document.createElement('span');
  lightText.textContent = plant.light || 'Luz não indicada';
  lightNeed.append(lightIcon, lightText);

  const detailsButton = document.createElement('button');
  detailsButton.type = 'button';
  detailsButton.className = 'btn-secondary btn-details';
  detailsButton.textContent = 'Detalhes';
  detailsButton.setAttribute('aria-expanded', 'false');
  detailsButton.setAttribute('aria-controls', `plant-details-${plant.id}`);

  summary.append(nextWatering, lightNeed, detailsButton);
  card.append(summary);

  const detailsPanel = document.createElement('div');
  detailsPanel.className = 'plant-card-details';
  detailsPanel.id = `plant-details-${plant.id}`;
  detailsPanel.hidden = true;

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'btn-secondary edit-plant-btn';
  editButton.textContent = 'Editar planta';
  editButton.addEventListener('click', () => openPlantEditor?.(plant));

  const dateLabel = document.createElement('label');
  dateLabel.className = 'plant-date-label';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'plant-date-input';
  dateInput.value = plant.nextWatering || '';
  dateInput.setAttribute('aria-label', `Próxima rega para ${String(plant.name ?? 'esta planta')}`);
  dateLabel.append('Agendar rega', dateInput);

  const saveDateButton = document.createElement('button');
  saveDateButton.type = 'button';
  saveDateButton.className = 'btn-secondary schedule-date-btn';
  saveDateButton.textContent = 'Guardar data';
  saveDateButton.addEventListener('click', async () => {
    saveDateButton.disabled = true;
    try {
      await updatePlant({ ...plant, nextWatering: dateInput.value });
      await renderUserPlants();
    } catch (err) {
      console.error('Erro ao guardar a data de rega:', err);
      const error = document.createElement('p');
      error.className = 'form-error';
      error.setAttribute('role', 'alert');
      error.textContent = 'Não foi possível guardar esta data.';
      card.append(error);
      saveDateButton.disabled = false;
    }
  });

  const waterButton = document.createElement('button');
  waterButton.type = 'button';
  waterButton.className = 'btn-secondary water-done-btn';
  waterButton.textContent = 'Marcar rega de hoje';
  waterButton.addEventListener('click', async () => {
    waterButton.disabled = true;
    try {
      await recordWateringToday(plant);
    } catch (err) {
      console.error('Erro ao atualizar a agenda de rega:', err);
      const error = document.createElement('p');
      error.className = 'form-error';
      error.setAttribute('role', 'alert');
      error.textContent = 'Não foi possível atualizar esta data.';
      card.append(error);
      waterButton.disabled = false;
    }
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn-secondary delete-plant-btn';
  deleteButton.textContent = 'Remover do jardim';
  deleteButton.setAttribute('aria-label', `Remover ${String(plant.name ?? 'esta planta')} do jardim`);
  deleteButton.addEventListener('click', async () => {
    if (!window.confirm(`Queres remover ${String(plant.name ?? 'esta planta')} do teu jardim? Esta ação não pode ser anulada.`)) {
      return;
    }

    deleteButton.disabled = true;
    try {
      await deletePlant(plant.id);
      await renderUserPlants();
    } catch (err) {
      console.error('Erro ao remover planta do jardim:', err);
      const error = document.createElement('p');
      error.className = 'form-error';
      error.setAttribute('role', 'alert');
      error.textContent = 'Não foi possível remover esta planta.';
      card.append(error);
      deleteButton.disabled = false;
    }
  });

  detailsButton.addEventListener('click', () => {
    const shouldShow = detailsPanel.hidden;
    detailsPanel.hidden = !shouldShow;
    detailsButton.textContent = shouldShow ? 'Fechar detalhes' : 'Detalhes';
    detailsButton.setAttribute('aria-expanded', String(shouldShow));
  });

  detailsPanel.append(
    createPlantCareInformation(plant),
    editButton,
    dateLabel,
    saveDateButton,
    waterButton,
    createCareRoutines(plant, card),
    deleteButton
  );
  card.append(detailsPanel);

  return card;
}

function getWaterIntervalDays(plant) {
  if (Number.isInteger(plant?.waterIntervalDays) && plant.waterIntervalDays >= 1 && plant.waterIntervalDays <= 365) {
    return plant.waterIntervalDays;
  }
  const intervals = {
    'Diária': 1,
    'A cada 2-3 dias': 3,
    'Semanal': 7,
    'Quinzenal': 14
  };
  return CATALOG_WATER_INTERVALS.get(plant?.catalogId) ?? intervals[plant?.water] ?? null;
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCareDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long'
  });
}

function renderWateringAgenda(plants) {
  const container = document.getElementById('watering-agenda');
  if (!container) return;

  renderDueWateringReminder(plants);

  const scheduledPlants = plants
    .flatMap((plant) => {
      const entries = [];
      if (/^\d{4}-\d{2}-\d{2}$/.test(plant.nextWatering ?? '')) {
        entries.push({ plant, task: 'Rega', date: plant.nextWatering });
      }
      (Array.isArray(plant.routines) ? plant.routines : []).forEach((routine) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(routine.nextDate ?? '')) {
          entries.push({ plant, task: routine.name, date: routine.nextDate });
        }
      });
      return entries;
    })
    .sort((first, second) => first.date.localeCompare(second.date));

  if (scheduledPlants.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'agenda-empty';
    empty.textContent = 'Sem lembretes de rega.';
    container.replaceChildren(empty);
    return;
  }

  const today = getLocalDateString(new Date());
  const list = document.createElement('ul');
  list.className = 'agenda-list';

  scheduledPlants.forEach(({ plant, task, date }) => {
    const item = document.createElement('li');
    if (date <= today) item.classList.add('is-priority');
    const title = document.createElement('strong');
    title.textContent = `${String(plant.name ?? 'Planta sem nome')} — ${task}`;
    const dateText = document.createElement('span');
    dateText.textContent = formatCareDate(date);
    const state = document.createElement('span');
    state.className = 'agenda-state';
    state.textContent = date < today
      ? 'Atrasada'
      : date === today
        ? 'Hoje'
        : 'Agendada';
    if (date < today) state.classList.add('is-overdue');
    if (date === today) state.classList.add('is-due');
    item.append(title, dateText, state);
    list.append(item);
  });

  container.replaceChildren(list);
}

async function recordWateringToday(plant) {
  const wateredOn = getLocalDateString(new Date());
  const intervalDays = getWaterIntervalDays(plant);
  let nextWateringDate = '';
  if (intervalDays !== null) {
    const nextDate = new Date(`${wateredOn}T12:00:00`);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    nextWateringDate = getLocalDateString(nextDate);
  }

  await updatePlant({
    ...plant,
    lastWatered: wateredOn,
    nextWatering: nextWateringDate
  });
  await renderUserPlants();
}

function getDueWateringPlants(plants) {
  const today = getLocalDateString(new Date());
  return plants.filter((plant) => (
    /^\d{4}-\d{2}-\d{2}$/.test(plant.nextWatering ?? '') &&
    plant.nextWatering <= today
  ));
}

function renderDueWateringReminder(plants) {
  const container = document.getElementById('watering-reminders');
  if (!container) return;

  const duePlants = getDueWateringPlants(plants);
  if (duePlants.length === 0) {
    container.replaceChildren();
    return;
  }

  const reminder = document.createElement('section');
  reminder.className = 'watering-reminder';
  reminder.setAttribute('role', 'alert');

  const heading = document.createElement('h3');
  heading.textContent = 'Está na hora de regar!';

  const list = document.createElement('ul');
  list.className = 'watering-due-list';
  const today = getLocalDateString(new Date());
  duePlants
    .sort((first, second) => first.nextWatering.localeCompare(second.nextWatering))
    .forEach((plant) => {
      const item = document.createElement('li');
      item.className = 'watering-due-item';
      const name = document.createElement('span');
      name.textContent = `${String(plant.name ?? 'Planta sem nome')} — ${plant.nextWatering < today ? 'atrasada' : 'hoje'}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-secondary';
      button.textContent = 'Marcar rega feita';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await recordWateringToday(plant);
        } catch (err) {
          console.error('Erro ao registar a rega:', err);
          button.disabled = false;
          const error = document.createElement('p');
          error.className = 'form-error';
          error.setAttribute('role', 'alert');
          error.textContent = `Não foi possível registar a rega de ${String(plant.name ?? 'esta planta')}.`;
          reminder.append(error);
        }
      });
      item.append(name, button);
      list.append(item);
    });

  reminder.append(heading, list);
  container.replaceChildren(reminder);
}

async function notifyDueWatering(plants) {
  if (
    wateringNotificationInProgress ||
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted' ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }

  const duePlants = getDueWateringPlants(plants);
  const dueKeys = duePlants.map((plant) => JSON.stringify([String(plant.id ?? plant.name), plant.nextWatering]));
  let notifiedKeys;
  try {
    const stored = localStorage.getItem(WATERING_NOTIFICATIONS_KEY);
    notifiedKeys = stored === null ? [] : JSON.parse(stored);
    if (!Array.isArray(notifiedKeys) || notifiedKeys.some((key) => typeof key !== 'string')) {
      throw new Error('O estado das notificações de rega guardado tem um formato inválido.');
    }
  } catch (err) {
    console.error('Erro ao consultar notificações de rega já apresentadas:', err);
    return;
  }

  const pendingPlants = duePlants.filter((plant) => (
    !notifiedKeys.includes(JSON.stringify([String(plant.id ?? plant.name), plant.nextWatering]))
  ));
  if (pendingPlants.length === 0) {
    const currentKeys = notifiedKeys.filter((key) => dueKeys.includes(key));
    if (currentKeys.length !== notifiedKeys.length) {
      try {
        localStorage.setItem(WATERING_NOTIFICATIONS_KEY, JSON.stringify(currentKeys));
      } catch (err) {
        console.error('Erro ao atualizar o estado das notificações de rega:', err);
      }
    }
    return;
  }

  wateringNotificationInProgress = true;
  try {
    const names = pendingPlants.slice(0, 3).map((plant) => String(plant.name ?? 'Planta sem nome'));
    const remainingCount = pendingPlants.length - names.length;
    const body = `${names.join(', ')}${remainingCount > 0 ? ` e mais ${remainingCount}` : ''}`;
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(
      pendingPlants.length === 1 ? 'FloraAura — hora da rega' : 'FloraAura — hora das regas',
      {
        body,
        icon: new URL('../../images/icons/icon-192x192.png', import.meta.url).href,
        tag: 'floraura-watering-due',
        data: { url: new URL('../../../index.html', import.meta.url).href }
      }
    );
    const updatedKeys = new Set([...notifiedKeys.filter((key) => dueKeys.includes(key)), ...dueKeys]);
    localStorage.setItem(WATERING_NOTIFICATIONS_KEY, JSON.stringify([...updatedKeys]));
  } catch (err) {
    console.error('Erro ao apresentar a notificação de rega:', err);
  } finally {
    wateringNotificationInProgress = false;
  }
}

export function setupWateringReminders() {
  const button = document.getElementById('enable-watering-notifications');
  const status = document.getElementById('watering-notification-status');
  if (!button || !status) return;

  const updatePermissionStatus = () => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      status.textContent = 'Notificações do navegador indisponíveis.';
      button.hidden = true;
    } else if (Notification.permission === 'granted') {
      status.textContent = 'Notificações ativadas.';
      button.hidden = true;
    } else if (Notification.permission === 'denied') {
      status.textContent = 'Notificações bloqueadas nas definições do navegador.';
      button.hidden = true;
    } else {
      status.textContent = 'Recebe avisos do navegador quando uma rega vencer.';
      button.hidden = false;
    }
  };

  const refreshReminders = async () => {
    try {
      const plants = await getAllPlants();
      renderWateringAgenda(plants);
      await notifyDueWatering(plants);
    } catch (err) {
      console.error('Erro ao verificar os lembretes de rega:', err);
    }
  };

  updatePermissionStatus();
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await Notification.requestPermission();
      updatePermissionStatus();
      await refreshReminders();
    } catch (err) {
      console.error('Erro ao pedir permissão para notificações:', err);
      status.textContent = 'Não foi possível ativar as notificações. Verifica as permissões do navegador.';
    } finally {
      button.disabled = false;
    }
  });

  window.setInterval(refreshReminders, 60_000);
  window.addEventListener('focus', refreshReminders);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshReminders();
  });
}

export async function renderUserPlants() {
  const container = document.getElementById('user-plants-grid');
  if (!container) return;

  try {
    const plants = await getAllPlants();
    updateGardenSummary(plants);
    renderWateringAgenda(plants);
    await notifyDueWatering(plants);
    if (plants.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Ainda não tens plantas. Adiciona a primeira para começar.';
      container.replaceChildren(empty);
      return;
    }

    container.replaceChildren(...plants.map(createPlantCard));
  } catch (err) {
    console.error('Erro ao carregar plantas do utilizador:', err);
    const error = document.createElement('p');
    error.className = 'empty-state error-state';
    error.setAttribute('role', 'alert');
    error.textContent = 'Não foi possível carregar as plantas guardadas. Tenta atualizar a página.';
    container.replaceChildren(error);
  }
}

export function setupModal() {
  const modal = document.getElementById('modal-add-plant');
  const btnOpen = document.getElementById('btn-add-plant');
  const heroBtnOpen = document.getElementById('hero-add-plant');
  const btnCancel = document.getElementById('btn-cancel');
  const form = document.getElementById('form-plant');
  const formError = document.getElementById('plant-form-error');
  const nameInput = document.getElementById('plant-name');
  const title = document.getElementById('plant-form-title');
  const description = document.getElementById('plant-form-description');
  const submitButton = form?.querySelector('button[type="submit"]');

  nameInput?.addEventListener('input', () => nameInput.setCustomValidity(''));
  const openModal = (plant = null) => {
    if (!modal) return;
    editingPlant = plant;
    form?.reset();
    document.getElementById('plant-water-interval').value = String(getWaterIntervalDays(plant) ?? 7);
    document.getElementById('plant-name').value = plant?.name ?? '';
    document.getElementById('plant-species').value = plant?.species ?? '';
    document.getElementById('plant-watering-advice').value = plant?.wateringAdvice ?? '';
    document.getElementById('plant-light').value = plant?.light ?? 'Luz Indireta Forte';
    document.getElementById('plant-soil').value = plant?.soil ?? '';
    document.getElementById('plant-care').value = plant?.care ?? '';
    document.getElementById('plant-pet-note').value = plant?.petNote ?? '';
    document.getElementById('plant-next-watering').value = plant?.nextWatering ?? '';
    if (title) title.textContent = plant ? 'Editar planta' : 'Registar Nova Planta';
    if (description) {
      description.textContent = plant
        ? 'Atualiza as informações e os cuidados desta planta.'
        : 'Adiciona uma planta e guarda as informações essenciais para cuidares dela.';
    }
    if (submitButton) submitButton.textContent = plant ? 'Guardar alterações' : 'Guardar Planta';
    formError?.replaceChildren();
    modal.showModal();
    nameInput?.focus();
  };

  openPlantEditor = openModal;
  btnOpen?.addEventListener('click', () => openModal());
  heroBtnOpen?.addEventListener('click', () => openModal());
  btnCancel?.addEventListener('click', () => {
    modal.close();
    form?.reset();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError?.replaceChildren();
    const intervalInput = document.getElementById('plant-water-interval');
    const waterIntervalDays = Number(intervalInput.value);
    if (!Number.isInteger(waterIntervalDays) || waterIntervalDays < 1 || waterIntervalDays > 365) {
      intervalInput.reportValidity();
      return;
    }
    const plantData = {
      name: document.getElementById('plant-name').value.trim(),
      species: document.getElementById('plant-species').value.trim(),
      waterIntervalDays,
      wateringAdvice: document.getElementById('plant-watering-advice').value.trim(),
      light: document.getElementById('plant-light').value,
      soil: document.getElementById('plant-soil').value.trim(),
      care: document.getElementById('plant-care').value.trim(),
      petNote: document.getElementById('plant-pet-note').value.trim(),
      nextWatering: document.getElementById('plant-next-watering').value,
      createdAt: editingPlant?.createdAt ?? new Date().toISOString()
    };

    nameInput.setCustomValidity(plantData.name ? '' : 'Introduz o nome da planta.');
    if (!plantData.name) {
      nameInput.reportValidity();
      return;
    }

    if (submitButton) submitButton.disabled = true;
    try {
      if (editingPlant) {
        await updatePlant({ ...editingPlant, ...plantData });
      } else {
        await addPlant(plantData);
      }
      editingPlant = null;
      form.reset();
      modal?.close();
      await renderUserPlants();
    } catch (err) {
      console.error('Erro ao guardar a planta:', err);
      if (formError) {
        formError.textContent = 'Não foi possível guardar a planta. Verifica o espaço disponível e tenta novamente.';
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}