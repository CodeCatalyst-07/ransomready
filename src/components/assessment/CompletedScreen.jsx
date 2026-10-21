import { scoreAssessment } from '../../utils/scoreAssessment.js';

export default function CompletedScreen({ answers, onReset, notice }) {
  let result;
  try {
    result = scoreAssessment(answers);
  } catch {
    // Saving has already succeeded; a scoring failure must not hide that message.
    result = null;
  }

  return (
    <section className="card assessment-panel" aria-labelledby="completed-title">
      <h2 id="completed-title">Assessment completed</h2>
      {/* This summary is temporary; the full dashboard arrives in Phase 6. */}
      {result ? <div className="score-summary">
        <p className="score-percent">{result.overall.percent}%</p>
        <p><span className={`score-badge tone-${result.overall.level.tone}`}>
          Level {result.overall.level.level}: {result.overall.level.name}
        </span></p>
        <p>{result.overall.level.description}</p>
        {result.overall.capped && <p className="score-cap">{result.overall.cappedReason}</p>}
        <p>Critical gaps: <strong>{result.stats.criticalGaps}</strong></p>
        <h3>Top recommendations</h3>
        {result.recommendations.length > 0 ? <ol className="score-recommendations">
          {result.recommendations.slice(0, 5).map((item) => <li key={item.questionId}>
            <div className="assessment-actions">
              <span className={`score-badge tone-${item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'success'}`}>{item.priority}</span>
              <strong>{item.domainName}</strong>
            </div>
            <p>{item.recommendation}</p>
          </li>)}
        </ol> : <p>No gaps identified from your answers. Keep testing and improving.</p>}
      </div> : <p role="alert">We couldn’t calculate a score for these answers. Your assessment has been saved.</p>}
      <p>Assessment saved.</p>
      {notice && <p role="alert" className="assessment-error">{notice}</p>}
      <button className="primary-button" onClick={onReset}>Start another assessment</button>
    </section>
  );
}
