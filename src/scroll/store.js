import { clampOffset } from './timeline.js';

export function createScrollStore() {
  let offset = 0;
  let command = null;
  const listeners = new Set();
  return {
    getSnapshot: () => offset,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish(value) {
      const next = clampOffset(value);
      if (next === offset) return;
      offset = next;
      listeners.forEach((listener) => listener());
    },
    seek(value) { command?.(clampOffset(value)); },
    connect(handler) {
      command = handler;
      return () => { if (command === handler) command = null; };
    },
  };
}
