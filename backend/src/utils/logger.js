/**
 * Logger — lightweight structured logging.
 *
 * We log room lifecycle events and execution events.
 * We do NOT log every keystroke or compilation error
 * (those are expected application flow, not infrastructure concerns).
 */

const timestamp = () => new Date().toISOString();

export const logger = {
  info(msg, data = {}) {
    console.log(JSON.stringify({ level: 'INFO', timestamp: timestamp(), msg, ...data }));
  },

  warn(msg, data = {}) {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: timestamp(), msg, ...data }));
  },

  error(msg, data = {}) {
    console.error(JSON.stringify({ level: 'ERROR', timestamp: timestamp(), msg, ...data }));
  },
};
