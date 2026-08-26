import './ConnectionStatus.css';

const LABELS = {
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected. Refresh to reconnect.',
};

/**
 * ConnectionStatus — shows current WebSocket connection state.
 *
 * No auto-reconnect per spec.  If disconnected, shows a clear message
 * telling the user to refresh.
 */
export default function ConnectionStatus({ status }) {
  return (
    <div className="connection-status">
      <span className={`connection-dot ${status}`} />
      <span className={`connection-text ${status}`}>
        {LABELS[status] || status}
      </span>
    </div>
  );
}
