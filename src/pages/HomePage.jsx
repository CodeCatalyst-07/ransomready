import { ArrowRight, ClipboardCheck, Radar, Lightbulb, ShieldCheck } from 'lucide-react';

const features = [
  { icon: ClipboardCheck, title: 'Assess readiness', text: 'Understand your organisation’s preparedness for ransomware.' },
  { icon: Radar, title: 'Detect early signs', text: 'Learn about potential warning signs that deserve attention.' },
  { icon: Lightbulb, title: 'Improve with recommendations', text: 'Turn identified gaps into practical steps for improvement.' },
];

export default function HomePage({ navigate }) {
  return (
    <div className="page-stack">
      <section className="welcome card" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <p className="eyebrow">ASSESS. DETECT. IMPROVE.</p>
          <h2 id="welcome-title">A clearer path to<br />ransomware readiness.</h2>
          <p>Welcome to RansomReady, a tool designed to help organisations understand their ransomware preparedness. As the project develops, it will bring together readiness assessments, early warning signs and practical recommendations for improvement.</p>
          <button className="primary-button" type="button" onClick={() => navigate('assessment')}>
            Start Assessment <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="welcome-emblem" aria-hidden="true"><ShieldCheck size={100} strokeWidth={1.25} /></div>
      </section>

      <section aria-labelledby="features-title">
        <div className="section-heading"><h2 id="features-title">Built around your readiness</h2><span>What’s ahead</span></div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card card" key={title}>
              <div className="icon-tile"><Icon size={23} aria-hidden="true" /></div>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="shell-note">The app shell is ready. Assessment and analysis features will arrive in later phases.</p>
    </div>
  );
}
