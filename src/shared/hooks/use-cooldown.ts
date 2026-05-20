import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown timer hook for resend-code cooldowns and similar.
 * Returns { secondsLeft, isActive, start } — start(seconds) kicks off the timer.
 */
export function useCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (duration: number) => {
      clear();
      setSecondsLeft(duration);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clear();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clear]
  );

  useEffect(() => clear, [clear]);

  return { secondsLeft, isActive: secondsLeft > 0, start };
}
