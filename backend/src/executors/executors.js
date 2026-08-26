import { exec } from 'child_process';
import path from 'path';
import {
  writeSourceFile,
  writeInputFile,
} from '../utils/workspaceManager.js';
import { EXECUTION_TIMEOUT_MS, DOCKER_IMAGES, FILE_NAMES } from '../config/constants.js';

/**
 * CppExecutor — compiles and runs C++ code inside a Docker container.
 *
 * Flow:
 *   1. Write main.cpp and input.txt to the workspace
 *   2. Run a Docker container that compiles with g++ and executes
 *   3. Return stdout, stderr, exitCode, timedOut
 *
 * The container has no network access and the workspace is mounted
 * read-only (source + input are already written before the container starts).
 */
export const CppExecutor = {
  language: 'cpp',

  async execute(code, input, workspacePath) {
    await writeSourceFile(workspacePath, FILE_NAMES.cpp, code);
    await writeInputFile(workspacePath, input);

    // Compile and run in a single container.
    // The shell command: compile → if success → run with input.
    const dockerCmd = buildDockerCommand(
      DOCKER_IMAGES.cpp,
      workspacePath,
      `g++ /code/${FILE_NAMES.cpp} -o /code/main 2>&1 && /code/main < /code/input.txt`
    );

    return runDocker(dockerCmd);
  },
};

/**
 * PythonExecutor — runs Python 3 code inside a Docker container.
 *
 * No compilation step — just run the script.
 */
export const PythonExecutor = {
  language: 'python',

  async execute(code, input, workspacePath) {
    await writeSourceFile(workspacePath, FILE_NAMES.python, code);
    await writeInputFile(workspacePath, input);

    const dockerCmd = buildDockerCommand(
      DOCKER_IMAGES.python,
      workspacePath,
      `python3 /code/${FILE_NAMES.python} < /code/input.txt`
    );

    return runDocker(dockerCmd);
  },
};

/**
 * JavaExecutor — compiles and runs Java code inside a Docker container.
 *
 * The public class must be named `Main` so the file name matches.
 */
export const JavaExecutor = {
  language: 'java',

  async execute(code, input, workspacePath) {
    await writeSourceFile(workspacePath, FILE_NAMES.java, code);
    await writeInputFile(workspacePath, input);

    const dockerCmd = buildDockerCommand(
      DOCKER_IMAGES.java,
      workspacePath,
      `javac /code/${FILE_NAMES.java} 2>&1 && java -cp /code Main < /code/input.txt`
    );

    return runDocker(dockerCmd);
  },
};

// ── Shared Helpers ────────────────────────────────────────

/**
 * Builds the `docker run` command string.
 *
 * Flags:
 *   --rm            remove container after exit
 *   --network none  no internet access
 *   --memory 256m   memory cap
 *   --cpus 0.5      CPU cap
 *   -v mount        mount workspace to /code
 *   -w /code        set working directory
 */
function buildDockerCommand(image, workspacePath, shellCommand) {
  // Convert Windows path to a Docker-compatible path
  const mountPath = workspacePath.replace(/\\/g, '/');

  return [
    'docker run --rm',
    '--network none',
    '--memory 256m',
    '--cpus 0.5',
    `--pids-limit 64`,
    `-v "${mountPath}:/code"`,
    '-w /code',
    image,
    `/bin/sh -c "${shellCommand}"`,
  ].join(' ');
}

/**
 * Runs the Docker command and resolves with the execution result.
 *
 * Uses child_process.exec with a timeout.  If the timeout fires,
 * the process is killed and `timedOut` is set to true.
 */
function runDocker(command) {
  return new Promise((resolve) => {
    const child = exec(
      command,
      { timeout: EXECUTION_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error && error.killed) {
          // Process was killed by the timeout
          resolve({
            stdout: stdout || '',
            stderr: 'Error: Execution timed out',
            exitCode: 1,
            timedOut: true,
          });
          return;
        }

        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: error ? error.code || 1 : 0,
          timedOut: false,
        });
      }
    );
  });
}
