import { FileDown } from 'lucide-react';

export default function DashboardHeader({ assessment, level, capped, cappedReason, onReassess, onExport, exporting }) {
  const date = new Date(assessment.completedAt);
  const validDate = Number.isFinite(date.getTime());
  return <header className="card dashboard-card dashboard-header">
    <div className="dashboard-heading">
      <div><p className="eyebrow">LATEST COMPLETED ASSESSMENT</p>
        <h2>{assessment.organisationName}</h2>
        <p className="dashboard-muted">
          {assessment.assessorName && <span>Assessed by {assessment.assessorName} · </span>}
          {validDate ? <time dateTime={assessment.completedAt}>{date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time> : 'Completion date unavailable'}
        </p>
      </div>
      <div className="dashboard-actions">
        <button className="primary-button" onClick={onExport} disabled={exporting}>
          <FileDown size={18} aria-hidden="true" />{exporting ? 'Exporting...' : 'Export PDF report'}
        </button>
        <button className="primary-button" onClick={onReassess}>Reassess</button>
      </div>
    </div>
    <p className={`tone-${level.tone}`}>Level {level.level}: {level.name}</p>
    {capped && <p className="dashboard-cap" role="note"><strong>Maturity level capped.</strong> {cappedReason}</p>}
  </header>;
}
