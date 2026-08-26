import { CppExecutor, PythonExecutor, JavaExecutor } from './executors.js';

/**
 * ExecutorRegistry — maps language names to their executor.
 *
 * This eliminates if-else chains throughout the codebase.
 * To add a new language, create an executor and register it here.
 */

const registry = new Map();

registry.set('cpp', CppExecutor);
registry.set('python', PythonExecutor);
registry.set('java', JavaExecutor);

/**
 * Returns the executor for the given language.
 * @throws {Error} if the language is not supported
 */
export function getExecutor(language) {
  const executor = registry.get(language);
  if (!executor) {
    throw new Error(`No executor registered for language: ${language}`);
  }
  return executor;
}
