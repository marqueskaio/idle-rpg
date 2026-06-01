import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Character, CharacterClass, Item, Rune, Progression, ItemRarity, ItemType, RuneStatType } from './types';

// Static configurations for skills
export const CLASS_SKILLS = {
  Warrior: [
    { id: 'w_passive', name: 'Fortitude', description: 'Aumenta HP máximo em 6% e Defesa em 6% por nível.', type: 'passive' as const, maxLevel: 10 },
    { id: 'w_active', name: 'Golpe de Escudo', description: 'Causa 120% de dano base. Cada nível aumenta o multiplicador de dano em +15%.', type: 'active' as const, maxLevel: 10 }
  ],
  Mage: [
    { id: 'm_passive', name: 'Fluxo Arcano', description: 'Aumenta o Ataque em 10% por nível.', type: 'passive' as const, maxLevel: 10 },
    { id: 'm_active', name: 'Bola de Fogo', description: 'Causa 150% de dano base. Cada nível aumenta o multiplicador de dano em +25%.', type: 'active' as const, maxLevel: 10 }
  ],
  Rogue: [
    { id: 'r_passive', name: 'Mestria em Adagas', description: 'Aumenta o Ataque em 7% por nível.', type: 'passive' as const, maxLevel: 10 },
    { id: 'r_active', name: 'Ataque Furtivo', description: 'Causa 130% de dano base. Cada nível aumenta o multiplicador de dano em +20%.', type: 'active' as const, maxLevel: 10 }
  ]
};

// Item generator helper
const RARITY_MULTIPLIERS = { common: 1, uncommon: 1.5, rare: 2.2, epic: 3.5, legendary: 6 };
const ITEM_TYPES: ItemType[] = ['weapon', 'armor', 'ring'];

export function generateRandomItem(level: number): Item {
  const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
  
  // Rarity roll: common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%)
  const roll = Math.random() * 100;
  let rarity: ItemRarity = 'common';
  if (roll < 1) rarity = 'legendary';
  else if (roll < 5) rarity = 'epic';
  else if (roll < 15) rarity = 'rare';
  else if (roll < 40) rarity = 'uncommon';
  
  const mult = RARITY_MULTIPLIERS[rarity];
  const id = Math.random().toString(36).substring(2, 9);
  
  let attack = 0;
  let defense = 0;
  let hp = 0;
  
  // Base stats grow with average party level
  const baseStatVal = Math.round(level * (2 + Math.random() * 0.5) * mult);
  
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
  
  const prefixes = {
    common: 'Gasto(a)',
    uncommon: 'Melhorado(a)',
    rare: 'Raro(a)',
    epic: 'Épico(a)',
    legendary: 'Lendário(a)'
  };
  
  const names = {
    weapon: ['Espada de Bronze', 'Cajado Rúnico', 'Adaga de Ferro', 'Arco Longo', 'Machado de Combate'],
    armor: ['Manto de Seda', 'Couraça de Aço', 'Armadura de Couro', 'Manto Sombrio'],
    ring: ['Anel de Ouro', 'Anel de Jade', 'Selo de Opala', 'Anel do Poder']
  };
  
  const baseName = names[type][Math.floor(Math.random() * names[type].length)];
  const name = `${prefixes[rarity]} ${baseName}`;
  
  return {
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

export function generateRandomRune(level: number): Rune {
  const statType = RUNE_STATS[Math.floor(Math.random() * RUNE_STATS.length)];
  const id = Math.random().toString(36).substring(2, 9);
  
  let value = 0;
  if (statType === 'goldGain' || statType === 'xpGain') {
    // E.g. +3% to +15% gold/xp gain
    value = 0.03 + (level * 0.01) + Math.round(Math.random() * 0.02 * 100) / 100;
  } else if (statType === 'attack') {
    value = Math.round(level * 2 + Math.random() * level);
  } else if (statType === 'defense') {
    value = Math.round(level * 1.2 + Math.random() * (level * 0.6));
  } else {
    // hp
    value = Math.round(level * 15 + Math.random() * (level * 10));
  }
  
  // Standard formatting
  value = Math.round(value * 100) / 100;
  
  const name = `${RUNE_NAMES[statType]} (${level}º Grau)`;
  
  return {
    id,
    name,
    statType,
    value,
    level
  };
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
  
  // Apply passive skill modifiers
  let atkMult = 1;
  let defMult = 1;
  let hpMult = 1;
  
  if (char.class === 'Warrior') {
    const lvl = char.skills['w_passive'] || 0;
    hpMult += lvl * 0.06;
    defMult += lvl * 0.06;
  } else if (char.class === 'Mage') {
    const lvl = char.skills['m_passive'] || 0;
    atkMult += lvl * 0.10;
  } else if (char.class === 'Rogue') {
    const lvl = char.skills['r_passive'] || 0;
    atkMult += lvl * 0.07;
  }
  
  // Apply character runes
  for (const rune of char.runes) {
    if (rune) {
      if (rune.statType === 'attack') totalAtk += rune.value;
      if (rune.statType === 'defense') totalDef += rune.value;
      if (rune.statType === 'hp') totalHp += rune.value;
    }
  }
  
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
  craftItem: () => void;
  enchantItem: (itemId: string) => void;
  tickGame: () => void;
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
    (set, get) => ({
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

      // Actions
      addLog: (message: string) => set((state) => {
        const logs = [message, ...state.combatLog];
        if (logs.length > 30) logs.pop();
        return { combatLog: logs };
      }),

      hireCharacter: (name: string, charClass: CharacterClass) => set((state) => {
        if (state.party.length >= 3) {
          return {}; // Max 3 heroes reached
        }
        
        const id = Math.random().toString(36).substring(2, 9);
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
        
        // Return updated state
        const nextState = {
          party: updatedParty,
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
        };

        // Trigger log update asynchronously or synchronously by returning it
        setTimeout(() => {
          get().addLog(`🛡️ [Herói] ${nameClean} (${charClass}) juntou-se ao grupo!`);
        }, 10);

        return nextState;
      }),

      fireCharacter: (charId: string) => set((state) => {
        const target = state.party.find(c => c.id === charId);
        if (!target) return {};
        
        // Return equipment and runes to stash/inventory
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

        setTimeout(() => {
          get().addLog(`🚪 [Herói] ${target.name} saiu do grupo. Equipamentos devolvidos.`);
        }, 10);

        return {
          party: updatedParty,
          inventory: newInventory,
          runeStash: newRuneStash,
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
        };
      }),

      allocateSkillPoint: (charId: string, skillId: string) => set((state) => {
        const updatedParty = state.party.map((char) => {
          if (char.id !== charId) return char;
          if (char.skillPoints <= 0) return char;

          const skillsCopy = { ...char.skills };
          const currentLvl = skillsCopy[skillId] || 0;
          
          // Verify max level
          const skillsList = CLASS_SKILLS[char.class];
          const skillConfig = skillsList.find(s => s.id === skillId);
          if (skillConfig && currentLvl >= skillConfig.maxLevel) return char;

          skillsCopy[skillId] = currentLvl + 1;
          
          return {
            ...char,
            skillPoints: char.skillPoints - 1,
            skills: skillsCopy
          };
        });

        const target = state.party.find(c => c.id === charId);
        const skillName = CLASS_SKILLS[target?.class || 'Warrior'].find(s => s.id === skillId)?.name || skillId;
        
        setTimeout(() => {
          get().addLog(`✨ [Skill] ${target?.name} subiu nível de ${skillName}!`);
        }, 10);

        return {
          party: updatedParty,
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
        };
      }),

      equipItem: (charId: string, itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        const updatedParty = state.party.map((char) => {
          if (char.id !== charId) return char;
          if (char.level < item.levelRequired) {
            setTimeout(() => get().addLog(`⚠️ [Aviso] Nível de ${char.name} é baixo demais para equipar ${item.name}.`), 10);
            return char;
          }

          const gearType = item.type;
          const oldEquip = char.equipment[gearType];
          
          // Filter item out of inventory, and add old equipped back to inventory
          const nextInventory = state.inventory.filter(i => i.id !== itemId);
          if (oldEquip) {
            nextInventory.push(oldEquip);
          }

          // Trigger log
          setTimeout(() => {
            get().addLog(`⚔️ [Equip] ${char.name} equipou ${item.name}.`);
          }, 10);

          return {
            ...char,
            equipment: {
              ...char.equipment,
              [gearType]: item
            }
          };
        });

        // Compute changes in inventory
        const targetChar = state.party.find(c => c.id === charId);
        if (targetChar && targetChar.level < item.levelRequired) {
          return {}; // No changes if requirements not met
        }

        const finalInventory = state.inventory.filter(i => i.id !== itemId);
        const prevEquipped = targetChar?.equipment[item.type];
        if (prevEquipped) {
          finalInventory.push(prevEquipped);
        }

        return {
          party: updatedParty,
          inventory: finalInventory,
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
        };
      }),

      unequipItem: (charId: string, slot: 'weapon' | 'armor' | 'ring') => set((state) => {
        const targetChar = state.party.find(c => c.id === charId);
        if (!targetChar) return {};
        const item = targetChar.equipment[slot];
        if (!item) return {};

        const updatedParty = state.party.map((char) => {
          if (char.id !== charId) return char;
          return {
            ...char,
            equipment: {
              ...char.equipment,
              [slot]: null
            }
          };
        });

        setTimeout(() => get().addLog(`🛡️ [Desequipar] ${item.name} desequipado de ${targetChar.name}.`), 10);

        return {
          party: updatedParty,
          inventory: [...state.inventory, item],
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
        };
      }),

      socketRune: (charId: string, runeId: string, slotIndex: number) => set((state) => {
        const rune = state.runeStash.find(r => r.id === runeId);
        if (!rune) return {};

        const updatedParty = state.party.map((char) => {
          if (char.id !== charId) return char;

          const runesCopy = [...char.runes];
          runesCopy[slotIndex] = rune;

          setTimeout(() => {
            get().addLog(`💎 [Runa] ${char.name} equipou ${rune.name} no slot ${slotIndex + 1}.`);
          }, 10);

          return {
            ...char,
            runes: runesCopy
          };
        });

        const targetChar = state.party.find(c => c.id === charId);
        const oldRune = targetChar?.runes[slotIndex];
        const nextRuneStash = state.runeStash.filter(r => r.id !== runeId);
        if (oldRune) {
          nextRuneStash.push(oldRune);
        }

        return {
          party: updatedParty,
          runeStash: nextRuneStash,
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
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
          return {
            ...char,
            runes: runesCopy
          };
        });

        setTimeout(() => get().addLog(`💎 [Runa] ${rune.name} removida de ${targetChar.name}.`), 10);

        return {
          party: updatedParty,
          runeStash: [...state.runeStash, rune],
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
        };
      }),

      sellItem: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        // Gold value depends on level & rarity
        const rarityVal = { common: 20, uncommon: 50, rare: 150, epic: 400, legendary: 1200 };
        const goldGain = Math.round(item.levelRequired * 5 + rarityVal[item.rarity]);

        setTimeout(() => get().addLog(`🪙 [Loja] Vendeu ${item.name} por ${goldGain} Gold.`), 10);

        return {
          gold: state.gold + goldGain,
          inventory: state.inventory.filter(i => i.id !== itemId)
        };
      }),

      dismantleItem: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        // Enchantment stones gained based on rarity
        const stonesVal = { common: 1, uncommon: 2, rare: 5, epic: 15, legendary: 45 };
        const stonesGain = stonesVal[item.rarity];

        setTimeout(() => get().addLog(`🔨 [Desmontar] Desmontou ${item.name} e obteve ${stonesGain} Pedra(s) de Encantamento.`), 10);

        return {
          enchantStones: state.enchantStones + stonesGain,
          inventory: state.inventory.filter(i => i.id !== itemId)
        };
      }),

      craftItem: () => set((state) => {
        const goldCost = 150;
        const stoneCost = 3;

        if (state.gold < goldCost || state.enchantStones < stoneCost) {
          setTimeout(() => get().addLog(`⚠️ [Craft] Gold ou Pedras de Encantamento insuficientes! (Requer 150g e 3 Pedras)`), 10);
          return {};
        }

        if (state.party.length === 0) {
          setTimeout(() => get().addLog(`⚠️ [Craft] Crie pelo menos um personagem para craftar itens.`), 10);
          return {};
        }

        // Get average level of party to determine item level
        const avgLevel = Math.round(state.party.reduce((sum, c) => sum + c.level, 0) / state.party.length);
        const newItem = generateRandomItem(avgLevel);

        setTimeout(() => get().addLog(`🔨 [Craft] Sucesso! Forjou ${newItem.name}.`), 10);

        return {
          gold: state.gold - goldCost,
          enchantStones: state.enchantStones - stoneCost,
          inventory: [...state.inventory, newItem]
        };
      }),

      enchantItem: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        const stoneCost = 1 + Math.floor(item.refineLevel / 3); // Cost increments every 3 levels
        const goldCost = Math.round((item.refineLevel + 1) * 80);

        if (state.gold < goldCost || state.enchantStones < stoneCost) {
          setTimeout(() => get().addLog(`⚠️ [Encantar] Ouro ou Pedras de Encantamento insuficientes para o upgrade +${item.refineLevel + 1}.`), 10);
          return {};
        }

        // Calculate success chance
        // 100% up to +4, then drops slowly
        const successRate = Math.max(0.35, 1.0 - Math.max(0, item.refineLevel - 3) * 0.15);
        const rolled = Math.random();
        
        let nextInventory = [...state.inventory];
        let message = '';
        let goldChange = -goldCost;
        let stonesChange = -stoneCost;

        if (rolled <= successRate) {
          // Success
          nextInventory = state.inventory.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              refineLevel: i.refineLevel + 1
            };
          });
          message = `✔️ [Encantar] Sucesso! ${item.name} aprimorado para +${item.refineLevel + 1}!`;
        } else {
          // Fail: Refine level drops by 1 (minimum 0), item is NOT destroyed
          nextInventory = state.inventory.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              refineLevel: Math.max(0, i.refineLevel - 1)
            };
          });
          message = `❌ [Encantar] Falha! ${item.name} caiu para +${Math.max(0, item.refineLevel - 1)}.`;
        }

        setTimeout(() => get().addLog(message), 10);

        return {
          gold: state.gold + goldChange,
          enchantStones: state.enchantStones + stonesChange,
          inventory: nextInventory,
          // Update global combat power since equipment stats inside party might need updating
          // (Wait, this only affects items in inventory, but let's update combat power anyway to be safe)
          globalCombatPower: calculateGlobalCombatPower(state.party)
        };
      }),

      tickGame: () => set((state) => {
        if (state.party.length === 0) {
          return {}; // No heroes to fight!
        }

        const p = state.progression;
        const difficulty = p.difficulty;
        const act = p.act;
        const stage = p.stage;

        // 1. Calculate party DPS
        let totalDps = 0;
        let totalDefense = 0;
        let totalMaxHp = 0;
        
        state.party.forEach(char => {
          const stats = calculateCharacterStats(char);
          totalDps += stats.attack;
          totalDefense += stats.defense;
          totalMaxHp += stats.hp;
        });

        // 2. Simulate combat values based on Act and Stage
        // Enemy stats scale up exponentially
        const enemyMaxHp = Math.round((stage * 15 + (act - 1) * 200) * Math.pow(1.8, difficulty - 1));
        const enemyAttack = Math.round((stage * 2 + (act - 1) * 30) * Math.pow(1.6, difficulty - 1));
        
        // Simple combat tick: party deals totalDps damage, enemy deals damage back.
        // For MVP, we simplify: we check how many seconds it takes to defeat a monster.
        // Since this is 1 tick (1 second):
        // Each tick, we accumulate "damage dealt" or we simplify:
        // DPS beats EnemyHP. If DPS > EnemyHP, we kill multiple monsters or 1 monster.
        // If DPS < EnemyHP, we deal a fraction of a kill. Let's stack damage progress!
        // To make it fun: We simulate killing rate.
        // Kill speed (monsters per tick) = DPS / EnemyHP.
        // We accumulate partial kills:
        const baseKillProgress = totalDps / enemyMaxHp;
        
        // Enemy can slow down the kills if enemy attack is higher than party defense
        // Let's create a survivability multiplier (e.g. 1.0 down to 0.1)
        const defenseVsAttack = totalDefense / (enemyAttack || 1);
        const survivabilityMult = Math.min(1.0, 0.3 + defenseVsAttack * 0.2);
        
        const killsGained = baseKillProgress * survivabilityMult;
        
        // Accumulate kills progress
        let newKillsProgress = p.killsInCurrentStage + killsGained;

        if (newKillsProgress >= p.killsRequiredForNextStage) {
          // Don't auto-skip multiple stages in 1 tick, just cap and level up stage
          newKillsProgress = 0; // Reset stage kills
        }

        // Handle rewards and stage transitions
        let nextStage = stage;
        let nextAct = act;
        let nextDifficulty = difficulty;
        let stageKills = p.killsInCurrentStage;
        let goldGained = 0;
        let xpGained = 0;

        // Base reward multipliers
        let goldModifier = 1;
        let xpModifier = 1;

        // Apply global rune modifiers from socketed runes
        state.party.forEach(char => {
          char.runes.forEach(rune => {
            if (rune) {
              if (rune.statType === 'goldGain') goldModifier += rune.value;
              if (rune.statType === 'xpGain') xpModifier += rune.value;
            }
          });
        });

        if (killsGained > 0) {
          // Grant active rewards for the damage progress made this tick
          // E.g. every tick gives small gold/xp, and completing a stage gives a big chest
          const tickGold = Math.max(1, Math.round((3 + stage * 0.5 + (act - 1) * 8) * difficulty * goldModifier * killsGained));
          const tickXp = Math.max(1, Math.round((5 + stage * 1 + (act - 1) * 15) * difficulty * xpModifier * killsGained));
          
          goldGained += tickGold;
          xpGained += tickXp;
          
          stageKills += killsGained;
        }

        let stageUp = false;
        let actUp = false;
        let diffUp = false;

        // If stage is cleared (kills reach requirements)
        if (stageKills >= p.killsRequiredForNextStage) {
          stageKills = 0;
          nextStage++;
          stageUp = true;

          // Bonus reward for stage clear!
          goldGained += Math.round((50 + stage * 20) * difficulty * goldModifier);
          
          // Chance to drop item on stage clear! (15% base chance)
          const roll = Math.random();
          if (roll <= 0.20) {
            const avgLvl = Math.max(1, Math.round(state.party.reduce((sum, c) => sum + c.level, 0) / state.party.length));
            const droppedItem = generateRandomItem(avgLvl);
            setTimeout(() => get().addLog(`🎁 [Saque] Encontrou ${droppedItem.name}!`), 10);
            state.inventory.push(droppedItem);
          }
          
          // Chance to drop Enchantment Stone (30%)
          if (Math.random() <= 0.30) {
            const stones = 1 + Math.floor(Math.random() * difficulty);
            setTimeout(() => get().addLog(`💎 [Saque] Encontrou ${stones} Pedra(s) de Encantamento!`), 10);
            state.enchantStones += stones;
          }

          // Chance to drop Rune (8%)
          if (Math.random() <= 0.08) {
            const runeLevel = Math.max(1, Math.round(avgLevelForRunes(state.party) * 0.8));
            const droppedRune = generateRandomRune(runeLevel);
            setTimeout(() => get().addLog(`🔷 [Saque] Obteve uma ${droppedRune.name}!`), 10);
            state.runeStash.push(droppedRune);
          }

          if (nextStage > 10) {
            nextStage = 1;
            nextAct++;
            actUp = true;

            // Extra Act clear bonus
            goldGained += Math.round(300 * difficulty * goldModifier);
            state.enchantStones += 5;
            setTimeout(() => get().addLog(`🎉 [Progresso] Ato ${act} concluído! Bônus de 5 Pedras recebido!`), 10);

            if (nextAct > 3) {
              nextAct = 1;
              nextDifficulty++;
              diffUp = true;
              
              // Big difficulty clear bonus
              goldGained += Math.round(1500 * difficulty * goldModifier);
              state.enchantStones += 15;
              setTimeout(() => get().addLog(`👑 [DIFICULDADE] Você conquistou a Dificuldade ${difficulty}! Nova dificuldade destravada!`), 15);
            }
          }
        }

        // Apply XP to all party members
        const updatedParty = state.party.map(char => {
          let charXp = char.xp + xpGained;
          let charLvl = char.level;
          let xpNeeded = char.xpNeeded;
          let spGained = 0;
          let levelUpTriggered = false;

          while (charXp >= xpNeeded) {
            charXp -= xpNeeded;
            charLvl++;
            spGained += 2; // 2 skill points per level
            xpNeeded = Math.round(xpNeeded * 1.35); // scaling xp requirements
            levelUpTriggered = true;
          }

          if (levelUpTriggered) {
            const name = char.name;
            const nextLvl = charLvl;
            setTimeout(() => {
              get().addLog(`⭐ [LEVEL UP] ${name} subiu para o Nível ${nextLvl}! (+2 Pontos de Habilidade)`);
            }, 10);
          }

          return {
            ...char,
            level: charLvl,
            xp: charXp,
            xpNeeded,
            skillPoints: char.skillPoints + spGained
          };
        });

        // Log general tick status occasionally (e.g. if stage clears, or simply show combat log on transitions)
        if (stageUp || actUp || diffUp) {
          const diffNames = ['Normal', 'Pesadelo', 'Inferno', 'Tormento', 'Abismo'];
          const diffText = diffNames[nextDifficulty - 1] || `Dificuldade ${nextDifficulty}`;
          setTimeout(() => {
            get().addLog(`⚔️ Avançou para a Fase [${diffText} - Ato ${nextAct} - Fase ${nextStage}]`);
          }, 5);
        }

        return {
          gold: state.gold + goldGained,
          party: updatedParty,
          progression: {
            ...p,
            difficulty: nextDifficulty,
            act: nextAct,
            stage: nextStage,
            killsInCurrentStage: Math.round(stageKills * 100) / 100
          },
          globalCombatPower: calculateGlobalCombatPower(updatedParty)
        };
      }),

      resetGame: () => set(() => {
        setTimeout(() => get().addLog('🔄 [Reiniciar] Jogo resetado com sucesso!'), 10);
        return {
          gold: 500,
          enchantStones: 5,
          progression: initialProgression,
          party: [],
          inventory: [],
          runeStash: [],
          cubeSlots: Array(9).fill(null),
          globalCombatPower: 0
        };
      }),

      toggleLayoutMode: () => set((state) => ({
        layoutMode: state.layoutMode === 'widget' ? 'taskbar' : 'widget'
      })),

      addToCube: (itemId: string) => set((state) => {
        const item = state.inventory.find(i => i.id === itemId);
        if (!item) return {};

        const emptyIdx = state.cubeSlots.findIndex(s => s === null);
        if (emptyIdx === -1) {
          setTimeout(() => get().addLog('⚠️ [Cubo] O cubo está cheio!'), 10);
          return {};
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
          setTimeout(() => get().addLog('⚠️ [Cubo] Não há 9 itens do mesmo grau para preenchimento automático!'), 10);
          return {
            cubeSlots: state.cubeSlots,
            inventory: state.inventory
          };
        }

        const itemsToPlace = grouped[eligibleRarity]!.slice(0, 9);
        const itemsToPlaceIds = new Set(itemsToPlace.map(i => i.id));
        const nextInventory = activeInventory.filter(i => !itemsToPlaceIds.has(i.id));

        setTimeout(() => get().addLog(`🧪 [Cubo] Preenchido com 9 itens de grau ${eligibleRarity}.`), 10);

        return {
          cubeSlots: itemsToPlace,
          inventory: nextInventory
        };
      }),

      synthesizeCube: () => set((state) => {
        const slots = state.cubeSlots;
        if (slots.some(s => s === null)) {
          setTimeout(() => get().addLog('⚠️ [Cubo] Preencha os 9 slots do cubo para sintetizar.'), 10);
          return {};
        }

        const firstItem = slots[0]!;
        const targetRarity = firstItem.rarity;
        const allSame = slots.every(s => s!.rarity === targetRarity);

        if (!allSame) {
          setTimeout(() => get().addLog('⚠️ [Cubo] Todos os 9 itens devem ser da mesma raridade.'), 10);
          return {};
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

        const newItem = generateRandomItem(avgLvl + levelBonus);
        newItem.rarity = nextRarity;
        
        const rarityVal = { common: 1, uncommon: 1.5, rare: 2.2, epic: 3.5, legendary: 6 };
        const mult = rarityVal[nextRarity];
        const baseStatVal = Math.round(newItem.levelRequired * (2.2 + Math.random() * 0.4) * mult);
        
        if (newItem.type === 'weapon') {
          newItem.attack = baseStatVal;
          newItem.defense = 0;
          newItem.hp = 0;
        } else if (newItem.type === 'armor') {
          newItem.defense = Math.round(baseStatVal * 0.4);
          newItem.hp = Math.round(baseStatVal * 5);
          newItem.attack = 0;
        } else {
          newItem.attack = Math.round(baseStatVal * 0.4);
          newItem.hp = Math.round(baseStatVal * 4);
          newItem.defense = Math.round(baseStatVal * 0.1);
        }

        setTimeout(() => get().addLog(`✨ [SÍNTESE] Criou: ${newItem.name} (${nextRarity})!`), 10);

        return {
          cubeSlots: Array(9).fill(null),
          inventory: [...state.inventory, newItem]
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
        combatLog: state.combatLog
      })
    }
  )
);

// Helper to find average level for runes scaling
function avgLevelForRunes(party: Character[]): number {
  if (party.length === 0) return 1;
  return party.reduce((sum, c) => sum + c.level, 0) / party.length;
}
