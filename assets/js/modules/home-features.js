const DIAGNOSIS_RESULT = {
  name: 'Monstera',
  status: '98% Saudável',
  advice: 'Rega quando os primeiros 2–3 cm de terra estiverem secos.'
};

const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
let diagnosisImageUrl = '';

export function setupHomeFeatures() {
  setupPlantDiagnosis();
  setupWeatherAlert();
  setupGardenMissions();
}

function setupPlantDiagnosis() {
  const fileInput = document.getElementById('plant-diagnosis-file');
  const button = document.getElementById('plant-diagnosis-button');
  const preview = document.getElementById('plant-diagnosis-preview');
  const status = document.getElementById('plant-diagnosis-status');
  if (!fileInput || !button || !preview || !status) return;

  button.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const [file] = fileInput.files ?? [];
    fileInput.value = '';
    if (!file) return;

    status.textContent = '';
    if (!file.type.startsWith('image/')) {
      status.textContent = 'Escolhe um ficheiro de imagem válido.';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      status.textContent = 'A imagem deve ter no máximo 10 MB.';
      return;
    }

    if (diagnosisImageUrl) URL.revokeObjectURL(diagnosisImageUrl);
    diagnosisImageUrl = URL.createObjectURL(file);
    preview.replaceChildren();

    const loading = document.createElement('div');
    loading.className = 'diagnosis-loading';
    loading.setAttribute('role', 'status');
    loading.textContent = 'A analisar a folha...';
    preview.append(loading);
    button.disabled = true;

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
      const card = document.createElement('article');
      card.className = 'diagnosis-result-card';

      const image = document.createElement('img');
      image.className = 'diagnosis-result-photo';
      image.src = diagnosisImageUrl;
      image.alt = `Fotografia da planta identificada como ${DIAGNOSIS_RESULT.name}`;

      const content = document.createElement('div');
      content.className = 'diagnosis-result-content';
      const heading = document.createElement('h3');
      heading.textContent = DIAGNOSIS_RESULT.name;
      const health = document.createElement('p');
      health.className = 'diagnosis-result-health';
      health.textContent = DIAGNOSIS_RESULT.status;
      const advice = document.createElement('p');
      advice.className = 'diagnosis-result-advice';
      advice.textContent = `💧 ${DIAGNOSIS_RESULT.advice}`;
      const disclaimer = document.createElement('p');
      disclaimer.className = 'diagnosis-result-disclaimer';
      disclaimer.textContent = 'Demonstração: a fotografia não foi analisada por IA.';

      content.append(heading, health, advice, disclaimer);
      card.append(image, content);
      preview.replaceChildren(card);
    } catch (error) {
      console.error('Não foi possível apresentar o diagnóstico da planta:', error);
      status.textContent = 'Não foi possível apresentar o diagnóstico. Tenta novamente.';
    } finally {
      button.disabled = false;
    }
  });

  window.addEventListener('pagehide', () => {
    if (diagnosisImageUrl) {
      URL.revokeObjectURL(diagnosisImageUrl);
      diagnosisImageUrl = '';
    }
  }, { once: true });
}

function setupWeatherAlert() {
  const button = document.getElementById('weather-check-button');
  const alert = document.getElementById('weather-alert');
  const status = document.getElementById('weather-status');
  if (!button || !alert || !status) return;

  button.addEventListener('click', async () => {
    if (window.location.protocol === 'file:' || !window.isSecureContext) {
      status.textContent = 'A localização requer HTTPS ou localhost. Abre a aplicação através de um servidor local seguro.';
      return;
    }
    if (!navigator.geolocation) {
      status.textContent = 'Este navegador não disponibiliza a localização.';
      return;
    }

    button.disabled = true;
    button.textContent = 'A consultar previsão…';
    status.textContent = '';
    try {
      const position = await getCurrentPosition();
      const forecast = await getWeatherForecast(position.coords.latitude, position.coords.longitude);
      renderWeatherAlert(alert, forecast);
    } catch (error) {
      console.error('Não foi possível consultar a meteorologia local:', error);
      status.textContent = error instanceof Error
        ? error.message
        : 'Não foi possível consultar a previsão. Tenta novamente.';
    } finally {
      button.disabled = false;
      button.textContent = 'Atualizar previsão local';
    }
  });
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      const messages = {
        1: 'A permissão de localização foi recusada. Ativa-a nas definições do navegador.',
        2: 'Não foi possível determinar a localização. Verifica o sinal e tenta novamente.',
        3: 'A localização demorou demasiado tempo. Tenta novamente.'
      };
      reject(new Error(messages[error.code] || 'Ocorreu um erro ao obter a localização.'));
    }, {
      enableHighAccuracy: false,
      maximumAge: 15 * 60 * 1000,
      timeout: 10 * 1000
    });
  });
}

async function getWeatherForecast(latitude, longitude) {
  const url = new URL(WEATHER_ENDPOINT);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m',
    daily: 'precipitation_probability_max,precipitation_sum,temperature_2m_max',
    forecast_days: '1',
    timezone: 'auto'
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('O serviço meteorológico não respondeu. Tenta novamente mais tarde.');
  }

  const data = await response.json();
  const values = {
    currentTemperature: data.current?.temperature_2m,
    maxTemperature: data.daily?.temperature_2m_max?.[0],
    rainProbability: data.daily?.precipitation_probability_max?.[0],
    rainAmount: data.daily?.precipitation_sum?.[0]
  };
  if (Object.values(values).some((value) => !Number.isFinite(value))) {
    throw new Error('O serviço meteorológico devolveu uma previsão incompleta. Tenta novamente.');
  }
  return values;
}

function renderWeatherAlert(container, forecast) {
  const rainExpected = forecast.rainProbability >= 50 || forecast.rainAmount >= 2;
  const icon = document.createElement('span');
  icon.className = 'weather-alert__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = rainExpected ? '🌧️' : '☀️';

  const message = document.createElement('p');
  message.className = 'weather-alert__message';
  if (rainExpected) {
    message.textContent = 'Previsão de chuva: Não é necessário regar hoje';
  } else if (forecast.maxTemperature >= 28) {
    message.textContent = `Dia quente (${Math.round(forecast.maxTemperature)}°C): Regar hoje à noite`;
  } else {
    message.textContent = `Sem chuva prevista (${Math.round(forecast.maxTemperature)}°C): Verifica a terra antes de regar`;
  }

  container.className = `weather-alert weather-alert--${rainExpected ? 'rain' : 'sun'}`;
  container.replaceChildren(icon, message);
}

function setupGardenMissions() {
  const checkboxes = [...document.querySelectorAll('[data-mission-points]')];
  const pointsDisplay = document.getElementById('missions-points');
  const progress = document.querySelector('.missions-progress');
  const progressFill = document.getElementById('missions-progress-fill');
  const caption = document.getElementById('missions-progress-caption');
  if (!checkboxes.length || !pointsDisplay || !progress || !progressFill || !caption) return;

  function updateProgress() {
    const points = checkboxes.reduce(
      (total, checkbox) => total + (checkbox.checked ? Number(checkbox.dataset.missionPoints) : 0),
      0
    );
    const total = checkboxes.reduce((sum, checkbox) => sum + Number(checkbox.dataset.missionPoints), 0);
    const percentage = total ? (points / total) * 100 : 0;
    pointsDisplay.textContent = String(points);
    progress.setAttribute('aria-valuenow', String(points));
    progress.setAttribute('aria-valuetext', `${points} de ${total} pontos`);
    progressFill.style.width = `${percentage}%`;
    caption.textContent = points === total
      ? 'Todas as missões concluídas!'
      : 'Conclui as missões para ganhar pontos';
    checkboxes.forEach((checkbox) => {
      checkbox.closest('.mission-item')?.classList.toggle('is-completed', checkbox.checked);
    });
  }

  checkboxes.forEach((checkbox) => checkbox.addEventListener('change', updateProgress));
  updateProgress();
}
