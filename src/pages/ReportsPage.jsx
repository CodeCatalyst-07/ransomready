import { useEffect, useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { scoreAssessment } from '../utils/scoreAssessment.js';
import useReportExport from '../hooks/useReportExport.js';
import ExportStatus from '../components/ExportStatus.jsx';
import '../styles/dashboard.css';

function dateLabel(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Date unavailable';
}

export default function ReportsPage({ navigate }) {
  const [state, setState] = useState({ loading: true, assessment: null, error: '' });
  const [scan, setScan] = useState(null);
  const [scanLoading, setScanLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const hasApi = typeof window.api?.getLatestAssessment === 'function';

  useEffect(() => {
    if (!hasApi) return;
    let active = true;
    setState({ loading: true, assessment: null, error: '' });
    setScan(null);
    setScanLoading(true);
    async function loadAssessment() {
      try {
        const response = await window.api.getLatestAssessment();
        if (!response.ok) throw new Error(response.error || 'Could not load your latest assessment.');
        if (active) setState({ loading: false, assessment: response.data, error: '' });
      } catch (error) {
        if (active) setState({ loading: false, assessment: null, error: error.message || 'Could not load your latest assessment.' });
      }
    }
    async function loadScan() {
      // Scan failure is optional and must not hide the assessment report.
      try {
        const response = await window.api.getLatestScan();
        if (active) setScan(response?.ok ? response.data : null);
      } catch { if (active) setScan(null); }
      finally { if (active) setScanLoading(false); }
    }
    loadAssessment();
    loadScan();
    return () => { active = false; };
  }, [attempt, hasApi]);

  const scored = useMemo(() => {
    if (!state.assessment) return null;
    try { return { result: scoreAssessment(state.assessment.answers) }; }
    catch { return { error: 'These saved answers could not be scored. They may belong to an older or incomplete assessment.' }; }
  }, [state.assessment]);
  const { exporting, status, exportReport, dismissStatus } = useReportExport({
    assessment: state.assessment, result: scanLoading ? null : scored?.result, scan,
  });
  const start = () => navigate('assessment');

  if (!hasApi) return <section className="card dashboard-state">
    <h2>Open RansomReady on your desktop</h2>
    <p>Your assessment results are saved privately on this computer. Open the Electron app to view your reports.</p>
  </section>;
  if (state.loading) return <section className="card dashboard-state" role="status" aria-busy="true"><p>Loading your latest report…</p></section>;
  if (state.error) return <section className="card dashboard-state">
    <h2>Couldn’t load your report</h2><p role="alert">{state.error}</p>
    <button className="primary-button" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
  </section>;
  if (!state.assessment) return <section className="card dashboard-state">
    <h2>No report available yet</h2><p>Complete an assessment to generate your readiness report.</p>
    <button className="primary-button" onClick={start}>Start assessment</button>
  </section>;
  if (scored.error) return <section className="card dashboard-state">
    <h2>Couldn’t prepare your report</h2><p role="alert">{scored.error}</p>
    <button className="primary-button" onClick={start}>Start assessment</button>
  </section>;

  const { assessment } = state;
  const { overall, stats } = scored.result;
  return <div className="dashboard page-stack reports-page">
    <section className="card dashboard-card report-summary" aria-labelledby="latest-report-title">
      <h2 id="latest-report-title">Latest report</h2>
      <h3>{assessment.organisationName}</h3>
      {assessment.assessorName && <p>Assessor: {assessment.assessorName}</p>}
      <p>Assessment completed: {dateLabel(assessment.completedAt)}</p>
      <p><strong>Overall readiness: {overall.percent}%</strong>{' '}
        <span className={`dashboard-badge tone-${overall.level.tone}`}>Level {overall.level.level}: {overall.level.name}</span>
      </p>
      {overall.capped && <p className="dashboard-cap">{overall.cappedReason}</p>}
      <p>Critical gaps: {stats.criticalGaps}</p>
      {scanLoading ? <p role="status">Checking for an early-sign scan…</p> : scan ? <p>
        Early-sign scan: {dateLabel(scan.finishedAt)} — {scan.counts.high} high, {scan.counts.medium} medium, {scan.counts.low} low. It will be included in the report.
      </p> : <div>
        <p>No early-sign scan yet. Running one is optional</p>
        <button className="primary-button" onClick={() => navigate('scanner')}>Go to Scanner</button>
      </div>}
      <div className="dashboard-actions">
        <button className="primary-button" onClick={exportReport} disabled={exporting || scanLoading}>
          <FileDown size={18} aria-hidden="true" />{exporting ? 'Exporting...' : 'Export PDF report'}
        </button>
        <button className="primary-button" onClick={() => navigate('dashboard')}>View dashboard</button>
      </div>
    </section>
    <ExportStatus status={status} dismissStatus={dismissStatus} />
    <section className="card dashboard-card report-summary" aria-labelledby="report-contents-title">
      <h2 id="report-contents-title">What the report contains</h2>
      <ul>
        <li>Cover</li><li>Executive summary</li><li>Domain results with radar chart</li>
        <li>Prioritised recommendations</li><li>Early-sign scan (when available)</li><li>Methodology and limits</li>
      </ul>
    </section>
    <p className="dashboard-muted">Reports are always generated from your most recent assessment. Earlier assessments stay saved on this computer but are not shown in the app.</p>
  </div>;
}
