import React from 'react';
import { useGameStore } from '../game/store';

export const StageProgress: React.FC = () => {
  const progression = useGameStore(s => s.progression);
  const layoutMode = useGameStore(s => s.layoutMode);

  const difficultyNames = ['Normal', 'Pesadelo', 'Inferno', 'Tormento', 'Abismo'];
  const diffName = difficultyNames[progression.difficulty - 1] || `Diff ${progression.difficulty}`;

  const killPercentage = Math.min(100, (progression.killsInCurrentStage / progression.killsRequiredForNextStage) * 100);

  if (layoutMode === 'taskbar') {
    return (
      <div className="taskbar-section" style={{ flex: 1, gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '100px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-gold)' }}>
            {diffName}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>
            Ato {progression.act} - Fase {progression.stage}/10
          </span>
        </div>
        
        <div className="progress-container" style={{ maxWidth: '300px' }}>
          <div className="progress-header">
            <span>Progresso da Fase</span>
            <span>{Math.floor(progression.killsInCurrentStage)} / {progression.killsRequiredForNextStage} Kills</span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill kills" 
              style={{ width: `${killPercentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rpg-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-gold-bright)', fontWeight: 'bold' }}>
            ⚔️ Dificuldade: {diffName}
          </span>
          <h3 className="rpg-font" style={{ fontSize: '13px', marginTop: '1px', color: 'white' }}>
            Ato {progression.act} - Fase {progression.stage} de 10
          </h3>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--color-text-dim)' }}>
          Kills: <strong style={{ color: 'var(--color-gold-bright)' }}>{Math.floor(progression.killsInCurrentStage)}/{progression.killsRequiredForNextStage}</strong>
        </div>
      </div>

      <div className="progress-container">
        <div className="progress-track" style={{ height: '12px' }}>
          <div 
            className="progress-fill kills" 
            style={{ width: `${killPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
