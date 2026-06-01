import { useGameStore } from './store';

const TICK_RATE_MS = 1000;
let intervalId: any = null;

/**
 * Starts the global background idle game loop.
 * It directly accesses and ticks the Zustand store every second.
 */
export function startGameLoop() {
  if (intervalId !== null) return;

  // Initial immediate tick if needed (optional)
  useGameStore.getState().tickGame();

  intervalId = setInterval(() => {
    useGameStore.getState().tickGame();
  }, TICK_RATE_MS);
}

/**
 * Stops the global game loop.
 */
export function stopGameLoop() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
