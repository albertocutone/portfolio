import { useEffect, useEffectEvent } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

export default function ScrollBridge({ store, paused, onReady }) {
  const data = useScroll();
  const events = useThree((state) => state.events);
  const reportReady = useEffectEvent(onReady);
  useEffect(() => {
    if (events.connected !== data.el) {
      events.connect?.(data.el);
      return;
    }
    let secondFrame;
    // Drei attaches its listener after connection and skips the initialization scroll.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => reportReady());
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [events, data]);

  useEffect(() => {
    const el = data.el;
    el.setAttribute('aria-label', 'Portfolio flight scroll area');
    el.setAttribute('tabindex', '-1');
    const disconnect = store.connect((offset) => {
      if (paused) return;
      const range = el.scrollHeight - el.clientHeight;
      el.scrollTop = offset * range;
      data.scroll.current = range > 0 ? el.scrollTop / range : 0;
    });
    const wheel = (event) => {
      if (event.ctrlKey || el.contains(event.target) || event.target.closest('dialog')) return;
      event.preventDefault();
      if (paused) return;
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1);
      el.scrollTop += pixels;
    };
    const key = (event) => {
      if (paused || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('dialog, input, textarea, select, [contenteditable="true"]')) return;
      // Space on a button retains native activation; arrows and paging navigate the flight.
      if (event.key === ' ' && event.target.closest('button, a')) return;
      const current = el.scrollTop / (el.scrollHeight - el.clientHeight);
      const commands = { Home: 0, End: 1, ArrowDown: current + 0.04, ArrowUp: current - 0.04, PageDown: current + 0.25, PageUp: current - 0.25, ' ': current + (event.shiftKey ? -0.25 : 0.25) };
      if (commands[event.key] === undefined) return;
      event.preventDefault();
      store.seek(commands[event.key]);
    };
    document.addEventListener('wheel', wheel, { passive: false });
    document.addEventListener('keydown', key);
    return () => {
      disconnect();
      document.removeEventListener('wheel', wheel);
      document.removeEventListener('keydown', key);
    };
  }, [data, store, paused]);

  useEffect(() => {
    if (!paused) return;
    const frozen = store.getSnapshot();
    data.offset = frozen;
    data.scroll.current = frozen;
    data.el.scrollTop = frozen * (data.el.scrollHeight - data.el.clientHeight);
  }, [paused, store, data]);

  useFrame(() => {
    if (!paused) store.publish(data.offset);
  });
  return null;
}
