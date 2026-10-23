import { useEffect, useRef, useState } from 'react';
import ScanAdvice from '../components/scanner/ScanAdvice.jsx';
import ScanControls from '../components/scanner/ScanControls.jsx';
import ScanProgress from '../components/scanner/ScanProgress.jsx';
import ScanSummary from '../components/scanner/ScanSummary.jsx';
import FindingsTable from '../components/scanner/FindingsTable.jsx';
import '../styles/scanner.css';
const emptyProgress = { filesScanned: 0, foldersScanned: 0, findingsCount: 0 };
export default function ScannerPage() {
  const api = window.api;
  const [folder, setFolder] = useState('');
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [latest, setLatest] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(emptyProgress);
  const mounted = useRef(false);
  const running = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    mounted.current = true;
    if (!api) return () => { mounted.current = false; };
    let active = true;
    const initialGeneration = generation.current;
    const unsubscribe = api.onScanProgress((data) => { if (active && running.current) setProgress(data); });
    api.getLatestScan().then((response) => {
      if (!active || generation.current !== initialGeneration) return;
      if (!response.ok) throw new Error(response.error);
      setLatest(response.data);
    }).catch((failure) => { if (active) setError(failure.message); });
    return () => {
      active = false;
      mounted.current = false;
      unsubscribe();
      // Use a ref so cleanup sees the current scan, without resubscribing on updates.
      if (running.current) api.cancelScan().catch(() => {});
    };
  }, [api]);
  async function choose() {
    setError(''); setChoosing(true);
    try {
      const response = await api.chooseScanFolder();
      if (!response.ok) throw new Error(response.error);
      if (mounted.current && response.data) setFolder(response.data.path);
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { if (mounted.current) setChoosing(false); }
  }
  async function start() {
    if (running.current) return;
    running.current = true;
    generation.current += 1;
    setBusy(true); setCancelling(false); setError(''); setResult(null); setProgress(emptyProgress);
    try {
      const response = await api.startScan();
      if (!response.ok) throw new Error(response.error);
      if (mounted.current) { setResult(response.data); setLatest(response.data); }
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { running.current = false; if (mounted.current) { setBusy(false); setCancelling(false); } }
  }
  async function cancel() {
    setCancelling(true);
    try { const response = await api.cancelScan(); if (!response.ok) throw new Error(response.error); }
    catch (failure) { if (mounted.current) { setError(failure.message); setCancelling(false); } }
  }
  async function reveal(relativePath) {
    setError('');
    try { const response = await api.revealInFolder(relativePath); if (!response.ok) throw new Error(response.error); }
    catch (failure) { if (mounted.current) setError(failure.message); }
  }
  if (!api) return <section className="card scan-card"><h2>Open RansomReady on your desktop</h2><p>Open the Electron app to choose a folder and scan file names privately on this computer.</p></section>;
  const total = result ? result.counts.high + result.counts.medium + result.counts.low : 0;
  return <div className="scanner page-stack">
    <ScanAdvice />
    <ScanControls folder={folder} busy={busy} choosing={choosing} cancelling={cancelling} onChoose={choose} onStart={start} onCancel={cancel} />
    {error && <p className="card scan-card scan-danger" role="alert">{error}</p>}
    {busy && <ScanProgress progress={progress} />}
    {!busy && latest && <section className="card scan-card scan-last"><h2>Last scan</h2><p className="scan-path">{latest.rootPath}</p><p>{new Date(latest.finishedAt).toLocaleString()} · {latest.counts.high} high · {latest.counts.medium} medium · {latest.counts.low} low · {latest.status}</p><p className="scan-muted">Starting a new scan replaces the saved last scan.</p></section>}
    {!busy && result && <><ScanSummary result={result} /><FindingsTable key={result.startedAt} findings={result.findings} onReveal={reveal} />{total > 0 && <ScanAdvice findings />}</>}
  </div>;
}
