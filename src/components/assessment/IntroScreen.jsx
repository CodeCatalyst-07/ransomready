import { useEffect, useState } from 'react';
import { restoreDraft } from '../../hooks/useAssessment.js';
import { getTotalQuestionCount } from '../../utils/questionBank.js';

export default function IntroScreen({ state, dispatch }) {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await window.api.loadDraft();
        if (!result.ok) throw new Error(result.error);
        if (active) setDraft(result.data);
      } catch (error) {
        if (active) setError(`Could not load saved progress: ${error.message}`);
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, []);

  async function startNew() {
    if (!window.confirm('Discard the previous assessment draft and start a new one?')) return;
    setClearing(true);
    setError('');
    try {
      const result = await window.api.clearDraft();
      if (!result.ok) throw new Error(result.error);
      setDraft(null);
      dispatch({ type: 'RESET' });
    } catch (error) { setError(`Could not clear the draft: ${error.message}`); }
    finally { setClearing(false); }
  }

  const savedTime = draft?.savedAt && Number.isFinite(Date.parse(draft.savedAt))
    ? new Date(draft.savedAt).toLocaleString() : 'Unavailable';
  return (
    <div className="card assessment-panel">
      <p className="eyebrow">RANSOMWARE READINESS · 8 DOMAINS</p>
      <h2>Start your assessment</h2>
      <p>Answer {getTotalQuestionCount()} questions about your organisation’s current practices. You can pause and resume later.</p>
      <p>Your answers stay on this computer.</p>
      {error && <p role="alert" className="assessment-error">{error}</p>}
      {loading ? <p role="status">Checking for saved progress…</p> : draft ? (
        <section className="resume-card" aria-labelledby="resume-title">
          <h3 id="resume-title">Resume previous assessment</h3>
          <p><strong>{draft.organisationName}</strong></p>
          <p>{Object.keys(restoreDraft(draft).answers).length} of {getTotalQuestionCount()} answered</p>
          <p>Last saved: {savedTime}</p>
          <div className="assessment-actions">
            <button className="primary-button" disabled={clearing} onClick={() => dispatch({ type: 'RESUME', draft })}>Resume</button>
            <button className="secondary-button" disabled={clearing} onClick={startNew}>Start new</button>
          </div>
        </section>
      ) : (
        <form className="assessment-form" onSubmit={(event) => { event.preventDefault(); dispatch({ type: 'NEXT' }); }}>
          <label htmlFor="organisation-name">Organisation name (required)</label>
          <input id="organisation-name" required maxLength={100} autoComplete="organization" value={state.organisationName}
            onChange={(event) => dispatch({ type: 'SET_FIELD', field: 'organisationName', value: event.target.value })} />
          <label htmlFor="assessor-name">Assessor name (optional)</label>
          <input id="assessor-name" autoComplete="name" value={state.assessorName}
            onChange={(event) => dispatch({ type: 'SET_FIELD', field: 'assessorName', value: event.target.value })} />
          <button className="primary-button" disabled={!state.organisationName.trim() || !!error}>Start assessment</button>
          {error && <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Retry loading progress</button>}
        </form>
      )}
    </div>
  );
}
