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

  const title = document.createElement('h3');
  title.textContent = String(plant.name ?? 'Planta sem nome');
  card.append(title);

  const details = [
    ['Espécie:', plant.species || 'Por identificar'],
    ['💧 Rega:', plant.water || 'Não indicada'],
    ['☀️ Luminosidade:', plant.light || 'Não indicada']
  ];

  details.forEach(([label, value]) => {
    const line = document.createElement('p');
    line.className = 'plant-meta';
    const strong = document.createElement('strong');
    strong.textContent = label;
    line.append(strong, ` ${String(value)}`);
    card.append(line);
  });

  const nextWatering = document.createElement('p');
  nextWatering.className = 'plant-care-date';
  if (plant.nextWatering) {
    const today = getLocalDateString(new Date());
    const daysUntilWatering = Math.round(
      (new Date(`${plant.nextWatering}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000
    );
    if (daysUntilWatering < 0) nextWatering.classList.add('is-overdue');
    if (daysUntilWatering === 0) nextWatering.classList.add('is-due');
    nextWatering.textContent = `${daysUntilWatering < 0 ? 'Rega atrasada' : daysUntilWatering === 0 ? 'Regar hoje' : 'Próxima rega'}: ${formatCareDate(plant.nextWatering)}`;
  } else if (plant.lastWatered) {
    nextWatering.textContent = `Última rega: ${formatCareDate(plant.lastWatered)}`;
  } else {
    nextWatering.textContent = 'Sem regas registadas.';
  }
  card.append(nextWatering);

  const dateLabel = document.createElement('label');
  dateLabel.className = 'plant-date-label';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'plant-date-input';
  dateInput.value = plant.nextWatering || '';
  dateInput.setAttribute('aria-label', `Próxima rega para ${String(plant.name ?? 'esta planta')}`);
  dateLabel.append('Agendar data', dateInput);

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
  card.append(dateLabel, saveDateButton);

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
  card.append(waterButton);

  card.append(createCareRoutines(plant, card));

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
  card.append(deleteButton);

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