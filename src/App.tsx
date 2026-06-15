import React, { useEffect, useState } from 'react';
import { useGameStore, calculateCharacterStats, CLASS_SKILLS } from './game/store';
import { startGameLoop, stopGameLoop } from './game/engine';
import { Header } from './components/Header';
import { PortalPanel } from './components/PortalPanel';
import { CubePanel } from './components/CubePanel';
import { StageProgress } from './components/StageProgress';
import { PartyPanel } from './components/PartyPanel';
import { CharacterModal } from './components/CharacterModal';
import type { Item, CharacterClass } from './game/types';
import { ItemIcon, RuneIcon, ClassIcon, CoinIcon, StoneIcon, PowerIcon } from './game/icons';

export const App: React.FC = () => {
  // Seletores granulares: cada componente assina só o que usa, evitando o
  // re-render global a cada tick. Ações são refs estáveis (não disparam render).
  const party = useGameStore(s => s.party);
  const inventory = useGameStore(s => s.inventory);
  const runeStash = useGameStore(s => s.runeStash);
  const combatLog = useGameStore(s => s.combatLog);
  const gold = useGameStore(s => s.gold);
  const enchantStones = useGameStore(s => s.enchantStones);
  const layoutMode = useGameStore(s => s.layoutMode);
  const globalCombatPower = useGameStore(s => s.globalCombatPower);
  const craftItem = useGameStore(s => s.craftItem);
  const sellItem = useGameStore(s => s.sellItem);
  const dismantleItem = useGameStore(s => s.dismantleItem);
  const enchantItem = useGameStore(s => s.enchantItem);
  const hireCharacter = useGameStore(s => s.hireCharacter);
  const equipItem = useGameStore(s => s.equipItem);
  const unequipItem = useGameStore(s => s.unequipItem);
  const socketRune = useGameStore(s => s.socketRune);
  const unsocketRune = useGameStore(s => s.unsocketRune);
  const allocateSkillPoint = useGameStore(s => s.allocateSkillPoint);
  const addToCube = useGameStore(s => s.addToCube);
  const toggleLayoutMode = useGameStore(s => s.toggleLayoutMode);

  const [activeRightTab, setActiveRightTab] = useState<'portal' | 'cube'>('portal');
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [selectedStashItemId, setSelectedStashItemId] = useState<string | null>(null);
  const [activeGearSlotSelect, setActiveGearSlotSelect] = useState<'weapon' | 'armor' | 'ring' | null>(null);
  const [activeRuneSlotSelect, setActiveRuneSlotSelect] = useState<number | null>(null);
  const [managedCharId, setManagedCharId] = useState<string | null>(null);
  
  // Hiring Form Local State
  const [isHiring, setIsHiring] = useState(false);
  const [hireName, setHireName] = useState('');
  const [hireClass, setHireClass] = useState<CharacterClass>('Warrior');

  // Start background game loop
  useEffect(() => {
    startGameLoop();
    return () => {
      stopGameLoop();
    };
  }, []);

  // Find active selected hero (falls back to first hero in party if selected is invalid)
  const activeHero = party.find(c => c.id === selectedHeroId) || party[0] || null;
  const activeHeroStats = activeHero ? calculateCharacterStats(activeHero) : null;

  // Stash grid calculation: fixed 50 slots
  const totalStashSlots = 50;
  const stashSlots = Array(totalStashSlots).fill(null);
  inventory.forEach((item, index) => {
    if (index < totalStashSlots) {
      stashSlots[index] = item;
    }
  });

  const selectedStashItem = inventory.find(i => i.id === selectedStashItemId) || null;

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    hireCharacter(hireName, hireClass);
    setHireName('');
    setIsHiring(false);
  };

  const handleStashSlotClick = (item: Item | null) => {
    if (!item) {
      setSelectedStashItemId(null);
      return;
    }

    if (activeRightTab === 'cube') {
      // If cube synthesis tab is open, clicking stash item places it in the cube
      addToCube(item.id);
      setSelectedStashItemId(null);
    } else {
      // Else, select it to view details and sell/dismantle
      setSelectedStashItemId(item.id);
    }
  };

  const getRarityColor = (rarity: string) => {
    return `var(--rarity-${rarity}-text)`;
  };

  // Enchantment costs
  const getEnchantCosts = (item: Item) => {
    const stoneCost = 1 + Math.floor(item.refineLevel / 3);
    const goldCost = Math.round((item.refineLevel + 1) * 80);
    const successRate = Math.max(0.35, 1.0 - Math.max(0, item.refineLevel - 3) * 0.15);
    return { stoneCost, goldCost, successRate: Math.round(successRate * 100) };
  };

  if (layoutMode === 'taskbar') {
    return (
      <div className="taskbar-stage">
      <div className="taskbar-layout">
        {/* Alternador de Layout */}
        <div className="taskbar-section" style={{ borderRight: '1px solid var(--color-border)', paddingRight: '12px' }}>
          <button 
            className="btn-secondary" 
            onClick={toggleLayoutMode} 
            title="Mudar para Modo Completo"
            style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--color-gold)' }}
          >
            🖥️ COMPLETO
          </button>
        </div>

        {/* Progresso de Fase */}
        <StageProgress />

        {/* Controle da Party */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <PartyPanel onManageChar={(char) => setManagedCharId(char.id)} />
        </div>

        {/* Status Globais Rápidos */}
        <div className="taskbar-section" style={{ gap: '12px', fontSize: '12px', borderLeft: '1px solid var(--color-border)', paddingLeft: '12px' }}>
          <span title="Ouro" style={{ color: '#ffd700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CoinIcon /> {gold.toLocaleString()}</span>
          <span title="Pedras" style={{ color: '#a5f3fc', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><StoneIcon /> {enchantStones}</span>
          <span title="Poder Global" style={{ color: 'var(--color-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><PowerIcon /> {globalCombatPower.toLocaleString()}</span>
        </div>

        {/* Modal de gerenciamento do herói */}
        {managedCharId && (
          <CharacterModal charId={managedCharId} onClose={() => setManagedCharId(null)} />
        )}
      </div>
      </div>
    );
  }

  return (
    <div className="rpg-desktop-layout">
      {/* Top Banner Status Bar */}
      <Header />

      {/* Primary 3-Panel Space */}
      <div className="rpg-panels-container">
        
        {/* ========================================================
            LEFT COLUMN: STASH (Inventory Grid & Actions)
            ======================================================== */}
        <div className="rpg-column panel-border">
          <div className="column-header">STASH</div>
          
          <div className="column-body" style={{ gap: '6px' }}>
            {/* Stash tabs headers */}
            <div className="stash-tabs">
              <button className="stash-tab-btn active">Baú 1</button>
              <button className="stash-tab-btn" disabled>Baú 2</button>
              <button className="stash-tab-btn" disabled>+</button>
            </div>

            {/* 10-Column Grid slots */}
            <div className="stash-grid">
              {stashSlots.map((item, idx) => (
                <div
                  key={idx}
                  className={`stash-slot ${item ? `rarity-${item.rarity}` : ''} ${selectedStashItemId === item?.id ? 'active' : ''}`}
                  onClick={() => handleStashSlotClick(item)}
                >
                  {item ? (
                    <>
                      <ItemIcon item={item} className="slot-icon" size={22} />
                      <span className="slot-refine">+{item.refineLevel}</span>
                    </>
                  ) : (
                    <span style={{ opacity: 0.05, fontSize: '18px' }}>·</span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Crafting Box */}
            <div className="rpg-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#131211', padding: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="rpg-font rpg-gold-text" style={{ fontSize: '16px' }}>Forja Arcana</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>Custo: 150g e 3 Pedras.</span>
              </div>
              <button
                className="btn-rpg"
                onClick={craftItem}
                disabled={gold < 150 || enchantStones < 3 || party.length === 0}
                style={{ fontSize: '14px', padding: '2px 8px' }}
              >
                🔨 Forjar
              </button>
            </div>

            {/* Item Action / Details Box */}
            {selectedStashItem ? (
              <div className="rpg-panel" style={{ backgroundColor: '#131211', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ color: getRarityColor(selectedStashItem.rarity), fontSize: '17px' }}>
                    {selectedStashItem.name} +{selectedStashItem.refineLevel}
                  </strong>
                  <button className="rpg-close-x" onClick={() => setSelectedStashItemId(null)}>X</button>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', color: 'var(--color-text-dim)', fontSize: '14px' }}>
                  {selectedStashItem.attack > 0 && <span>⚔️Atk: <strong style={{ color: 'white' }}>{Math.round(selectedStashItem.attack * (1 + selectedStashItem.refineLevel * 0.15))}</strong></span>}
                  {selectedStashItem.defense > 0 && <span>🛡️Def: <strong style={{ color: 'white' }}>{Math.round(selectedStashItem.defense * (1 + selectedStashItem.refineLevel * 0.15))}</strong></span>}
                  {selectedStashItem.hp > 0 && <span>❤️HP: <strong style={{ color: 'white' }}>{Math.round(selectedStashItem.hp * (1 + selectedStashItem.refineLevel * 0.15))}</strong></span>}
                </div>

                {(() => {
                  const { stoneCost, goldCost, successRate } = getEnchantCosts(selectedStashItem);
                  return (
                    <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', padding: '2px 0' }}>
                      Melhorar: 🪙{goldCost} + 💎{stoneCost} Pedras | Chance: {successRate}%
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                  <button
                    className="btn-rpg"
                    onClick={() => enchantItem(selectedStashItem.id)}
                    disabled={gold < getEnchantCosts(selectedStashItem).goldCost || enchantStones < getEnchantCosts(selectedStashItem).stoneCost}
                    style={{ flex: 2, fontSize: '14px', padding: '2px 0' }}
                  >
                    🔮 Melhorar
                  </button>
                  <button
                    className="btn-rpg"
                    onClick={() => { sellItem(selectedStashItem.id); setSelectedStashItemId(null); }}
                    style={{ flex: 1, fontSize: '14px', padding: '2px 0' }}
                  >
                    🪙 Vender
                  </button>
                  <button
                    className="btn-rpg"
                    onClick={() => { dismantleItem(selectedStashItem.id); setSelectedStashItemId(null); }}
                    style={{ flex: 1, fontSize: '14px', padding: '2px 0', color: 'var(--color-danger)', borderColor: '#7f1d1d' }}
                  >
                    🔨 Desman.
                  </button>
                </div>
              </div>
            ) : (
              <div className="rpg-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-dim)', fontSize: '15px', backgroundColor: '#0d0c0b' }}>
                <span>Clique em um item do Baú para ver detalhes ou transmutar.</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            MIDDLE COLUMN: HERO (Equipment, Character Stats & Skills)
            ======================================================== */}
        <div className="rpg-column panel-border">
          <div className="column-header">HERO</div>
          
          <div className="column-body">
            {/* Active Group Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
              <span className="rpg-font" style={{ fontSize: '16px', color: 'var(--color-text-dim)' }}>Grupo ({party.length}/3)</span>
              {party.length < 3 && !isHiring && (
                <button className="btn-rpg" onClick={() => setIsHiring(true)} style={{ padding: '1px 8px', fontSize: '14px' }}>
                  ➕ Recrutar
                </button>
              )}
            </div>

            {/* Recrutar form */}
            {isHiring && (
              <form onSubmit={handleHireSubmit} className="rpg-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={hireName}
                    onChange={e => setHireName(e.target.value)}
                    placeholder="Nome..."
                    maxLength={10}
                    style={{ flex: 1 }}
                    required
                  />
                  <select value={hireClass} onChange={e => setHireClass(e.target.value as CharacterClass)} title="Escolher classe do herói">
                    <option value="Warrior">🛡️ Guerreiro</option>
                    <option value="Mage">🔮 Mago</option>
                    <option value="Rogue">🗡️ Ladino</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-rpg" onClick={() => setIsHiring(false)} style={{ fontSize: '13px', padding: '1px 6px' }}>Mudar</button>
                  <button type="submit" className="btn-rpg" style={{ fontSize: '13px', padding: '1px 6px', color: 'var(--color-gold)' }}>Contratar</button>
                </div>
              </form>
            )}

            {/* Party heroes icons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {party.map(char => (
                <button
                  key={char.id}
                  className={`btn-secondary ${selectedHeroId === char.id ? 'active' : ''}`}
                  onClick={() => { setSelectedHeroId(char.id); setActiveGearSlotSelect(null); setActiveRuneSlotSelect(null); }}
                  style={{ flex: 1, padding: '3px', fontSize: '15px', textTransform: 'none' }}
                >
                  <ClassIcon cls={char.class} size={14} /> {char.name} (Nv.{char.level})
                </button>
              ))}
              {party.length === 0 && (
                <div style={{ textAlign: 'center', width: '100%', padding: '12px', fontSize: '14px', color: 'var(--color-text-dim)', border: '1px dashed var(--color-border)' }}>
                  Nenhum herói recrutado.
                </div>
              )}
            </div>

            {activeHero && activeHeroStats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                
                {/* Hero status bar (level, XP) */}
                <div className="progress-container">
                  <div className="progress-header" style={{ fontSize: '13px' }}>
                    <span>XP herói (Nv.{activeHero.level})</span>
                    <span>{activeHero.xp} / {activeHero.xpNeeded}</span>
                  </div>
                  <div className="rpg-bar-track">
                    <div className="rpg-bar-fill xp" style={{ width: `${Math.min(100, (activeHero.xp / activeHero.xpNeeded) * 100)}%` }} />
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="rpg-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '14px', padding: '6px' }}>
                  <div>⭐ Poder: <strong className="rpg-gold-text">{activeHeroStats.power}</strong></div>
                  <div>⚔️ Ataque: <strong>{activeHeroStats.attack}</strong></div>
                  <div>🛡️ Defesa: <strong>{activeHeroStats.defense}</strong></div>
                  <div>❤️ HP: <strong>{activeHeroStats.hp}</strong></div>
                </div>

                {/* Equipment Paper-Doll */}
                <div className="hero-doll-container">
                  
                  {/* Weapon socket */}
                  <div className="hero-doll-slot">
                    <span>Arma</span>
                    <div
                      className={`doll-slot-box ${activeHero.equipment.weapon ? `rarity-${activeHero.equipment.weapon.rarity}` : ''}`}
                      onClick={() => { setActiveGearSlotSelect(activeGearSlotSelect === 'weapon' ? null : 'weapon'); setActiveRuneSlotSelect(null); }}
                    >
                      {activeHero.equipment.weapon ? (
                        <>
                          <ItemIcon item={activeHero.equipment.weapon} className="slot-icon" size={26} />
                          <span className="slot-refine">+{activeHero.equipment.weapon.refineLevel}</span>
                        </>
                      ) : '➕'}
                    </div>
                    {activeHero.equipment.weapon && (
                      <button className="btn-danger" onClick={() => unequipItem(activeHero.id, 'weapon')} style={{ fontSize: '12px', padding: '1px 3px' }}>Remover</button>
                    )}
                  </div>

                  {/* Armor socket */}
                  <div className="hero-doll-slot">
                    <span>Armadura</span>
                    <div
                      className={`doll-slot-box ${activeHero.equipment.armor ? `rarity-${activeHero.equipment.armor.rarity}` : ''}`}
                      onClick={() => { setActiveGearSlotSelect(activeGearSlotSelect === 'armor' ? null : 'armor'); setActiveRuneSlotSelect(null); }}
                    >
                      {activeHero.equipment.armor ? (
                        <>
                          <ItemIcon item={activeHero.equipment.armor} className="slot-icon" size={26} />
                          <span className="slot-refine">+{activeHero.equipment.armor.refineLevel}</span>
                        </>
                      ) : '➕'}
                    </div>
                    {activeHero.equipment.armor && (
                      <button className="btn-danger" onClick={() => unequipItem(activeHero.id, 'armor')} style={{ fontSize: '12px', padding: '1px 3px' }}>Remover</button>
                    )}
                  </div>

                  {/* Ring socket */}
                  <div className="hero-doll-slot">
                    <span>Anel</span>
                    <div
                      className={`doll-slot-box ${activeHero.equipment.ring ? `rarity-${activeHero.equipment.ring.rarity}` : ''}`}
                      onClick={() => { setActiveGearSlotSelect(activeGearSlotSelect === 'ring' ? null : 'ring'); setActiveRuneSlotSelect(null); }}
                    >
                      {activeHero.equipment.ring ? (
                        <>
                          <ItemIcon item={activeHero.equipment.ring} className="slot-icon" size={26} />
                          <span className="slot-refine">+{activeHero.equipment.ring.refineLevel}</span>
                        </>
                      ) : '➕'}
                    </div>
                    {activeHero.equipment.ring && (
                      <button className="btn-danger" onClick={() => unequipItem(activeHero.id, 'ring')} style={{ fontSize: '12px', padding: '1px 3px' }}>Remover</button>
                    )}
                  </div>

                </div>

                {/* Sublist selection menu for Gear sockets */}
                {activeGearSlotSelect && (
                  <div className="rpg-panel" style={{ padding: '6px', backgroundColor: '#141312', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className="rpg-gold-text" style={{ fontSize: '14px' }}>Selecionar {activeGearSlotSelect === 'weapon' ? 'Arma' : activeGearSlotSelect === 'armor' ? 'Armadura' : 'Anel'}</span>
                      <button className="rpg-close-x" onClick={() => setActiveGearSlotSelect(null)}>X</button>
                    </div>
                    <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {inventory.filter(i => i.type === activeGearSlotSelect).length === 0 ? (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', textAlign: 'center', padding: '4px' }}>Nenhum item compatível no baú.</div>
                      ) : (
                        inventory
                          .filter(i => i.type === activeGearSlotSelect)
                          .map(item => (
                            <div
                              key={item.id}
                              className="equip-row"
                              onClick={() => { equipItem(activeHero.id, item.id); setActiveGearSlotSelect(null); }}
                            >
                              <span style={{ color: getRarityColor(item.rarity) }}>{item.name} +{item.refineLevel}</span>
                              <span style={{ color: activeHero.level >= item.levelRequired ? 'var(--color-success)' : 'var(--color-danger)' }}>Req: Nv.{item.levelRequired}</span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}

                {/* Diamond Rune Sockets (counter-rotated for diamond geometry) */}
                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-around', padding: '6px 0', border: '1px solid var(--color-border)', backgroundColor: '#131211' }}>
                  {activeHero.runes.map((rune, rIdx) => (
                    <div key={rIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        className="item-slot"
                        onClick={() => { setActiveRuneSlotSelect(activeRuneSlotSelect === rIdx ? null : rIdx); setActiveGearSlotSelect(null); }}
                        style={{
                          width: '32px',
                          height: '32px',
                          transform: 'rotate(45deg)',
                          borderColor: rune ? 'var(--color-gold)' : 'var(--color-border)',
                          borderStyle: rune ? 'solid' : 'dashed',
                          margin: '4px 0'
                        }}
                      >
                        {rune ? (
                          <div style={{ transform: 'rotate(-45deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }} title={rune.name}>
                            <RuneIcon rune={rune} size={16} />
                          </div>
                        ) : (
                          <span style={{ transform: 'rotate(-45deg)', fontSize: '11px', color: 'var(--color-text-dim)' }}>+</span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Runa {rIdx + 1}</span>
                      {rune && (
                        <button className="btn-danger" onClick={() => unsocketRune(activeHero.id, rIdx)} style={{ fontSize: '10px', padding: '0 2px', marginTop: '2px' }}>Soltar</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Sublist selection menu for Rune sockets */}
                {activeRuneSlotSelect !== null && (
                  <div className="rpg-panel" style={{ padding: '6px', backgroundColor: '#141312', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className="rpg-gold-text" style={{ fontSize: '14px' }}>Encaixar Runa no Slot {activeRuneSlotSelect + 1}</span>
                      <button className="rpg-close-x" onClick={() => setActiveRuneSlotSelect(null)}>X</button>
                    </div>
                    <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {runeStash.length === 0 ? (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', textAlign: 'center', padding: '4px' }}>Nenhuma runa livre no baú.</div>
                      ) : (
                        runeStash.map(rune => (
                          <div
                            key={rune.id}
                            className="equip-row"
                            onClick={() => { socketRune(activeHero.id, rune.id, activeRuneSlotSelect); setActiveRuneSlotSelect(null); }}
                          >
                            <span style={{ color: 'var(--class-mage)' }}>{rune.name}</span>
                            <span style={{ fontSize: '12px' }}>
                              {rune.statType === 'attack' ? `Atk +${rune.value}` : rune.statType === 'defense' ? `Def +${rune.value}` : `HP +${rune.value}`}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Skill point allocation */}
                <div className="rpg-panel" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span className="rpg-gold-text">Pontos de Habilidade: {activeHero.skillPoints}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {CLASS_SKILLS[activeHero.class].map(skill => {
                      const curLvl = activeHero.skills[skill.id] || 0;
                      const isMax = curLvl >= skill.maxLevel;
                      return (
                        <div key={skill.id} style={{ flex: 1, backgroundColor: '#090807', border: '1px solid var(--color-border)', padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '13px', color: 'white', fontWeight: 'bold' }}>{skill.icon} {skill.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', height: '28px', overflow: 'hidden' }}>{skill.description}</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--color-gold)' }}>Nv.{curLvl}/{skill.maxLevel}</span>
                            <button
                              className="btn-rpg"
                              onClick={() => allocateSkillPoint(activeHero.id, skill.id)}
                              disabled={activeHero.skillPoints <= 0 || isMax}
                              style={{ padding: '0 6px', fontSize: '11px' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Battle Logs box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="rpg-font rpg-gold-text" style={{ fontSize: '15px' }}>⚔️ Registro de Batalha (Logs)</span>
              <div className="rpg-log-box">
                {combatLog.slice(0, 15).map((log, index) => (
                  <div key={index} className="rpg-log-item">
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: PORTAL & CUBE (Toggleable visual tabs)
            ======================================================== */}
        <div className="rpg-column panel-border">
          {/* Tabs header selector */}
          <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)' }}>
            <button
              className={`tab-btn ${activeRightTab === 'portal' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('portal')}
              style={{ flex: 1, padding: '4px', fontSize: '20px', textTransform: 'uppercase' }}
            >
              🗺️ Portal Map
            </button>
            <button
              className={`tab-btn ${activeRightTab === 'cube' ? 'active' : ''}`}
              onClick={() => setActiveRightTab('cube')}
              style={{ flex: 1, padding: '4px', fontSize: '20px', textTransform: 'uppercase' }}
            >
              📦 Transmutador
            </button>
          </div>

          <div className="column-body" style={{ padding: '4px' }}>
            {activeRightTab === 'portal' ? (
              <PortalPanel />
            ) : (
              <CubePanel />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
