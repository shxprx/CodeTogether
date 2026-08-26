/**
 * Participant — plain data object representing a user in a room.
 *
 * Why a class instead of a raw object?
 * It documents the shape clearly and makes it easy to extend later
 * (e.g., adding a cursor position for future features) without
 * refactoring every call-site.
 */
export class Participant {
  constructor(socketId, username) {
    this.socketId = socketId;
    this.username = username;
  }

  /** Serialisable snapshot sent to clients. */
  toJSON() {
    return {
      socketId: this.socketId,
      username: this.username,
    };
  }
}
