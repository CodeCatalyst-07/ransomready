export default function CompletedScreen({ onReset, notice }) {
  return (
    <section className="card assessment-panel" aria-labelledby="completed-title">
      <h2 id="completed-title">Assessment completed</h2>
      <p>Assessment saved. Scoring and the dashboard arrive in Phases 5 and 6.</p>
      {notice && <p role="alert" className="assessment-error">{notice}</p>}
      <button className="primary-button" onClick={onReset}>Start another assessment</button>
    </section>
  );
}
