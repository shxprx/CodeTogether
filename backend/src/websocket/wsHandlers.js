import { roomManager } from '../core/RoomManager.js';
import { sendToSocket, broadcast } from './wsServer.js';
import { SUPPORTED_LANGUAGES, MAX_CODE_SIZE } from '../config/constants.js';

/**
 * WebSocket Message Handlers
 *
 * Incoming message format:  { type: string, payload: object }
 * Outgoing message format:  { type: string, payload: object }
 *
 * Every handler validates its input, delegates business logic to
 * RoomManager, and broadcasts state changes to other participants.
 */

export function handleMessage(ws, message) {
  const { type, payload } = message;

  switch (type) {
    case 'JOIN_ROOM':
      return handleJoinRoom(ws, payload);
    case 'CODE_CHANGE':
      return handleCodeChange(ws, payload);
    case 'LANGUAGE_CHANGE':
      return handleLanguageChange(ws, payload);
    case 'LEAVE_ROOM':
      return handleLeaveRoom(ws);
    default:
      sendToSocket(ws, { type: 'ERROR', payload: { message: `Unknown message type: ${type}` } });
  }
}

// ── JOIN_ROOM ───────────────────────────────────────────

function handleJoinRoom(ws, payload) {
  if (!payload || !payload.roomId || !payload.username) {
    return sendToSocket(ws, {
      type: 'ERROR',
      payload: { message: 'roomId and username are required' },
    });
  }

  const { roomId, username } = payload;

  // Basic validation
  if (typeof username !== 'string' || username.trim().length === 0 || username.length > 20) {
    return sendToSocket(ws, {
      type: 'ERROR',
      payload: { message: 'Username must be 1-20 characters' },
    });
  }

  const result = roomManager.joinRoom(roomId, ws.socketId, username.trim());

  if (!result.success) {
    return sendToSocket(ws, { type: 'ERROR', payload: { message: result.error } });
  }

  const room = result.room;

  // Send the full room state to the newly joined user
  sendToSocket(ws, {
    type: 'ROOM_STATE',
    payload: room.toJSON(),
  });

  // Notify everyone else that a new user joined
  broadcast(
    roomId,
    {
      type: 'USER_JOINED',
      payload: {
        socketId: ws.socketId,
        username: username.trim(),
        participants: room.getParticipantList(),
      },
    },
    ws.socketId // exclude the joiner
  );
}

// ── CODE_CHANGE ─────────────────────────────────────────

function handleCodeChange(ws, payload) {
  if (!payload || typeof payload.code !== 'string') {
    return sendToSocket(ws, {
      type: 'ERROR',
      payload: { message: 'code is required' },
    });
  }

  if (payload.code.length > MAX_CODE_SIZE) {
    return sendToSocket(ws, {
      type: 'ERROR',
      payload: { message: 'Code exceeds maximum size' },
    });
  }

  const roomId = roomManager.getRoomIdBySocket(ws.socketId);
  if (!roomId) return;

  roomManager.updateCode(roomId, payload.code);

  // Broadcast to everyone EXCEPT the sender (they already have the code locally)
  broadcast(
    roomId,
    { type: 'CODE_UPDATED', payload: { code: payload.code } },
    ws.socketId
  );
}

// ── LANGUAGE_CHANGE ─────────────────────────────────────

function handleLanguageChange(ws, payload) {
  if (!payload || !payload.language) {
    return sendToSocket(ws, {
      type: 'ERROR',
      payload: { message: 'language is required' },
    });
  }

  if (!SUPPORTED_LANGUAGES.includes(payload.language)) {
    return sendToSocket(ws, {
      type: 'ERROR',
      payload: { message: `Unsupported language: ${payload.language}` },
    });
  }

  const roomId = roomManager.getRoomIdBySocket(ws.socketId);
  if (!roomId) return;

  const result = roomManager.updateLanguage(roomId, payload.language);
  if (!result.success) {
    return sendToSocket(ws, { type: 'ERROR', payload: { message: result.error } });
  }

  // Broadcast to ALL participants including the sender,
  // because language change also resets the code to default boilerplate
  broadcast(roomId, {
    type: 'LANGUAGE_UPDATED',
    payload: {
      language: result.room.language,
      code: result.room.code,
    },
  });
}

// ── LEAVE_ROOM / DISCONNECT ────────────────────────────

function handleLeaveRoom(ws) {
  handleDisconnect(ws);
}

export function handleDisconnect(ws) {
  const result = roomManager.leaveRoom(ws.socketId);
  if (!result) return;

  const { roomId, username } = result;
  const room = roomManager.getRoom(roomId);

  // If the room still exists (might have been deleted if empty),
  // notify remaining participants
  if (room) {
    broadcast(roomId, {
      type: 'USER_LEFT',
      payload: {
        socketId: ws.socketId,
        username,
        participants: room.getParticipantList(),
      },
    });
  }
}
