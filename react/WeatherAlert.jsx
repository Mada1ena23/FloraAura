import './WeatherAlert.css';

const WEATHER_ALERTS = {
  sol: {
    icon: '☀️',
    label: 'Sol',
    message: 'Dia quente (28°C): Regar hoje à noite'
  },
  chuva: {
    icon: '🌧️',
    label: 'Chuva',
    message: 'Previsão de chuva: Não é necessário regar hoje'
  }
};

/**
 * @param {{ estatutoclima: 'sol' | 'chuva' }} props
 */
export default function WeatherAlert({ estatutoclima }) {
  const alert = WEATHER_ALERTS[estatutoclima];
  if (!alert) return null;

  return (
    <aside
      className={`weather-alert weather-alert--${estatutoclima}`}
      aria-label={`Alerta meteorológico: ${alert.label}`}
      role="status"
    >
      <span className="weather-alert__icon" aria-hidden="true">{alert.icon}</span>
      <p className="weather-alert__message">{alert.message}</p>
    </aside>
  );
}
