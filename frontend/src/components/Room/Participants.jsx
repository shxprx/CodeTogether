import './Participants.css';

/**
 * Participants — simple bullet list of users in the room.
 *
 * No avatars, no fancy cards.  Just:
 *   • Shourya
 *   • Aryan
 *
 * Per spec — keep it simple.
 */
export default function Participants({ participants }) {
  return (
    <div className="participants">
      <div className="participants-title">
        Participants
        <span className="participants-count">({participants.length})</span>
      </div>
      <ul className="participants-list">
        {participants.map((p) => (
          <li key={p.socketId} className="participant-item">
            <span className="participant-dot" />
            <span className="participant-name">{p.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
