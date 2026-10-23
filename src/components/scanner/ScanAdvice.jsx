export default function ScanAdvice({ findings = false }) {
  return <section className="card scan-card">
    <h2>{findings ? 'What to do if these look real' : 'Early-sign scanner'}</h2>
    {findings ? <>
      <p>These can be false positives. A filename alone cannot confirm ransomware.</p>
      <ul><li>Disconnect the device from the network.</li><li>Do not open or run the suspicious files.</li><li>Do not pay any ransom.</li><li>Keep logs and contact your IT or security team.</li><li>Report to CERT-In (cert-in.org.in).</li></ul>
    </> : <>
      <p>Read-only. This scan only looks at file names. It never opens, changes or uploads your files.</p>
      <p>A clean result does not prove your computer is safe. This is not an antivirus.</p>
      <p className="scan-muted">The indicator list is a small demonstration sample, not a complete or authoritative list.</p>
    </>}
  </section>;
}
