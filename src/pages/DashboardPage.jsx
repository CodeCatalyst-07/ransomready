import { useEffect, useMemo, useRef, useState } from 'react';
import { buildReportHtml } from '../utils/reportHtml.js';
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
  const [scan, setScan] = useState(null);
  const [scanLoading, setScanLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState({ text: '', error: false });
  const exportBusy = useRef(false);
  const mounted = useRef(false);
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

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    // A missing/corrupt scan must never prevent assessment results from loading.
    async function loadScan() {
      try {
        const response = await window.api?.getLatestScan?.();
        if (active) setScan(response?.ok ? response.data : null);
      } catch { if (active) setScan(null); }
      finally { if (active) setScanLoading(false); }
    }
    loadScan();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!exportMessage.text || exportMessage.error) return;
    const timer = setTimeout(() => setExportMessage({ text: '', error: false }), 8000);
    return () => clearTimeout(timer);
  }, [exportMessage]);

  // Saved files contain answers only. Recalculate when the loaded assessment changes.
  const scored = useMemo(() => {
    if (!state.assessment) return null;
    try { return { result: scoreAssessment(state.assessment.answers) }; }
    catch { return { error: 'These saved answers could not be scored. They may belong to an older or incomplete assessment.' }; }
  }, [state.assessment]);
  const start = () => navigate('assessment');

  async function exportReport() {
    // A ref closes the small gap before React renders the disabled button.
    if (exportBusy.current || scanLoading || !scored?.result) return;
    exportBusy.current = true;
    setExporting(true);
    setExportMessage({ text: '', error: false });
    try {
      const generatedAt = new Date().toISOString();
      const html = buildReportHtml({ assessment: state.assessment, result: scored.result, scan, generatedAt });
      const response = await window.api.exportReportPdf({
        html, suggestedName: `RansomReady-Report-${state.assessment.organisationName}-${generatedAt.slice(0, 10)}.pdf`,
      });
      if (!response?.ok) throw new Error(response?.error || 'Could not export the report.');
      if (!response.data.cancelled && mounted.current) {
        setExportMessage({ text: `Report saved to ${response.data.filePath}`, error: false });
      }
    } catch (error) {
      if (mounted.current) setExportMessage({ text: error.message || 'Could not export the report.', error: true });
    } finally {
      exportBusy.current = false;
      if (mounted.current) setExporting(false);
    }
  }

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
    <DashboardHeader assessment={state.assessment} {...result.overall} onReassess={start} onExport={exportReport} exporting={exporting || scanLoading} />
    {exportMessage.text && <div className="card dashboard-card" role={exportMessage.error ? 'alert' : 'status'}>
      <p>{exportMessage.text}</p>
      <button className="primary-button" onClick={() => setExportMessage({ text: '', error: false })}>Dismiss</button>
    </div>}
    <div className="dashboard-overview">
      <div className="dashboard-summary"><ScoreGauge {...result.overall} /><StatsRow stats={result.stats} /></div>
      <RadarChart domains={result.domains} />
    </div>
    <DomainBars domains={result.domains} />
    <WeakAreas domains={result.domains} />
    <RecommendationsPanel recommendations={result.recommendations} />
  </div>;
}
