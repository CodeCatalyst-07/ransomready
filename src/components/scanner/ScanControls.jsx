export default function ScanControls({ folder, busy, choosing, cancelling, onChoose, onStart, onCancel }) {
  return <section className="card scan-card">
    <h2>Choose what to scan</h2>
    <p className="scan-path">{folder || 'Choose a folder using the desktop folder picker.'}</p>
    <div className="scan-actions">
      <button className="secondary-button" disabled={busy || choosing} onClick={onChoose}>{choosing ? 'Choosing…' : 'Choose folder'}</button>
      <button className="primary-button" disabled={!folder || busy || choosing} onClick={onStart}>Start scan</button>
      {busy && <button className="secondary-button" disabled={cancelling} onClick={onCancel}>{cancelling ? 'Cancelling…' : 'Cancel'}</button>}
    </div>
  </section>;
}
