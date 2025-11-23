// Logger utility that sends logs to both browser console and backend terminal

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

async function sendLogToBackend(level: 'log' | 'error' | 'warn', message: string, data?: any) {
  try {
    await fetch(`${API_URL}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, data }),
    });
  } catch (err) {
    // Silently fail - don't break the app if backend is down
  }
}

export const logger = {
  log: (message: string, ...args: any[]) => {
    console.log(message, ...args);
    sendLogToBackend('log', message, args.length > 0 ? args : undefined);
  },

  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
    sendLogToBackend('error', message, args.length > 0 ? args : undefined);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
    sendLogToBackend('warn', message, args.length > 0 ? args : undefined);
  },
};
