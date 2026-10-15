import { getAllPlants, addPlant } from '../db.js';

export function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabs = document.querySelectorAll('.tab-content');

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      navBtns.forEach((b) => b.classList.remove('active'));
      tabs.forEach((t) => t.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

export async function renderUserPlants() {
  const container = document.getElementById('user-plants-grid');
  if (!container) return;

  try {
    const plants = await getAllPlants();
    if (plants.length === 0) {
      container.innerHTML = `<p class="empty-state">Ainda não adicionaste nenhuma planta ao teu jardim.</p>`;
      return;
    }

    container.innerHTML = plants.map((plant) => `
      <article class="plant-card">
        <h3>${plant.name}</h3>
        <p class="plant-meta"><strong>Espécie:</strong> ${plant.species || 'N/A'}</p>
        <p class="plant-meta"><strong>💧 Rega:</strong> ${plant.water}</p>
        <p class="plant-meta"><strong>☀️ Luminosidade:</strong> ${plant.light}</p>
      </article>
    `).join('');
  } catch (err) {
    console.error('Erro ao carregar plantas do utilizador:', err);
  }
}

export function setupModal() {
  const modal = document.getElementById('modal-add-plant');
  const btnOpen = document.getElementById('btn-add-plant');
  const btnCancel = document.getElementById('btn-cancel');
  const form = document.getElementById('form-plant');

  btnOpen?.addEventListener('click', () => modal.showModal());
  btnCancel?.addEventListener('click', () => modal.close());

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPlant = {
      name: document.getElementById('plant-name').value,
      species: document.getElementById('plant-species').value,
      water: document.getElementById('plant-water').value,
      light: document.getElementById('plant-light').value,
      createdAt: new Date().toISOString()
    };

    await addPlant(newPlant);
    form.reset();
    modal.close();
    renderUserPlants();
  });
}