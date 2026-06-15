import React from 'react';
import { useGameStore } from '../game/store';
import { CoinIcon, StoneIcon, PowerIcon } from '../game/icons';

export const Header: React.FC = () => {
  const gold = useGameStore(s => s.gold);
  const enchantStones = useGameStore(s => s.enchantStones);
  const globalCombatPower = useGameStore(s => s.globalCombatPower);
  const layoutMode = useGameStore(s => s.layoutMode);
  const resetGame = useGameStore(s => s.resetGame);
  const toggleLayoutMode = useGameStore(s => s.toggleLayoutMode);

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar todo o seu progresso? Isso limpará seus heróis, itens e ouro.')) {
      resetGame();
    }
  };

  return (
    <div className="rpg-top-bar">
      {/* Title */}
      <span className="rpg-font rpg-gold-text" style={{ fontWeight: 'bold', fontSize: '20px' }}>
        ⚔️ WEB IDLE HERO
      </span>

      {/* Account stats */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div className="currency-badge" title="Poder de Combate Global da Conta">
          <PowerIcon color="var(--color-gold-bright)" /> CP Global: <span>{globalCombatPower.toLocaleString()}</span>
        </div>
        <div className="currency-badge" title="Ouro acumulado" style={{ color: '#ffd700' }}>
          <CoinIcon /> Ouro: <span>{gold.toLocaleString()}</span>
        </div>
        <div className="stone-badge" title="Pedras de Encantamento">
          <StoneIcon color="#a5f3fc" /> Pedras: <span style={{ color: '#a5f3fc' }}>{enchantStones}</span>
        </div>
      </div>

      {/* Control panel buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={toggleLayoutMode}
          className="btn-secondary"
          title="Alternar Modo de Exibição"
          style={{ fontSize: '13px', color: 'var(--color-gold)', padding: '1px 8px' }}
        >
          {layoutMode === 'widget' ? '📺 COMPACTO' : '🖥️ COMPLETO'}
        </button>
        <button 
          onClick={handleReset} 
          className="btn-secondary" 
          title="Resetar todo o progresso"
          style={{ fontSize: '13px', color: 'var(--color-danger)', borderColor: '#c22929', padding: '1px 8px' }}
        >
          🔄 RESET
        </button>
      </div>
    </div>
  );
};
export default Header;
