import { DEFAULT_CODE } from '../config/constants.js';

/**
 * Room — holds the entire state of a single collaborative session.
 *
 * This is a pure data container.  It knows nothing about networking,
 * Docker, or persistence.  All lifecycle decisions (create / join /
 * leave / cleanup) are made by RoomManager.
 */
export class Room {
  constructor(roomId, language = 'cpp') {
    this.roomId = roomId;
    this.language = language;
    this.code = DEFAULT_CODE[language] || '';
    this.participants = new Map(); // socketId → Participant
    this.output = '';
    this.isCompiling = false;
    this.lastActivity = Date.now();
    this.deleteTimer = null; // setTimeout handle for room cleanup
  }

  // ── Participants ──────────────────────────────────────

  addParticipant(participant) {
    this.participants.set(participant.socketId, participant);
    this.touch();
  }

  removeParticipant(socketId) {
    this.participants.delete(socketId);
    this.touch();
  }

  hasParticipant(socketId) {
    return this.participants.has(socketId);
  }

  getParticipantByUsername(username) {
    for (const p of this.participants.values()) {
      if (p.username === username) return p;
    }
    return null;
  }

  getParticipantList() {
    return Array.from(this.participants.values()).map((p) => p.toJSON());
  }

  isEmpty() {
    return this.participants.size === 0;
  }

  // ── State Updates ────────────────────────────────────

  updateCode(code) {
    this.code = code;
    this.touch();
  }

  updateLanguage(language) {
    this.language = language;
    // Reset code to the new language's default boilerplate
    this.code = DEFAULT_CODE[language] || '';
    this.touch();
  }

  updateOutput(output) {
    this.output = output;
    this.touch();
  }

  setCompiling(value) {
    this.isCompiling = value;
    this.touch();
  }

  // ── Activity Tracking ────────────────────────────────

  touch() {
    this.lastActivity = Date.now();
  }

  // ── Serialisation ────────────────────────────────────

  /** Full snapshot sent to a newly-joined client. */
  toJSON() {
    return {
      roomId: this.roomId,
      language: this.language,
      code: this.code,
      participants: this.getParticipantList(),
      output: this.output,
    };
  }
}
