import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import { handleMessage, handleDisconnect } from './wsHandlers.js';
import { roomManager } from '../core/RoomManager.js';
import { logger } from '../utils/logger.js';

/** @type {WebSocketServer} */
let wss = null;

/**
 * Initialises the WebSocket server and attaches it to the HTTP server.
 *
 * Each connection is assigned a unique socketId. All incoming messages
 * are delegated to wsHandlers.  On close, handleDisconnect is called.
 */
export function initWebSocketServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    // Assign a unique ID to this socket so we can track it across rooms
    ws.socketId = nanoid(10);

    ws.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        handleMessage(ws, message);
      } catch {
        sendToSocket(ws, { type: 'ERROR', payload: { message: 'Invalid message format' } });
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', { socketId: ws.socketId, error: err.message });
    });
  });

  logger.info('WebSocket server initialised');
}

// ── Messaging Utilities ──────────────────────────────────

/** Send a JSON message to a single socket. */
export function sendToSocket(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a message to every participant in a room.
 *
 * @param {string} roomId
 * @param {object} message
 * @param {string} [excludeSocketId] - optional socket to skip (e.g. the sender)
 */
export function broadcast(roomId, message, excludeSocketId = null) {
  if (!wss) return;

  const room = roomManager.getRoom(roomId);
  if (!room) return;

  const data = JSON.stringify(message);

  for (const client of wss.clients) {
    if (
      client.readyState === client.OPEN &&
      room.hasParticipant(client.socketId) &&
      client.socketId !== excludeSocketId
    ) {
      client.send(data);
    }
  }
}
