import { domainIcons, fallbackDomainIcon } from '../../config/domainIcons.js';

export default function DomainBars({ domains }) {
  return (
    <section className="card dashboard-card">
      <h2>Domain scores</h2>
      <div className="domain-score-list">{domains.map((domain) => {
        const Icon = domainIcons[domain.id] || fallbackDomainIcon;
        return <div className="domain-score-row" key={domain.id}>
          <div className="domain-score-name"><Icon size={20} aria-hidden="true" /><h3>{domain.name}</h3></div>
          <div className="domain-score-bar" role="progressbar" aria-label={`${domain.name} readiness`}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={domain.percent}
            aria-valuetext={`${domain.percent} percent, ${domain.level.name}`}>
            <div className={`domain-score-fill tone-${domain.level.tone}`} style={{ width: `${domain.percent}%` }} />
          </div>
          <div className="domain-score-details">
            <strong>{domain.percent}%</strong>
            <span className={`dashboard-badge tone-${domain.level.tone}`}>{domain.level.name}</span>
            <span>{domain.gapCount} gaps</span>
            {domain.criticalGapCount > 0 && <span className="tone-danger">{domain.criticalGapCount} critical</span>}
          </div>
        </div>;
      })}</div>
    </section>
  );
}
