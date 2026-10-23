export default function ScanSummary({ result }) {
  const total = result.counts.high + result.counts.medium + result.counts.low;
  const tone = total === 0 ? 'success' : result.counts.high ? 'danger' : 'warning';
  return <section className={`card scan-card scan-summary scan-${tone}`}>
    <h2>{total ? `${total} possible indicators found` : 'No possible indicators found in this folder'}</h2>
    <p>A clean result is not proof of safety. Filename matches can be false positives.</p>
    {result.status === 'cancelled' && <p role="status"><strong>Scan cancelled.</strong> These are partial results.</p>}
    {result.status === 'limit-reached' && <p role="status"><strong>File limit reached.</strong> These are partial results.</p>}
    {result.truncated && <p role="status"><strong>Findings list truncated.</strong> Showing {result.findings.length} findings; counts include all matches found.</p>}
    <dl className="scan-stats">
      <div><dt>High</dt><dd>{result.counts.high}</dd></div><div><dt>Medium</dt><dd>{result.counts.medium}</dd></div><div><dt>Low</dt><dd>{result.counts.low}</dd></div>
      <div><dt>Files scanned</dt><dd>{result.filesScanned.toLocaleString()}</dd></div>
      <div><dt>Duration</dt><dd>{(result.durationMs / 1000).toFixed(1)} s</dd></div>
      <div><dt>Unreadable items skipped</dt><dd>{result.skippedUnreadable}</dd></div>
      <div><dt>Symlinks skipped</dt><dd>{result.symlinksSkipped}</dd></div>
      <div><dt>Folders skipped</dt><dd>{result.foldersSkipped}</dd></div>
    </dl>
  </section>;
}
