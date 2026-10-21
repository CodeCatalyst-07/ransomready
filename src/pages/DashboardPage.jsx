import { useEffect, useMemo, useState } from 'react';
import { scoreAssessment } from '../utils/scoreAssessment.js';
import ScoreGauge from '../components/dashboard/ScoreGauge.jsx';
import RadarChart from '../components/dashboard/RadarChart.jsx';
import DomainBars from '../components/dashboard/DomainBars.jsx';
import StatsRow from '../components/dashboard/StatsRow.jsx';
import WeakAreas from '../components/dashboard/WeakAreas.jsx';
import RecommendationsPanel from '../components/dashboard/RecommendationsPanel.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import DashboardEmpty from '../components/dashboard/DashboardEmpty.jsx';
import '../styles/dashboard.css';

export default function DashboardPage({ navigate }) {
  const [state, setState] = useState({ loading: true, assessment: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const hasApi = typeof window.api?.getLatestAssessment === 'function';

  useEffect(() => {
    if (!hasApi) return;
    // Ignore late responses if the user leaves the page or retries.
    let active = true;
    async function load() {
      setState({ loading: true, assessment: null, error: '' });
      try {
        const response = await window.api.getLatestAssessment();
        if (!response.ok) throw new Error(response.error || 'Could not load your latest assessment.');
        if (active) setState({ loading: false, assessment: response.data, error: '' });
      } catch (error) {
        if (active) setState({ loading: false, assessment: null, error: error.message || 'Could not load your latest assessment.' });
      }
    }
    load();
    return () => { active = false; };
  }, [attempt, hasApi]);

  // Saved files contain answers only. Recalculate when the loaded assessment changes.
  const scored = useMemo(() => {
    if (!state.assessment) return null;
    try { return { result: scoreAssessment(state.assessment.answers) }; }
    catch { return { error: 'These saved answers could not be scored. They may belong to an older or incomplete assessment.' }; }
  }, [state.assessment]);
  const start = () => navigate('assessment');

  if (!hasApi) return <section className="card dashboard-state">
    <h2>Open RansomReady on your desktop</h2>
    <p>Your assessment results are saved privately on this computer. Open the Electron app to view your dashboard.</p>
  </section>;
  if (state.loading) return <section className="card dashboard-state" role="status" aria-busy="true"><p>Loading your latest assessment…</p></section>;
  if (state.error) return <section className="card dashboard-state">
    <h2>Couldn’t load your assessment</h2><p role="alert">{state.error}</p>
    <button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
  </section>;
  if (!state.assessment) return <DashboardEmpty onStart={start} />;
  if (scored.error) return <section className="card dashboard-state">
    <h2>Let’s start a fresh assessment</h2><p role="alert">{scored.error}</p>
    <button className="primary-button" onClick={start}>Start new assessment</button>
  </section>;

  const { result } = scored;
  return <div className="dashboard page-stack">
    <DashboardHeader assessment={state.assessment} {...result.overall} onReassess={start} />
    <div className="dashboard-overview">
      <div className="dashboard-summary"><ScoreGauge {...result.overall} /><StatsRow stats={result.stats} /></div>
      <RadarChart domains={result.domains} />
    </div>
    <DomainBars domains={result.domains} />
    <WeakAreas domains={result.domains} />
    <RecommendationsPanel recommendations={result.recommendations} />
  </div>;
}
