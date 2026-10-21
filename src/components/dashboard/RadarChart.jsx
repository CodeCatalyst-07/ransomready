import { buildGridPolygonPoints, buildRadarPolygonPoints, polarToCartesian,
  getWeakestDomains } from '../../utils/chartMath.js';

export default function RadarChart({ domains }) {
  const lowest = getWeakestDomains(domains, 1)[0];
  const highest = domains.reduce((best, domain) => !best || domain.percent > best.percent ? domain : best, null);
  // Padding leaves room for labels even on the left and right axes.
  const cx = 240, cy = 200, radius = 125;
  const points = buildRadarPolygonPoints(domains.map((domain) => domain.percent), cx, cy, radius);
  return (
    <section className="card dashboard-card radar-card">
      <h2>Readiness by domain</h2>
      <p className="dashboard-muted">Each outer edge represents 100% readiness.</p>
      <svg className="radar-chart" viewBox="0 0 480 400" role="img"
        aria-label={lowest ? `Domain readiness: lowest ${lowest.name} at ${lowest.percent} percent; highest ${highest.name} at ${highest.percent} percent.` : 'No domain scores available'}>
        {[25, 50, 75, 100].map((percent) => <g key={percent}>
          <polygon className="radar-grid" points={buildGridPolygonPoints(percent, domains.length, cx, cy, radius)} />
          <text className="radar-ring-label" x={cx + 5} y={cy - radius * percent / 100 - 4}>{percent}</text>
        </g>)}
        {domains.map((domain, index) => {
          const end = polarToCartesian(cx, cy, radius, index, domains.length);
          const label = polarToCartesian(cx, cy, radius + 26, index, domains.length);
          return <g key={domain.id}>
            <line className="radar-axis" x1={cx} y1={cy} x2={end.x} y2={end.y} />
            <text className="radar-label" x={label.x} y={label.y} dominantBaseline="middle"
              textAnchor={label.x > cx + 1 ? 'start' : label.x < cx - 1 ? 'end' : 'middle'}>
              {domain.shortName || domain.name.split(' ')[0]}
            </text>
          </g>;
        })}
        <polygon className="radar-scores" points={points} />
        {domains.map((domain, index) => {
          const point = polarToCartesian(cx, cy, radius * domain.percent / 100, index, domains.length);
          return <circle className="radar-dot" key={domain.id} cx={point.x} cy={point.y} r="3.5" />;
        })}
      </svg>
      <table className="sr-only">
        <caption>Readiness scores by domain</caption>
        <thead><tr><th scope="col">Domain</th><th scope="col">Percent</th></tr></thead>
        <tbody>{domains.map((domain) => <tr key={domain.id}><th scope="row">{domain.name}</th><td>{domain.percent}%</td></tr>)}</tbody>
      </table>
    </section>
  );
}
