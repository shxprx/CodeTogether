import { useState, useCallback } from 'react';
import './TopBar.css';

const LANGUAGE_LABELS = {
  cpp: 'C++',
  python: 'Python',
  java: 'Java',
};

/**
 * TopBar — room controls.
 *
 * Shows: brand, room ID (click to copy), language selector, run button, leave button.
 */
export default function TopBar({ roomId, language, isCompiling, onLanguageChange, onLeave }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomId]);

  return (
    <div className="topbar">
      <span className="topbar-brand">⟨/⟩ Code Together</span>

      <div
        className={`topbar-room-id ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        title="Click to copy Room ID"
      >
        <span>{copied ? '✓ Copied!' : roomId}</span>
        {!copied && <span className="copy-icon">📋</span>}
      </div>

      <div className="topbar-actions">
        <select
          id="language-selector"
          className="select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <button
          id="leave-btn"
          className="btn btn-danger"
          onClick={onLeave}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
