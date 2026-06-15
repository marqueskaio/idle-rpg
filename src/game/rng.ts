// PRNG determinístico (mulberry32). A seed faz parte do GameState persistido,
// então a simulação idle é reproduzível e validável por replay no servidor
// (anti-cheat). Toda aleatoriedade do jogo DEVE passar por aqui — nunca Math.random
// dentro do caminho simulado, senão o replay diverge.

/** Avança a seed uma vez. Retorna [novaSeed, valor em [0,1)]. */
export function nextRandom(seed: number): [number, number] {
  const a = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [a, value];
}

/** Inteiro em [0, max). Retorna [novaSeed, inteiro]. */
export function nextInt(seed: number, max: number): [number, number] {
  const [s, v] = nextRandom(seed);
  return [s, Math.floor(v * max)];
}

/** Id curto derivado da seed — reproduzível no replay (não usa Math.random). */
export function seededId(seed: number): [number, string] {
  const [s, v] = nextRandom(seed);
  const id = Math.floor(v * 0xffffffff).toString(36).padStart(6, '0').slice(0, 7);
  return [s, id];
}

/** Seed inicial aleatória — usada SÓ ao criar um jogo novo (vira a âncora do replay). */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0 || 1;
}
