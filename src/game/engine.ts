import { useGameStore } from './store';

// O driver dispara `tick(now)` com o relógio de parede. O trabalho real é
// derivado do delta-time dentro do store, não da frequência do timer — então
// o estrangulamento de timers em abas em segundo plano só reduz a granularidade,
// nunca perde progresso. Ao voltar o foco, o catch-up roda na hora.
const DRIVER_MS = 500;

let intervalId: ReturnType<typeof setInterval> | null = null;
let onVisibility: (() => void) | null = null;

function pump() {
  useGameStore.getState().tick(Date.now());
}

export function startGameLoop() {
  if (intervalId !== null) return;

  pump(); // offline catch-up imediato no load

  intervalId = setInterval(pump, DRIVER_MS);

  onVisibility = () => {
    if (document.visibilityState === 'visible') pump();
  };
  document.addEventListener('visibilitychange', onVisibility);
}

export function stopGameLoop() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (onVisibility) {
    document.removeEventListener('visibilitychange', onVisibility);
    onVisibility = null;
  }
}
