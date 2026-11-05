import {
  addPlant,
  deletePlant,
  exportGardenBackup,
  getAllPlants,
  getFavoriteSpecies,
  importGardenBackup,
  toggleFavoriteSpecies,
  updatePlant
} from '../assets/js/db.js';
import { getPlantPhotoFallbackUrl } from '../assets/js/modules/plant-images.js';

const results = document.getElementById('test-results');
const summary = document.getElementById('test-summary');
const testPlantName = `Teste FloraAura ${Date.now()}`;
const testFavoriteId = `test-${Date.now()}`;
let originalBackup;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function test(name, callback) {
  const item = document.createElement('li');
  try {
    await callback();
    item.className = 'pass';
    item.textContent = `OK — ${name}`;
    passed += 1;
  } catch (error) {
    item.className = 'fail';
    item.textContent = `Falhou — ${name}: ${error.message}`;
    failed += 1;
  }
  results.append(item);
}

try {
  originalBackup = await exportGardenBackup();

  await test('criar, atualizar e eliminar planta', async () => {
    const id = await addPlant({
      name: testPlantName,
      species: 'Espécie de teste',
      waterIntervalDays: 7
    });
    const plant = (await getAllPlants()).find((item) => item.id === id);
    assert(plant?.name === testPlantName, 'A planta criada não foi encontrada.');

    await updatePlant({
      ...plant,
      lastWatered: '2026-11-05',
      nextWatering: '2026-11-12'
    });
    const wateredPlant = (await getAllPlants()).find((item) => item.id === id);
    assert(wateredPlant?.lastWatered === '2026-11-05', 'A data da rega não foi guardada.');
    assert(wateredPlant?.nextWatering === '2026-11-12', 'A próxima rega não foi guardada.');

    await deletePlant(id);
    assert(!(await getAllPlants()).some((item) => item.id === id), 'A planta eliminada continua guardada.');
  });

  await test('adicionar e remover favorito', async () => {
    assert(await toggleFavoriteSpecies(testFavoriteId), 'O favorito não foi ativado.');
    assert((await getFavoriteSpecies()).includes(testFavoriteId), 'O favorito não foi persistido.');
    assert(!(await toggleFavoriteSpecies(testFavoriteId)), 'O favorito não foi removido.');
    assert(!(await getFavoriteSpecies()).includes(testFavoriteId), 'O favorito removido continua guardado.');
  });

  await test('exportar e restaurar cópia de segurança', async () => {
    const id = await addPlant({ name: testPlantName, species: 'Espécie de teste' });
    const backup = await exportGardenBackup();
    assert(backup.plants.some((plant) => plant.id === id), 'A exportação não contém a planta de teste.');

    await deletePlant(id);
    await importGardenBackup(backup);
    assert((await getAllPlants()).some((plant) => plant.id === id), 'A importação não restaurou a planta.');
  });

  await test('rejeitar cópia incompatível sem alterar dados', async () => {
    const before = await exportGardenBackup();
    let rejected = false;
    try {
      await importGardenBackup({ format: 'formato-inválido', version: 1 });
    } catch {
      rejected = true;
    }
    assert(rejected, 'A cópia incompatível não foi rejeitada.');
    const after = await exportGardenBackup();
    assert(
      JSON.stringify(after.plants) === JSON.stringify(before.plants),
      'Os dados foram alterados pela importação inválida.'
    );
  });
  await test('imagem de fallback local está disponível', async () => {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error('A imagem SVG local não carregou.')), { once: true });
      image.src = getPlantPhotoFallbackUrl();
    });
  });
} catch (error) {
  const item = document.createElement('li');
  item.className = 'fail';
  item.textContent = `Falhou — preparação dos testes: ${error.message}`;
  results.append(item);
  failed += 1;
} finally {
  if (originalBackup) {
    try {
      await importGardenBackup(originalBackup);
    } catch (error) {
      const item = document.createElement('li');
      item.className = 'fail';
      item.textContent = `Não foi possível restaurar os dados originais: ${error.message}`;
      results.append(item);
      failed += 1;
    }
  }
  summary.textContent = `${passed} testes aprovados; ${failed} falharam.`;
}
