import { useEffect, useRef, useState } from 'react';
import { formatElapsedTimer } from '../lib/share.js';

function usePuzzleTimer({ hasPuzzleStarted, isSolved, onRequestResumeOverlay }) {
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerPausedAt, setTimerPausedAt] = useState(null);
  const [pausedDurationMs, setPausedDurationMs] = useState(0);
  const timerPausedAtRef = useRef(null);
  const shouldShowResumeOverlayRef = useRef(false);
  const hasActiveRun = hasPuzzleStarted || timerStartedAt !== null;

  const getCurrentElapsedSeconds = (now) => {
    if (!timerStartedAt) {
      return 0;
    }

    const pausedOffset = timerPausedAtRef.current ? now - timerPausedAtRef.current : 0;
    return Math.max(0, Math.floor((now - timerStartedAt - pausedDurationMs - pausedOffset) / 1000));
  };

  const resumeTimer = () => {
    const pausedAt = timerPausedAtRef.current;

    if (!timerStartedAt || isSolved || pausedAt === null) {
      return;
    }

    const now = Date.now();
    timerPausedAtRef.current = null;
    setPausedDurationMs((current) => current + (now - pausedAt));
    setTimerPausedAt(null);
  };

  const resetTimer = () => {
    setTimerStartedAt(null);
    setElapsedSeconds(0);
    setTimerPausedAt(null);
    setPausedDurationMs(0);
    timerPausedAtRef.current = null;
    shouldShowResumeOverlayRef.current = false;
  };

  const freezeElapsedTime = () => {
    setElapsedSeconds(getCurrentElapsedSeconds(Date.now()));
  };

  useEffect(() => {
    if (!timerStartedAt && !isSolved && hasPuzzleStarted) {
      setTimerStartedAt(Date.now());
      setElapsedSeconds(0);
      setTimerPausedAt(null);
      setPausedDurationMs(0);
      timerPausedAtRef.current = null;
    }
  }, [hasPuzzleStarted, isSolved, timerStartedAt]);

  useEffect(() => {
    timerPausedAtRef.current = timerPausedAt;
  }, [timerPausedAt]);

  useEffect(() => {
    if (!timerStartedAt || isSolved || timerPausedAt !== null) {
      return undefined;
    }

    const updateElapsedTime = () => {
      setElapsedSeconds(getCurrentElapsedSeconds(Date.now()));
    };

    updateElapsedTime();
    const intervalId = window.setInterval(updateElapsedTime, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isSolved, pausedDurationMs, timerPausedAt, timerStartedAt]);

  useEffect(() => {
    const pauseTimer = () => {
      if (!timerStartedAt || isSolved || timerPausedAtRef.current !== null) {
        return;
      }

      const now = Date.now();
      timerPausedAtRef.current = now;
      setElapsedSeconds(getCurrentElapsedSeconds(now));
      setTimerPausedAt(now);
      shouldShowResumeOverlayRef.current = hasActiveRun;
    };

    const requestResumeOverlay = () => {
      if (document.visibilityState === 'visible' && shouldShowResumeOverlayRef.current && hasActiveRun && !isSolved) {
        onRequestResumeOverlay?.();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseTimer();
        return;
      }

      requestResumeOverlay();
    };

    window.addEventListener('blur', pauseTimer);
    window.addEventListener('focus', requestResumeOverlay);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', pauseTimer);
      window.removeEventListener('focus', requestResumeOverlay);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasActiveRun, hasPuzzleStarted, isSolved, onRequestResumeOverlay, pausedDurationMs, timerStartedAt]);

  return {
    elapsedSeconds,
    resetTimer,
    resumeTimer,
    freezeElapsedTime,
    timerStartedAt,
    timerText: formatElapsedTimer(elapsedSeconds),
  };
}

export default usePuzzleTimer;
