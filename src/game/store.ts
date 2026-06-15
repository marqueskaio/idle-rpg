import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Character, CharacterClass, Item, Rune, Progression, ItemRarity, ItemType, RuneStatType } from './types';
import { nextRandom, seededId, randomSeed } from './rng';

// Static configurations for skills
type SkillEffectKind = 'atkPct' | 'defPct' | 'hpPct' | 'atkFlat' | 'defFlat' | 'hpFlat';
interface SkillEffect { kind: SkillEffectKind; value: number; } // value = por nível
interface SkillDef {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive';
  maxLevel: number;
  icon: string;
  effects: SkillEffect[];
}

// Ids antigos (w_passive, w_active, ...) preservados para não invalidar saves.
export const CLASS_SKILLS: Record<CharacterClass, SkillDef[]> = {
  Warrior: [
    { id: 'w_passive', name: 'Fortitude', description: 'Aumenta HP máximo em 6% e Defesa em 6% por nível.', type: 'passive', maxLevel: 10, icon: '🛡️', effects: [{ kind: 'hpPct', value: 6 }, { kind: 'defPct', value: 6 }] },
    { id: 'w_active', name: 'Golpe de Escudo', description: 'Investida marcial: +8% de Ataque por nível.', type: 'active', maxLevel: 10, icon: '⚔️', effects: [{ kind: 'atkPct', value: 8 }] },
    { id: 'w_fury', name: 'Fúria de Batalha', description: 'Sede de sangue: +5% de Ataque por nível.', type: 'passive', maxLevel: 10, icon: '🔥', effects: [{ kind: 'atkPct', value: 5 }] },
    { id: 'w_stone', name: 'Pele de Pedra', description: 'Endurecimento: +4 de Defesa e +3% de HP por nível.', type: 'passive', maxLevel: 10, icon: '🪨', effects: [{ kind: 'defFlat', value: 4 }, { kind: 'hpPct', value: 3 }] }
  ],
  Mage: [
    { id: 'm_passive', name: 'Fluxo Arcano', description: 'Aumenta o Ataque em 10% por nível.', type: 'passive', maxLevel: 10, icon: '🌀', effects: [{ kind: 'atkPct', value: 10 }] },
    { id: 'm_active', name: 'Bola de Fogo', description: 'Conjuração ofensiva: +12% de Ataque por nível.', type: 'active', maxLevel: 10, icon: '☄️', effects: [{ kind: 'atkPct', value: 12 }] },
    { id: 'm_focus', name: 'Intelecto', description: 'Poder bruto: +3 de Ataque e +2% por nível.', type: 'passive', maxLevel: 10, icon: '📘', effects: [{ kind: 'atkFlat', value: 3 }, { kind: 'atkPct', value: 2 }] },
    { id: 'm_ward', name: 'Escudo Arcano', description: 'Barreira mágica: +5% de HP e +4% de Defesa por nível.', type: 'passive', maxLevel: 10, icon: '🔵', effects: [{ kind: 'hpPct', value: 5 }, { kind: 'defPct', value: 4 }] }
  ],
  Rogue: [
    { id: 'r_passive', name: 'Mestria em Adagas', description: 'Aumenta o Ataque em 7% por nível.', type: 'passive', maxLevel: 10, icon: '🗡️', effects: [{ kind: 'atkPct', value: 7 }] },
    { id: 'r_active', name: 'Ataque Furtivo', description: 'Golpe nas sombras: +10% de Ataque por nível.', type: 'active', maxLevel: 10, icon: '🌑', effects: [{ kind: 'atkPct', value: 10 }] },
    { id: 'r_crit', name: 'Letalidade', description: 'Golpes críticos: +6% de Ataque por nível.', type: 'passive', maxLevel: 10, icon: '🎯', effects: [{ kind: 'atkPct', value: 6 }] },
    { id: 'r_evasion', name: 'Evasão', description: 'Reflexos felinos: +3% de Defesa e +3% de HP por nível.', type: 'passive', maxLevel: 10, icon: '💨', effects: [{ kind: 'defPct', value: 3 }, { kind: 'hpPct', value: 3 }] }
  ]
};

// Item generator helper
const RARITY_MULTIPLIERS = { common: 1, uncommon: 1.5, rare: 2.2, epic: 3.5, legendary: 6 };
const ITEM_TYPES: ItemType[] = ['weapon', 'armor', 'ring'];

const ITEM_PREFIXES: Record<ItemRarity, string> = {
  common: 'Gasto(a)',
  uncommon: 'Melhorado(a)',
  rare: 'Raro(a)',
  epic: 'Épico(a)',
  legendary: 'Lendário(a)'
};

const ITEM_NAMES: Record<ItemType, string[]> = {
  weapon: [
    'Espada de Bronze', 'Espada Larga', 'Lâmina Élfica', 'Montante de Aço',
    'Cajado Rúnico', 'Cajado de Carvalho', 'Cetro Arcano',
    'Adaga de Ferro', 'Punhal Venenoso',
    'Arco Longo', 'Besta Pesada',
    'Machado de Combate', 'Machado Duplo',
    'Martelo de Guerra', 'Maça Cravejada',
    'Lança de Prata', 'Alabarda Real'
  ],
  armor: [
    'Manto de Seda', 'Túnica do Aprendiz', 'Manto Sombrio',
    'Couraça de Aço', 'Armadura de Placas',
    'Armadura de Couro', 'Gibão Reforçado',
    'Elmo de Ferro', 'Capacete Alado', 'Coroa de Batalha'
  ],
  ring: [
    'Anel de Ouro', 'Anel de Jade', 'Selo de Opala', 'Anel do Poder', 'Anel de Mithril',
    'Amuleto Rúnico', 'Colar de Safira', 'Pingente de Rubi'
  ]
};

/** Gera um item de forma determinística a partir da seed. Retorna [item, novaSeed]. */
export function generateRandomItem(level: number, seed: number): [Item, number] {
  let s = seed;
  let r: number;

  [s, r] = nextRandom(s);
  const type = ITEM_TYPES[Math.floor(r * ITEM_TYPES.length)];

  // Rarity roll: common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%)
  [s, r] = nextRandom(s);
  const roll = r * 100;
  let rarity: ItemRarity = 'common';
  if (roll < 1) rarity = 'legendary';
  else if (roll < 5) rarity = 'epic';
  else if (roll < 15) rarity = 'rare';
  else if (roll < 40) rarity = 'uncommon';

  const mult = RARITY_MULTIPLIERS[rarity];

  const idResult = seededId(s);
  s = idResult[0];
  const id = idResult[1];

  let attack = 0;
  let defense = 0;
  let hp = 0;

  // Base stats grow with average party level
  [s, r] = nextRandom(s);
  const baseStatVal = Math.round(level * (2 + r * 0.5) * mult);

  if (type === 'weapon') {
    attack = baseStatVal;
  } else if (type === 'armor') {
    defense = Math.round(baseStatVal * 0.4);
    hp = Math.round(baseStatVal * 5);
  } else {
    // ring is hybrid
    attack = Math.round(baseStatVal * 0.4);
    hp = Math.round(baseStatVal * 4);
    defense = Math.round(baseStatVal * 0.1);
  }

  [s, r] = nextRandom(s);
  const baseName = ITEM_NAMES[type][Math.floor(r * ITEM_NAMES[type].length)];
  const name = `${ITEM_PREFIXES[rarity]} ${baseName}`;

  const item: Item = {
    id,
    name,
    type,
    rarity,
    attack,
    defense,
    hp,
    refineLevel: 0,
    levelRequired: level
  };

  return [item, s];
}

// Rune generator helper
const RUNE_STATS: RuneStatType[] = ['attack', 'defense', 'hp', 'goldGain', 'xpGain'];
const RUNE_NAMES = {
  attack: 'Runa da Força',
  defense: 'Runa da Proteção',
  hp: 'Runa da Vitalidade',
  goldGain: 'Runa da Ganância',
  xpGain: 'Runa da Sabedoria'
};

/** Gera uma runa de forma determinística a partir da seed. Retorna [runa, novaSeed]. */
export function generateRandomRune(level: number, seed: number): [Rune, number] {
  let s = seed;
  let r: number;

  [s, r] = nextRandom(s);
  const statType = RUNE_STATS[Math.floor(r * RUNE_STATS.length)];

  const idResult = seededId(s);
  s = idResult[0];
  const id = idResult[1];

  let value: number;
  [s, r] = nextRandom(s);
  if (statType === 'goldGain' || statType === 'xpGain') {
    // E.g. +3% to +15% gold/xp gain
    value = 0.03 + (level * 0.01) + Math.round(r * 0.02 * 100) / 100;
  } else if (statType === 'attack') {
    value = Math.round(level * 2 + r * level);
  } else if (statType === 'defense') {
    value = Math.round(level * 1.2 + r * (level * 0.6));
  } else {
    // hp
    value = Math.round(level * 15 + r * (level * 10));
  }

  // Standard formatting
  value = Math.round(value * 100) / 100;

  const name = `${RUNE_NAMES[statType]} (${level}º Grau)`;

  const rune: Rune = { id, name, statType, value, level };
  return [rune, s];
}

// Calculate effective stats for a character
export function calculateCharacterStats(char: Character) {
  let baseAtk = 0;
  let baseDef = 0;
  let baseHp = 0;

  if (char.class === 'Warrior') {
    baseAtk = 8 + (char.level - 1) * 2;
    baseDef = 10 + (char.level - 1) * 3;
    baseHp = 120 + (char.level - 1) * 25;
  } else if (char.class === 'Mage') {
    baseAtk = 16 + (char.level - 1) * 5;
    baseDef = 3 + (char.level - 1) * 0.8;
    baseHp = 70 + (char.level - 1) * 12;
  } else if (char.class === 'Rogue') {
    baseAtk = 12 + (char.level - 1) * 4;
    baseDef = 5 + (char.level - 1) * 1.5;
    baseHp = 90 + (char.level - 1) * 18;
  }

  let gearAtk = 0;
  let gearDef = 0;
  let gearHp = 0;

  const gearList = [char.equipment.weapon, char.equipment.armor, char.equipment.ring];
  for (const gear of gearList) {
    if (gear) {
      const refineMult = 1 + gear.refineLevel * 0.15; // +15% stat boost per refinement level
      gearAtk += gear.attack * refineMult;
      gearDef += gear.defense * refineMult;
      gearHp += gear.hp * refineMult;
    }
  }

  let totalAtk = baseAtk + gearAtk;
  let totalDef = baseDef + gearDef;
  let totalHp = baseHp + gearHp;

  // Apply skill modifiers (passivas e ativas) — genérico via effects
  let atkMult = 1;
  let defMult = 1;
  let hpMult = 1;
  let skillAtkFlat = 0;
  let skillDefFlat = 0;
  let skillHpFlat = 0;

  for (const skill of CLASS_SKILLS[char.class]) {
    const lvl = char.skills[skill.id] || 0;
    if (lvl <= 0) continue;
    for (const eff of skill.effects) {
      const amt = eff.value * lvl;
      switch (eff.kind) {
        case 'atkPct': atkMult += amt / 100; break;
        case 'defPct': defMult += amt / 100; break;
        case 'hpPct': hpMult += amt / 100; break;
        case 'atkFlat': skillAtkFlat += amt; break;
        case 'defFlat': skillDefFlat += amt; break;
        case 'hpFlat': skillHpFlat += amt; break;
      }
    }
  }

  // Apply character runes
  for (const rune of char.runes) {
    if (rune) {
      if (rune.statType === 'attack') totalAtk += rune.value;
      if (rune.statType === 'defense') totalDef += rune.value;
      if (rune.statType === 'hp') totalHp += rune.value;
    }
  }

  totalAtk += skillAtkFlat;
  totalDef += skillDefFlat;
  totalHp += skillHpFlat;

  const finalAtk = Math.round(totalAtk * atkMult);
  const finalDef = Math.round(totalDef * defMult);
  const finalHp = Math.round(totalHp * hpMult);

  // Combat Power: (Atk * 3) + (Def * 2) + (HP / 5)
  const power = Math.max(1, Math.round(finalAtk * 3 + finalDef * 2 + finalHp / 5));

  return {
    attack: finalAtk,
    defense: finalDef,
    hp: finalHp,
    power
  };
}

// Calculate the global combat power of the account
export function calculateGlobalCombatPower(party: Character[]) {
  if (party.length === 0) return 0;
  return party.reduce((sum, char) => sum + calculateCharacterStats(char).power, 0);
}

// Initial default state
const initialProgression: Progression = {
  difficulty: 1,
  act: 1,
  stage: 1,
  killsInCurrentStage: 0,
  killsRequiredForNextStage: 5
};

// ----------------------------------------------------------------------------
// ENGINE PURA E DETERMINÍSTICA
// `stepOnce` é um tick lógico sem efeitos colaterais. Mesma entrada (incluindo
// seed) -> mesma saída. É o que permite offline catch-up e validação por replay.
// ----------------------------------------------------------------------------

const TICK_MS = 1000;
const MAX_CATCHUP_TICKS = 12 * 60 * 60; // teto de 12h de progresso offline
const OFFLINE_THRESHOLD = 5;            // acima disso: log de resumo em vez de spam

interface SimModel {
  gold: number;
  enchantStones: number;
  party: Character[];
  inventory: Item[];
  runeStash: Rune[];
  progression: Progression;
  seed: number;
}

function stepOnce(m: SimModel, collectLogs: boolean): { model: SimModel; logs: string[] } {
  const logs: string[] = [];
  if (m.party.length === 0) return { model: m, logs };

  let seed = m.seed;
  const p = m.progression;
  const difficulty = p.difficulty;
  const act = p.act;
  const stage = p.stage;

  // 1. Party DPS / defense
  let totalDps = 0;
  let totalDefense = 0;
  m.party.forEach(char => {
    const stats = calculateCharacterStats(char);
    totalDps += stats.attack;
    totalDefense += stats.defense;
  });

  // 2. Enemy scaling (exponential by difficulty)
  const enemyMaxHp = Math.round((stage * 15 + (act - 1) * 200) * Math.pow(1.8, difficulty - 1));
  const enemyAttack = Math.round((stage * 2 + (act - 1) * 30) * Math.pow(1.6, difficulty - 1));

  const baseKillProgress = totalDps / enemyMaxHp;
  const defenseVsAttack = totalDefense / (enemyAttack || 1);
  const survivabilityMult = Math.min(1.0, 0.3 + defenseVsAttack * 0.2);
  const killsGained = baseKillProgress * survivabilityMult;

  // Reward modifiers from socketed runes
  let goldModifier = 1;
  let xpModifier = 1;
  m.party.forEach(char => {
    char.runes.forEach(rune => {
      if (rune) {
        if (rune.statType === 'goldGain') goldModifier += rune.value;
        if (rune.statType === 'xpGain') xpModifier += rune.value;
      }
    });
  });

  let goldGained = 0;
  let xpGained = 0;
  let stageKills = p.killsInCurrentStage;
  let nextStage = stage;
  let nextAct = act;
  let nextDifficulty = difficulty;

  if (killsGained > 0) {
    const tickGold = Math.max(1, Math.round((3 + stage * 0.5 + (act - 1) * 8) * difficulty * goldModifier * killsGained));
    const tickXp = Math.max(1, Math.round((5 + stage * 1 + (act - 1) * 15) * difficulty * xpModifier * killsGained));
    goldGained += tickGold;
    xpGained += tickXp;
    stageKills += killsGained;
  }

  let inventory = m.inventory;
  let runeStash = m.runeStash;
  let enchantStones = m.enchantStones;
  let stageUp = false;
  let actUp = false;
  let diffUp = false;

  if (stageKills >= p.killsRequiredForNextStage) {
    stageKills = 0;
    nextStage++;
    stageUp = true;

    goldGained += Math.round((50 + stage * 20) * difficulty * goldModifier);
    const avgLvl = Math.max(1, Math.round(m.party.reduce((sum, c) => sum + c.level, 0) / m.party.length));

    let r: number;

    // Item drop (20%)
    [seed, r] = nextRandom(seed);
    if (r <= 0.20) {
      let item: Item;
      [item, seed] = generateRandomItem(avgLvl, seed);
      inventory = [...inventory, item];
      if (collectLogs) logs.push(`🎁 [Saque] Encontrou ${item.name}!`);
    }

    // Enchant stone drop (30%)
    [seed, r] = nextRandom(seed);
    if (r <= 0.30) {
      let rr: number;
      [seed, rr] = nextRandom(seed);
      const stones = 1 + Math.floor(rr * difficulty);
      enchantStones += stones;
      if (collectLogs) logs.push(`💎 [Saque] Encontrou ${stones} Pedra(s) de Encantamento!`);
    }

    // Rune drop (8%)
    [seed, r] = nextRandom(seed);
    if (r <= 0.08) {
      const runeLevel = Math.max(1, Math.round((m.party.reduce((sum, c) => sum + c.level, 0) / m.party.length) * 0.8));
      let rune: Rune;
      [rune, seed] = generateRandomRune(runeLevel, seed);
      runeStash = [...runeStash, rune];
      if (collectLogs) logs.push(`🔷 [Saque] Obteve uma ${rune.name}!`);
    }

    if (nextStage > 10) {
      nextStage = 1;
      nextAct++;
      actUp = true;

      goldGained += Math.round(300 * difficulty * goldModifier);
      enchantStones += 5;
      if (collectLogs) logs.push(`🎉 [Progresso] Ato ${act} concluído! Bônus de 5 Pedras recebido!`);

      if (nextAct > 3) {
        nextAct = 1;
        nextDifficulty++;
        diffUp = true;

        goldGained += Math.round(1500 * difficulty * goldModifier);
        enchantStones += 15;
        if (collectLogs) logs.push(`👑 [DIFICULDADE] Você conquistou a Dificuldade ${difficulty}! Nova dificuldade destravada!`);
      }
    }
  }

  // Apply XP to all party members
  const party = m.party.map(char => {
    let charXp = char.xp + xpGained;
    let charLvl = char.level;
    let xpNeeded = char.xpNeeded;
    let spGained = 0;
    let leveled = false;

    while (charXp >= xpNeeded) {
      charXp -= xpNeeded;
      charLvl++;
      spGained += 2;
      xpNeeded = Math.round(xpNeeded * 1.35);
      leveled = true;
    }

    if (leveled && collectLogs) {
      logs.push(`⭐ [LEVEL UP] ${char.name} subiu para o Nível ${charLvl}! (+2 Pontos de Habilidade)`);
    }

    return {
      ...char,
      level: charLvl,
      xp: charXp,
      xpNeeded,
      skillPoints: char.skillPoints + spGained
    };
  });

  if ((stageUp || actUp || diffUp) && collectLogs) {
    const diffNames = ['Normal', 'Pesadelo', 'Inferno', 'Tormento', 'Abismo'];
    const diffText = diffNames[nextDifficulty - 1] || `Dificuldade ${nextDifficulty}`;
    logs.push(`⚔️ Avançou para a Fase [${diffText} - Ato ${nextAct} - Fase ${nextStage}]`);
  }

  return {
    model: {
      gold: m.gold + goldGained,
      enchantStones,
      party,
      inventory,
      runeStash,
      progression: {
        ...p,
        difficulty: nextDifficulty,
        act: nextAct,
        stage: nextStage,
        killsInCurrentStage: Math.round(stageKills * 100) / 100
      },
      seed
    },
    logs
  };
}

// Logs guardados newest-first. `batch` chega em ordem cronológica (mais antigo primeiro).
function withLogs(log: string[], batch: string[]): string[] {
  if (batch.length === 0) return log;
  const next = [...batch.slice().reverse(), ...log];
  return next.length > 30 ? next.slice(0, 30) : next;
}

interface GameActions {
  hireCharacter: (name: string, charClass: CharacterClass) => void;
  fireCharacter: (charId: string) => void;
  allocateSkillPoint: (charId: string, skillId: string) => void;
  equipItem: (charId: string, itemId: string) => void;
  unequipItem: (charId: string, slot: 'weapon' | 'armor' | 'ring') => void;
  socketRune: (charId: string, runeId: string, slotIndex: number) => void;
  unsocketRune: (charId: string, slotIndex: number) => void;
  sellItem: (itemId: string) => void;
  dismantleItem: (itemId: string) => void;
  sortInventory: () => void;
  sellItemsByRarity: (rarities: ItemRarity[]) => void;
  craftItem: () => void;
  enchantItem: (itemId: string) => void;
  tick: (nowMs: number) => void;
  resetGame: () => void;
  toggleLayoutMode: () => void;
  addLog: (message: string) => void;
  addToCube: (itemId: string) => void;
  removeFromCube: (slotIndex: number) => void;
  clearCube: () => void;
  autoFillCube: () => void;
  synthesizeCube: () => void;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set) => ({
      // State variables
      gold: 500, // Start with some pocket gold for crafting
      enchantStones: 5,
      progression: initialProgression,
      party: [],
      inventory: [],
      runeStash: [],
      cubeSlots: Array(9).fill(null),
      layoutMode: 'widget',
      combatLog: ['Bem-vindo ao Idle RPG! Crie seu primeiro herói para começar.'],
      globalCombatPower: 0,
      seed: randomSeed(),
      lastTickMs: 0,

      // Actions
      addLog: (message: string) => set((state) => withLogsState(state.combatLog, message)),

      hireCharacter: (name: string, charClass: CharacterClass) => set((state) => {
        if (state.party.length >= 3) {
          return {}; // Max 3 heroes reached
        }

        const [seed, id] = seededId(state.seed);
        const nameClean = name.trim() || `${charClass} #${state.party.length + 1}`;

        const newChar: Character = {
          id,
          name: nameClean,
          class: charClass,
          level: 1,
          xp: 0,
          xpNeeded: 100,
          skillPoints: 1, // Start with 1 skill point
          skills: {},
          equipment: { weapon: null, armor: null, ring: null },
          runes: [null, null, null]
        };

        const updatedParty = [...state.party, newChar];

        return {
          party: updatedParty,
          seed,
          globalCombatPower: calculateGlobalCombatPower(updatedParty),
          combatLog: withLogs(state.combatLog, [`🛡️ [Herói] ${nameClean} (${charClass}) juntou-se ao grupo!`])
        };
      }),

      fireCharacter: (charId: string) => set((state) => {
        const target = state.party.find(c => c.id === charId);
        if (!target) return {};

        const newInventory = [...state.inventory];
        const newRuneStash = [...state.runeStash];

        const { weapon, armor, ring } = target.equipment;
        if (weapon) newInventory.push(weapon);
        if (armor) newInventory.push(armor);
        if (ring) newInventory.push(ring);

        for (const rune of target.runes) {
          if (rune) newRuneStash.push(rune);
        }

        const updatedParty = state.party.filter(c => c.id !== charId);

        return {
          party: updatedParty,
          inventory: newInventory,
          runeStash: newRuneStash,
          globalCombatPower: calculateGlobalCombatPower(updatedParty),
          combatLog: withLogs(state.combatLog, [`🚪 [Herói] ${target.name} saiu do grupo. Equipamentos devolvidos.`])
        };
      }),

      allocateSkillPoint: (charId: string, skillId: string) => set((state) => {
        const target = state.party.find(c => c.id === charId);
        if (!target || target.skillPoints <= 0) return {};

        const skillsList = CLASS_SKILLS[target.class];
        const skillConfig = skillsList.find(s => s.id === skillId);
        const currentLvl = target.skills[skillId] || 0;
        if (skillConfig && currentLvl >= skillConfig.maxLevel) return {};

        const updatedParty = state.party.map((char) => {
          if (char.id !== charId) return char;
          const skillsCopy = { ...char.skills };
          skillsCopy[skillId] = (skillsCopy[skillId] || 0) + 1;
          return { ...char, skillPoints: char.skillPoints - 1, skills: skillsCopy };
        });

        const skillName = skillConfig?.name || skillId;

        return {
          party: updatedParty,
          globalCombatPower: calculateGlobalCombatPower(updatedParty),
          combatLog: withLogs(state.combatLog, [`✨ [Skill] ${target.name} subiu nível de ${skillName}!`])
        };
      }),

      equipItem: (charId: string, itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};
        const char = state.party.find(c => c.id === charId);
        if (!char) return {};

        if (char.level < item.levelRequired) {
          return { combatLog: withLogs(state.combatLog, [`⚠️ [Aviso] Nível de ${char.name} é baixo demais para equipar ${item.name}.`]) };
        }

        const slot = item.type;
        const prev = char.equipment[slot];
        const inventory = state.inventory.filter(i => i.id !== itemId);
        if (prev) inventory.push(prev);

        const updatedParty = state.party.map((c) =>
          c.id !== charId ? c : { ...c, equipment: { ...c.equipment, [slot]: item } }
        );

        return {
          party: updatedParty,
          inventory,
          globalCombatPower: calculateGlobalCombatPower(updatedParty),
          combatLog: withLogs(state.combatLog, [`⚔️ [Equip] ${char.name} equipou ${item.name}.`])
        };
      }),

      unequipItem: (charId: string, slot: 'weapon' | 'armor' | 'ring') => set((state) => {
        const targetChar = state.party.find(c => c.id === charId);
        if (!targetChar) return {};
        const item = targetChar.equipment[slot];
        if (!item) return {};

        const updatedParty = state.party.map((char) =>
          char.id !== charId ? char : { ...char, equipment: { ...char.equipment, [slot]: null } }
        );

        return {
          party: updatedParty,
          inventory: [...state.inventory, item],
          globalCombatPower: calculateGlobalCombatPower(updatedParty),
          combatLog: withLogs(state.combatLog, [`🛡️ [Desequipar] ${item.name} desequipado de ${targetChar.name}.`])
        };
      }),

      socketRune: (charId: string, runeId: string, slotIndex: number) => set((state) => {
        const rune = state.runeStash.find(r => r.id === runeId);
        if (!rune) return {};
        const targetChar = state.party.find(c => c.id === charId);
        if (!targetChar) return {};

        const oldRune = targetChar.runes[slotIndex];
        const updatedParty = state.party.map((char) => {
          if (char.id !== charId) return char;
          const runesCopy = [...char.runes];
          runesCopy[slotIndex] = rune;
          return { ...char, runes: runesCopy };
        });

        const nextRuneStash = state.runeStash.filter(r => r.id !== runeId);
        if (oldRune) nextRuneStash.push(oldRune);

        return {
          party: updatedParty,
          runeStash: nextRuneStash,
          globalCombatPower: calculateGlobalCombatPower(updatedParty),
          combatLog: withLogs(state.combatLog, [`💎 [Runa] ${targetChar.name} equipou ${rune.name} no slot ${slotIndex + 1}.`])
        };
      }),

      unsocketRune: (charId: string, slotIndex: number) => set((state) => {
        const targetChar = state.party.find(c => c.id === charId);
        if (!targetChar) return {};
        const rune = targetChar.runes[slotIndex];
        if (!rune) return {};

        const updatedParty = state.party.map((char) => {
          if (char.id !== charId) return char;
          const runesCopy = [...char.runes];
          runesCopy[slotIndex] = null;
          return { ...char, runes: runesCopy };
        });

        return {
          party: updatedParty,
          runeStash: [...state.runeStash, rune],
          globalCombatPower: calculateGlobalCombatPower(updatedParty),
          combatLog: withLogs(state.combatLog, [`💎 [Runa] ${rune.name} removida de ${targetChar.name}.`])
        };
      }),

      sellItem: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        const rarityVal = { common: 20, uncommon: 50, rare: 150, epic: 400, legendary: 1200 };
        const goldGain = Math.round(item.levelRequired * 5 + rarityVal[item.rarity]);

        return {
          gold: state.gold + goldGain,
          inventory: state.inventory.filter(i => i.id !== itemId),
          combatLog: withLogs(state.combatLog, [`🪙 [Loja] Vendeu ${item.name} por ${goldGain} Gold.`])
        };
      }),

      dismantleItem: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        const stonesVal = { common: 1, uncommon: 2, rare: 5, epic: 15, legendary: 45 };
        const stonesGain = stonesVal[item.rarity];

        return {
          enchantStones: state.enchantStones + stonesGain,
          inventory: state.inventory.filter(i => i.id !== itemId),
          combatLog: withLogs(state.combatLog, [`🔨 [Desmontar] Desmontou ${item.name} e obteve ${stonesGain} Pedra(s) de Encantamento.`])
        };
      }),

      sortInventory: () => set((state) => {
        const order: Record<ItemRarity, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        const sorted = [...state.inventory].sort((a, b) => {
          if (order[b.rarity] !== order[a.rarity]) return order[b.rarity] - order[a.rarity];
          if (b.refineLevel !== a.refineLevel) return b.refineLevel - a.refineLevel;
          if (b.levelRequired !== a.levelRequired) return b.levelRequired - a.levelRequired;
          return a.type.localeCompare(b.type);
        });
        return {
          inventory: sorted,
          combatLog: withLogs(state.combatLog, ['🗂️ [Baú] Inventário organizado por raridade.'])
        };
      }),

      sellItemsByRarity: (rarities: ItemRarity[]) => set((state) => {
        const target = new Set(rarities);
        const toSell = state.inventory.filter(i => target.has(i.rarity));
        if (toSell.length === 0) {
          return { combatLog: withLogs(state.combatLog, ['⚠️ [Loja] Nenhum item desse grau no baú.']) };
        }
        const rarityVal = { common: 20, uncommon: 50, rare: 150, epic: 400, legendary: 1200 };
        const goldGain = toSell.reduce((sum, i) => sum + Math.round(i.levelRequired * 5 + rarityVal[i.rarity]), 0);
        return {
          gold: state.gold + goldGain,
          inventory: state.inventory.filter(i => !target.has(i.rarity)),
          combatLog: withLogs(state.combatLog, [`🪙 [Loja] Vendeu ${toSell.length} item(s) por ${goldGain.toLocaleString()} Gold.`])
        };
      }),

      craftItem: () => set((state) => {
        const goldCost = 150;
        const stoneCost = 3;

        if (state.gold < goldCost || state.enchantStones < stoneCost) {
          return { combatLog: withLogs(state.combatLog, [`⚠️ [Craft] Gold ou Pedras de Encantamento insuficientes! (Requer 150g e 3 Pedras)`]) };
        }
        if (state.party.length === 0) {
          return { combatLog: withLogs(state.combatLog, [`⚠️ [Craft] Crie pelo menos um personagem para craftar itens.`]) };
        }

        const avgLevel = Math.round(state.party.reduce((sum, c) => sum + c.level, 0) / state.party.length);
        const [newItem, seed] = generateRandomItem(avgLevel, state.seed);

        return {
          gold: state.gold - goldCost,
          enchantStones: state.enchantStones - stoneCost,
          inventory: [...state.inventory, newItem],
          seed,
          combatLog: withLogs(state.combatLog, [`🔨 [Craft] Sucesso! Forjou ${newItem.name}.`])
        };
      }),

      enchantItem: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        const stoneCost = 1 + Math.floor(item.refineLevel / 3);
        const goldCost = Math.round((item.refineLevel + 1) * 80);

        if (state.gold < goldCost || state.enchantStones < stoneCost) {
          return { combatLog: withLogs(state.combatLog, [`⚠️ [Encantar] Ouro ou Pedras de Encantamento insuficientes para o upgrade +${item.refineLevel + 1}.`]) };
        }

        // 100% up to +4, then drops slowly (min 35%)
        const successRate = Math.max(0.35, 1.0 - Math.max(0, item.refineLevel - 3) * 0.15);
        const [seed, rolled] = nextRandom(state.seed);

        let nextInventory: Item[];
        let message: string;

        if (rolled <= successRate) {
          nextInventory = state.inventory.map(i => (i.id !== itemId ? i : { ...i, refineLevel: i.refineLevel + 1 }));
          message = `✔️ [Encantar] Sucesso! ${item.name} aprimorado para +${item.refineLevel + 1}!`;
        } else {
          // Fail: refine level drops by 1 (min 0), item NOT destroyed
          nextInventory = state.inventory.map(i => (i.id !== itemId ? i : { ...i, refineLevel: Math.max(0, i.refineLevel - 1) }));
          message = `❌ [Encantar] Falha! ${item.name} caiu para +${Math.max(0, item.refineLevel - 1)}.`;
        }

        return {
          gold: state.gold - goldCost,
          enchantStones: state.enchantStones - stoneCost,
          inventory: nextInventory,
          seed,
          combatLog: withLogs(state.combatLog, [message])
        };
      }),

      tick: (nowMs: number) => set((state) => {
        const seed = state.seed && state.seed !== 0 ? state.seed : randomSeed();
        const last = state.lastTickMs && state.lastTickMs > 0 ? state.lastTickMs : nowMs;

        let due = Math.floor((nowMs - last) / TICK_MS);

        if (due <= 0) {
          // Inicializa seed/lastTickMs no primeiro tick após load (saves antigos).
          const patch: Partial<GameState> = {};
          if (state.seed !== seed) patch.seed = seed;
          if (!state.lastTickMs) patch.lastTickMs = last;
          return patch;
        }

        const offline = due > OFFLINE_THRESHOLD;
        // Acima do teto: concede só 12h e descarta o excedente (evita spin de catch-up).
        const cappedToNow = due > MAX_CATCHUP_TICKS;
        if (cappedToNow) due = MAX_CATCHUP_TICKS;

        let model: SimModel = {
          gold: state.gold,
          enchantStones: state.enchantStones,
          party: state.party,
          inventory: state.inventory,
          runeStash: state.runeStash,
          progression: state.progression,
          seed
        };

        const goldBefore = model.gold;
        const batch: string[] = [];

        for (let i = 0; i < due; i++) {
          const res = stepOnce(model, !offline);
          model = res.model;
          if (!offline) batch.push(...res.logs);
        }

        if (offline) {
          const mins = Math.max(1, Math.floor((due * TICK_MS) / 60000));
          const goldEarned = model.gold - goldBefore;
          batch.push(`🌙 [Offline] Bem-vindo de volta! Em ~${mins} min, sua party farmou +${goldEarned.toLocaleString()} de ouro.`);
        }

        return {
          gold: model.gold,
          enchantStones: model.enchantStones,
          party: model.party,
          inventory: model.inventory,
          runeStash: model.runeStash,
          progression: model.progression,
          seed: model.seed,
          lastTickMs: cappedToNow ? nowMs : last + due * TICK_MS,
          globalCombatPower: calculateGlobalCombatPower(model.party),
          combatLog: withLogs(state.combatLog, batch)
        };
      }),

      resetGame: () => set(() => ({
        gold: 500,
        enchantStones: 5,
        progression: initialProgression,
        party: [],
        inventory: [],
        runeStash: [],
        cubeSlots: Array(9).fill(null),
        globalCombatPower: 0,
        seed: randomSeed(),
        lastTickMs: 0,
        combatLog: ['🔄 [Reiniciar] Jogo resetado com sucesso!']
      })),

      toggleLayoutMode: () => set((state) => ({
        layoutMode: state.layoutMode === 'widget' ? 'taskbar' : 'widget'
      })),

      addToCube: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        const emptyIdx = state.cubeSlots.findIndex(s => s === null);
        if (emptyIdx === -1) {
          return { combatLog: withLogs(state.combatLog, ['⚠️ [Cubo] O cubo está cheio!']) };
        }

        const updatedCube = [...state.cubeSlots];
        updatedCube[emptyIdx] = item;

        return {
          cubeSlots: updatedCube,
          inventory: state.inventory.filter(i => i.id !== itemId)
        };
      }),

      removeFromCube: (slotIndex: number) => set((state) => {
        const item = state.cubeSlots[slotIndex];
        if (!item) return {};

        const updatedCube = [...state.cubeSlots];
        updatedCube[slotIndex] = null;

        return {
          cubeSlots: updatedCube,
          inventory: [...state.inventory, item]
        };
      }),

      clearCube: () => set((state) => {
        const itemsToReturn = state.cubeSlots.filter((i): i is Item => i !== null);
        if (itemsToReturn.length === 0) return {};

        return {
          cubeSlots: Array(9).fill(null),
          inventory: [...state.inventory, ...itemsToReturn]
        };
      }),

      autoFillCube: () => set((state) => {
        const itemsToReturn = state.cubeSlots.filter((i): i is Item => i !== null);
        const activeInventory = [...state.inventory, ...itemsToReturn];

        const grouped: { [rarity in ItemRarity]?: Item[] } = {};
        activeInventory.forEach(item => {
          if (!grouped[item.rarity]) grouped[item.rarity] = [];
          grouped[item.rarity]!.push(item);
        });

        const eligibleRarity = (['common', 'uncommon', 'rare', 'epic', 'legendary'] as ItemRarity[]).find(r => (grouped[r]?.length || 0) >= 9);

        if (!eligibleRarity) {
          return { combatLog: withLogs(state.combatLog, ['⚠️ [Cubo] Não há 9 itens do mesmo grau para preenchimento automático!']) };
        }

        const itemsToPlace = grouped[eligibleRarity]!.slice(0, 9);
        const itemsToPlaceIds = new Set(itemsToPlace.map(i => i.id));
        const nextInventory = activeInventory.filter(i => !itemsToPlaceIds.has(i.id));

        return {
          cubeSlots: itemsToPlace,
          inventory: nextInventory,
          combatLog: withLogs(state.combatLog, [`🧪 [Cubo] Preenchido com 9 itens de grau ${eligibleRarity}.`])
        };
      }),

      synthesizeCube: () => set((state) => {
        const slots = state.cubeSlots;
        if (slots.some(s => s === null)) {
          return { combatLog: withLogs(state.combatLog, ['⚠️ [Cubo] Preencha os 9 slots do cubo para sintetizar.']) };
        }

        const targetRarity = slots[0]!.rarity;
        const allSame = slots.every(s => s!.rarity === targetRarity);
        if (!allSame) {
          return { combatLog: withLogs(state.combatLog, ['⚠️ [Cubo] Todos os 9 itens devem ser da mesma raridade.']) };
        }

        const totalLvl = slots.reduce((sum, s) => sum + s!.levelRequired, 0);
        const avgLvl = Math.round(totalLvl / 9);

        let nextRarity: ItemRarity = 'uncommon';
        let levelBonus = 1;
        if (targetRarity === 'common') nextRarity = 'uncommon';
        else if (targetRarity === 'uncommon') nextRarity = 'rare';
        else if (targetRarity === 'rare') nextRarity = 'epic';
        else if (targetRarity === 'epic') nextRarity = 'legendary';
        else if (targetRarity === 'legendary') {
          nextRarity = 'legendary';
          levelBonus = 3;
        }

        let [newItem, seed] = generateRandomItem(avgLvl + levelBonus, state.seed);
        const rarityVal = { common: 1, uncommon: 1.5, rare: 2.2, epic: 3.5, legendary: 6 };
        const mult = rarityVal[nextRarity];

        const rollResult = nextRandom(seed);
        seed = rollResult[0];
        const baseStatVal = Math.round((avgLvl + levelBonus) * (2.2 + rollResult[1] * 0.4) * mult);

        if (newItem.type === 'weapon') {
          newItem = { ...newItem, rarity: nextRarity, attack: baseStatVal, defense: 0, hp: 0 };
        } else if (newItem.type === 'armor') {
          newItem = { ...newItem, rarity: nextRarity, defense: Math.round(baseStatVal * 0.4), hp: Math.round(baseStatVal * 5), attack: 0 };
        } else {
          newItem = { ...newItem, rarity: nextRarity, attack: Math.round(baseStatVal * 0.4), hp: Math.round(baseStatVal * 4), defense: Math.round(baseStatVal * 0.1) };
        }

        return {
          cubeSlots: Array(9).fill(null),
          inventory: [...state.inventory, newItem],
          seed,
          combatLog: withLogs(state.combatLog, [`✨ [SÍNTESE] Criou: ${newItem.name} (${nextRarity})!`])
        };
      })
    }),
    {
      name: 'rpgidle-save-state', // localStorage item key
      partialize: (state) => ({
        gold: state.gold,
        enchantStones: state.enchantStones,
        progression: state.progression,
        party: state.party,
        inventory: state.inventory,
        runeStash: state.runeStash,
        cubeSlots: state.cubeSlots,
        layoutMode: state.layoutMode,
        combatLog: state.combatLog,
        seed: state.seed,
        lastTickMs: state.lastTickMs
      })
    }
  )
);

// addLog helper kept synchronous (no setTimeout). Used by external dispatchers (e.g. teleport).
function withLogsState(combatLog: string[], message: string): { combatLog: string[] } {
  return { combatLog: withLogs(combatLog, [message]) };
}
