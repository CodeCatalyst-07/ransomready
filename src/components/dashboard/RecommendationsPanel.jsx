import { useId, useState } from 'react';
import { filterRecommendations } from '../../utils/chartMath.js';

const answerLabels = { no: 'Not in place', partial: 'Partially in place', unsure: 'Not sure' };
const priorityTones = { High: 'danger', Medium: 'warning', Low: 'success' };

export default function RecommendationsPanel({ recommendations }) {
  const [priority, setPriority] = useState('All');
  const [domainId, setDomainId] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const id = useId();
  const domains = [...new Map(recommendations.map((item) => [item.domainId, item.domainName])).entries()];
  const filtered = filterRecommendations(recommendations, { priority, domainId });
  const visible = showAll ? filtered : filtered.slice(0, 8);

  // Changing either filter returns the list to its short, eight-item view.
  function changeFilter(setFilter, value) {
    setFilter(value);
    setShowAll(false);
  }

  return <section className="card dashboard-card recommendations-panel">
    <h2>Prioritised recommendations</h2>
    {recommendations.length === 0 ? <p className="tone-success">No gaps found. Keep testing and improving.</p> : <>
      <div className="recommendation-filters">
        <div><label htmlFor={`${id}-priority`}>Priority</label>
          <select id={`${id}-priority`} value={priority} onChange={(event) => changeFilter(setPriority, event.target.value)}>
            {['All', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}
          </select></div>
        <div><label htmlFor={`${id}-domain`}>Domain</label>
          <select id={`${id}-domain`} value={domainId} onChange={(event) => changeFilter(setDomainId, event.target.value)}>
            <option value="all">All domains</option>
            {domains.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select></div>
      </div>
      <p className="dashboard-muted" role="status">Showing {visible.length} of {filtered.length}
        {filtered.length !== recommendations.length && ` matching recommendations (${recommendations.length} total)`}</p>
      {filtered.length === 0 ? <p>No recommendations match these filters</p> : <ol className="recommendation-list" id={`${id}-list`}>
        {visible.map((item) => <li key={item.questionId}>
          <div className="recommendation-meta">
            <span className={`dashboard-badge tone-${priorityTones[item.priority]}`}>{item.priority}</span>
            <strong>{item.domainName}</strong>
          </div>
          <h3>{item.questionText}</h3>
          <p>{item.recommendation}</p>
          <p className="dashboard-muted">Current answer: <strong>{answerLabels[item.answer]}</strong></p>
        </li>)}
      </ol>}
      {filtered.length > 8 && <button className="secondary-button" aria-expanded={showAll} aria-controls={`${id}-list`}
        onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer' : `Show all ${filtered.length}`}</button>}
    </>}
  </section>;
}
