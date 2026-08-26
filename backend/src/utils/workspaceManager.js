import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { logger } from './logger.js';

/**
 * WorkspaceManager — creates and cleans up temporary directories
 * for each code execution.
 *
 * Every execution gets a fresh workspace under `backend/workspace/<executionId>/`.
 * The workspace contains only the source file and optional input file.
 * It is always cleaned up after execution, even on error.
 */

const WORKSPACE_ROOT = path.resolve(process.cwd(), 'workspace');

/**
 * Creates a fresh workspace directory and returns its absolute path
 * along with a unique executionId.
 */
export async function createWorkspace() {
  const executionId = nanoid(12);
  const workspacePath = path.join(WORKSPACE_ROOT, executionId);
  await fs.mkdir(workspacePath, { recursive: true });
  return { executionId, workspacePath };
}

/** Writes the user's source code into the workspace. */
export async function writeSourceFile(workspacePath, filename, code) {
  await fs.writeFile(path.join(workspacePath, filename), code, 'utf-8');
}

/** Writes stdin input into the workspace as `input.txt`. */
export async function writeInputFile(workspacePath, input) {
  await fs.writeFile(path.join(workspacePath, 'input.txt'), input || '', 'utf-8');
}

/** Removes the workspace directory after execution. */
export async function cleanupWorkspace(workspacePath) {
  try {
    await fs.rm(workspacePath, { recursive: true, force: true });
  } catch (err) {
    // Cleanup failure is non-critical — log it but don't crash
    logger.error('Workspace cleanup failed', { workspacePath, error: err.message });
  }
}
