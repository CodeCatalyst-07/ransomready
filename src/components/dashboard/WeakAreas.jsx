import { getWeakestDomains } from '../../utils/chartMath.js';
import { domainIcons, fallbackDomainIcon } from '../../config/domainIcons.js';

export default function WeakAreas({ domains }) {
  return <section className="weak-areas">
    <h2>Weakest areas</h2>
    <p className="dashboard-muted">The three lowest scoring domains, to help focus your next improvements.</p>
    <div className="weak-area-grid">{getWeakestDomains(domains, 3).map((domain) => {
      const Icon = domainIcons[domain.id] || fallbackDomainIcon;
      return <article className="card dashboard-card weak-area-card" key={domain.id}>
        <Icon size={24} className="dashboard-accent" aria-hidden="true" />
        <h3>{domain.name}</h3>
        <strong className="weak-area-percent">{domain.percent}%</strong>
        <span className={`dashboard-badge tone-${domain.level.tone}`}>Level {domain.level.level}: {domain.level.name}</span>
        <p className="dashboard-muted">{domain.gapCount} gaps, {domain.criticalGapCount} critical</p>
      </article>;
    })}</div>
  </section>;
}
