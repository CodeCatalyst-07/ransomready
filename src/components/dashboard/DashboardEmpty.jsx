import { ChartPie } from 'lucide-react';

export default function DashboardEmpty({ onStart }) {
  return <section className="card dashboard-state">
    <span className="icon-tile"><ChartPie size={28} aria-hidden="true" /></span>
    <h2>No assessment yet</h2>
    <p>Complete an assessment to see your readiness score, strengths and next steps.</p>
    <button className="primary-button" onClick={onStart}>Start assessment</button>
  </section>;
}
