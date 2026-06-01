import React from 'react';
import { useGameStore } from '../game/store';

export const Header: React.FC = () => {
  const { gold, enchantStones, globalCombatPower, layoutMode, toggleLayoutMode, resetGame } = useGameStore();

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar todo o seu progresso? Isso limpará seus heróis, itens e ouro.')) {
      resetGame();
    }
  };

  if (layoutMode === 'taskbar') {
    return (
      <div className="taskbar-section" style={{ gap: '12px' }}>
        <span className="rpg-font" style={{ color: 'var(--color-gold)', fontWeight: 'bold', fontSize: '12px' }}>
          ⚔️ MINI IDLE
        </span>
        <div className="currency-badge" title="Poder de Combate Global da Conta">
          ⭐ <span style={{ fontFamily: 'monospace' }}>{globalCombatPower.toLocaleString()}</span> CP
        </div>
        <div className="currency-badge" title="Ouro acumulado">
          🪙 <span style={{ fontFamily: 'monospace' }}>{gold.toLocaleString()}</span>
        </div>
        <div className="stone-badge" title="Pedras de Encantamento (usadas em upgrades/crafting)">
          💎 <span style={{ color: 'hsl(200, 90%, 65%)', fontFamily: 'monospace' }}>{enchantStones}</span>
        </div>
      </div>
    );
  }

  return (
    <header className="app-header">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 className="rpg-font" style={{ fontSize: '13px', color: 'var(--color-gold-bright)' }}>MINI IDLE RPG</h2>
        <span style={{ fontSize: '9px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ⭐ CP Global: <strong style={{ color: 'white' }}>{globalCombatPower.toLocaleString()}</strong>
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <div className="currency-badge" style={{ fontSize: '12px' }}>
          🪙{gold.toLocaleString()}
        </div>
        <div className="stone-badge" style={{ fontSize: '12px' }}>
          💎{enchantStones}
        </div>
        
        <button 
          onClick={toggleLayoutMode} 
          className="layout-toggle-btn" 
          title="Alternar para barra horizontal"
          style={{ fontSize: '10px' }}
        >
          ↔️
        </button>
        <button 
          onClick={handleReset} 
          className="layout-toggle-btn" 
          title="Resetar progresso"
          style={{ fontSize: '10px', color: 'var(--color-danger)', borderColor: 'rgba(194, 41, 41, 0.4)' }}
        >
          🔄
        </button>
      </div>
    </header>
  );
};
