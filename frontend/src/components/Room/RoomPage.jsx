import { useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { RoomProvider, useRoom } from '../../context/RoomContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import TopBar from './TopBar';
import EditorPanel from './EditorPanel';
import OutputPanel from './OutputPanel';
import Participants from './Participants';
import ConnectionStatus from '../shared/ConnectionStatus';
import ToastContainer from '../shared/Toast';
import './RoomPage.css';

const WS_URL = 'ws://localhost:3001';

/**
 * RoomPageInner — the actual room UI.
 *
 * Separated from the wrapper so it can use the RoomContext.
 */
function RoomPageInner() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username;
  const { state, dispatch } = useRoom();

  // If someone navigates directly to /room/:id without a username, redirect home
  useEffect(() => {
    if (!username) {
      navigate('/', { replace: true });
    }
  }, [username, navigate]);

  // Handle incoming WebSocket messages → dispatch to context
  const onMessage = useCallback((message) => {
    dispatch(message); // message.type matches reducer action types exactly
  }, [dispatch]);

  const { sendMessage, connectionStatus } = useWebSocket(
    username ? WS_URL : null,
    onMessage
  );

  // Update connection status in context
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: connectionStatus });
  }, [connectionStatus, dispatch]);

  // Join the room once connected
  useEffect(() => {
    if (connectionStatus === 'connected' && username && roomId) {
      sendMessage('JOIN_ROOM', { roomId, username });
    }
  }, [connectionStatus, roomId, username, sendMessage]);

  // Handle leaving the room
  const handleLeave = useCallback(() => {
    sendMessage('LEAVE_ROOM');
    navigate('/', { replace: true });
  }, [sendMessage, navigate]);

  // Handle code change (send full code)
  const handleCodeChange = useCallback((code) => {
    dispatch({ type: 'SET_CODE', payload: code });
    sendMessage('CODE_CHANGE', { code });
  }, [dispatch, sendMessage]);

  // Handle language change
  const handleLanguageChange = useCallback((language) => {
    sendMessage('LANGUAGE_CHANGE', { language });
  }, [sendMessage]);

  if (!username) return null;

  return (
    <div className="room-container">
      <TopBar
        roomId={roomId}
        language={state.language}
        isCompiling={state.isCompiling}
        onLanguageChange={handleLanguageChange}
        onLeave={handleLeave}
      />
      <div className="room-body">
        <div className="room-main">
          <EditorPanel
            code={state.code}
            language={state.language}
            onChange={handleCodeChange}
          />
          <OutputPanel
            output={state.output}
            roomId={roomId}
            isCompiling={state.isCompiling}
          />
        </div>
        <div className="room-sidebar">
          <Participants participants={state.participants} />
          <ConnectionStatus status={state.connectionStatus} />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

/**
 * RoomPage — wraps the inner component with the RoomProvider.
 */
export default function RoomPage() {
  return (
    <RoomProvider>
      <RoomPageInner />
    </RoomProvider>
  );
}
