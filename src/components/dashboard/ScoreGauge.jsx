import { arcDashArray } from '../../utils/chartMath.js';

export default function ScoreGauge({ percent, level }) {
  const { dash, gap } = arcDashArray(percent, 84);
  return (
    <section className="card dashboard-card score-gauge">
      <h2>Overall readiness</h2>
      <svg viewBox="0 0 220 220" role="img"
        aria-label={`Overall readiness ${percent} percent, Level ${level.level} ${level.name}`}>
        <circle className="gauge-track" cx="110" cy="110" r="84" />
        {/* Rotate the start of the circle from the right edge to the top. */}
        <circle className={`gauge-arc tone-${level.tone}`} cx="110" cy="110" r="84"
          transform="rotate(-90 110 110)" strokeDasharray={`${dash} ${gap}`} />
        <text className="gauge-number" x="110" y="108" textAnchor="middle" dominantBaseline="middle">{percent}%</text>
        <text className="gauge-caption" x="110" y="137" textAnchor="middle">readiness</text>
      </svg>
      <span className={`dashboard-badge tone-${level.tone}`}>{level.name}</span>
      <p>Level {level.level} of 5</p>
      <p className="dashboard-muted">{level.description}</p>
    </section>
  );
}
