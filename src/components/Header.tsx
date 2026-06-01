import React from 'react';
import { useGameStore } from '../game/store';

export const Header: React.FC = () => {
  const { gold, enchantStones, globalCombatPower, resetGame } = useGameStore();

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar todo o seu progresso? Isso limpará seus heróis, itens e ouro.')) {
      resetGame();
    }
  };

  return (
    <div className="rpg-top-bar">
      {/* Title */}
      <span className="rpg-font rpg-gold-text" style={{ fontWeight: 'bold', fontSize: '20px' }}>
        ⚔️ MINI IDLE RPG
      </span>

      {/* Account stats */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div className="currency-badge" title="Poder de Combate Global da Conta">
          ⭐ CP Global: <span>{globalCombatPower.toLocaleString()}</span>
        </div>
        <div className="currency-badge" title="Ouro acumulado" style={{ color: '#ffd700' }}>
          🪙 Ouro: <span>{gold.toLocaleString()}</span>
        </div>
        <div className="stone-badge" title="Pedras de Encantamento">
          💎 Pedras: <span style={{ color: '#a5f3fc' }}>{enchantStones}</span>
        </div>
      </div>

      {/* Control panel buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          onClick={handleReset} 
          className="btn-secondary" 
          title="Resetar todo o progresso"
          style={{ fontSize: '15px', color: 'var(--color-danger)', borderColor: '#c22929', padding: '1px 8px' }}
        >
          🔄 RESET PROGRESS
        </button>
      </div>
    </div>
  );
};
export default Header;
