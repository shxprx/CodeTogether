import { Router } from 'express';
import { roomManager } from '../core/RoomManager.js';
import { getExecutor } from '../executors/ExecutorRegistry.js';
import {
  createWorkspace,
  cleanupWorkspace,
} from '../utils/workspaceManager.js';
import { MAX_INPUT_SIZE } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { broadcast } from '../websocket/wsServer.js';

/**
 * Execution Routes
 *
 * POST /api/run — Compile and execute code for a room.
 *
 * The request body contains only { roomId, stdin }.
 * Code and language are read from the room's state because
 * the backend is the single source of truth.
 */
const router = Router();

router.post('/', async (req, res) => {
  const { roomId, stdin } = req.body;

  // ── Validation ────────────────────────────────────────
  if (!roomId || typeof roomId !== 'string') {
    return res.status(400).json({ error: 'roomId is required' });
  }

  const room = roomManager.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.isCompiling) {
    return res.status(409).json({ error: 'Compilation already in progress' });
  }

  if (stdin && stdin.length > MAX_INPUT_SIZE) {
    return res.status(400).json({ error: 'Input too large' });
  }

  // ── Execute ───────────────────────────────────────────
  let workspacePath = null;

  try {
    room.setCompiling(true);

    // Broadcast compiling state so all clients can disable their Run buttons
    broadcast(roomId, { type: 'OUTPUT_UPDATED', payload: { output: 'Compiling...' } });

    const { code, language } = room;
    const executor = getExecutor(language);

    const workspace = await createWorkspace();
    workspacePath = workspace.workspacePath;

    logger.info('Execution started', {
      roomId,
      language,
      executionId: workspace.executionId,
    });

    const result = await executor.execute(code, stdin || '', workspacePath);

    // Build a user-friendly output string
    let output = '';
    if (result.timedOut) {
      output = 'Error: Execution timed out (5s limit)';
    } else if (result.stderr && result.exitCode !== 0) {
      output = result.stderr;
    } else {
      output = result.stdout || '(no output)';
      if (result.stderr) {
        output += '\n--- stderr ---\n' + result.stderr;
      }
    }

    // Store output in room and broadcast to all participants
    room.updateOutput(output);
    broadcast(roomId, { type: 'OUTPUT_UPDATED', payload: { output } });

    logger.info('Execution finished', { roomId, exitCode: result.exitCode });

    return res.json({ output, exitCode: result.exitCode });
  } catch (err) {
    logger.error('Execution failed', { roomId, error: err.message });

    const errorOutput = 'Internal error: execution failed';
    room.updateOutput(errorOutput);
    broadcast(roomId, { type: 'OUTPUT_UPDATED', payload: { output: errorOutput } });

    return res.status(500).json({ error: 'Execution failed' });
  } finally {
    room.setCompiling(false);

    // Always clean up the workspace
    if (workspacePath) {
      await cleanupWorkspace(workspacePath);
    }
  }
});

export default router;
