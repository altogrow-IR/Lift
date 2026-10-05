import { useEffect, useState } from "react";
const KEY = "lift.rest.deadline";
export function useRestTimer() {
  const [deadline, setDeadline] = useState(() => {
    try {
      const n = Number(sessionStorage.getItem(KEY));
      return n > Date.now() && n < Date.now() + 180000 ? n : 0;
    } catch {
      return 0;
    }
  });
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    try {
      if (deadline) sessionStorage.setItem(KEY, String(deadline));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* The timer remains usable without storage. */
    }
    if (!deadline) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) {
        setDeadline(0);
        setFinished(true);
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline]);
  return {
    remaining,
    finished,
    start: (seconds: number) => {
      setFinished(false);
      setDeadline(seconds ? Date.now() + seconds * 1000 : 0);
    },
    stop: () => {
      setDeadline(0);
      setFinished(false);
    },
  };
}
