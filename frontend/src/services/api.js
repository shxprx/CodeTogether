/**
 * API Service — HTTP calls to the backend.
 *
 * Only two endpoints:
 *   POST /api/rooms — create a room
 *   POST /api/run   — compile & execute code
 */

const API_BASE = 'http://localhost:3001/api';

export async function createRoom() {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create room');
  }

  return res.json(); // { roomId }
}

export async function runCode(roomId, stdin = '') {
  const res = await fetch(`${API_BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, stdin }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Execution failed');
  }

  return res.json(); // { output, exitCode }
}
