import { createElement } from 'react';
import type { IconType } from 'react-icons';
import {
  GiBroadsword, GiDaggers, GiWizardStaff, GiBowArrow, GiBattleAxe,
  GiWarhammer, GiTrident, GiCape, GiClosedBarbute, GiBreastplate,
  GiChestArmor, GiLeatherArmor, GiNecklace, GiCutDiamond, GiRing,
  GiShield, GiPointyHat, GiHood, GiTwoCoins, GiCrystalShine,
  GiStarFormation, GiSwordsPower, GiHearts, GiUpgrade, GiSun, GiScythe
} from 'react-icons/gi';
import type { CharacterClass } from './types';

// Ícone (SVG, recolorível) resolvido pelo NOME do item — funciona com saves antigos
// e dá variedade por subtipo. Game Icons (react-icons/gi).
function resolveItemIcon(item: { type: string; name: string }): IconType {
  const n = item.name.toLowerCase();

  if (item.type === 'weapon') {
    if (n.includes('cajado') || n.includes('cetro') || n.includes('varinha')) return GiWizardStaff;
    if (n.includes('adaga') || n.includes('punhal')) return GiDaggers;
    if (n.includes('arco') || n.includes('besta')) return GiBowArrow;
    if (n.includes('machado')) return GiBattleAxe;
    if (n.includes('martelo') || n.includes('maça') || n.includes('marreta')) return GiWarhammer;
    if (n.includes('lança') || n.includes('alabarda') || n.includes('tridente')) return GiTrident;
    return GiBroadsword;
  }

  if (item.type === 'armor') {
    if (n.includes('manto') || n.includes('túnica') || n.includes('robe')) return GiCape;
    if (n.includes('elmo') || n.includes('capacete') || n.includes('coroa')) return GiClosedBarbute;
    if (n.includes('couro') || n.includes('gibão')) return GiLeatherArmor;
    if (n.includes('couraça') || n.includes('placa') || n.includes('aço')) return GiBreastplate;
    return GiChestArmor;
  }

  if (n.includes('amuleto') || n.includes('colar') || n.includes('pingente')) return GiNecklace;
  if (n.includes('jade') || n.includes('opala') || n.includes('safira') || n.includes('rubi')) return GiCutDiamond;
  return GiRing;
}

function resolveRuneIcon(statType: string): IconType {
  switch (statType) {
    case 'attack': return GiSwordsPower;
    case 'defense': return GiShield;
    case 'hp': return GiHearts;
    case 'goldGain': return GiTwoCoins;
    case 'xpGain': return GiUpgrade;
    default: return GiCutDiamond;
  }
}

function resolveClassIcon(cls: CharacterClass): IconType {
  switch (cls) {
    case 'Warrior': return GiShield;
    case 'Mage': return GiPointyHat;
    case 'Rogue': return GiHood;
    case 'Cleric': return GiSun;
    case 'Paladin': return GiWarhammer;
    case 'Necromancer': return GiScythe;
  }
}

const RUNE_COLORS: Record<string, string> = {
  attack: 'var(--class-warrior)',
  defense: 'var(--class-mage)',
  hp: '#f87171',
  goldGain: 'var(--color-gold)',
  xpGain: 'var(--class-rogue)'
};

// Componentes prontos. Usamos createElement (não JSX <Ico/>) porque o ícone é
// escolhido dinamicamente — evita o falso positivo de "componente criado no render".
interface ItemIconProps {
  item: { type: string; name: string; rarity?: string };
  size?: number;
  className?: string;
}
export function ItemIcon({ item, size = 22, className }: ItemIconProps) {
  const color = item.rarity ? `var(--rarity-${item.rarity}-text)` : undefined;
  return createElement(resolveItemIcon(item), { size, color, className });
}

interface RuneIconProps {
  rune: { statType: string };
  size?: number;
  className?: string;
}
export function RuneIcon({ rune, size = 18, className }: RuneIconProps) {
  return createElement(resolveRuneIcon(rune.statType), { size, color: RUNE_COLORS[rune.statType], className });
}

interface ClassIconProps {
  cls: CharacterClass;
  size?: number;
  className?: string;
}
export function ClassIcon({ cls, size = 18, className }: ClassIconProps) {
  return createElement(resolveClassIcon(cls), { size, className });
}

export { GiTwoCoins as CoinIcon, GiCrystalShine as StoneIcon, GiStarFormation as PowerIcon };
