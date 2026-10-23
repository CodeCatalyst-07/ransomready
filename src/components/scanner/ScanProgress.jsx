export default function ScanProgress({ progress }) {
  return <section className="card scan-card" aria-busy="true">
    <h2>Scanning file names…</h2>
    <div className="scan-progress" role="progressbar" aria-label="Folder scan in progress"><span /></div>
    <p role="status" aria-live="polite">{progress.filesScanned.toLocaleString()} files scanned · {progress.foldersScanned.toLocaleString()} folders scanned · {progress.findingsCount.toLocaleString()} findings so far</p>
  </section>;
}
