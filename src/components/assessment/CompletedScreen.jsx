import { useMemo } from 'react';
import { scoreAssessment } from '../../utils/scoreAssessment.js';
import '../../styles/dashboard.css';

export default function CompletedScreen({ answers, onReset, notice, navigate }) {
  const result = useMemo(() => {
    try { return scoreAssessment(answers); }
    // Saving has already succeeded; a scoring failure must not hide confirmation.
    catch { return null; }
  }, [answers]);

  return <section className="card assessment-panel" aria-labelledby="completed-title">
    <h2 id="completed-title">Assessment saved</h2>
    {result ? <p className="completed-score">
      <strong>{result.overall.percent}%</strong>
      <span className={`dashboard-badge tone-${result.overall.level.tone}`}>
        Level {result.overall.level.level}: {result.overall.level.name}
      </span>
    </p> : <p role="alert">We couldn’t calculate a score for these answers. Your assessment has been saved.</p>}
    <p>View your dashboard for domain scores and prioritised next steps.</p>
    {notice && <p role="alert" className="assessment-error">{notice}</p>}
    <div className="assessment-actions">
      <button className="primary-button" onClick={() => navigate('dashboard')}>View dashboard</button>
      <button className="secondary-button" onClick={onReset}>Start another assessment</button>
    </div>
  </section>;
}
