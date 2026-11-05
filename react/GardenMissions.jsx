import { useState } from 'react';
import './GardenMissions.css';

const MISSIONS = [
  { id: 'water', label: 'Regar plantas da varanda', points: 20 },
  { id: 'flower', label: 'Fotografar uma flor', points: 30 }
];
const TOTAL_POINTS = MISSIONS.reduce((total, mission) => total + mission.points, 0);

export default function GardenMissions() {
  const [completedMissions, setCompletedMissions] = useState([]);
  const points = MISSIONS.reduce(
    (total, mission) => total + (completedMissions.includes(mission.id) ? mission.points : 0),
    0
  );
  const progress = (points / TOTAL_POINTS) * 100;

  function toggleMission(missionId) {
    setCompletedMissions((currentMissions) => (
      currentMissions.includes(missionId)
        ? currentMissions.filter((id) => id !== missionId)
        : [...currentMissions, missionId]
    ));
  }

  return (
    <section className="garden-missions" aria-labelledby="garden-missions-title">
      <header className="garden-missions__header">
        <div>
          <p className="garden-missions__eyebrow">O meu jardim · desafios</p>
          <h2 id="garden-missions-title">Nível 1</h2>
          <p className="garden-missions__rank">Jardineiro Iniciante</p>
        </div>
        <p className="garden-missions__points" aria-live="polite">
          <strong>{points}</strong>
          <span>/{TOTAL_POINTS} pts</span>
        </p>
      </header>

      <div
        className="garden-missions__progress"
        role="progressbar"
        aria-label="Progresso das missões"
        aria-valuemin={0}
        aria-valuemax={TOTAL_POINTS}
        aria-valuenow={points}
        aria-valuetext={`${points} de ${TOTAL_POINTS} pontos`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="garden-missions__progress-caption">
        {points === TOTAL_POINTS ? 'Todas as missões concluídas!' : 'Conclui as missões para ganhar pontos'}
      </p>

      <fieldset className="garden-missions__list">
        <legend>Missões de hoje</legend>
        {MISSIONS.map((mission) => {
          const checked = completedMissions.includes(mission.id);
          const inputId = `garden-mission-${mission.id}`;
          return (
            <label
              className={`garden-missions__mission${checked ? ' garden-missions__mission--completed' : ''}`}
              htmlFor={inputId}
              key={mission.id}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={() => toggleMission(mission.id)}
              />
              <span className="garden-missions__mission-label">{mission.label}</span>
              <span className="garden-missions__mission-points">+{mission.points} pts</span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
