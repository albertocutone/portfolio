import { useEffect, useEffectEvent, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

export default function ScrollBridge({ store, paused, onReady }) {
  const data = useScroll();
  const events = useThree((state) => state.events);
  const nativeWheelFrame = useRef(0);
  const reportReady = useEffectEvent(onReady);
  useEffect(() => {
    if (events.connected !== data.el) {
      events.connect?.(data.el);
      return;
    }
    let secondFrame;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => reportReady());
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [events, data]);

  const syncNative = useEffectEvent(() => {
    if (paused) return;
    const range = data.el.scrollHeight - data.el.clientHeight;
    data.scroll.current = range > 0 ? data.el.scrollTop / range : 0;
  });
  const seek = useEffectEvent((offset) => {
    if (paused) return;
    data.el.scrollTop = offset * (data.el.scrollHeight - data.el.clientHeight);
    syncNative();
  });
  const wheel = useEffectEvent((event) => {
    const el = data.el;
    if (event.ctrlKey || event.target.closest('dialog')) return;
    if (paused) { event.preventDefault(); return; }
    if (el.contains(event.target)) {
      // Read after the browser scrolls; this also survives Drei's listener reset window.
      cancelAnimationFrame(nativeWheelFrame.current);
      nativeWheelFrame.current = requestAnimationFrame(syncNative);
      return;
    }
    event.preventDefault();
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1);
    el.scrollTop += pixels;
    syncNative();
  });
  const key = useEffectEvent((event) => {
    if (paused || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('dialog, input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === ' ' && event.target.closest('button, a')) return;
    const range = data.el.scrollHeight - data.el.clientHeight;
    const current = range > 0 ? data.el.scrollTop / range : 0;
    const commands = { Home: 0, End: 1, ArrowDown: current + 0.04, ArrowUp: current - 0.04, PageDown: current + 0.25, PageUp: current - 0.25, ' ': current + (event.shiftKey ? -0.25 : 0.25) };
    if (commands[event.key] === undefined) return;
    event.preventDefault();
    store.seek(commands[event.key]);
  });

  useEffect(() => {
    const el = data.el;
    el.setAttribute('aria-label', 'Portfolio flight scroll area');
    el.setAttribute('tabindex', '-1');
    const disconnect = store.connect(seek);
    document.addEventListener('wheel', wheel, { passive: false });
    document.addEventListener('keydown', key);
    return () => {
      disconnect();
      cancelAnimationFrame(nativeWheelFrame.current);
      document.removeEventListener('wheel', wheel);
      document.removeEventListener('keydown', key);
    };
  }, [data, store]);

  useEffect(() => {
    if (!paused) return;
    const frozen = store.getSnapshot();
    data.offset = frozen;
    data.scroll.current = frozen;
    data.el.scrollTop = frozen * (data.el.scrollHeight - data.el.clientHeight);
  }, [paused, store, data]);

  useFrame(() => { if (!paused) store.publish(data.offset); });
  return null;
}
