import React, { useState } from 'react';
import { useGameStore } from '../game/store';

// Coordinates for the 10 stages on a viewBox of 100 x 100
// y: 90 is bottom (Stage 1), y: 8 is top (Stage 10)
const stageCoordinates = [
  { stage: 1, x: 50, y: 86 },
  { stage: 2, x: 28, y: 78 },
  { stage: 3, x: 42, y: 70 },
  { stage: 4, x: 72, y: 62 },
  { stage: 5, x: 55, y: 53 },
  { stage: 6, x: 26, y: 45 },
  { stage: 7, x: 48, y: 36 },
  { stage: 8, x: 74, y: 27 },
  { stage: 9, x: 56, y: 18 },
  { stage: 10, x: 50, y: 8 } // Boss stage
];

// SVG path connecting all stages
const linePathD = stageCoordinates.map((node, i) => `${i === 0 ? 'M' : 'L'} ${node.x.toString()} ${node.y.toString()}`).join(' ');

// Landscape decorations per Act to enrich the visuals
const actDecorations: Record<number, { emoji: string; x: number; y: number }[]> = {
  1: [
    { emoji: '🌲', x: 12, y: 82 },
    { emoji: '🌲', x: 80, y: 75 },
    { emoji: '🌳', x: 18, y: 52 },
    { emoji: '🌲', x: 72, y: 44 },
    { emoji: '🏰', x: 84, y: 15 },
    { emoji: '🛖', x: 14, y: 22 }
  ],
  2: [
    { emoji: '🌵', x: 14, y: 72 },
    { emoji: '🐪', x: 78, y: 80 },
    { emoji: '🌵', x: 76, y: 48 },
    { emoji: '⛫', x: 16, y: 24 },
    { emoji: '🌴', x: 84, y: 16 },
    { emoji: '☀️', x: 86, y: 4 }
  ],
  3: [
    { emoji: '🔥', x: 12, y: 76 },
    { emoji: '💀', x: 76, y: 64 },
    { emoji: '🔥', x: 84, y: 38 },
    { emoji: '🌋', x: 14, y: 18 },
    { emoji: '👹', x: 82, y: 14 },
    { emoji: '⛓️', x: 18, y: 48 }
  ]
};

export const PortalPanel: React.FC = () => {
  const progression = useGameStore(s => s.progression);
  const party = useGameStore(s => s.party);
  const [selectedAct, setSelectedAct] = useState<number>(progression.act);

  // Maximum difficulty unlocked is the current progression difficulty
  const maxDifficulty = progression.difficulty;
  const currentDiff = progression.difficulty;

  const difficultyNames = [
    'Normal', 'Pesadelo', 'Inferno', 'Tormento', 'Abismo', 
    'Purgatório', 'Eternidade', 'Caos', 'Vazio', 'Apocalipse', 
    'Divino', 'Demiurgo', 'Estelar', 'Ancestral', 'Singularidade', 
    'Infinito'
  ];

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDiff = parseInt(e.target.value, 10);
    if (newDiff <= maxDifficulty) {
      // Direct state update on useGameStore
      useGameStore.setState((state) => {
        // Find if we are moving back to a cleared difficulty, we set act/stage to 1,
        // or if we go back to our highest difficulty, restore current highest act/stage.
        const targetAct = newDiff === currentDiff ? progression.act : 1;
        const targetStage = newDiff === currentDiff ? progression.stage : 1;

        return {
          progression: {
            ...state.progression,
            difficulty: newDiff,
            act: targetAct,
            stage: targetStage,
            killsInCurrentStage: 0
          }
        };
      });
      // Synchronize tab view act target
      setSelectedAct(newDiff === currentDiff ? progression.act : 1);
    }
  };

  const selectAct = (actNum: number) => {
    // Prevent selecting locked acts in the current difficulty
    if (actNum <= progression.act || currentDiff < maxDifficulty) {
      setSelectedAct(actNum);
      
      // Allow teleporting / farming on unlocked acts!
      // If we clicked a previous act, let them set their active progression stage to Act X Stage 1
      useGameStore.setState((state) => {
        // If it's the current act, reset stage to current stage, otherwise set to stage 1 of previous act
        const targetStage = actNum === progression.act ? progression.stage : 1;
        return {
          progression: {
            ...state.progression,
            act: actNum,
            stage: targetStage,
            killsInCurrentStage: 0
          }
        };
      });
    }
  };

  const selectStage = (stageNum: number) => {
    // Allow teleporting / farming on unlocked stages in this act!
    const isUnlocked = 
      selectedAct < progression.act || 
      (selectedAct === progression.act && stageNum <= progression.stage);

    if (isUnlocked && party.length > 0) {
      useGameStore.setState((state) => ({
        progression: {
          ...state.progression,
          stage: stageNum,
          killsInCurrentStage: 0
        }
      }));
      useGameStore.getState().addLog(`🔮 [Teleporte] Grupo viajou para o Estágio [Ato ${selectedAct.toString()} - Fase ${stageNum.toString()}]!`);
    }
  };

  return (
    <div className="rpg-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: '300px' }}>
      
      {/* Header ribbon */}
      <div className="rpg-title-ribbon" style={{ margin: '0 -12px 6px -12px' }}>
        <h3>🔮 Portal de Viagem</h3>
      </div>

      {/* Difficulty Dropdown Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-dim)', fontWeight: 'bold' }}>Dificuldade:</span>
        <select 
          value={progression.difficulty} 
          onChange={handleDifficultyChange}
          style={{ flex: 1, padding: '4px 6px !important', height: '28px' }}
          title="Selecionar Dificuldade"
        >
          {Array.from({ length: maxDifficulty }).map((_, i) => (
            <option key={i} value={i + 1}>
              💀 {difficultyNames[i] || `Dificuldade ${(i + 1).toString()}`}
            </option>
          ))}
        </select>
      </div>

      {/* Act Selection Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
        {[1, 2, 3].map((actNum) => {
          // Unlocked if previous act, or current act
          const isActUnlocked = actNum <= progression.act;
          const isActive = selectedAct === actNum;

          return (
            <button
              key={actNum}
              className={`btn-secondary ${isActive ? 'active' : ''}`}
              onClick={() => { if (isActUnlocked) selectAct(actNum); }}
              disabled={!isActUnlocked}
              style={{
                flex: 1,
                padding: '4px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                opacity: isActUnlocked ? 1 : 0.4
              }}
            >
              {isActUnlocked ? '' : '🔒 '}Ato {actNum}
            </button>
          );
        })}
      </div>

      {/* Map Canvas Visual Wrapper */}
      <div className={`rpg-map-canvas map-act-${selectedAct.toString()}`}>
        
        {/* Landscape Decorations */}
        {actDecorations[selectedAct as 1 | 2 | 3].map((dec, idx) => (
          <span
            key={idx}
            style={{
              position: 'absolute',
              left: `${dec.x.toString()}%`,
              top: `${dec.y.toString()}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: '18px',
              opacity: 0.4,
              filter: 'saturate(0.8) blur(0.3px)',
              pointerEvents: 'none',
              textShadow: '0 2px 6px rgba(0,0,0,0.9)'
            }}
          >
            {dec.emoji}
          </span>
        ))}

        {/* Winding Path Dotted SVG Line */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d={linePathD}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="2.5"
            strokeDasharray="4,4"
          />
        </svg>

        {/* Stage Nodes */}
        {stageCoordinates.map((node) => {
          const isCurrent = progression.act === selectedAct && progression.stage === node.stage;
          const isPassed = 
            selectedAct < progression.act || 
            (selectedAct === progression.act && node.stage < progression.stage);
          
          const isLocked = !isCurrent && !isPassed;
          const isBoss = node.stage === 10;

          // Determine alignment of labels to avoid overlap
          const labelPosClass = node.x > 50 ? 'pos-left' : 'pos-right';

          let nodeClass = 'map-node';
          if (isCurrent) nodeClass += ' active';
          else if (isPassed) nodeClass += ' passed';
          else if (isLocked) nodeClass += ' locked';
          if (isBoss) nodeClass += ' boss';

          return (
            <div
              key={node.stage}
              className={nodeClass}
              onClick={() => { if (!isLocked) selectStage(node.stage); }}
              style={{
                left: `${node.x.toString()}%`,
                top: `${node.y.toString()}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title={
                isLocked ? 'Estágio Bloqueado' : 
                isCurrent ? 'Seu Grupo está lutando aqui' : 
                'Clique para teleportar e farmar neste estágio'
              }
            >
              {/* Flag marker above current active node */}
              {isCurrent && <span className="node-flag">🚩</span>}

              {/* Central Node Dot */}
              <div className="node-circle">
                {isBoss ? '💀' : isLocked ? '🔒' : node.stage}
              </div>

              {/* Level indicator tag label (like [2-9] in print) */}
              <span className={`node-label ${labelPosClass}`}>
                [{selectedAct}-{node.stage}]
              </span>
            </div>
          );
        })}

        {/* Small Landscape Badge */}
        <div 
          className="rpg-font"
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid var(--color-border)',
            padding: '2px 6px',
            fontSize: '8px',
            color: 'var(--color-gold-bright)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {selectedAct === 1 ? '🌲 Bosque' : selectedAct === 2 ? '🏜️ Deserto' : '🌋 Abismo'}
        </div>

      </div>

      <div style={{ fontSize: '9px', color: 'var(--color-text-dark)', textAlign: 'center', marginTop: '2px' }}>
        💡 Clique em qualquer fase liberada no mapa para teleportar seu grupo e farmar ouro/XP nela.
      </div>

    </div>
  );
};
