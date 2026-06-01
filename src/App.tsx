import React, { useEffect, useState } from 'react';
import { useGameStore } from './game/store';
import { startGameLoop, stopGameLoop } from './game/engine';
import { Header } from './components/Header';
import { StageProgress } from './components/StageProgress';
import { PartyPanel } from './components/PartyPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { CharacterModal } from './components/CharacterModal';
import { PortalPanel } from './components/PortalPanel';

export const App: React.FC = () => {
  const { layoutMode, combatLog, toggleLayoutMode } = useGameStore();
  const [activeManageCharId, setActiveManageCharId] = useState<string | null>(null);
  const [widgetTab, setWidgetTab] = useState<'party' | 'inventory' | 'portal'>('party');

  // Start background game loop on component mount, and clean up on unmount
  useEffect(() => {
    startGameLoop();
    return () => {
      stopGameLoop();
    };
  }, []);

  const latestLog = combatLog[0] || 'Iniciando o combate...';

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: layoutMode === 'taskbar' ? 'auto' : '100vh',
        background: layoutMode === 'taskbar' ? 'transparent' : 'rgba(0, 0, 0, 0.95)',
        padding: layoutMode === 'taskbar' ? 0 : '20px'
      }}
    >
      <div className={`app-wrapper mode-${layoutMode}`}>
        
        {/* ========================================================
            TASKBAR MODE RENDERING (Horizontal Strip)
            ======================================================== */}
        {layoutMode === 'taskbar' && (
          <>
            {/* Title, CP, Gold, Stones */}
            <Header />

            {/* Difficulty, Act, Stage and Kills Progress Bar */}
            <StageProgress />

            {/* Small Avatars list of active heroes */}
            <PartyPanel onManageChar={(char) => setActiveManageCharId(char.id)} />

            {/* Scrolling log ticker (only shows the single latest entry) */}
            <div 
              className="taskbar-section" 
              style={{ 
                flex: 2, 
                borderRight: 'none', 
                fontSize: '11px', 
                color: 'var(--color-text-dim)', 
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.3)',
                padding: '4px 10px',
                borderRadius: '4px',
                height: '42px',
                maxWidth: '300px'
              }}
              title={latestLog}
            >
              <span style={{ marginRight: '6px' }}>👁️‍🗨️</span>
              <span 
                style={{ 
                  animation: 'fadeIn 0.2s ease-out',
                  display: 'inline-block' 
                }}
              >
                {latestLog}
              </span>
            </div>

            {/* Toggles bar back to Widget */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button 
                onClick={toggleLayoutMode} 
                className="layout-toggle-btn"
                title="Maximizar para janela de Widget"
              >
                📱
              </button>
            </div>
          </>
        )}

        {/* ========================================================
            WIDGET MODE RENDERING (Compact Floating Dashboard)
            ======================================================== */}
        {layoutMode === 'widget' && (
          <>
            {/* Header: Gold, CP, stones */}
            <Header />

            {/* Stage Progress: Act/Stage numbers and kills bar */}
            <div style={{ padding: '16px 16px 0 16px' }}>
              <StageProgress />
            </div>

            {/* Main Tabs body */}
            <main className="app-main">
              {widgetTab === 'party' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  {/* Party Cards Grid */}
                  <PartyPanel onManageChar={(char) => setActiveManageCharId(char.id)} />
                  
                  {/* Miniature logs section directly in screen */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                      ⚔️ Registro de Batalha (Logs)
                    </span>
                    <div className="combat-log-container" style={{ minHeight: '140px', flex: 1 }}>
                      {combatLog.slice(0, 15).map((log, index) => (
                        <div key={index} className="combat-log-item" style={{ color: index === 0 ? 'white' : 'var(--color-text-dim)' }}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {widgetTab === 'inventory' && (
                <InventoryPanel />
              )}

              {widgetTab === 'portal' && (
                <PortalPanel />
              )}
            </main>

            {/* Tabs Selector Footer */}
            <div className="app-tabs">
              <button 
                className={`tab-btn ${widgetTab === 'party' ? 'active' : ''}`}
                onClick={() => setWidgetTab('party')}
              >
                <span>👥</span>
                <span>Grupo</span>
              </button>
              <button 
                className={`tab-btn ${widgetTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setWidgetTab('inventory')}
              >
                <span>🎒</span>
                <span>Baú / Forja</span>
              </button>
              <button 
                className={`tab-btn ${widgetTab === 'portal' ? 'active' : ''}`}
                onClick={() => setWidgetTab('portal')}
              >
                <span>🗺️</span>
                <span>Portal</span>
              </button>
            </div>
          </>
        )}

        {/* Character Detail/Management Modal Overlay */}
        {activeManageCharId && (
          <CharacterModal 
            charId={activeManageCharId} 
            onClose={() => setActiveManageCharId(null)} 
          />
        )}

      </div>
    </div>
  );
};

export default App;
