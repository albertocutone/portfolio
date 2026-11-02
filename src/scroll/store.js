import { clampOffset } from './timeline.js';

export function createScrollStore() {
  let offset = 0;
  let command = null;
  let pendingSeek = null;
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
    seek(value) {
      const target = clampOffset(value);
      if (command) command(target);
      else pendingSeek = target;
    },
    connect(handler) {
      command = handler;
      if (pendingSeek !== null) {
        const target = pendingSeek;
        pendingSeek = null;
        handler(target);
      }
      return () => { if (command === handler) command = null; };
    },
  };
}
