import { useEffect, useRef, useState } from 'react';
import './WeatherPlantAdvice.css';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const LOCATION_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 15 * 60 * 1000,
  timeout: 10 * 1000
};

/**
 * Meteorologia local e sugestões gerais para os cuidados das plantas.
 */
export default function WeatherPlantAdvice() {
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const abortController = useRef(null);

  useEffect(() => () => {
    requestId.current += 1;
    abortController.current?.abort();
  }, []);

  function loadForecast() {
    if (isLoading) return;

    if (!window.isSecureContext) {
      setError('A localização só está disponível numa ligação segura (HTTPS) ou em localhost.');
      return;
    }

    if (!navigator.geolocation) {
      setError('Este navegador não disponibiliza a localização. Verifica as definições do dispositivo.');
      return;
    }

    const activeRequestId = requestId.current + 1;
    requestId.current = activeRequestId;
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;

    setError('');
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (activeRequestId !== requestId.current) return;

        try {
          const result = await fetchForecast(coords.latitude, coords.longitude, controller.signal);
          if (activeRequestId === requestId.current) setForecast(result);
        } catch (forecastError) {
          if (forecastError.name === 'AbortError') return;
          console.error('Não foi possível obter a previsão meteorológica:', forecastError);
          if (activeRequestId === requestId.current) {
            setError(forecastError instanceof Error
              ? forecastError.message
              : 'Não foi possível obter a previsão. Tenta novamente.');
          }
        } finally {
          if (activeRequestId === requestId.current) setIsLoading(false);
        }
      },
      (locationError) => {
        if (activeRequestId !== requestId.current) return;
        setError(getLocationErrorMessage(locationError));
        setIsLoading(false);
      },
      LOCATION_OPTIONS
    );
  }

  const advice = forecast ? getPlantAdvice(forecast) : null;

  return (
    <section className="weather-plant-advice" aria-labelledby="weather-plant-advice-title">
      <header className="weather-plant-advice__header">
        <p className="weather-plant-advice__eyebrow">FloraAura · cuidados locais</p>
        <h2 id="weather-plant-advice-title">O tempo ajuda a cuidar do teu jardim</h2>
        <p>Consulta a previsão de hoje para receber uma sugestão de rega e proteção solar.</p>
      </header>

      {!forecast && !isLoading && !error && (
        <div className="weather-plant-advice__empty">
          <span className="weather-plant-advice__weather-icon" aria-hidden="true">☀</span>
          <p>Usamos a tua localização apenas para consultar a previsão meteorológica.</p>
        </div>
      )}

      {isLoading && (
        <div className="weather-plant-advice__loading" role="status" aria-live="polite">
          <span className="weather-plant-advice__spinner" aria-hidden="true" />
          <span>A consultar a previsão para a tua localização…</span>
        </div>
      )}

      {error && <p className="weather-plant-advice__error" role="alert">{error}</p>}

      {forecast && advice && (
        <div className="weather-plant-advice__content" aria-live="polite">
          <div className="weather-plant-advice__conditions" aria-label="Previsão meteorológica de hoje">
            <div className="weather-plant-advice__temperature">
              <span aria-hidden="true">{forecast.maxTemperature >= 30 ? '☀' : '🌡'}</span>
              <strong>{formatTemperature(forecast.currentTemperature)}</strong>
              <span>agora</span>
            </div>
            <div className="weather-plant-advice__metric">
              <span>Máxima</span>
              <strong>{formatTemperature(forecast.maxTemperature)}</strong>
            </div>
            <div className="weather-plant-advice__metric">
              <span>Probabilidade de chuva</span>
              <strong>{Math.round(forecast.rainProbability)}%</strong>
            </div>
            <div className="weather-plant-advice__metric">
              <span>Chuva prevista</span>
              <strong>{formatRainfall(forecast.rainAmount)}</strong>
            </div>
          </div>

          <article className={`weather-plant-advice__recommendation weather-plant-advice__recommendation--${advice.tone}`}>
            <p className="weather-plant-advice__eyebrow">Sugestão para hoje</p>
            <h3>{advice.title}</h3>
            <p>{advice.message}</p>
          </article>
          <p className="weather-plant-advice__note">
            Previsões são estimativas: confirma sempre a humidade do substrato e as necessidades específicas de cada planta.
          </p>
        </div>
      )}

      <button
        className="weather-plant-advice__button"
        type="button"
        onClick={loadForecast}
        disabled={isLoading}
      >
        {isLoading ? 'A obter previsão…' : forecast ? 'Atualizar previsão' : 'Consultar previsão local'}
      </button>
    </section>
  );
}

async function fetchForecast(latitude, longitude, signal) {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m',
    daily: 'precipitation_probability_max,precipitation_sum,temperature_2m_max',
    forecast_days: '1',
    timezone: 'auto'
  });

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error('O serviço meteorológico não respondeu. Tenta novamente mais tarde.');
  }

  const data = await response.json();
  if (!data || typeof data !== 'object') {
    throw new Error('O serviço meteorológico devolveu uma previsão inválida. Tenta novamente.');
  }

  const forecast = {
    currentTemperature: data.current?.temperature_2m,
    maxTemperature: data.daily?.temperature_2m_max?.[0],
    rainProbability: data.daily?.precipitation_probability_max?.[0],
    rainAmount: data.daily?.precipitation_sum?.[0]
  };

  if (Object.values(forecast).some((value) => !Number.isFinite(value))) {
    throw new Error('O serviço meteorológico devolveu uma previsão incompleta. Tenta novamente.');
  }

  return forecast;
}

function getPlantAdvice({ maxTemperature, rainProbability, rainAmount }) {
  const hotDay = maxTemperature >= 30;
  const likelyRain = rainProbability >= 50 || rainAmount >= 2;

  if (hotDay && likelyRain) {
    return {
      tone: 'sun',
      title: 'Protege as plantas do sol forte',
      message: 'A máxima pode chegar aos 30 °C e há chuva prevista. Dá sombra às plantas mais sensíveis nas horas de maior calor e não regues sem verificar primeiro o substrato.',
    };
  }
  if (hotDay) {
    return {
      tone: 'sun',
      title: 'Atenção ao calor e à rega',
      message: 'Com uma máxima elevada e pouca chuva prevista, protege as plantas sensíveis do sol direto. Verifica a terra e, se estiver seca, rega de manhã cedo ou ao fim do dia.',
    };
  }
  if (likelyRain) {
    return {
      tone: 'rain',
      title: 'A chuva pode dispensar a rega',
      message: 'Há chuva prevista para hoje. Evita regar automaticamente: confirma a humidade da terra e não deixes água acumular nos vasos.',
    };
  }

  return {
    tone: 'water',
    title: 'Verifica se as plantas precisam de água',
    message: 'A previsão indica pouca chuva e não aponta para calor extremo. Toca no substrato e rega apenas as plantas cuja terra esteja seca.',
  };
}

function getLocationErrorMessage(error) {
  switch (error.code) {
    case 1:
      return 'A permissão de localização foi recusada. Ativa-a nas definições do navegador para consultar a previsão local.';
    case 2:
      return 'Não foi possível determinar a tua localização. Verifica o sinal e tenta novamente.';
    case 3:
      return 'A localização demorou demasiado tempo. Tenta novamente.';
    default:
      return 'Ocorreu um erro ao obter a localização. Tenta novamente.';
  }
}

function formatTemperature(value) {
  return `${Math.round(value)} °C`;
}

function formatRainfall(value) {
  return `${value.toLocaleString('pt-PT', { maximumFractionDigits: 1 })} mm`;
}
