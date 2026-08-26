import { Router } from 'express';
import { roomManager } from '../core/RoomManager.js';

/**
 * Room Routes
 *
 * POST /api/rooms — Create a new room
 *
 * This is the only HTTP endpoint for room management.
 * Joining happens over WebSocket (JOIN_ROOM message).
 */
const router = Router();

router.post('/', (req, res) => {
  try {
    const roomId = roomManager.createRoom();
    return res.status(201).json({ roomId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

export default router;
