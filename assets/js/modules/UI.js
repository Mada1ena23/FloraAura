import { getAllPlants, addPlant, updatePlant, deletePlant } from '../db.js';

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

function getPlantPhotoUrl(plant) {
  const speciesKey = String(plant?.species || plant?.name || 'planta').trim().toLowerCase();
  const photoMap = {
    'monstera deliciosa': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    'costela-de-ão': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    'chlorophytum comosum': 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    'dracaena trifasciata': 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=900&q=80',
    'epipremnum aureum': 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=900&q=80',
    'spathiphyllum wallisii': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
    'aloe vera': 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=80',
    'ficus elastica': 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=900&q=80',
    'goeppertia orbifolia': 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    'zamioculcas zamiifolia': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80',
    'pilea peperomioides': 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=80'
  };

  return photoMap[speciesKey] || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80';
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
  photo.style.backgroundImage = `linear-gradient(180deg, rgba(26, 42, 34, 0.2), rgba(12, 25, 21, 0.38)), url("${getPlantPhotoUrl(plant)}")`;
  photo.style.backgroundSize = 'cover';
  photo.style.backgroundPosition = 'center';

  const leafOne = document.createElement('span');
  leafOne.className = 'plant-leaf leaf-one';
  const leafTwo = document.createElement('span');
  leafTwo.className = 'plant-leaf leaf-two';
  const leafThree = document.createElement('span');
  leafThree.className = 'plant-leaf leaf-three';

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

  photo.append(leafOne, leafTwo, leafThree);
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
  detailsButton.textContent = 'Ver ou editar detalhes';
  detailsButton.setAttribute('aria-expanded', 'false');

  summary.append(nextWatering, lightNeed, detailsButton);
  card.append(summary);

  const detailsPanel = document.createElement('div');
  detailsPanel.className = 'plant-card-details';
  detailsPanel.hidden = true;

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
      const wateredOn = getLocalDateString(new Date());
      const intervalDays = getWaterIntervalDays(plant.water);
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
    detailsButton.textContent = shouldShow ? 'Ocultar detalhes' : 'Ver ou editar detalhes';
    detailsButton.setAttribute('aria-expanded', String(shouldShow));
  });

  detailsPanel.append(dateLabel, saveDateButton, waterButton, createCareRoutines(plant, card), deleteButton);
  card.append(detailsPanel);

  return card;
}

function getWaterIntervalDays(waterFrequency) {
  const intervals = {
    'Diária': 1,
    'A cada 2-3 dias': 3,
    'Semanal': 7,
    'Quinzenal': 14
  };
  return intervals[waterFrequency] ?? null;
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
    empty.textContent = 'Ainda não tens cuidados agendados. Define datas de rega ou cria rotinas nos cartões das plantas.';
    container.replaceChildren(empty);
    return;
  }

  const today = getLocalDateString(new Date());
  const list = document.createElement('ul');
  list.className = 'agenda-list';

  scheduledPlants.forEach(({ plant, task, date }) => {
    const item = document.createElement('li');
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

export async function renderUserPlants() {
  const container = document.getElementById('user-plants-grid');
  if (!container) return;

  try {
    const plants = await getAllPlants();
    updateGardenSummary(plants);
    renderWateringAgenda(plants);
    if (plants.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Ainda não adicionaste nenhuma planta ao teu jardim.';
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

  nameInput?.addEventListener('input', () => nameInput.setCustomValidity(''));
  const openModal = () => {
    if (!modal) return;
    formError?.replaceChildren();
    modal.showModal();
  };

  btnOpen?.addEventListener('click', openModal);
  heroBtnOpen?.addEventListener('click', openModal);
  btnCancel?.addEventListener('click', () => modal.close());

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError?.replaceChildren();
    const newPlant = {
      name: document.getElementById('plant-name').value.trim(),
      species: document.getElementById('plant-species').value.trim(),
      water: document.getElementById('plant-water').value,
      light: document.getElementById('plant-light').value,
      nextWatering: document.getElementById('plant-next-watering').value,
      createdAt: new Date().toISOString()
    };

    nameInput.setCustomValidity(newPlant.name ? '' : 'Introduz o nome da planta.');
    if (!newPlant.name) {
      nameInput.reportValidity();
      return;
    }

    try {
      await addPlant(newPlant);
      form.reset();
      modal?.close();
      await renderUserPlants();
    } catch (err) {
      console.error('Erro ao guardar a planta:', err);
      if (formError) {
        formError.textContent = 'Não foi possível guardar a planta. Verifica o espaço disponível e tenta novamente.';
      }
    }
  });
}