import { useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';
import './Toast.css';

const TOAST_DURATION = 3000;

const ICONS = {
  info: 'ℹ️',
  error: '❌',
  success: '✅',
};

/**
 * ToastContainer — renders toast notifications from the RoomContext.
 *
 * Toasts auto-dismiss after 3 seconds.
 * Used for join/leave notifications and error messages.
 */
export default function ToastContainer() {
  const { state, dispatch } = useRoom();
  const { toasts } = state;

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dispatch({ type: 'DISMISS_TOAST', payload: toast.id });
      }, TOAST_DURATION)
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span className="toast-icon">{ICONS[toast.type] || 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
