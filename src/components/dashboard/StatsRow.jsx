export default function StatsRow({ stats }) {
  const counts = [['Yes', stats.yes], ['Partial', stats.partial], ['No', stats.no],
    ['Not sure', stats.unsure], ['Critical gaps', stats.criticalGaps]];
  return <section aria-label="Answer statistics" className="stats-row">
    {counts.map(([label, count]) => <div className="card stat-card" key={label}>
      <strong className={label === 'Critical gaps' && count > 0 ? 'tone-danger' : ''}>{count}</strong>
      <span>{label}</span>
    </div>)}
  </section>;
}
