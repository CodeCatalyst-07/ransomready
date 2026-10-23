import { useState } from 'react';
export default function FindingsTable({ findings, onReveal }) {
  const [severity, setSeverity] = useState('all');
  const visible = findings.filter((finding) => severity === 'all' || finding.severity === severity);
  return <section className="card scan-card">
    <div className="scan-table-heading"><h2>Findings</h2>
      <label>Severity <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
        <option value="all">All severities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
      </select></label>
    </div>
    {!visible.length ? <p>{findings.length ? 'No findings match this severity.' : 'No possible indicators to display.'}</p> : <div className="scan-table-scroll" tabIndex={0} role="region" aria-label="Scan findings table">
      <table className="scan-table"><caption>{visible.length} retained findings</caption>
        <thead><tr><th scope="col">Severity</th><th scope="col">File name / relative path</th><th scope="col">Rule / reason</th><th scope="col">Action</th></tr></thead>
        <tbody>{visible.map((finding) => <tr key={finding.relativePath}>
          <td><span className={`scan-badge scan-${finding.severity === 'high' ? 'danger' : finding.severity === 'medium' ? 'warning' : 'low'}`}>{finding.severity}</span></td>
          <td><strong>{finding.name}</strong><span className="scan-path">{finding.relativePath}</span></td>
          <td><strong>{finding.title}</strong><p>{finding.reason}</p></td>
          <td><button className="secondary-button" aria-label={`Show ${finding.relativePath} in Finder`} onClick={() => onReveal(finding.relativePath)}>Show in Finder</button></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
