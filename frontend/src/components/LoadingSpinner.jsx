export default function LoadingSpinner({ message }) {
  return (
    <div className="spinner-overlay">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        {message && <p className="text-secondary">{message}</p>}
      </div>
    </div>
  );
}
