import { domains, getQuestionsByDomain } from '../../utils/questionBank.js';

export default function ReviewScreen({ state, allComplete, onEdit, onSubmit, onBack, busy, error }) {
  const unsureCount = Object.values(state.answers).filter((answer) => answer === 'unsure').length;
  return (
    <section className="card assessment-panel" aria-labelledby="review-title">
      <h2 id="review-title">Review your assessment</h2>
      <p><strong>{state.organisationName}</strong>{state.assessorName && ` · Assessor: ${state.assessorName}`}</p>
      <p>{unsureCount} {unsureCount === 1 ? 'answer is' : 'answers are'} “Not sure”. These count as gaps; you can check with your team and edit them.</p>
      <table className="review-table">
        <caption>Answers by domain</caption>
        <thead><tr><th scope="col">Domain</th><th scope="col">Answered</th><th scope="col">Action</th></tr></thead>
        <tbody>{domains.map((domain, index) => {
          const domainQuestions = getQuestionsByDomain(domain.id);
          return <tr key={domain.id}><th scope="row">{domain.name}</th>
            <td>{domainQuestions.filter((q) => state.answers[q.id]).length} / {domainQuestions.length}</td>
            <td><button className="secondary-button" disabled={busy} aria-label={`Edit ${domain.name}`} onClick={() => onEdit(index)}>Edit</button></td></tr>;
        })}</tbody>
      </table>
      {error && <p role="alert" className="assessment-error">{error}</p>}
      <div className="assessment-actions">
        <button className="secondary-button" disabled={busy} onClick={onBack}>Back</button>
        <button className="primary-button" disabled={!allComplete || busy} onClick={onSubmit}>{busy ? 'Saving…' : 'Submit assessment'}</button>
      </div>
    </section>
  );
}
