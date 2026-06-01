import React, { useState } from 'react';
import { useGameStore, calculateCharacterStats } from '../game/store';
import type { Character, CharacterClass } from '../game/types';

interface PartyPanelProps {
  onManageChar: (char: Character) => void;
}

export const PartyPanel: React.FC<PartyPanelProps> = ({ onManageChar }) => {
  const { party, hireCharacter, layoutMode } = useGameStore();
  const [isHiring, setIsHiring] = useState(false);
  const [hireName, setHireName] = useState('');
  const [hireClass, setHireClass] = useState<CharacterClass>('Warrior');

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    hireCharacter(hireName, hireClass);
    setHireName('');
    setIsHiring(false);
  };

  const getClassEmoji = (cls: CharacterClass) => {
    switch (cls) {
      case 'Warrior': return '🛡️';
      case 'Mage': return '🔮';
      case 'Rogue': return '🗡️';
    }
  };

  if (layoutMode === 'taskbar') {
    return (
      <div className="taskbar-section" style={{ gap: '10px' }}>
        {party.map((char) => {
          const stats = calculateCharacterStats(char);
          const xpPercent = Math.min(100, (char.xp / char.xpNeeded) * 100);
          return (
            <div 
              key={char.id} 
              className={`hero-card class-${char.class}`} 
              onClick={() => onManageChar(char)}
              style={{
                flexDirection: 'row', 
                gap: '8px', 
                padding: '4px 8px', 
                height: '52px',
                width: '125px',
                alignItems: 'center'
              }}
              title={`Clique para gerenciar ${char.name}. CP: ${stats.power}`}
            >
              <div 
                className="hero-avatar" 
                style={{ 
                  width: '26px', 
                  height: '26px', 
                  fontSize: '14px', 
                  margin: 0,
                  border: 'none',
                  color: `var(--class-${char.class.toLowerCase()})`
                }}
              >
                {getClassEmoji(char.class)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span className="hero-name" style={{ fontSize: '10px', textAlign: 'left' }}>
                  {char.name}
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--color-gold)' }}>
                  <span>Nv.{char.level}</span>
                  {char.skillPoints > 0 && <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>+1 SP</span>}
                </div>
                <div className="progress-track" style={{ height: '3px', border: 'none', marginTop: '2px' }}>
                  <div className="progress-fill xp" style={{ width: `${xpPercent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        {party.length < 3 && (
          <button 
            className="btn-secondary" 
            onClick={() => setIsHiring(true)}
            style={{ height: '40px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ➕ Contratar ({party.length}/3)
          </button>
        )}

        {isHiring && (
          <div className="modal-overlay" onClick={() => setIsHiring(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="rpg-font" style={{ color: 'var(--color-gold)' }}>Contratar Herói</h3>
              <form onSubmit={handleHireSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Nome do Herói</label>
                  <input 
                    type="text" 
                    value={hireName} 
                    onChange={e => setHireName(e.target.value)} 
                    placeholder="Ex: Arthas" 
                    maxLength={14}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--color-border)',
                      padding: '8px',
                      color: '#white',
                      borderRadius: '4px',
                      outline: 'none'
                    }}
                    required 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Classe</label>
                  <select 
                    value={hireClass} 
                    onChange={e => setHireClass(e.target.value as CharacterClass)}
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--color-border)',
                      padding: '8px',
                      color: 'var(--color-text)',
                      borderRadius: '4px',
                      outline: 'none'
                    }}
                  >
                    <option value="Warrior">Guerreiro (Foco: Defesa & Vida)</option>
                    <option value="Mage">Mago (Foco: Alto Ataque)</option>
                    <option value="Rogue">Ladino (Foco: Velocidade & Crit)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsHiring(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Recrutar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rpg-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="rpg-font" style={{ fontSize: '12px', color: 'var(--color-text)' }}>👥 Seu Grupo ({party.length}/3)</h3>
        {party.length < 3 && !isHiring && (
          <button className="btn-secondary" onClick={() => setIsHiring(true)}>
            ➕ Recrutar
          </button>
        )}
      </div>

      {isHiring ? (
        <form onSubmit={handleHireSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '2px solid var(--color-border)', padding: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={hireName} 
              onChange={e => setHireName(e.target.value)} 
              placeholder="Nome do herói..." 
              maxLength={12}
              style={{ flex: 1 }}
              required 
            />
            <select 
              value={hireClass} 
              onChange={e => setHireClass(e.target.value as CharacterClass)}
            >
              <option value="Warrior">🛡️ Guerreiro</option>
              <option value="Mage">🔮 Mago</option>
              <option value="Rogue">🗡️ Ladino</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsHiring(false)} style={{ padding: '4px 8px', fontSize: '11px' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }}>
              Confirmar
            </button>
          </div>
        </form>
      ) : party.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '12px', border: '2px dashed var(--color-border)' }}>
          Você não tem personagens no grupo. Clique em Recrutar acima para contratar seu primeiro herói!
        </div>
      ) : (
        <div className="hero-grid">
          {party.map((char) => {
            const stats = calculateCharacterStats(char);
            const xpPercent = Math.min(100, (char.xp / char.xpNeeded) * 100);
            return (
              <div 
                key={char.id} 
                className={`hero-card class-${char.class}`} 
                onClick={() => onManageChar(char)}
                title="Gerenciar Herói"
              >
                {char.skillPoints > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: 'var(--color-success)',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '9px',
                      padding: '2px 5px',
                      boxShadow: '0 0 8px rgba(0, 255, 100, 0.6)'
                    }}
                  >
                    +SP
                  </span>
                )}
                <div className="hero-avatar" style={{ color: `var(--class-${char.class.toLowerCase()})` }}>
                  {getClassEmoji(char.class)}
                </div>
                <span className="hero-name">{char.name}</span>
                <span className="hero-level">Nv.{char.level}</span>
                <div style={{ fontSize: '9px', color: 'var(--color-text-dim)', marginTop: '4px' }}>
                  ⭐ {stats.power.toLocaleString()} CP
                </div>
                <div className="progress-container" style={{ marginTop: '8px' }}>
                  <div className="progress-track" style={{ height: '6px' }}>
                    <div className="progress-fill xp" style={{ width: `${xpPercent}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
