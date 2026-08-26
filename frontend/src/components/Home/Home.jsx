import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../services/api';
import './Home.css';

/**
 * Home — landing page with room creation and joining.
 *
 * Two actions:
 *   1. Create Room → POST /api/rooms → navigate to /room/:id
 *   2. Join Room   → navigate to /room/:id (joining happens via WebSocket)
 */
export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await createRoom();
      navigate(`/room/${data.roomId}`, { state: { username: username.trim() } });
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter a Room ID');
      return;
    }

    setError('');
    navigate(`/room/${roomId.trim()}`, { state: { username: username.trim() } });

  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (roomId.trim()) {
        handleJoinRoom();
      } else {
        handleCreateRoom();
      }
    }
  };

  return (
    <div className="home-container">
      <div className="home-card fade-in">
        <div className="home-header">
          <div className="home-logo">⟨/⟩</div>
          <h1 className="home-title">Code Together</h1>
          <p className="home-subtitle">
            Real-time collaborative code editor
          </p>
        </div>

        <div className="home-form">
          <div className="home-field">
            <label className="home-label" htmlFor="username-input">
              Username
            </label>
            <input
              id="username-input"
              className="input"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              autoFocus
            />
          </div>

          <button
            id="create-room-btn"
            className="btn btn-primary home-btn"
            onClick={handleCreateRoom}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            Create New Room
          </button>

          <div className="home-divider">
            <span>or join existing</span>
          </div>

          <div className="home-field">
            <label className="home-label" htmlFor="room-id-input">
              Room ID
            </label>
            <input
              id="room-id-input"
              className="input"
              type="text"
              placeholder="Paste Room ID here"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            id="join-room-btn"
            className="btn btn-secondary home-btn"
            onClick={handleJoinRoom}
            disabled={loading}
          >
            Join Room
          </button>

          {error && <div className="home-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
