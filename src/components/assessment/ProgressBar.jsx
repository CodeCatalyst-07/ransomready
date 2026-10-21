export default function ProgressBar({ answeredCount, totalCount, percentComplete }) {
  return (
    <div className="assessment-progress">
      <p aria-live="polite">{answeredCount} of {totalCount} answered <strong>{percentComplete}% complete</strong></p>
      <div className="progress-track" role="progressbar" aria-label="Assessment progress"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentComplete}
        aria-valuetext={`${answeredCount} of ${totalCount} questions answered`}>
        <div className="progress-fill" style={{ width: `${percentComplete}%` }} />
      </div>
    </div>
  );
}
