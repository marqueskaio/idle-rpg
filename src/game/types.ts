export type CharacterClass = 'Warrior' | 'Mage' | 'Rogue';

export type ItemType = 'weapon' | 'armor' | 'ring';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  attack: number;
  defense: number;
  hp: number;
  refineLevel: number; // e.g. +0, +1, +2
  levelRequired: number;
}

export type RuneStatType = 'attack' | 'defense' | 'hp' | 'goldGain' | 'xpGain';

export interface Rune {
  id: string;
  name: string;
  statType: RuneStatType;
  value: number; // e.g. 0.05 for +5% or 10 for flat attack
  level: number; // Can be upgraded in the future
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive';
  level: number;
  maxLevel: number;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  xp: number;
  xpNeeded: number;
  skillPoints: number;
  // Map of skillId to skill level (allocated points)
  skills: { [skillId: string]: number };
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    ring: Item | null;
  };
  runes: (Rune | null)[]; // 3 sockets
}

export interface Progression {
  difficulty: number; // 1 = Normal, 2 = Hard, 3 = Nightmare
  act: number;        // 1 to 3
  stage: number;      // 1 to 10
  killsInCurrentStage: number;
  killsRequiredForNextStage: number;
}

export interface GameState {
  gold: number;
  enchantStones: number;
  progression: Progression;
  party: Character[]; // Max 3 characters
  inventory: Item[];  // Equipment stash
  runeStash: Rune[];  // Unequipped runes
  layoutMode: 'widget' | 'taskbar';
  combatLog: string[];
  globalCombatPower: number;
}
