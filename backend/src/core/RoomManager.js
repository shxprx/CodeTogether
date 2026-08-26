import { nanoid } from 'nanoid';
import { Room } from './Room.js';
import { Participant } from './Participant.js';
import {
  MAX_ROOM_CAPACITY,
  ROOM_CLEANUP_DELAY_MS,
  SUPPORTED_LANGUAGES,
} from '../config/constants.js';
import { logger } from '../utils/logger.js';

/**
 * RoomManager — single instance that owns the entire room lifecycle.
 *
 * Responsibilities:
 *   • Create / delete rooms
 *   • Join / leave
 *   • Validation (room exists, username unique, capacity, language)
 *   • Cleanup timer when a room becomes empty
 *
 * What it does NOT do:
 *   • HTTP or WebSocket I/O — that belongs to routes and wsHandlers
 *   • Docker / execution — that belongs to executors
 */
class RoomManager {
  constructor() {
    this.rooms = new Map();        // roomId → Room
    this.socketToRoom = new Map(); // socketId → roomId
  }

  // ── Create ─────────────────────────────────────────────

  createRoom() {
    const roomId = nanoid(8); // short, URL-friendly
    const room = new Room(roomId);
    this.rooms.set(roomId, room);
    logger.info('Room created', { roomId });
    return roomId;
  }

  // ── Join ───────────────────────────────────────────────

  /**
   * @returns {{ success: boolean, error?: string, room?: Room }}
   */
  joinRoom(roomId, socketId, username) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }
    if (room.participants.size >= MAX_ROOM_CAPACITY) {
      return { success: false, error: 'Room is full' };
    }
    if (room.getParticipantByUsername(username)) {

      return { success: false, error: 'Username already taken in this room' };
    }

    // Cancel any pending deletion since someone is joining
    if (room.deleteTimer) {
      clearTimeout(room.deleteTimer);
      room.deleteTimer = null;
    }

    const participant = new Participant(socketId, username);
    room.addParticipant(participant);
    this.socketToRoom.set(socketId, roomId);

    logger.info('User joined room', { roomId, username, socketId });
    return { success: true, room };
  }

  // ── Leave ──────────────────────────────────────────────

  /**
   * Removes a participant and starts the cleanup timer if the room
   * is now empty.
   *
   * @returns {{ roomId: string, username: string } | null}
   */
  leaveRoom(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const participant = room.participants.get(socketId);
    const username = participant ? participant.username : 'unknown';

    room.removeParticipant(socketId);
    this.socketToRoom.delete(socketId);

    logger.info('User left room', { roomId, username, socketId });

    // Start cleanup timer if room is now empty
    if (room.isEmpty()) {
      this.scheduleRoomDeletion(roomId);
    }

    return { roomId, username };
  }

  // ── Cleanup ────────────────────────────────────────────

  scheduleRoomDeletion(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    logger.info('Room empty — scheduling deletion', { roomId, delayMs: ROOM_CLEANUP_DELAY_MS });

    room.deleteTimer = setTimeout(() => {
      // Double-check room is still empty (someone may have rejoined)
      const current = this.rooms.get(roomId);
      if (current && current.isEmpty()) {
        this.rooms.delete(roomId);
        logger.info('Room deleted after inactivity', { roomId });
      }
    }, ROOM_CLEANUP_DELAY_MS);
  }

  // ── State Updates ──────────────────────────────────────

  updateCode(roomId, code) {
    const room = this.rooms.get(roomId);
    if (room) room.updateCode(code);
  }

  updateLanguage(roomId, language) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return { success: false, error: `Unsupported language: ${language}` };
    }
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found' };

    room.updateLanguage(language);
    return { success: true, room };
  }

  // ── Lookups ────────────────────────────────────────────

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  getRoomBySocket(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  getRoomIdBySocket(socketId) {
    return this.socketToRoom.get(socketId) || null;
  }
}

// Single instance — used across the entire backend
export const roomManager = new RoomManager();
