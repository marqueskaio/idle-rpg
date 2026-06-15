import React from 'react';
import { useGameStore } from '../game/store';
import { ItemIcon } from '../game/icons';

export const CubePanel: React.FC = () => {
  const cubeSlots = useGameStore(s => s.cubeSlots);
  const autoFillCube = useGameStore(s => s.autoFillCube);
  const clearCube = useGameStore(s => s.clearCube);
  const synthesizeCube = useGameStore(s => s.synthesizeCube);
  const removeFromCube = useGameStore(s => s.removeFromCube);

  // Find if all items are same rarity and count filled slots
  const filledCount = cubeSlots.filter(s => s !== null).length;
  const firstItem = cubeSlots.find(s => s !== null);
  const isAllSameRarity = cubeSlots
    .filter(s => s !== null)
    .every(s => s.rarity === firstItem?.rarity);

  const canSynthesize = filledCount === 9 && isAllSameRarity;

  const getRarityTextPT = (rarity?: string) => {
    if (!rarity) return '';
    switch (rarity) {
      case 'common': return 'Comum';
      case 'uncommon': return 'Incomum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      default: return rarity;
    }
  };

  return (
    <div className="rpg-panel panel-border" style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, height: '100%' }}>
      
      {/* Red banner title */}
      <div className="rpg-title-ribbon" style={{ margin: '0 -12px 6px -12px' }}>
        <h3>📦 Cubo Transmutador</h3>
      </div>

      <div className="cube-grid-container">
        {/* 3x3 Grid */}
        <div className="cube-grid-3x3">
          {cubeSlots.map((item, index) => (
            <div
              key={index}
              className={`cube-slot-box ${item ? `rarity-${item.rarity}` : ''}`}
              onClick={() => { if (item) removeFromCube(index); }}
              title={item ? `${item.name}. Clique para remover.` : 'Slot Vazio'}
            >
              {item ? (
                <>
                  <ItemIcon item={item} className="slot-icon" size={20} />
                  <span className="slot-refine" style={{ fontSize: '11px', top: '1px', right: '2px' }}>+{item.refineLevel}</span>
                </>
              ) : (
                <span style={{ opacity: 0.15, fontSize: '18px' }}>·</span>
              )}
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', width: '100%', gap: '6px', marginTop: '6px' }}>
          <button
            className="btn-rpg"
            onClick={autoFillCube}
            style={{ flex: 1, fontSize: '13px', padding: '2px 0' }}
            title="Auto-preenche com 9 itens de mesma raridade do baú"
          >
            Auto-Preencher
          </button>
          <button
            className="btn-rpg"
            onClick={clearCube}
            disabled={filledCount === 0}
            style={{ flex: 1, fontSize: '13px', padding: '2px 0' }}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Synthesis Details & Trigger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0', marginTop: 'auto' }}>
        <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', textAlign: 'center', lineHeight: '1.2' }}>
          {filledCount === 0 ? (
            <span>Selecione itens no Baú ou clique em Auto-Preencher.</span>
          ) : filledCount < 9 ? (
            <span>Coloque {9 - filledCount} itens restantes ({filledCount}/9).</span>
          ) : !isAllSameRarity ? (
            <span style={{ color: 'var(--color-danger)' }}>⚠️ Erro: Todos os itens devem ter a mesma raridade.</span>
          ) : (
            <span style={{ color: 'var(--color-success)' }}>
              Pronto para transmutar! Grau: <strong style={{ textTransform: 'capitalize' }}>{getRarityTextPT(firstItem?.rarity)}</strong>
            </span>
          )}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '6px 0', fontSize: '18px' }}
          onClick={synthesizeCube}
          disabled={!canSynthesize}
        >
          🔮 Sintetizar
        </button>
      </div>

    </div>
  );
};
