export default function ExportStatus({ status, dismissStatus }) {
  if (!status.text) return null;
  return <div className="card dashboard-card" role={status.error ? 'alert' : 'status'}>
    <p>{status.text}</p>
    <button className="primary-button" onClick={dismissStatus}>Dismiss</button>
  </div>;
}
