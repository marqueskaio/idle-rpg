import React, { useState } from 'react';
import { useGameStore } from '../game/store';
import type { Item } from '../game/types';

export const InventoryPanel: React.FC = () => {
  const { 
    inventory, 
    runeStash, 
    gold, 
    enchantStones, 
    sellItem, 
    dismantleItem, 
    craftItem, 
    enchantItem 
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'items' | 'runes'>('items');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleCraft = () => {
    craftItem();
  };

  const handleSell = (id: string) => {
    sellItem(id);
    setSelectedItem(null);
  };

  const handleDismantle = (id: string) => {
    dismantleItem(id);
    setSelectedItem(null);
  };

  const handleEnchant = (id: string) => {
    enchantItem(id);
    // Refresh selected item view to reflect success/fail refinement change
    setTimeout(() => {
      const updated = useGameStore.getState().inventory.find(i => i.id === id);
      setSelectedItem(updated || null);
    }, 20);
  };

  const getRarityColor = (rarity: string) => {
    return `var(--rarity-${rarity})`;
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Comum';
      case 'uncommon': return 'Incomum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      default: return rarity;
    }
  };

  const getItemTypeEmoji = (type: string) => {
    switch (type) {
      case 'weapon': return '🗡️';
      case 'armor': return '🛡️';
      case 'ring': return '💍';
      default: return '📦';
    }
  };

  // Enchantment costs
  const getEnchantCosts = (item: Item) => {
    const stoneCost = 1 + Math.floor(item.refineLevel / 3);
    const goldCost = Math.round((item.refineLevel + 1) * 80);
    const successRate = Math.max(0.35, 1.0 - Math.max(0, item.refineLevel - 3) * 0.15);
    return { stoneCost, goldCost, successRate: Math.round(successRate * 100) };
  };

  return (
    <div className="rpg-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: '300px' }}>
      
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
        <button 
          className={`btn-secondary ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => { setActiveTab('items'); setSelectedItem(null); }}
          style={{ flex: 1, padding: '4px', fontSize: '11px', color: activeTab === 'items' ? 'var(--color-gold)' : 'var(--color-text)' }}
        >
          🎒 Equipamentos ({inventory.length})
        </button>
        <button 
          className={`btn-secondary ${activeTab === 'runes' ? 'active' : ''}`}
          onClick={() => { setActiveTab('runes'); setSelectedItem(null); }}
          style={{ flex: 1, padding: '4px', fontSize: '11px', color: activeTab === 'runes' ? 'var(--color-gold)' : 'var(--color-text)' }}
        >
          💎 Runas Guardadas ({runeStash.length})
        </button>
      </div>

      {activeTab === 'items' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          
          {/* Crafting Button Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '8px', border: '2px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="rpg-font" style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-gold-bright)' }}>Forja Arcana</span>
              <span style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>Forje itens. Custo: 150g e 3 Pedras.</span>
            </div>
            <button 
              className="btn-primary" 
              onClick={handleCraft}
              disabled={gold < 150 || enchantStones < 3}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              🔨 Forjar
            </button>
          </div>

          {/* Grid Slots */}
          <div className="item-grid" style={{ maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
            {inventory.map((item) => (
              <div 
                key={item.id}
                className={`item-slot rarity-${item.rarity} ${selectedItem?.id === item.id ? 'active' : ''}`}
                onClick={() => setSelectedItem(item)}
                style={{ outline: selectedItem?.id === item.id ? '2px solid var(--color-gold)' : 'none' }}
              >
                <span className="item-icon">{getItemTypeEmoji(item.type)}</span>
                <span className="item-refine">+{item.refineLevel}</span>
              </div>
            ))}
            {inventory.length === 0 && (
              <span style={{ gridColumn: 'span 5', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-dim)', padding: '24px 0' }}>
                Seu inventário está vazio.
              </span>
            )}
          </div>

          {/* Details & Actions for selected item */}
          {selectedItem && (
            <div className="rpg-panel" style={{ padding: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ color: getRarityColor(selectedItem.rarity), fontSize: '11px' }}>
                  {selectedItem.name} +{selectedItem.refineLevel}
                </strong>
                <span style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>
                  ({getRarityText(selectedItem.rarity)})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', color: 'var(--color-text-dim)', fontSize: '10px' }}>
                {selectedItem.attack > 0 && <span>⚔️ Ataque: <strong style={{ color: 'white' }}>{Math.round(selectedItem.attack * (1 + selectedItem.refineLevel * 0.15))}</strong></span>}
                {selectedItem.defense > 0 && <span>🛡️ Defesa: <strong style={{ color: 'white' }}>{Math.round(selectedItem.defense * (1 + selectedItem.refineLevel * 0.15))}</strong></span>}
                {selectedItem.hp > 0 && <span>❤️ HP: <strong style={{ color: 'white' }}>{Math.round(selectedItem.hp * (1 + selectedItem.refineLevel * 0.15))}</strong></span>}
              </div>

              {/* Upgrade pricing info */}
              {(() => {
                const { stoneCost, goldCost, successRate } = getEnchantCosts(selectedItem);
                return (
                  <div style={{ padding: '4px', background: 'rgba(0,0,0,0.2)', fontSize: '9px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                    Upgrade: 🪙<strong>{goldCost}</strong> + 💎<strong>{stoneCost} Pedras</strong> | Chance: <strong style={{ color: successRate >= 75 ? 'var(--color-success)' : 'orange' }}>{successRate}%</strong>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => handleEnchant(selectedItem.id)}
                  disabled={gold < getEnchantCosts(selectedItem).goldCost || enchantStones < getEnchantCosts(selectedItem).stoneCost}
                  style={{ flex: 2, padding: '4px', fontSize: '10px' }}
                >
                  🔮 Encantar
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleSell(selectedItem.id)}
                  style={{ flex: 1, padding: '4px', fontSize: '10px' }}
                >
                  🪙 Vender
                </button>
                <button 
                  className="btn-danger" 
                  onClick={() => handleDismantle(selectedItem.id)}
                  style={{ flex: 1, padding: '4px', fontSize: '10px' }}
                >
                  🔨 Desman.
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* RUNES TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-dim)', paddingBottom: '4px' }}>
            💡 Runas dropadas de chefes podem ser socketadas na tela de gerenciamento de cada herói.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {runeStash.map((rune) => (
              <div 
                key={rune.id}
                className="rpg-panel" 
                style={{ 
                  padding: '6px', 
                  flex: '1 1 calc(50% - 6px)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '10px', 
                  border: '1px solid var(--color-border)' 
                }}
              >
                <span style={{ fontSize: '16px' }}>🔷</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--rarity-rare)', fontWeight: 'bold' }}>{rune.name}</span>
                  <span style={{ color: 'var(--color-text-dim)', fontSize: '9px' }}>
                    {rune.statType === 'attack' && `Ataque +${rune.value}`}
                    {rune.statType === 'defense' && `Defesa +${rune.value}`}
                    {rune.statType === 'hp' && `Vida +${rune.value}`}
                    {rune.statType === 'goldGain' && `Gold +${Math.round(rune.value*100)}%`}
                    {rune.statType === 'xpGain' && `XP +${Math.round(rune.value*100)}%`}
                  </span>
                </div>
              </div>
            ))}
            {runeStash.length === 0 && (
              <span style={{ textAlign: 'center', width: '100%', fontSize: '11px', color: 'var(--color-text-dim)', padding: '24px 0' }}>
                Nenhuma runa guardada no baú.
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
