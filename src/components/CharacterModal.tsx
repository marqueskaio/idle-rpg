import React, { useState } from 'react';
import { useGameStore, CLASS_SKILLS, calculateCharacterStats } from '../game/store';


interface CharacterModalProps {
  charId: string;
  onClose: () => void;
}

type TabType = 'skills' | 'equipment' | 'runes' | 'options';

export const CharacterModal: React.FC<CharacterModalProps> = ({ charId, onClose }) => {
  const { 
    party, 
    inventory, 
    runeStash,
    allocateSkillPoint, 
    equipItem, 
    unequipItem, 
    socketRune, 
    unsocketRune, 
    fireCharacter 
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabType>('equipment');
  const [selectedSlot, setSelectedSlot] = useState<'weapon' | 'armor' | 'ring' | null>(null);
  const [selectedRuneSlot, setSelectedRuneSlot] = useState<number | null>(null);

  // Find target character in party
  const char = party.find(c => c.id === charId);
  if (!char) {
    return null;
  }

  const stats = calculateCharacterStats(char);
  const skillsConfig = CLASS_SKILLS[char.class];

  const handleFire = () => {
    if (window.confirm(`Tem certeza de que deseja dispensar ${char.name}? Todos os itens e runas equipados serão devolvidos para o inventário.`)) {
      fireCharacter(char.id);
      onClose();
    }
  };

  // Get eligible items from inventory for selection
  const getEligibleItems = (type: 'weapon' | 'armor' | 'ring') => {
    return inventory.filter(item => item.type === type);
  };



  const getClassEmoji = (cls: string) => {
    switch (cls) {
      case 'Warrior': return '🛡️';
      case 'Mage': return '🔮';
      case 'Rogue': return '🗡️';
      default: return '👤';
    }
  };

  const xpPercent = Math.min(100, (char.xp / char.xpNeeded) * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', height: '90%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>{getClassEmoji(char.class)}</span>
              <h3 style={{ fontSize: '15px' }}>{char.name}</h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-gold)' }}>
              Nv. {char.level} {char.class === 'Warrior' ? 'Guerreiro' : char.class === 'Mage' ? 'Mago' : 'Ladino'}
            </span>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '2px 8px', fontSize: '12px' }}>
            Fechar
          </button>
        </div>

        {/* XP Bar */}
        <div className="progress-container" style={{ gap: '2px' }}>
          <div className="progress-header" style={{ fontSize: '10px' }}>
            <span>Experiência</span>
            <span>{char.xp} / {char.xpNeeded} XP</span>
          </div>
          <div className="progress-track" style={{ height: '5px' }}>
            <div className="progress-fill xp" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* Stats Panel */}
        <div className="rpg-panel" style={{ padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '11px' }}>
          <div>⭐ Poder: <strong style={{ color: 'var(--color-gold-bright)' }}>{stats.power}</strong></div>
          <div>⚔️ Ataque: <strong>{stats.attack}</strong></div>
          <div>🛡️ Defesa: <strong>{stats.defense}</strong></div>
          <div>❤️ Vida Máx: <strong>{stats.hp}</strong></div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: '4px' }}>
          <button 
            className={`btn-secondary ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => { setActiveTab('equipment'); setSelectedSlot(null); setSelectedRuneSlot(null); }}
            style={{ flex: 1, padding: '4px', fontSize: '10px', color: activeTab === 'equipment' ? 'var(--color-gold)' : 'var(--color-text)' }}
          >
            Equipar
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => { setActiveTab('skills'); setSelectedSlot(null); setSelectedRuneSlot(null); }}
            style={{ flex: 1, padding: '4px', fontSize: '10px', color: activeTab === 'skills' ? 'var(--color-gold)' : 'var(--color-text)' }}
          >
            Skills ({char.skillPoints})
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'runes' ? 'active' : ''}`}
            onClick={() => { setActiveTab('runes'); setSelectedSlot(null); setSelectedRuneSlot(null); }}
            style={{ flex: 1, padding: '4px', fontSize: '10px', color: activeTab === 'runes' ? 'var(--color-gold)' : 'var(--color-text)' }}
          >
            Runas
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'options' ? 'active' : ''}`}
            onClick={() => { setActiveTab('options'); setSelectedSlot(null); setSelectedRuneSlot(null); }}
            style={{ flex: 1, padding: '4px', fontSize: '10px', color: activeTab === 'options' ? 'var(--color-gold)' : 'var(--color-text)' }}
          >
            Config
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          
          {/* EQUIPMENT TAB */}
          {activeTab === 'equipment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '8px' }}>
                
                {/* Weapon Slot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Arma</span>
                  <div 
                    className={`item-slot rarity-${char.equipment.weapon?.rarity || 'common'}`} 
                    onClick={() => { setSelectedSlot('weapon'); setSelectedRuneSlot(null); }}
                    style={{ width: '56px', height: '56px', borderStyle: char.equipment.weapon ? 'solid' : 'dashed' }}
                  >
                    {char.equipment.weapon ? (
                      <>
                        <span className="item-icon">🗡️</span>
                        <span className="item-refine">+{char.equipment.weapon.refineLevel}</span>
                      </>
                    ) : '⚔️'}
                  </div>
                  {char.equipment.weapon && (
                    <button 
                      className="btn-danger" 
                      onClick={() => unequipItem(char.id, 'weapon')} 
                      style={{ padding: '1px 4px', fontSize: '9px', marginTop: '2px' }}
                    >
                      Remover
                    </button>
                  )}
                </div>

                {/* Armor Slot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Armadura</span>
                  <div 
                    className={`item-slot rarity-${char.equipment.armor?.rarity || 'common'}`} 
                    onClick={() => { setSelectedSlot('armor'); setSelectedRuneSlot(null); }}
                    style={{ width: '56px', height: '56px', borderStyle: char.equipment.armor ? 'solid' : 'dashed' }}
                  >
                    {char.equipment.armor ? (
                      <>
                        <span className="item-icon">🛡️</span>
                        <span className="item-refine">+{char.equipment.armor.refineLevel}</span>
                      </>
                    ) : '👕'}
                  </div>
                  {char.equipment.armor && (
                    <button 
                      className="btn-danger" 
                      onClick={() => unequipItem(char.id, 'armor')}
                      style={{ padding: '1px 4px', fontSize: '9px', marginTop: '2px' }}
                    >
                      Remover
                    </button>
                  )}
                </div>

                {/* Ring Slot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Anel</span>
                  <div 
                    className={`item-slot rarity-${char.equipment.ring?.rarity || 'common'}`} 
                    onClick={() => { setSelectedSlot('ring'); setSelectedRuneSlot(null); }}
                    style={{ width: '56px', height: '56px', borderStyle: char.equipment.ring ? 'solid' : 'dashed' }}
                  >
                    {char.equipment.ring ? (
                      <>
                        <span className="item-icon">💍</span>
                        <span className="item-refine">+{char.equipment.ring.refineLevel}</span>
                      </>
                    ) : '💍'}
                  </div>
                  {char.equipment.ring && (
                    <button 
                      className="btn-danger" 
                      onClick={() => unequipItem(char.id, 'ring')}
                      style={{ padding: '1px 4px', fontSize: '9px', marginTop: '2px' }}
                    >
                      Remover
                    </button>
                  )}
                </div>

              </div>

              {/* Equip List Dropdown */}
              {selectedSlot && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', background: 'rgba(0,0,0,0.3)', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--color-gold)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Escolha um item ({selectedSlot === 'weapon' ? 'Armas' : selectedSlot === 'armor' ? 'Armaduras' : 'Anéis'})</span>
                    <button onClick={() => setSelectedSlot(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>[X]</button>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                    {getEligibleItems(selectedSlot).length === 0 ? (
                      <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textAlign: 'center', padding: '6px' }}>
                        Nenhum item do tipo disponível no inventário.
                      </span>
                    ) : (
                      getEligibleItems(selectedSlot).map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => { equipItem(char.id, item.id); setSelectedSlot(null); }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.01)',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          <div>
                            <span style={{ color: `var(--rarity-${item.rarity})`, fontWeight: '600' }}>
                              {item.name} {item.refineLevel > 0 ? `+${item.refineLevel}` : ''}
                            </span>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>
                              {item.attack > 0 && `Atk: +${item.attack} `}
                              {item.defense > 0 && `Def: +${item.defense} `}
                              {item.hp > 0 && `HP: +${item.hp} `}
                            </div>
                          </div>
                          <span style={{ fontSize: '9px', color: char.level >= item.levelRequired ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            Req: Nv.{item.levelRequired}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--color-text-dim)' }}>
                <span>Pontos Disponíveis: <strong style={{ color: 'var(--color-success)' }}>{char.skillPoints}</strong></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {skillsConfig.map(skill => {
                  const currentLvl = char.skills[skill.id] || 0;
                  const isMax = currentLvl >= skill.maxLevel;
                  return (
                    <div key={skill.id} className="rpg-panel" style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, paddingRight: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <h4 style={{ fontSize: '12px', color: 'var(--color-gold)' }}>
                            {skill.type === 'active' ? '⚔️' : '🛡️'} {skill.name}
                          </h4>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>
                            {currentLvl}/{skill.maxLevel} Nv
                          </span>
                        </div>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-dim)', marginTop: '4px', lineHeight: '1.3' }}>
                          {skill.description}
                        </p>
                      </div>
                      <button 
                        className="btn-primary" 
                        disabled={char.skillPoints <= 0 || isMax}
                        onClick={() => allocateSkillPoint(char.id, skill.id)}
                        style={{ padding: '6px', fontSize: '10px', minWidth: '40px' }}
                      >
                        {isMax ? 'MAX' : '+1'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RUNES TAB */}
          {activeTab === 'runes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', gap: '8px', padding: '10px 0' }}>
                {char.runes.map((rune, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>Slot {index + 1}</span>
                    <div 
                      className="item-slot" 
                      onClick={() => { setSelectedRuneSlot(index); setSelectedSlot(null); }}
                      style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderStyle: rune ? 'solid' : 'dashed', 
                        borderColor: rune ? 'var(--color-gold)' : 'var(--color-border)',
                        transform: 'rotate(45deg)',
                        margin: '6px'
                      }}
                    >
                      {rune ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'rotate(-45deg)' }}>
                          <span style={{ fontSize: '16px' }}>🔷</span>
                          <span style={{ fontSize: '7px', color: 'var(--color-gold-bright)', position: 'absolute', bottom: '2px' }}>G.{rune.level}</span>
                        </div>
                      ) : (
                        <span style={{ transform: 'rotate(-45deg)', fontSize: '12px' }}>➕</span>
                      )}
                    </div>
                    {rune && (
                      <button 
                        className="btn-danger" 
                        onClick={() => unsocketRune(char.id, index)}
                        style={{ padding: '1px 4px', fontSize: '9px', marginTop: '2px' }}
                      >
                        Soltar
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {selectedRuneSlot !== null && (
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', background: 'rgba(0,0,0,0.3)', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '11px', color: 'var(--color-gold)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Socketar Runa no Slot {selectedRuneSlot + 1}</span>
                    <button onClick={() => setSelectedRuneSlot(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>[X]</button>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                    {runeStash.length === 0 ? (
                      <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textAlign: 'center', padding: '6px' }}>
                        Nenhuma runa livre no baú.
                      </span>
                    ) : (
                      runeStash.map(rune => (
                        <div 
                          key={rune.id} 
                          onClick={() => { socketRune(char.id, rune.id, selectedRuneSlot); setSelectedRuneSlot(null); }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.01)',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          <div>
                            <span style={{ color: 'var(--rarity-rare)', fontWeight: '600' }}>
                              {rune.name}
                            </span>
                            <div style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>
                              Efeito: {rune.statType === 'attack' ? `Atk +${rune.value}` : 
                                       rune.statType === 'defense' ? `Def +${rune.value}` : 
                                       rune.statType === 'hp' ? `HP +${rune.value}` : 
                                       rune.statType === 'goldGain' ? `Gold +${Math.round(rune.value*100)}%` : 
                                       `XP +${Math.round(rune.value*100)}%`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OPTIONS TAB */}
          {activeTab === 'options' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-dim)', textAlign: 'center' }}>
                Ao dispensar o herói, ele sairá permanentemente do seu grupo. Todos os seus equipamentos e runas retornarão para o seu baú.
              </p>
              <button className="btn-danger" onClick={handleFire} style={{ width: '100%', padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                Dispensar Herói
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
