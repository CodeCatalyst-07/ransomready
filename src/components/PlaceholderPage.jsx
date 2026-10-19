export default function PlaceholderPage({ icon: Icon, title, description, phase }) {
  return (
    <section className="placeholder card" aria-labelledby="placeholder-title">
      <div className="icon-tile placeholder-icon"><Icon size={32} aria-hidden="true" /></div>
      <span className="phase-badge">Coming in Phase {phase}</span>
      <h2 id="placeholder-title">{title}</h2>
      <p>{description}</p>
    </section>
  );
}
