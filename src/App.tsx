import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, ItemInstance, ItemDef, LogEntry, ElementType, Rarity, ItemType, Stats, BattleState, SkillDef, Buff } from './types';
import { REALMS, ITEM_DB, MAPS, PROLOGUE_TEXT, ELEM_NAMES, ELEM_COUNTER, ELEM_COLORS, RARITY_COLORS, VERSION, MONSTER_POOLS, SKILL_DB } from './constants';
import { Button, ProgressBar, Card, Modal } from './components/UIComponents';
import { Users, AlertTriangle, Shield, Sword, Sparkles, Gem, Scroll, Skull, Settings, Save, Trash2, Download, Upload, Archive, XCircle, Play, FastForward, Activity, LogOut, ChevronsRight, Footprints, Wrench, PlusCircle, Zap, Heart, BookOpen, Hexagon, RefreshCw, Repeat } from 'lucide-react';

// --- Helper Functions ---
const getRandElem = (): ElementType => {
  const elems: ElementType[] = ['gold', 'wood', 'earth', 'water', 'fire'];
  return elems[Math.floor(Math.random() * elems.length)];
};

const createItem = (id: string, count: number = 1): ItemInstance[] => {
  const items: ItemInstance[] = [];
  const dbItem = ITEM_DB[id];
  if (!dbItem) return [];

  for (let i = 0; i < count; i++) {
    let finalVal = 0;
    if (dbItem.val) {
      const variance = 0.1;
      const factor = 1 + (Math.random() * variance * 2 - variance);
      finalVal = Math.floor(dbItem.val * factor);
    }
    
    let elements: ElementType[] = [];
    if (['weapon', 'armor', 'furnace', 'robe', 'artifact'].includes(dbItem.type)) {
      let elemCount = 0;
      const r = dbItem.rarity;
      if (r === 'common') elemCount = Math.random() > 0.8 ? 1 : 0;
      else if (r === 'rare') elemCount = 1;
      else if (r === 'epic') elemCount = Math.random() > 0.7 ? 2 : 1;
      else if (r === 'legend' || r === 'myth') elemCount = Math.random() > 0.5 ? 3 : 2;

      while (elements.length < elemCount) {
        const e = getRandElem();
        if (!elements.includes(e)) elements.push(e);
      }
    }

    items.push({
      uid: Date.now().toString() + Math.random().toString().slice(2),
      id: id,
      finalVal: finalVal,
      elements: elements
    });
  }
  return items;
};

const BulkSellModal: React.FC<{ inventory: ItemInstance[]; onClose: () => void; onConfirm: (items: ItemInstance[]) => void }> = ({ inventory, onClose, onConfirm }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = (uid: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(uid)) newSet.delete(uid);
      else newSet.add(uid);
      setSelectedIds(newSet);
  };

  const selectByRarity = (rarity: string) => {
      const newSet = new Set(selectedIds);
      inventory.forEach(item => {
          const db = ITEM_DB[item.id];
          if (db && db.rarity === rarity) newSet.add(item.uid);
      });
      setSelectedIds(newSet);
  };
  
  const deselectAll = () => setSelectedIds(new Set());

  const confirm = () => {
      const items = inventory.filter(i => selectedIds.has(i.uid));
      onConfirm(items);
  };

  const totalValue = inventory.filter(i => selectedIds.has(i.uid)).reduce((acc, i) => {
      const db = ITEM_DB[i.id];
      return acc + (db ? Math.floor(db.price * 0.3) : 0);
  }, 0);

  return (
      <Modal title="批量販售" onClose={onClose}>
          <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" className="text-xs py-1" onClick={() => selectByRarity('common')}>全選凡品</Button>
                  <Button variant="outline" className="text-xs py-1" onClick={() => selectByRarity('rare')}>全選稀有</Button>
                  <Button variant="outline" className="text-xs py-1" onClick={deselectAll}>取消全選</Button>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar border border-gray-700 p-2 space-y-1">
                  {inventory.map(item => {
                      const db = ITEM_DB[item.id];
                      if (!db) return null;
                      const isSelected = selectedIds.has(item.uid);
                      return (
                          <div key={item.uid} onClick={() => toggle(item.uid)} className={`cursor-pointer p-2 flex justify-between items-center border ${isSelected ? 'border-yellow-500 bg-yellow-900/20' : 'border-transparent hover:bg-gray-800'}`}>
                              <div className={RARITY_COLORS[db.rarity]}>{db.name}</div>
                              <div className="text-xs text-gray-500">{Math.floor(db.price * 0.3)} 靈石</div>
                          </div>
                      );
                  })}
                  {inventory.length === 0 && <div className="text-center text-gray-500">無可販售物品</div>}
              </div>
              <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                  <div>預計獲得: <span className="text-yellow-400 font-bold">{totalValue}</span> 靈石</div>
                  <Button onClick={confirm} disabled={selectedIds.size === 0}>確認販售 ({selectedIds.size})</Button>
              </div>
          </div>
      </Modal>
  );
};

// --- Initial State ---
const INITIAL_STATE: GameState = {
  name: '', isGM: false, seenPrologue: false,
  realm: 0, level: 1, exp: 0, maxExp: 100,
  hp: 100, maxHp: 100, mp: 50, maxMp: 50,
  demon: 0, stones: 0, injury: 0,
  stats: { gold: 1, wood: 1, water: 1, fire: 1, earth: 1 },
  freePoints: 0, mapId: 0, qiDeviation: false,
  inventory: [],
  learnedSkills: [],
  equip: { 
      weapon: null, armor: null, furnace: null, robe: null, artifact: null,
      skill1: null, skill2: null, skill3: null 
  }
};

// --- Stat Calculation Helper ---
const calculateStats = (state: GameState) => {
    // 0. Safety Checks
    if (!state || !state.equip) {
        return {
            maxHp: state?.maxHp || 100,
            maxMp: state?.maxMp || 50,
            atk: 0,
            def: 0,
            luk: 0
        };
    }

    const s = state.stats || { gold: 1, wood: 1, water: 1, fire: 1, earth: 1 };

    // 1. Calculate Passives
    let hpMod = 0;
    let mpMod = 0;
    ['skill1', 'skill2', 'skill3'].forEach(slot => {
        const skillId = state.equip?.[slot as keyof typeof state.equip];
        if (skillId) {
            const skill = SKILL_DB[skillId];
            if (skill?.type === 'passive') {
                if (skillId === 's_water_3') mpMod += 0.1; // 凝水心法
                if (skillId === 's_earth_3') hpMod += 0.1; // 厚土根基
            }
        }
    });

    // 2. Base Max Stats
    const maxHp = Math.floor((state.maxHp || 100) * (1 + hpMod));
    const maxMp = Math.floor(((state.maxMp || 50) + ((s.water || 1) * 10)) * (1 + mpMod));

    // 3. Attributes (Atk/Def/Luk)
    const injury = state.injury || 0;
    const realm = injury >= 50 ? Math.max(0, state.realm - 2) : (injury > 0 ? Math.max(0, state.realm - 1) : state.realm);
    
    // Adjusted formula: Added flat +10 ATK and +5 DEF to base to ensure playability at level 1/realm 0 with bad stats
    let baseAtk = ((s.gold || 1) + (s.fire || 1)) * 5 + (realm * 50) + (state.level * 5) + 10;
    let baseDef = ((s.wood || 1) + (s.earth || 1)) * 3 + (realm * 30) + (state.level * 3) + 5;
    let baseLuk = ((s.water || 1) * 2);

    Object.entries(state.equip).forEach(([slot, val]) => {
      if (!val) return;
      if (slot.startsWith('skill')) return;

      const item = state.inventory.find(i => i.uid === val);
      if (!item) return;

      const dbItem = ITEM_DB[item.id];
      if (!dbItem) return; // Safety check for invalid items

      let itemVal = item.finalVal || dbItem.val || 0;
      
      let bonus = 0;
      item.elements.forEach(e => {
        if (e !== 'none' && s[e] > 0) {
            bonus += Math.floor(itemVal * (s[e] * 0.05));
        }
      });
      itemVal += bonus;

      if (slot === 'weapon') baseAtk += itemVal;
      if (slot === 'armor') baseDef += itemVal;
      if (slot === 'artifact') baseLuk += itemVal;
    });

    let multiplier = 1.0;
    if (injury >= 50) multiplier *= 0.5;
    else if (injury > 0) multiplier *= 0.75;

    return {
        maxHp: isNaN(maxHp) ? 100 : maxHp,
        maxMp: isNaN(maxMp) ? 50 : maxMp,
        atk: isNaN(baseAtk) ? 10 : Math.floor(baseAtk * multiplier),
        def: isNaN(baseDef) ? 5 : Math.floor(baseDef * multiplier),
        luk: isNaN(baseLuk) ? 1 : baseLuk
    };
};

const App: React.FC = () => {
  // State
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'adventure' | 'cave' | 'bag' | 'skills' | 'market'>('adventure');
  const [bagFilter, setBagFilter] = useState<string>('all');
  
  // Battle State
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [autoLoop, setAutoLoop] = useState(false);
  
  // Modals & Screens
  const [screen, setScreen] = useState<'login' | 'prologue' | 'game'>('login');
  const [showSettings, setShowSettings] = useState(false);
  const [showBulkSell, setShowBulkSell] = useState(false);
  const [showIO, setShowIO] = useState<'import' | 'export' | null>(null);
  const [ioText, setIoText] = useState('');
  
  // GM Modal
  const [showGM, setShowGM] = useState(false);
  const [gmItemFilter, setGmItemFilter] = useState<ItemType | 'all'>('all');

  // Creation State
  const [creationName, setCreationName] = useState('');
  const [creationPoints, setCreationPoints] = useState({ gold:1, wood:1, water:1, fire:1, earth:1, remain:15 });

  const logRef = useRef<HTMLDivElement>(null);

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('bdo_save_v9');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && Array.isArray(parsed.inventory)) {
            // Migrations & Safety Checks
            // Filter out items that don't exist in current DB to prevent crashes
            if (parsed.inventory) {
                parsed.inventory = parsed.inventory.filter((i: any) => i && i.id && ITEM_DB[i.id]);
            }

            if (!parsed.equip) parsed.equip = { ...INITIAL_STATE.equip };
            if(!parsed.equip.skill1) parsed.equip = { ...parsed.equip, skill1: null, skill2: null, skill3: null };
            if(!parsed.learnedSkills) {
                parsed.learnedSkills = [];
                if (parsed.equip.skill1) parsed.learnedSkills.push(parsed.equip.skill1);
                if (parsed.equip.skill2 && !parsed.learnedSkills.includes(parsed.equip.skill2)) parsed.learnedSkills.push(parsed.equip.skill2);
                if (parsed.equip.skill3 && !parsed.learnedSkills.includes(parsed.equip.skill3)) parsed.learnedSkills.push(parsed.equip.skill3);
            }
            // Ensure numbers
            if(isNaN(parsed.maxHp)) parsed.maxHp = 100;
            if(isNaN(parsed.maxMp)) parsed.maxMp = 50;
            if(isNaN(parsed.hp)) parsed.hp = 100;
            if(isNaN(parsed.mp)) parsed.mp = 50;
            if(!parsed.stats) parsed.stats = { ...INITIAL_STATE.stats };

            setGameState(parsed);
            setScreen(parsed.seenPrologue ? 'game' : 'prologue');
        }
      } catch (e) { console.error("Save file corrupted"); }
    }
  }, []);

  const saveGame = () => {
    localStorage.setItem('bdo_save_v9', JSON.stringify(gameState));
    addLog("遊戲已儲存", 'system');
  };

  // --- Logging ---
  const addLog = (message: string, type: LogEntry['type'] = 'normal') => {
    const entry: LogEntry = {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message,
        type
    };
    setLogs(prev => [entry, ...prev].slice(0, 100));
  };

  // --- Stats Accessors ---
  // We use the helper for display, but inside functions we might re-call it to get fresh values
  const currentStats = calculateStats(gameState);

  // --- Actions ---
  const checkLevelUp = (state: GameState): GameState => {
    let newState = { ...state };
    // Recalc helper needed for exp? No, exp limit only depends on realm/level which are in state
    const calcMaxExp = (realm: number, level: number) => {
        const multipliers = [1, 20, 80, 300, 1200, 5000, 20000, 80000, 320000];
        const mult = multipliers[realm] || multipliers[multipliers.length - 1];
        return Math.floor(100 * mult * Math.pow(1.15, level - 1));
    };

    if (newState.exp >= newState.maxExp) {
        if (newState.level < 10) {
            newState.exp -= newState.maxExp;
            newState.level++;
            newState.maxExp = calcMaxExp(newState.realm, newState.level);
            newState.maxHp += 50;
            newState.maxMp += 20;
            newState.hp = newState.maxHp; 
            newState.freePoints += 3;
            addLog(`境界提升至 ${REALMS[newState.realm]} ${newState.level}重！`, 'gain');
        } else {
            newState.exp = newState.maxExp;
            addLog("修為已至圓滿，請嘗試突破！", 'warn');
        }
    }
    return newState;
  };

  const cultivate = () => {
    if (gameState.injury > 0) {
        addLog("重傷未癒，經脈受阻，無法精進修為！", 'warn');
        return;
    }
    const gain = 10 + Math.floor(currentStats.luk * 0.5);
    let newState = { ...gameState, exp: gameState.exp + gain };
    addLog(`修煉獲得 ${gain} 修為`, 'gain');
    newState = checkLevelUp(newState);
    setGameState(newState);
  };

  const meditate = () => {
    setGameState(prev => {
        const stats = calculateStats(prev);
        let injury = prev.injury;
        if (prev.realm === 0 && prev.injury > 0) {
             injury = Math.max(0, prev.injury - 10);
             addLog("凡人體質，打坐慢慢調養傷勢... (重傷 -10%)", 'gain');
        }
        addLog("打坐調息，狀態全滿。", 'system');
        return { ...prev, hp: stats.maxHp, mp: stats.maxMp, injury };
    });
  };

  // --- Battle System ---

  const processBattleRound = () => {
      setBattle(prev => {
            if (!prev || prev.result !== 'ongoing') return prev;

            const newLogs = [...prev.logs];
            let p = { ...prev.player };
            let e = { ...prev.enemy };
            let cooldowns = { ...prev.cooldowns };

            // 0. Process Buffs/Debuffs & Cooldowns
            for(let k in cooldowns) {
                if(cooldowns[k] > 0) cooldowns[k]--;
            }
            [p, e].forEach(entity => {
                entity.buffs = entity.buffs.filter(b => {
                    b.duration--;
                    if(b.type === 'dot') {
                        const dotDmg = Math.floor(b.val);
                        entity.curHp -= dotDmg;
                        newLogs.push(`${entity.name === p.name ? '你' : e.name} 受到燃燒傷害 ${dotDmg}`);
                    }
                    return b.duration > 0;
                });
                if(entity === p && (gameState.equip.skill1 === 's_wood_3' || gameState.equip.skill2 === 's_wood_3' || gameState.equip.skill3 === 's_wood_3')) {
                     const heal = Math.floor(entity.maxHp * 0.01);
                     if (entity.curHp < entity.maxHp) entity.curHp = Math.min(entity.maxHp, entity.curHp + heal);
                }
                if(entity === p && (gameState.equip.skill1 === 's_dark_3' || gameState.equip.skill2 === 's_dark_3' || gameState.equip.skill3 === 's_dark_3')) {
                     entity.curMp = Math.min(entity.maxMp, entity.curMp + 3);
                }
            });

            if (p.curHp <= 0 || e.curHp <= 0) {
                 if (e.curHp <= 0) {
                    e.curHp = 0;
                    newLogs.push(`>>> [${e.name}] 倒下了！`);
                    // Calculate rewards on win
                    const winState = calculateWinState(prev); 
                    return { ...prev, round: prev.round, player: p, enemy: e, logs: newLogs, result: 'win', cooldowns, finalRewards: winState.rewards };
                 }
                 if (p.curHp <= 0) {
                    p.curHp = 0;
                    newLogs.push(`>>> 你已重傷倒地...`);
                    return { ...prev, round: prev.round, player: p, enemy: e, logs: newLogs, result: 'loss', cooldowns };
                 }
            }

            const pStun = p.buffs.find(b => b.type === 'stun');
            const eStun = e.buffs.find(b => b.type === 'stun');

            // 1. Player Action
            if (!pStun) {
                let pAtkMod = 1 + p.buffs.reduce((acc, b) => b.type === 'atk_mod' ? acc + b.val : acc, 0);
                if ((gameState.equip.skill1 === 's_fire_3' || gameState.equip.skill2 === 's_fire_3' || gameState.equip.skill3 === 's_fire_3') && p.curHp < p.maxHp * 0.3) {
                    pAtkMod += 0.15;
                }
                
                let eDefMod = 1 + e.buffs.reduce((acc, b) => b.type === 'def_mod' ? acc + b.val : acc, 0);

                let pDmgMult = 1.0;
                let atkMsg = "";
                let pIsCrit = false;

                let ignoreDef = 0;
                if (gameState.equip.skill1 === 's_gold_3' || gameState.equip.skill2 === 's_gold_3' || gameState.equip.skill3 === 's_gold_3') {
                    if (Math.random() < 0.05) { ignoreDef = 0.3; pIsCrit = true; atkMsg += "(破甲)"; }
                }

                const weaponUid = gameState.equip.weapon;
                if (weaponUid) {
                    const item = gameState.inventory.find(i => i.uid === weaponUid);
                    if (item) {
                        let counters = false;
                        let beCountered = false;
                        item.elements.forEach(el => {
                            if (ELEM_COUNTER[el]?.includes(e.element)) counters = true;
                            if (ELEM_COUNTER[e.element]?.includes(el)) beCountered = true;
                        });
                        if (counters) { pDmgMult = 1.5; pIsCrit = true; }
                        else if (beCountered) { pDmgMult = 0.8; atkMsg = "(逆)"; }
                    }
                }
                
                const pFinalAtk = p.atk * pAtkMod;
                const eFinalDef = e.def * eDefMod * (1 - ignoreDef);
                
                const pDmg = Math.max(1, Math.floor((pFinalAtk * pDmgMult) - eFinalDef));
                e.curHp -= pDmg;
                newLogs.push(`> 你對 [${e.name}] 造成 ${pDmg} 點傷害 ${pIsCrit ? '💥' : ''} ${atkMsg}`);
            } else {
                newLogs.push(`> 你被暈眩了，無法行動！`);
            }

            if (e.curHp <= 0) {
                e.curHp = 0;
                newLogs.push(`>>> [${e.name}] 倒下了！`);
                const winState = calculateWinState(prev);
                return { ...prev, round: prev.round + 1, player: p, enemy: e, logs: newLogs, result: 'win', cooldowns, finalRewards: winState.rewards };
            }

            // 2. Enemy Attack
            if (!eStun) {
                let eAtkMod = 1 + e.buffs.reduce((acc, b) => b.type === 'atk_mod' ? acc + b.val : acc, 0);
                let pDefMod = 1 + p.buffs.reduce((acc, b) => b.type === 'def_mod' ? acc + b.val : acc, 0);
                let dmgReduction = 0;
                if ((gameState.equip.skill1 === 's_light_3' || gameState.equip.skill2 === 's_light_3' || gameState.equip.skill3 === 's_light_3') && e.element === 'dark') {
                    dmgReduction += 0.15;
                }

                let eDmgMult = 1.0;
                let defMsg = "";
                let eIsCrit = false;

                const armorUid = gameState.equip.armor;
                if (armorUid) {
                    const item = gameState.inventory.find(i => i.uid === armorUid);
                    if (item) {
                        let counters = false;
                        let beCountered = false;
                        item.elements.forEach(el => {
                            if (ELEM_COUNTER[el]?.includes(e.element)) counters = true;
                            if (ELEM_COUNTER[e.element]?.includes(el)) beCountered = true;
                        });
                        if (counters) { eDmgMult = 0.8; defMsg = "(防)"; }
                        else if (beCountered) { eDmgMult = 1.5; eIsCrit = true; }
                    }
                }

                const eFinalAtk = e.atk * eAtkMod;
                const pFinalDef = p.def * pDefMod;

                let eDmg = Math.max(1, Math.floor((eFinalAtk * eDmgMult) - pFinalDef));
                eDmg = Math.floor(eDmg * (1 - dmgReduction));

                p.curHp -= eDmg;
                newLogs.push(`< [${e.name}] 對你造成 ${eDmg} 點傷害 ${eIsCrit ? '💔' : ''} ${defMsg}`);
            } else {
                newLogs.push(`< [${e.name}] 被暈眩了！`);
            }

            if (p.curHp <= 0) {
                p.curHp = 0;
                newLogs.push(`>>> 你已重傷倒地...`);
                return { ...prev, round: prev.round + 1, player: p, enemy: e, logs: newLogs, result: 'loss', cooldowns };
            }

            return { ...prev, round: prev.round + 1, player: p, enemy: e, logs: newLogs, cooldowns };
        });
  };

  const useSkill = (skillId: string) => {
      if (!battle || battle.result !== 'ongoing') return;
      if (battle.cooldowns[skillId] > 0) return;

      const skill = SKILL_DB[skillId];
      if (battle.player.curMp < skill.mpCost) {
          setBattle(prev => prev ? { ...prev, logs: [...prev.logs, `MP不足 (${skill.mpCost})`] } : null);
          return;
      }

      setBattle(prev => {
          if (!prev) return null;
          let p = { ...prev.player };
          let e = { ...prev.enemy };
          let logs = [...prev.logs];
          let cooldowns = { ...prev.cooldowns };

          p.curMp -= skill.mpCost;
          cooldowns[skillId] = skill.cooldown;
          logs.push(`> 施放技能：${skill.name}`);

          if (skillId === 's_gold_1') { 
              const dmg = Math.floor(p.atk * 1.2 - e.def); e.curHp -= Math.max(1, dmg); logs.push(`  造成 ${Math.max(1, dmg)} 傷害`);
              if (Math.random() < 0.1) { e.buffs.push({ id: Math.random().toString(), name: '破防', type: 'def_mod', val: -0.2, duration: 5 }); logs.push(`  [破防] 敵防禦-20%`); }
          }
          else if (skillId === 's_gold_2') { p.buffs.push({ id: Math.random().toString(), name: '鋼骨', type: 'def_mod', val: 0.25, duration: 10 }); logs.push(`  防禦力提升25%`); }
          else if (skillId === 's_wood_1') { const dmg = Math.floor(p.atk * 0.5 - e.def); e.curHp -= Math.max(1, dmg); e.buffs.push({ id: Math.random().toString(), name: '纏繞', type: 'stun', val: 1, duration: 3 }); logs.push(`  造成 ${Math.max(1, dmg)} 傷害，敵人被纏繞`); }
          else if (skillId === 's_wood_2') { const heal = Math.floor(p.maxHp * 0.2); p.curHp = Math.min(p.maxHp, p.curHp + heal); logs.push(`  回復了 ${heal} 生命`); }
          else if (skillId === 's_water_1') { const dmg = Math.floor(p.atk * 1.1 - e.def); e.curHp -= Math.max(1, dmg); e.buffs.push({ id: Math.random().toString(), name: '減速', type: 'atk_mod', val: -0.1, duration: 4 }); logs.push(`  造成 ${Math.max(1, dmg)} 傷害，敵人攻勢減緩`); }
          else if (skillId === 's_water_2') { p.buffs.push({ id: Math.random().toString(), name: '冰膚', type: 'def_mod', val: 0.15, duration: 8 }); logs.push(`  受傷減少 (防禦提升)`); }
          else if (skillId === 's_fire_1') { const dmg = Math.floor(p.atk * 1.3 - e.def); e.curHp -= Math.max(1, dmg); const burnDmg = Math.floor(p.atk * 0.1); e.buffs.push({ id: Math.random().toString(), name: '燃燒', type: 'dot', val: burnDmg, duration: 5 }); logs.push(`  造成 ${Math.max(1, dmg)} 傷害，附加燃燒`); }
          else if (skillId === 's_fire_2') { p.buffs.push({ id: Math.random().toString(), name: '爆發', type: 'atk_mod', val: 0.2, duration: 8 }); logs.push(`  攻擊力大幅提升`); }
          else if (skillId === 's_earth_1') { p.buffs.push({ id: Math.random().toString(), name: '岩甲', type: 'def_mod', val: 0.3, duration: 12 }); logs.push(`  防禦力大幅提升`); }
          else if (skillId === 's_earth_2') { const dmg = Math.floor(p.atk * 1.2 - e.def); e.curHp -= Math.max(1, dmg); e.buffs.push({ id: Math.random().toString(), name: '暈眩', type: 'stun', val: 1, duration: 2 }); logs.push(`  造成 ${Math.max(1, dmg)} 傷害，敵人暈眩`); }
          else if (skillId === 's_light_1') { let mod = 1.15; if (e.element === 'dark') mod += 0.3; const dmg = Math.floor(p.atk * mod - e.def); e.curHp -= Math.max(1, dmg); logs.push(`  造成 ${Math.max(1, dmg)} 光屬性傷害`); }
          else if (skillId === 's_light_2') { p.buffs = []; const heal = Math.floor(p.maxHp * 0.1); p.curHp = Math.min(p.maxHp, p.curHp + heal); logs.push(`  狀態淨化，回復 ${heal} 生命`); }
          else if (skillId === 's_dark_1') { const dmg = Math.floor(p.atk * 1.1 - e.def); const actualDmg = Math.max(1, dmg); e.curHp -= actualDmg; const drain = Math.floor(actualDmg * 0.2); p.curHp = Math.min(p.maxHp, p.curHp + drain); logs.push(`  造成 ${actualDmg} 傷害，吸取 ${drain} 生命`); }
          else if (skillId === 's_dark_2') { e.buffs.push({ id: Math.random().toString(), name: '虛弱', type: 'atk_mod', val: -0.2, duration: 8 }); logs.push(`  敵人攻擊力大幅下降`); }

          return { ...prev, player: p, enemy: e, logs, cooldowns };
      });
  };

  const useBattleItem = (itemId: string) => {
     if (!battle || battle.result !== 'ongoing') return;
     const dbItem = ITEM_DB[itemId];
     if (!dbItem) return;

     setBattle(prev => {
         if(!prev) return null;
         let p = {...prev.player};
         let logs = [...prev.logs];
         if (itemId === 'hp_s') { p.curHp = Math.min(p.maxHp, p.curHp + 50); logs.push(`> 使用回春丹，HP+50`); }
         else if (itemId === 'mp_s') { p.curMp = Math.min(p.maxMp, p.curMp + 30); logs.push(`> 使用聚氣丹，MP+30`); }
         return { ...prev, player: p, logs };
     });

     setGameState(prev => {
         const idx = prev.inventory.findIndex(i => i.id === itemId);
         if (idx > -1) {
             const newInv = [...prev.inventory];
             newInv.splice(idx, 1);
             return { ...prev, inventory: newInv };
         }
         return prev;
     });
  };

  // Battle Loop (Auto)
  useEffect(() => {
    let timer: any;
    if (battle?.active && battle.auto && battle.result === 'ongoing') {
        timer = setInterval(() => {
            processBattleRound();
        }, 800);
    }
    return () => clearInterval(timer);
  }, [battle?.active, battle?.auto, battle?.result]);

  // Auto Restart Loop
  useEffect(() => {
      let timer: any;
      if (battle?.result === 'win' && autoLoop) {
          timer = setTimeout(() => {
              restartBattle();
          }, 1500);
      }
      return () => clearTimeout(timer);
  }, [battle?.result, autoLoop]);

  const attemptFlee = () => {
      if (!battle || battle.result !== 'ongoing') return;
      
      const chance = 40 + (currentStats.luk * 0.2); // Base 40% + Luck
      const roll = Math.random() * 100;

      if (roll < chance) {
          setBattle(prev => prev ? ({ ...prev, logs: [...prev.logs, ">>> 腳底抹油，溜之大吉！"], result: 'escaped' }) : null);
      } else {
          setBattle(prev => {
              if (!prev) return null;
              return { ...prev, logs: [...prev.logs, "逃跑失敗！被敵人截住了去路！"] };
          });
      }
  };

  const explore = (initialState?: GameState) => {
    // If explore is called via onClick event, initialState will be a SyntheticEvent, not GameState.
    // We check if it has 'equip' to confirm it's a valid state, otherwise use current gameState.
    const currentState = (initialState && (initialState as any).equip) ? initialState : gameState;
    
    if (currentState.hp <= 0) { addLog("請先打坐療傷。", 'warn'); return; }
    
    // IMPORTANT: Calculate stats based on the CURRENT state passed in, not the stale component state
    const dynamicStats = calculateStats(currentState);

    let currentMapId = currentState.mapId;
    if (currentState.qiDeviation && currentMapId !== 99) {
        currentMapId = 99;
        addLog("心魔作祟，只能前往魔域！", 'warn');
    }

    const mapData = MAPS.find(m => m.id === currentMapId) || MAPS[0];
    
    // -- Monster Generation --
    const roll = Math.random();
    let rarity: 'common' | 'elite' | 'miniboss' | 'boss' = 'common';
    
    if (roll > 0.98) { rarity = 'boss'; }
    else if (roll > 0.90) { rarity = 'miniboss'; }
    else if (roll > 0.70) { rarity = 'elite'; }

    const pool = MONSTER_POOLS[currentMapId === 99 ? 0 : currentMapId] || MONSTER_POOLS[0];
    
    // Fallback safety if specific pool/rarity is empty
    let category = pool[rarity];
    if (!category || category.length === 0) {
        category = pool['common'];
    }
    // Hard fallback to Map 0 common if still empty
    if (!category || category.length === 0) {
        category = MONSTER_POOLS[0]['common'];
    }

    const template = category[Math.floor(Math.random() * category.length)];
    const variance = 0.9 + Math.random() * 0.2;
    
    // Calc Enemy Stats
    const enemyStats = {
        name: template.name,
        maxHp: Math.floor(mapData.base.hp * template.modifiers.hp * variance),
        maxMp: 100, // Dummy MP for enemy
        curMp: 100,
        atk: Math.floor(mapData.base.atk * template.modifiers.atk * variance),
        def: Math.floor(mapData.base.def * template.modifiers.def),
        element: template.element,
        buffs: []
    };
    
    // Realm Pressure Check
    const currentRealm = currentState.injury >= 50 ? Math.max(0, currentState.realm - 2) : (currentState.injury > 0 ? Math.max(0, currentState.realm - 1) : currentState.realm);
    if (currentRealm < mapData.minRealm - 1) {
        enemyStats.atk *= 2; 
    }

    // Prepare Rewards Calculation (Pre-calc basics, final mods apply on win)
    let rarityMult = 1;
    if (rarity === 'elite') rarityMult = 4;
    else if (rarity === 'miniboss') rarityMult = 12;
    else if (rarity === 'boss') rarityMult = mapData.id >= 7 ? 50 : 35;
    
    const rawExp = mapData.base.exp * rarityMult;
    const baseStones = Math.floor(mapData.base.stones * template.modifiers.hp);

    // Drops Pre-calc
    let drops: ItemInstance[] = [];
    let dropChance = 0.2; // Adjusted downwards from 0.3
    if (rarity === 'elite') dropChance = 0.4;
    if (rarity === 'miniboss') dropChance = 0.7;
    if (rarity === 'boss') dropChance = 1.0;

    if (mapData.drops.length > 0 && Math.random() < dropChance) {
        const possibleDrops = Object.keys(ITEM_DB).filter(k => {
            const item = ITEM_DB[k];
            // Exclude skill books from drops
            return item.type !== 'skill_book' && item.type !== 'use' && mapData.drops.includes(item.rarity);
        });
        if (possibleDrops.length > 0) {
            const dropId = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
            drops = createItem(dropId);
        }
    }

    const safeHp = typeof currentState.hp === 'number' && !isNaN(currentState.hp) ? currentState.hp : dynamicStats.maxHp;
    const safeMp = typeof currentState.mp === 'number' && !isNaN(currentState.mp) ? currentState.mp : dynamicStats.maxMp;

    // Init Battle State
    setBattle({
        active: true,
        auto: autoLoop, // Inherit auto state if looping
        round: 1,
        player: {
            name: currentState.name,
            maxHp: dynamicStats.maxHp, // Use newly calculated max
            curHp: safeHp,
            maxMp: dynamicStats.maxMp, // Use newly calculated max
            curMp: safeMp,
            atk: dynamicStats.atk,
            def: dynamicStats.def,
            element: 'physical',
            buffs: []
        },
        enemy: {
            ...enemyStats,
            curHp: enemyStats.maxHp
        },
        logs: [`遭遇了 ${rarity !== 'common' ? `[${rarity.toUpperCase()}]` : ''} ${template.name}!`],
        result: 'ongoing',
        enemyRarity: rarity,
        mapId: mapData.id,
        cooldowns: {},
        rewards: {
            exp: rawExp,
            stones: baseStones,
            drops: drops
        }
    });
  };

  const calculateWinState = (currentState?: BattleState) => {
    const battleState = currentState || battle;
    if (!battleState) return { newState: gameState, rewards: { exp: 0, stones: 0, drops: [] } };
    
    const mapData = MAPS.find(m => m.id === battleState.mapId) || MAPS[0];
    const monsterRealm = mapData.minRealm;
    const realmDiff = Math.max(0, gameState.realm - monsterRealm);
    let realmMult = 1.0;
    if (realmDiff === 1) realmMult = 0.6;
    else if (realmDiff === 2) realmMult = 0.3;
    else if (realmDiff === 3) realmMult = 0.1;
    else if (realmDiff === 4) realmMult = 0.05;
    else if (realmDiff >= 5) realmMult = 0.01;

    const tierDiff = Math.max(0, gameState.level - 1);
    let tierMult = 1.0;
    if (tierDiff >= 8) tierMult = 0.2;
    else if (tierDiff >= 5) tierMult = 0.4;
    else if (tierDiff >= 3) tierMult = 0.7;
    else if (tierDiff >= 1) tierMult = 0.9;

    let finalExp = Math.floor((battleState.rewards?.exp || 0) * realmMult * tierMult);
    finalExp = Math.max(1, finalExp);
    
    // Recalc dynamic stats for luck logic just in case, though gameState should be enough
    const dynStats = calculateStats(gameState);
    const stones = Math.floor((battleState.rewards?.stones || 0) * 1.5 * (1 + (dynStats.luk/100)));
    const drops = battleState.rewards?.drops || [];

    let newState = { 
        ...gameState, 
        hp: battleState.player.curHp,
        mp: battleState.player.curMp, 
        stones: gameState.stones + stones,
        inventory: [...gameState.inventory, ...drops] 
    };

    if (gameState.injury === 0) newState.exp += finalExp;
    
    return { newState, rewards: { exp: finalExp, stones, drops } };
  };

  const endBattle = (result: 'win' | 'loss' | 'escaped') => {
      if (!battle) return;

      if (result === 'win') {
          // If we have finalRewards calculated during battle, use them. Otherwise calc.
          const { newState, rewards } = battle.finalRewards ? { 
              newState: { 
                  ...gameState, 
                  hp: battle.player.curHp, 
                  mp: battle.player.curMp, 
                  stones: gameState.stones + battle.finalRewards.stones,
                  exp: gameState.injury === 0 ? gameState.exp + battle.finalRewards.exp : gameState.exp,
                  inventory: [...gameState.inventory, ...battle.finalRewards.drops]
              }, 
              rewards: battle.finalRewards 
          } : calculateWinState();

          if (gameState.injury > 0) {
              addLog(`擊敗 ${battle.enemy.name}。重傷狀態下無法獲取修為。`, 'warn');
          } else {
              addLog(`擊敗 ${battle.enemy.name}，獲得 ${rewards.stones} 靈石, ${rewards.exp} 修為`, 'gain');
          }
          if(rewards.drops.length > 0) {
              const dName = ITEM_DB[rewards.drops[0].id]?.name || '未知物品';
              addLog(`獲得戰利品: ${dName}`, 'drop');
          }

          setGameState(checkLevelUp(newState));

      } else if (result === 'loss') {
          setGameState(prev => ({ ...prev, hp: 1, injury: 100 }));
          addLog(`不敵 ${battle.enemy.name}，身受重傷，狼狽逃回！`, 'warn');
          if (autoLoop) setAutoLoop(false); // Stop loop on loss
      } else if (result === 'escaped') {
          setGameState(prev => ({ ...prev, hp: battle.player.curHp, mp: battle.player.curMp }));
          addLog(`成功從 ${battle.enemy.name} 手中逃脫。`, 'system');
          if (autoLoop) setAutoLoop(false); // Stop loop on escape
      }

      setBattle(null);
  };

  const restartBattle = () => {
      if(!battle) return;
      
      const { newState, rewards } = battle.finalRewards ? { 
          newState: { 
              ...gameState, 
              hp: battle.player.curHp, 
              mp: battle.player.curMp, 
              stones: gameState.stones + battle.finalRewards.stones,
              exp: gameState.injury === 0 ? gameState.exp + battle.finalRewards.exp : gameState.exp,
              inventory: [...gameState.inventory, ...battle.finalRewards.drops]
          }, 
          rewards: battle.finalRewards 
      } : calculateWinState();
      
      if (gameState.injury > 0) addLog(`擊敗 ${battle.enemy.name}。重傷狀態下無法獲取修為。`, 'warn');
      else addLog(`擊敗 ${battle.enemy.name}，獲得 ${rewards.stones} 靈石, ${rewards.exp} 修為`, 'gain');
      if(rewards.drops.length > 0) {
          const dName = ITEM_DB[rewards.drops[0].id]?.name || '未知物品';
          addLog(`獲得戰利品: ${dName}`, 'drop');
      }
      
      const leveledState = checkLevelUp(newState);
      setGameState(leveledState);
      
      explore(leveledState);
  };

  // --- GM Functions ---
  const gmHeal = () => {
      setGameState(p => {
          const s = calculateStats(p);
          return {
            ...p, hp: s.maxHp, mp: s.maxMp, injury: 0, demon: 0, qiDeviation: false, mapId: p.mapId === 99 ? 0 : p.mapId
          };
      });
      addLog("GM: 狀態全滿", 'system');
  };
  const gmStones = () => {
      setGameState(p => ({ ...p, stones: p.stones + 100000 }));
      addLog("GM: 獲得 100,000 靈石", 'system');
  };
  const gmExp = () => {
      setGameState(p => ({ ...p, exp: p.maxExp }));
      addLog("GM: 修為已至圓滿", 'system');
  };
  const gmRealmUp = () => {
      setGameState(p => {
          const nextRealm = Math.min(REALMS.length - 1, p.realm + 1);
          const newMaxExp = 1000000000; // Simplified for GM
          return {
              ...p,
              realm: nextRealm,
              level: 1,
              exp: 0,
              maxExp: newMaxExp,
              maxHp: Math.floor(p.maxHp * 1.5),
              maxMp: Math.floor(p.maxMp * 1.5),
              hp: Math.floor(p.maxHp * 1.5),
              mp: Math.floor(p.maxMp * 1.5),
              demon: 0
          };
      });
      addLog(`GM: 境界強制突破`, 'system');
  };
  const gmAddItem = (id: string) => {
      const newItems = createItem(id);
      setGameState(p => ({ ...p, inventory: [...p.inventory, ...newItems] }));
      addLog(`GM: 獲得物品 ${ITEM_DB[id].name}`, 'system');
  };

  const attemptBreakthrough = () => {
    if (gameState.injury > 0) { addLog("重傷狀態無法突破！", 'warn'); return; }
    if (gameState.level < 10 || gameState.exp < gameState.maxExp) { addLog("修為尚未圓滿。", 'warn'); return; }

    let rate = [100, 60, 45, 30, 20, 15, 10, 5][gameState.realm] || 5;
    rate += Math.min(15, currentStats.luk * 0.5);

    const fUid = gameState.equip.furnace;
    if (fUid) {
        const item = gameState.inventory.find(i => i.uid === fUid);
        if(item) rate += item.finalVal;
    }
    const aUid = gameState.equip.artifact;
    if (aUid) {
        const item = gameState.inventory.find(i => i.uid === aUid);
        if(item) rate += item.finalVal;
    }

    if (gameState.demon > 20) rate -= (gameState.demon - 20) * 0.5;
    rate = Math.min(95, Math.max(1, rate));

    const roll = Math.random() * 100;
    
    if (roll <= rate) {
        setGameState(prev => {
            const nextRealm = prev.realm + 1;
            const mult = [1, 20, 80, 300, 1200, 5000, 20000, 80000, 320000];
            const m = mult[nextRealm] || mult[mult.length-1];
            const newMaxExp = Math.floor(100 * m); 
            return {
                ...prev,
                realm: nextRealm,
                level: 1,
                exp: 0,
                maxExp: newMaxExp,
                maxHp: Math.floor(prev.maxHp * 1.5),
                demon: Math.max(0, prev.demon - 10)
            };
        });
        addLog(`突破成功！踏入 ${REALMS[gameState.realm + 1]} 之境！`, 'gain');
    } else {
        setGameState(prev => {
            const expLoss = Math.floor(prev.exp * 0.9);
            let demonGain = 10;
            const rUid = prev.equip.robe;
            if (rUid) {
                const item = prev.inventory.find(i => i.uid === rUid);
                if (item) {
                     if (ITEM_DB[item.id].rarity === 'legend') demonGain = 0;
                     else demonGain -= item.finalVal;
                }
            }
            demonGain = Math.max(0, demonGain);
            
            let qiDeviation = prev.qiDeviation;
            let mapId = prev.mapId;
            if (prev.demon + demonGain >= 80 && Math.random() > 0.5) {
                qiDeviation = true;
                mapId = 99;
                addLog(`=== 走火入魔 === 墮入魔域結界！`, 'warn');
            }

            return { ...prev, exp: expLoss, demon: prev.demon + demonGain, qiDeviation, mapId };
        });
        addLog(`突破失敗... 心魔滋生`, 'warn');
    }
  };

  const useItem = (item: ItemInstance) => {
      const dbItem = ITEM_DB[item.id];
      
      if (item.id === 'bk_random') {
          const allBooks = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].type === 'skill_book');
          const randomBookId = allBooks[Math.floor(Math.random() * allBooks.length)];
          const newBooks = createItem(randomBookId);
          const bookName = ITEM_DB[randomBookId].name;
          
          setGameState(prev => ({
              ...prev,
              inventory: [...prev.inventory.filter(i => i.uid !== item.uid), ...newBooks]
          }));
          addLog(`打開泥如可寶典，獲得了: ${bookName}！`, 'gain');
          return;
      }
      
      if (dbItem.type === 'use' || dbItem.type === 'skill_book') {
          if (dbItem.type === 'skill_book') {
             const skillId = dbItem.id.replace('bk_', 's_');
             const skillDef = SKILL_DB[skillId];
             if (!skillDef) return;

             setGameState(prev => {
                 let learned = [...prev.learnedSkills];
                 if (!learned.includes(skillId)) {
                     learned.push(skillId);
                     addLog(`習得技能: ${skillDef.name}`, 'gain');
                     
                     const eq = { ...prev.equip };
                     if (!eq.skill1) eq.skill1 = skillId;
                     else if (!eq.skill2) eq.skill2 = skillId;
                     else if (!eq.skill3) eq.skill3 = skillId;

                     const inv = prev.inventory.filter(i => i.uid !== item.uid);
                     return { ...prev, equip: eq, inventory: inv, learnedSkills: learned };
                 } else {
                     addLog("已習得此技能", 'warn');
                     return prev;
                 }
             });
             return;
          }

          if (dbItem.effect) {
              const res = dbItem.effect(gameState); 
              if (res === '僅突破時生效') {
                  addLog(res, 'warn');
                  return;
              }
              setGameState(prev => {
                  const copy = { ...prev };
                  dbItem.effect?.(copy);
                  const stats = calculateStats(copy);
                  if (copy.hp > stats.maxHp) copy.hp = stats.maxHp;
                  if (copy.mp > stats.maxMp) copy.mp = stats.maxMp;
                  const inv = copy.inventory.filter(i => i.uid !== item.uid);
                  return { ...copy, inventory: inv };
              });
              addLog(`使用了 ${dbItem.name}`, 'system');
          }
      } else {
          // Equip
          const slotMap: Record<string, keyof GameState['equip']> = { 
              'weapon':'weapon', 'armor':'armor', 'furnace':'furnace', 'robe':'robe', 'artifact':'artifact' 
          };
          const slot = slotMap[dbItem.type];
          if (slot) {
              setGameState(prev => {
                  const newEquip = { ...prev.equip };
                  const newInv = prev.inventory.filter(i => i.uid !== item.uid);
                  
                  if (prev.equip[slot]) {
                      const oldUid = prev.equip[slot];
                      if(oldUid) {
                          const oldItem = prev.inventory.find(i => i.uid === oldUid);
                          if(oldItem) newInv.push(oldItem);
                      }
                  }
                  newEquip[slot] = item.uid;
                  return { ...prev, equip: newEquip };
              });
              addLog(`裝備了 ${dbItem.name}`, 'system');
          }
      }
  };

  const unequipItem = (slot: keyof GameState['equip']) => {
      setGameState(prev => ({
          ...prev,
          equip: { ...prev.equip, [slot]: null }
      }));
      addLog(`卸下了裝備/技能`, 'system');
  };

  const equipSkill = (skillId: string) => {
      setGameState(prev => {
          const eq = { ...prev.equip };
          if (!eq.skill1) eq.skill1 = skillId;
          else if (!eq.skill2) eq.skill2 = skillId;
          else if (!eq.skill3) eq.skill3 = skillId;
          else {
              addLog("技能欄已滿，請先卸下舊技能", 'warn');
              return prev; 
          }
          addLog(`裝備技能: ${SKILL_DB[skillId].name}`, 'system');
          return { ...prev, equip: eq };
      });
  };

  const getComparison = (item: ItemInstance) => {
      const db = ITEM_DB[item.id];
      if (!db) return null;
      const type = db.type;
      
      if (type === 'skill_book' || item.id === 'bk_random') return null;

      const slotMap: Record<string, keyof GameState['equip']> = { 
          'weapon':'weapon', 'armor':'armor', 'furnace':'furnace', 'robe':'robe', 'artifact':'artifact' 
          };
      const slot = slotMap[type];
      
      if (!slot) return <span className="text-gray-500">🪬</span>;

      const equippedUid = gameState.equip[slot];
      if (!equippedUid) return <span className="text-green-500">⬆️</span>;
      if (equippedUid === item.uid) return <span className="text-gray-500">↔️</span>;

      const equippedItem = gameState.inventory.find(i => i.uid === equippedUid);
      if (!equippedItem) return <span className="text-green-500">⬆️</span>;

      if (item.finalVal > equippedItem.finalVal) return <span className="text-green-500">⬆️</span>;
      if (item.finalVal < equippedItem.finalVal) return <span className="text-red-500">⬇️</span>;
      return <span className="text-gray-500">↔️</span>;
  };

  const sellItem = (item: ItemInstance) => {
      const dbItem = ITEM_DB[item.id];
      if (['epic', 'legend', 'myth'].includes(dbItem.rarity)) {
          if(!window.confirm(`確定要販售稀有物品 ${dbItem.name}?`)) return;
      }
      const val = Math.floor(dbItem.price * 0.3);
      setGameState(prev => ({
          ...prev,
          stones: prev.stones + val,
          inventory: prev.inventory.filter(i => i.uid !== item.uid),
          equip: { // Unequip if sold
              ...prev.equip,
              weapon: prev.equip.weapon === item.uid ? null : prev.equip.weapon,
              armor: prev.equip.armor === item.uid ? null : prev.equip.armor,
              furnace: prev.equip.furnace === item.uid ? null : prev.equip.furnace,
              robe: prev.equip.robe === item.uid ? null : prev.equip.robe,
              artifact: prev.equip.artifact === item.uid ? null : prev.equip.artifact,
          }
      }));
      addLog(`販售 ${dbItem.name}，獲得 ${val} 靈石`, 'gain');
  };

  const buyItem = (id: string) => {
      const dbItem = ITEM_DB[id];
      if (gameState.stones >= dbItem.price) {
          const newItems = createItem(id);
          setGameState(prev => ({
              ...prev,
              stones: prev.stones - dbItem.price,
              inventory: [...prev.inventory, ...newItems]
          }));
          addLog(`購買了 ${dbItem.name}`, 'gain');
      } else {
          addLog("靈石不足", 'warn');
      }
  };

  const retreat = () => {
    if (gameState.stones < 50) { addLog("靈石不足", 'warn'); return; }
    setGameState(prev => {
        const reduction = Math.floor(Math.random() * 10) + 10;
        const newDemon = Math.max(0, prev.demon - reduction);
        let qiDeviation = prev.qiDeviation;
        let mapId = prev.mapId;
        if (newDemon < 50 && prev.qiDeviation) {
            qiDeviation = false;
            mapId = 0;
            addLog("神智恢復清明。", 'gain');
        }
        addLog(`閉關結束，心魔減少 ${reduction}`, 'system');
        return { ...prev, stones: prev.stones - 50, demon: newDemon, qiDeviation, mapId };
    });
  };

  const healInjury = () => {
      if (gameState.stones < 1000) { addLog("靈石不足 (需1000)", 'warn'); return; }
      if (gameState.injury <= 0) { addLog("無需療傷", 'system'); return; }
      setGameState(prev => ({
          ...prev,
          stones: prev.stones - 1000,
          injury: Math.max(0, prev.injury - 5)
      }));
      addLog("重傷恢復 -5%", 'gain');
  };

  // --- Creation Logic ---
  const handleStatAlloc = (stat: keyof typeof creationPoints, delta: number) => {
      setCreationPoints(prev => {
          if (stat === 'remain') return prev;
          const current = prev[stat];
          if (delta > 0 && prev.remain > 0 && current < 5) {
              return { ...prev, [stat]: current + 1, remain: prev.remain - 1 };
          }
          if (delta < 0 && current > 1) {
              return { ...prev, [stat]: current - 1, remain: prev.remain + 1 };
          }
          return prev;
      });
  };

  const startNewGame = () => {
      if (!creationName) return alert("請輸入道號");
      if (creationPoints.remain > 0) return alert("請分配所有點數");
      
      const newState: GameState = {
          ...INITIAL_STATE,
          name: creationName,
          stats: {
              gold: creationPoints.gold,
              wood: creationPoints.wood,
              water: creationPoints.water,
              fire: creationPoints.fire,
              earth: creationPoints.earth
          },
          isGM: creationName === 'CCJ888'
      };
      if(newState.isGM) newState.stones = 88888;
      
      setGameState(newState);
      setScreen('prologue');
  };

  // --- Renders ---

  // LOGIN SCREEN
  if (screen === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=5')] bg-cover bg-blend-overlay">
        <Card className="w-full max-w-md bg-black/90 border-yellow-600/50 backdrop-blur" title={<div className="text-center text-2xl mb-2">踏入仙途</div>}>
          <div className="space-y-6">
            <div className="text-center text-gray-400 text-xs tracking-widest mb-4">BLACK DRAGON ORDER {VERSION}</div>
            
            <input 
              type="text" 
              placeholder="請輸入道號 (最多8字)" 
              maxLength={8}
              className="w-full bg-[#222] border border-gray-600 p-3 text-center text-white focus:border-yellow-500 outline-none"
              value={creationName}
              onChange={e => setCreationName(e.target.value)}
            />

            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                <span>剩餘點數 <span className='text-xs text-gray-500'>(單項上限5點)</span></span>
                <span className="text-yellow-400 font-bold">{creationPoints.remain}</span>
              </div>
              {['gold','wood','water','fire','earth'].map(s => (
                <div key={s} className="flex justify-between items-center py-1">
                  <span className={`${ELEM_COLORS[s]} capitalize w-20`}>{ELEM_NAMES[s]}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleStatAlloc(s as any, -1)} className="w-8 h-8 bg-[#333] hover:bg-[#444] border border-gray-600">-</button>
                    <span className="w-4 text-center">{creationPoints[s as keyof typeof creationPoints]}</span>
                    <button onClick={() => handleStatAlloc(s as any, 1)} className="w-8 h-8 bg-[#333] hover:bg-[#444] border border-gray-600">+</button>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={startNewGame} className="w-full py-4 text-lg">開始修煉</Button>
            
            <div className="text-center">
                <button onClick={() => setShowIO('import')} className="text-gray-500 hover:text-gray-300 text-xs underline">匯入存檔</button>
            </div>
          </div>
        </Card>

        {showIO === 'import' && (
            <Modal title="匯入存檔" onClose={() => setShowIO(null)}>
                <textarea className="w-full h-32 bg-[#222] text-white p-2 text-xs mb-4" placeholder="貼上存檔代碼..." value={ioText} onChange={e => setIoText(e.target.value)} />
                <Button onClick={() => {
                    try {
                        const parsed = JSON.parse(atob(ioText));
                        if(parsed.name) {
                            setGameState(parsed);
                            setScreen('game');
                            setShowIO(null);
                        } else alert("Invalid Save");
                    } catch(e) { alert("Invalid Code"); }
                }}>確認匯入</Button>
            </Modal>
        )}
      </div>
    );
  }

  // PROLOGUE SCREEN
  if (screen === 'prologue') {
      const pText = PROLOGUE_TEXT.replace('<PLAYER_NAME>', `<span class="text-yellow-500 font-bold">${gameState.name}</span>`);
      return (
          <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
              <div className="max-w-2xl w-full bg-[#111] border border-gray-800 p-8 shadow-2xl">
                  <h1 className="text-red-700 text-3xl font-serif text-center mb-8 border-b border-gray-800 pb-4">黑龍令 · 開章</h1>
                  <div className="prose prose-invert prose-p:text-gray-400 max-h-[60vh] overflow-y-auto pr-4 mb-8 whitespace-pre-wrap font-serif leading-loose" dangerouslySetInnerHTML={{__html: pText}}></div>
                  <Button onClick={() => {
                      setGameState(prev => ({ ...prev, seenPrologue: true }));
                      setScreen('game');
                      saveGame();
                  }} className="w-full">踏入黑龍塚</Button>
              </div>
          </div>
      );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-2 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="md:col-span-12 flex justify-between items-center border-b-2 border-yellow-800 pb-4 mb-2">
        <div>
          <h1 className="text-3xl text-yellow-500 font-serif font-bold tracking-[0.2em] uppercase text-shadow-sm">黑龍令 <span className="text-xs text-gray-600 align-middle tracking-normal ml-2">{VERSION}</span></h1>
        </div>
        <div className="flex gap-2">
           {gameState.isGM && <Button variant="danger" className="text-xs px-2 py-1 flex items-center gap-1" onClick={() => setShowGM(true)}>
               <Wrench size={14} /> GM
           </Button>}
           <button onClick={() => setShowSettings(!showSettings)} className="p-2 border border-gray-700 hover:border-yellow-500 rounded text-yellow-500 transition-colors">
             <Settings size={20} />
           </button>
        </div>
      </div>

      {/* SETTINGS MENU */}
      {showSettings && (
          <div className="md:col-span-12 flex justify-end gap-2 mb-4 animate-in slide-in-from-top-2">
              <Button variant="outline" onClick={saveGame} className="flex gap-2 items-center"><Save size={14}/> 儲存</Button>
              <Button variant="outline" onClick={() => {
                  setIoText(btoa(JSON.stringify(gameState)));
                  setShowIO('export');
              }} className="flex gap-2 items-center"><Download size={14}/> 匯出</Button>
              <Button variant="outline" onClick={() => {
                  setIoText('');
                  setShowIO('import');
              }} className="flex gap-2 items-center"><Upload size={14}/> 匯入</Button>
              <Button variant="danger" onClick={() => {
                  if(confirm("確定刪除存檔並重置?")) {
                      localStorage.removeItem('bdo_save_v9');
                      window.location.reload();
                  }
              }} className="flex gap-2 items-center"><Trash2 size={14}/> 重置</Button>
          </div>
      )}

      {/* LEFT PANEL: STATS */}
      <div className="md:col-span-4 flex flex-col gap-4">
        <Card className="text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-600 to-transparent opacity-50"></div>
            <h2 className="text-2xl font-bold text-white mb-1">{gameState.name}</h2>
            <div className="flex justify-center items-center gap-2 text-yellow-500 font-serif mb-2">
                <span>{REALMS[gameState.realm]}</span>
                <span className="text-xs border border-yellow-700 px-1 rounded">{gameState.level}重</span>
                {gameState.injury > 0 && <span className="text-red-500 animate-pulse text-xs font-bold">[重傷 {gameState.injury}%]</span>}
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm bg-[#151515] p-2 rounded border border-gray-800 mb-4">
                <div className="flex justify-between"><span>⚔️ 攻擊</span><span className="text-gray-300">{currentStats.atk}</span></div>
                <div className="flex justify-between"><span>🛡️ 防禦</span><span className="text-gray-300">{currentStats.def}</span></div>
                <div className="flex justify-between"><span>🍀 氣運</span><span className="text-gray-300">{currentStats.luk}</span></div>
                <div className="flex justify-between"><span>💎 靈石</span><span className="text-blue-300">{gameState.stones}</span></div>
                {/* Elements */}
                {['gold','wood','water','fire','earth'].map(e => (
                   <div key={e} className={`flex justify-between ${ELEM_COLORS[e]}`}>
                       <span className="capitalize">{ELEM_NAMES[e]}</span>
                       <div className="flex items-center gap-1">
                           <span>{gameState.stats[e as keyof Stats]}</span>
                           {gameState.freePoints > 0 && <button onClick={() => setGameState(p => ({...p, freePoints: p.freePoints-1, stats:{...p.stats, [e]: p.stats[e as keyof Stats]+1}}))} className="text-[10px] bg-gray-800 px-1 border border-gray-600 hover:border-white">+</button>}
                       </div>
                   </div>
                ))}
                {gameState.freePoints > 0 && <div className="col-span-2 text-center text-xs text-green-400">剩餘點數: {gameState.freePoints}</div>}
            </div>

            {/* Bars */}
            <ProgressBar value={gameState.hp} max={currentStats.maxHp} label="HP" color="bg-red-600" />
            <ProgressBar value={gameState.mp} max={currentStats.maxMp} label="MP" color="bg-purple-600" />
            <ProgressBar value={gameState.exp} max={gameState.maxExp} label="修為" color="bg-yellow-600" />
            <ProgressBar value={gameState.demon} max={100} label="心魔" color="bg-indigo-900" />
        </Card>

        {/* Equipment */}
        <Card title="裝備" className="flex-grow">
            <div className="space-y-2">
                {[
                    { slot: 'weapon', label: '武器', icon: <Sword size={14}/> },
                    { slot: 'skill1', label: '技能I', icon: <Zap size={14}/> },
                    { slot: 'skill2', label: '技能II', icon: <Zap size={14}/> },
                    { slot: 'skill3', label: '技能III', icon: <Zap size={14}/> },
                    { slot: 'armor', label: '防具', icon: <Shield size={14}/> },
                    { slot: 'furnace', label: '丹爐', icon: <Archive size={14}/> }, 
                    { slot: 'robe', label: '法袍', icon: <Users size={14}/> },
                    { slot: 'artifact', label: '靈器', icon: <Gem size={14}/> },
                ].map(({ slot, label, icon }) => {
                    const val = gameState.equip[slot as keyof GameState['equip']];
                    // Skills are string IDs, items are UIDs
                    const isSkill = slot.startsWith('skill');
                    let dbName = '';
                    let rarity = 'common';
                    
                    if (isSkill) {
                        if (val) {
                            const skill = SKILL_DB[val as string];
                            dbName = skill?.name || '';
                            rarity = 'epic'; // Skills color
                        }
                    } else {
                        if (val) {
                            const item = gameState.inventory.find(i => i.uid === val);
                            if(item && ITEM_DB[item.id]) {
                                dbName = ITEM_DB[item.id].name;
                                rarity = ITEM_DB[item.id].rarity;
                            }
                        }
                    }

                    return (
                        <div key={slot} className="flex items-center justify-between bg-[#151515] p-2 rounded border border-gray-800 text-sm h-12">
                            <div className="flex items-center gap-2 text-gray-500 w-16">
                                {icon} <span className="text-xs">{label}</span>
                            </div>
                            {val ? (
                                <div className="flex-grow text-right flex items-center justify-end gap-2">
                                    <div className="flex-grow">
                                        <div className={`${RARITY_COLORS[rarity]} font-medium truncate`}>
                                            {dbName} {!isSkill && val && getComparison(gameState.inventory.find(i => i.uid === val)!)}
                                        </div>
                                    </div>
                                    <button onClick={() => unequipItem(slot as keyof GameState['equip'])} className="text-gray-500 hover:text-red-400"><XCircle size={14} /></button>
                                </div>
                            ) : <span className="text-gray-600 flex-grow text-right">無</span>}
                        </div>
                    );
                })}
            </div>
        </Card>
      </div>

      {/* RIGHT PANEL: ACTIONS & TABS */}
      <div className="md:col-span-8 flex flex-col gap-4 h-[calc(100vh-120px)]">
         
         {/* TABS HEADER */}
         <div className="flex border-b border-gray-700 bg-[#1e1e1e]">
             {[
                 { id: 'adventure', label: '冒險', icon: <Sword size={16}/> },
                 { id: 'cave', label: '洞窟', icon: <Sparkles size={16}/> },
                 { id: 'bag', label: '百納袋', icon: <Scroll size={16}/> },
                 { id: 'skills', label: '功法', icon: <BookOpen size={16}/> },
                 { id: 'market', label: '坊市', icon: <Gem size={16}/> },
             ].map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${activeTab === tab.id ? 'text-yellow-500 border-b-2 border-yellow-500 bg-[#252525]' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     {tab.icon} {tab.label}
                 </button>
             ))}
         </div>

         {/* TAB CONTENT */}
         <div className="flex-grow bg-[#1e1e1e] p-4 border border-gray-700 overflow-hidden flex flex-col relative">
             
             {/* ADVENTURE TAB */}
             {activeTab === 'adventure' && (
                 <div className="flex flex-col h-full gap-4">
                     <select 
                        value={gameState.mapId} 
                        onChange={e => setGameState(p => ({ ...p, mapId: parseInt(e.target.value) }))}
                        disabled={gameState.qiDeviation}
                        className="w-full bg-[#111] border border-gray-600 p-2 text-white"
                     >
                         {gameState.qiDeviation 
                            ? <option value={99}>☣️ 魔域結界</option> 
                            : MAPS.filter(m => m.id !== 99).map(m => <option key={m.id} value={m.id}>{m.name} (LV.{m.minRealm})</option>)
                         }
                     </select>
                    
                    {/* Breakthrough Button */}
                    {gameState.level === 10 && gameState.exp >= gameState.maxExp && (
                         <button onClick={attemptBreakthrough} className="w-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 text-black font-bold py-3 animate-pulse border border-yellow-300">
                             ⚠️ 嘗試境界突破
                         </button>
                    )}

                     <div className="grid grid-cols-3 gap-2">
                         <Button onClick={meditate} variant="outline" className="h-20 flex flex-col items-center justify-center gap-1">
                             <div className="text-2xl">🧘</div>
                             <div className="text-xs">打坐</div>
                         </Button>
                         <Button onClick={cultivate} variant="outline" className="h-20 flex flex-col items-center justify-center gap-1">
                             <div className="text-2xl">⚡</div>
                             <div className="text-xs">修煉</div>
                         </Button>
                         <Button onClick={() => explore()} variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 border-red-900 bg-red-900/10 hover:bg-red-900/30">
                             <div className="text-2xl">⚔️</div>
                             <div className="text-xs text-red-300">歷練</div>
                         </Button>
                     </div>

                     <div className="flex-grow bg-black/50 border border-gray-800 p-2 overflow-y-auto font-mono text-sm custom-scrollbar flex flex-col" ref={logRef}>
                         {logs.map(log => (
                             <div key={log.id} className={`mb-1 border-b border-gray-800/50 pb-1 ${
                                 log.type === 'gain' ? 'text-green-400' :
                                 log.type === 'warn' ? 'text-red-400' :
                                 log.type === 'system' ? 'text-yellow-600' :
                                 log.type === 'combat' ? 'text-gray-400 italic' :
                                 log.type === 'drop' ? 'text-purple-400 font-bold' : 'text-gray-300'
                             }`}>
                                 <span className="text-gray-600 text-[10px] mr-2">[{log.time}]</span>
                                 {log.message}
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* CAVE TAB */}
             {activeTab === 'cave' && (
                 <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                     <div className="text-6xl animate-pulse">🧘‍♂️</div>
                     <div className="text-gray-400 max-w-sm">
                         洞窟幽靜，可在此閉關化解心魔，或花費靈石治療重傷。
                     </div>
                     <div className="space-y-4 w-full max-w-xs">
                        <Button onClick={retreat} className="w-full flex justify-between">
                            <span>閉關清修</span>
                            <span className="text-xs text-blue-300">-50靈石</span>
                        </Button>
                        <Button onClick={healInjury} variant="danger" className="w-full flex justify-between">
                            <span>治療重傷</span>
                            <span className="text-xs text-yellow-300">-1000靈石</span>
                        </Button>
                     </div>
                 </div>
             )}

             {/* BAG TAB */}
             {activeTab === 'bag' && (
                 <div className="flex flex-col h-full">
                     <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                         {['all','weapon','armor','skill_book','consumable','misc'].map(f => (
                             <button 
                                key={f} 
                                onClick={() => setBagFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs border ${bagFilter === f ? 'bg-yellow-900 border-yellow-600 text-yellow-200' : 'bg-black border-gray-700 text-gray-400'}`}
                             >
                                 {f === 'consumable' ? '丹藥' : f === 'misc' ? '素材' : f === 'all' ? '全部' : f === 'weapon' ? '武器' : f === 'armor' ? '防具' : '秘籍'}
                             </button>
                         ))}
                     </div>

                     <div className="mb-2">
                        <Button variant="danger" className="w-full py-1 text-xs" onClick={() => setShowBulkSell(true)}>🗑️ 批量販售</Button>
                     </div>

                     <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {gameState.inventory.filter(i => {
                            const dbItem = ITEM_DB[i.id];
                            if (!dbItem) return false;
                            const type = dbItem.type;
                            if (gameState.equip.weapon === i.uid || gameState.equip.armor === i.uid || gameState.equip.furnace === i.uid || gameState.equip.robe === i.uid || gameState.equip.artifact === i.uid) return false; // Hide equipped items from bag list to simplify
                            if (bagFilter === 'all') return true;
                            if (bagFilter === 'weapon') return type === 'weapon';
                            if (bagFilter === 'armor') return type === 'armor';
                            if (bagFilter === 'skill_book') return type === 'skill_book';
                            if (bagFilter === 'consumable') return type === 'use' && !i.id.startsWith('bk_'); // Exclude books from consumable filter if specific
                            if (bagFilter === 'misc') return !['weapon','armor','use','skill_book'].includes(type);
                            return true;
                        }).map(item => {
                            const db = ITEM_DB[item.id];
                            return (
                                <div key={item.uid} className="bg-[#111] border border-gray-700 p-2 flex justify-between items-center text-sm group hover:border-gray-500 transition-colors">
                                    <div>
                                        <div className={`font-bold ${RARITY_COLORS[db.rarity]}`}>
                                            {db.name} {getComparison(item)}
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                                            {item.finalVal > 0 && <span>效能: {item.finalVal}</span>}
                                            {db.type === 'skill_book' && <span>{db.desc} (MP: {db.reqMp || 0})</span>}
                                            <div className="flex gap-1">
                                                {item.elements.map((e, idx) => <span key={idx} className={`w-2 h-2 rounded-full ${e === 'gold' ? 'bg-yellow-400' : e === 'fire' ? 'bg-red-500' : e === 'water' ? 'bg-blue-400' : e === 'wood' ? 'bg-green-500' : 'bg-orange-400'}`}></span>)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => useItem(item)} className="bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 text-xs border border-gray-600 rounded">
                                            {db.type === 'use' ? '使用' : db.type === 'skill_book' ? '學習' : '裝備'}
                                        </button>
                                        <button onClick={() => sellItem(item)} className="bg-red-900/30 hover:bg-red-900/50 text-red-300 px-2 py-1 text-xs border border-red-900 rounded">
                                            販售
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {gameState.inventory.length === 0 && <div className="text-center text-gray-600 mt-10">百納袋空空如也</div>}
                     </div>
                 </div>
             )}

             {/* SKILLS TAB */}
             {activeTab === 'skills' && (
                 <div className="flex flex-col h-full gap-4">
                     {/* Equipped */}
                     <div className="grid grid-cols-3 gap-2">
                        {['skill1', 'skill2', 'skill3'].map((slot, idx) => {
                            const skillId = gameState.equip[slot as keyof typeof gameState.equip];
                            const skill = skillId ? SKILL_DB[skillId] : null;
                            return (
                                <div key={slot} className="border border-gray-700 bg-black/40 p-2 flex flex-col items-center text-center relative h-24 justify-center">
                                    <div className="text-xs text-gray-500 absolute top-1 left-1">Slot {idx+1}</div>
                                    {skill ? (
                                        <>
                                            <div className="text-yellow-500 font-bold text-sm mb-1">{skill.name}</div>
                                            <div className="text-[10px] text-gray-400 mb-2">{skill.type === 'active' ? `MP:${skill.mpCost} CD:${skill.cooldown}` : '被動'}</div>
                                            <button onClick={() => unequipItem(slot as any)} className="text-xs bg-red-900/30 border border-red-800 text-red-300 px-2 py-0.5 hover:bg-red-900/50">卸下</button>
                                        </>
                                    ) : (
                                        <div className="text-gray-600 text-xs">空</div>
                                    )}
                                </div>
                            );
                        })}
                     </div>

                     <div className="border-t border-gray-700 my-2"></div>

                     {/* Known Skills List */}
                     <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2">
                        <div className="text-xs text-gray-400 mb-2 uppercase tracking-widest">已習得技能 ({gameState.learnedSkills.length})</div>
                        {gameState.learnedSkills.length === 0 && <div className="text-gray-600 text-center text-sm py-4">尚未習得任何技能</div>}
                        {gameState.learnedSkills.map(sid => {
                            const skill = SKILL_DB[sid];
                            const isEquipped = Object.values(gameState.equip).includes(sid);
                            return (
                                <div key={sid} className="bg-[#111] border border-gray-700 p-2 flex justify-between items-center text-sm">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${ELEM_COLORS[skill.element]}`}>{skill.name}</span>
                                            {skill.type === 'passive' && <span className="text-[10px] bg-gray-800 px-1 border border-gray-600 text-gray-400">被動</span>}
                                        </div>
                                        <div className="text-xs text-gray-500">{skill.desc}</div>
                                        {skill.type === 'active' && <div className="text-[10px] text-blue-400 mt-1">消耗: {skill.mpCost} MP | 冷卻: {skill.cooldown} 回合</div>}
                                    </div>
                                    <div>
                                        {isEquipped ? (
                                            <span className="text-green-500 text-xs border border-green-900 bg-green-900/20 px-2 py-1">已裝備</span>
                                        ) : (
                                            <button onClick={() => equipSkill(sid)} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 text-xs border border-gray-600">
                                                裝備
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                     </div>
                 </div>
             )}

             {/* MARKET TAB */}
             {activeTab === 'market' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1">
                     {Object.entries(ITEM_DB)
                        .filter(([id, item]) => 
                            // Show common non-skill items OR specifically bk_random
                            (item.rarity === 'common' || item.type === 'use') && (item.type !== 'skill_book' || id === 'bk_random')
                        )
                        .map(([key, item]) => (
                         <div key={key} className="bg-[#111] border border-gray-700 p-2 flex justify-between items-center text-sm">
                             <div>
                                 <div className={`font-bold ${RARITY_COLORS[item.rarity]}`}>{item.name}</div>
                                 <div className="text-xs text-gray-500">{item.desc || '普通物品'}</div>
                             </div>
                             <Button variant="outline" className="text-xs py-1 px-2 border-yellow-900 text-yellow-500" onClick={() => buyItem(key)}>
                                 {item.price} 💎
                             </Button>
                         </div>
                     ))}
                 </div>
             )}

         </div>
      </div>

      {/* Battle Modal - Reverted to Standard Layout */}
      {battle && (
          <Modal title="戰鬥中" onClose={() => { /* Handled by internal buttons usually */ }}>
              <div className="space-y-4">
                  {/* Status Bars Row */}
                  <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <div className="w-5/12">
                          <div className="text-yellow-500 font-bold mb-1">{battle.player.name}</div>
                          <ProgressBar value={battle.player.curHp} max={battle.player.maxHp} color="bg-green-600" label="HP" />
                          <ProgressBar value={battle.player.curMp} max={battle.player.maxMp} color="bg-blue-600" label="MP" />
                          {/* Buffs and Passive Indicators */}
                          <div className="flex gap-1 mt-1 flex-wrap">
                              {/* Display Active Passives */}
                              {['skill1','skill2','skill3'].map(slot => {
                                  const sid = gameState.equip[slot as keyof typeof gameState.equip];
                                  if(!sid) return null;
                                  const skill = SKILL_DB[sid];
                                  if(skill?.type === 'passive') {
                                      return <span key={sid} className={`text-[10px] px-1 border border-gray-600 rounded ${ELEM_COLORS[skill.element]}`}>{skill.name}</span>
                                  }
                                  return null;
                              })}
                              {battle.player.buffs.map(b => <span key={b.id} className="text-[10px] px-1 bg-gray-700 rounded text-gray-300">{b.name}({b.duration})</span>)}
                          </div>
                      </div>
                      <div className="w-2/12 text-center flex flex-col items-center">
                          <div className="text-red-900 font-bold text-xl self-center">VS</div>
                          <button 
                            onClick={() => setAutoLoop(!autoLoop)} 
                            className={`mt-2 text-[10px] flex items-center gap-1 px-2 py-1 rounded border ${autoLoop ? 'bg-yellow-900 border-yellow-500 text-yellow-500' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                          >
                              <Repeat size={10} /> {autoLoop ? '循環' : '單次'}
                          </button>
                      </div>
                      <div className="w-5/12 text-right">
                          <div className="text-red-500 font-bold mb-1">{battle.enemy.name} <span className="text-xs text-gray-500">[{ELEM_NAMES[battle.enemy.element]}]</span></div>
                          <ProgressBar value={battle.enemy.curHp} max={battle.enemy.maxHp} color="bg-red-600" label="HP" />
                          <div className="flex gap-1 mt-1 justify-end flex-wrap">
                              {battle.enemy.buffs.map(b => <span key={b.id} className="text-[10px] px-1 bg-gray-700 rounded text-gray-300">{b.name}({b.duration})</span>)}
                          </div>
                      </div>
                  </div>

                  {/* Log (Newest at Top) */}
                  {battle.result === 'ongoing' && (
                      <div className="h-48 overflow-y-auto bg-black p-2 text-xs font-mono space-y-1 border border-gray-700 custom-scrollbar">
                          {battle.logs.slice().reverse().map((log, i) => <div key={i} className={`border-b border-gray-900 pb-0.5 ${log.startsWith('>')?'text-green-300':log.startsWith('<')?'text-red-300':log.startsWith('>>>')?'text-yellow-500 font-bold':''}`}>{log}</div>)}
                      </div>
                  )}

                  {/* Results Screen */}
                  {battle.result !== 'ongoing' && (
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-700 space-y-3">
                          <div className={`text-2xl font-bold ${battle.result === 'win' ? 'text-yellow-500' : 'text-red-500'}`}>
                              {battle.result === 'win' ? '戰鬥勝利！' : battle.result === 'escaped' ? '逃脫成功' : '戰鬥失敗'}
                          </div>
                          
                          {battle.result === 'win' && battle.finalRewards && (
                              <div className="w-full space-y-2 text-center">
                                  <div className="text-gray-300 text-sm">獲得獎勵</div>
                                  <div className="flex justify-center gap-4 text-sm font-bold">
                                      <span className="text-yellow-400">💎 {battle.finalRewards.stones} 靈石</span>
                                      <span className="text-green-400">⚡ {battle.finalRewards.exp} 修為</span>
                                  </div>
                                  {battle.finalRewards.drops.length > 0 && (
                                      <div className="text-xs text-purple-400 border-t border-gray-700 pt-2 mt-2">
                                          戰利品: {battle.finalRewards.drops.map(d => ITEM_DB[d.id]?.name || '???').join(', ')}
                                      </div>
                                  )}
                              </div>
                          )}
                          {battle.result === 'loss' && <div className="text-gray-400 text-sm">身受重傷，修為受損...</div>}
                          
                          {autoLoop && battle.result === 'win' && (
                              <div className="text-xs text-yellow-600 animate-pulse mt-2">
                                  即將開始下一場戰鬥...
                              </div>
                          )}
                      </div>
                  )}

                  {/* Controls */}
                  {battle.result === 'ongoing' ? (
                      <div className="space-y-2">
                           {/* Skills (Hide Passives) */}
                           <div className="flex gap-1 justify-center overflow-x-auto pb-1">
                              {['skill1','skill2','skill3'].map(slot => {
                                  const sid = gameState.equip[slot as keyof typeof gameState.equip];
                                  if(!sid) return null;
                                  const skill = SKILL_DB[sid];
                                  if (skill?.type === 'passive') return null; // Don't show passive buttons
                                  
                                  const cd = battle.cooldowns[sid] || 0;
                                  return (
                                      <Button key={sid} disabled={cd > 0 || battle.player.curMp < skill.mpCost} onClick={() => useSkill(sid)} className="text-xs py-1 px-2 relative min-w-[80px]">
                                          {skill.name}
                                          {cd > 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">{cd}</div>}
                                      </Button>
                                  );
                              })}
                           </div>
                          <div className="flex gap-2 justify-center">
                              <Button variant={battle.auto ? 'primary' : 'outline'} onClick={() => setBattle(p => p ? {...p, auto: !p.auto} : null)} className="py-1">
                                  {battle.auto ? '自動戰鬥' : '自動'}
                              </Button>
                              <Button onClick={() => processBattleRound()} disabled={battle.auto} className="py-1">普攻</Button>
                              <Button variant="danger" onClick={attemptFlee} className="py-1">逃跑</Button>
                          </div>
                          <div className="flex gap-2 justify-center">
                                  <Button variant="outline" onClick={() => useBattleItem('hp_s')} disabled={!gameState.inventory.find(i => i.id === 'hp_s')} className="py-0.5 text-xs">回春丹</Button>
                                  <Button variant="outline" onClick={() => useBattleItem('mp_s')} disabled={!gameState.inventory.find(i => i.id === 'mp_s')} className="py-0.5 text-xs">聚氣丹</Button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center space-y-3 pt-2">
                          <div className="flex gap-2 justify-center">
                              {battle.result === 'win' && (
                                   <Button 
                                        variant="primary" 
                                        onClick={restartBattle}
                                        className="animate-pulse flex items-center gap-1"
                                   >
                                        <RefreshCw size={14}/> 新的試煉
                                   </Button>
                              )}
                              <Button onClick={() => endBattle(battle.result as any)}>離開</Button>
                          </div>
                      </div>
                  )}
              </div>
          </Modal>
      )}

      {/* GM MODAL */}
      {showGM && (
          <Modal title="GM 控制台" onClose={() => setShowGM(false)}>
              <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="space-y-2">
                      <div className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1">狀態調整</div>
                      <div className="grid grid-cols-2 gap-2">
                          <Button onClick={gmHeal} className="flex items-center justify-center gap-2"><Heart size={14}/> 恢復狀態</Button>
                          <Button onClick={gmStones} className="flex items-center justify-center gap-2"><Gem size={14}/> +10萬靈石</Button>
                          <Button onClick={gmExp} className="flex items-center justify-center gap-2"><Zap size={14}/> 修為圓滿</Button>
                          <Button onClick={gmRealmUp} variant="danger" className="flex items-center justify-center gap-2"><ChevronsRight size={14}/> 強制突破</Button>
                      </div>
                  </div>

                  {/* Item Spawner */}
                  <div className="space-y-2">
                      <div className="text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1 flex justify-between items-center">
                          <span>物品獲取</span>
                          <select 
                            className="bg-black border border-gray-700 text-xs p-1"
                            value={gmItemFilter}
                            onChange={(e) => setGmItemFilter(e.target.value as any)}
                          >
                              <option value="all">全部</option>
                              <option value="weapon">武器</option>
                              <option value="armor">防具</option>
                              <option value="use">丹藥</option>
                              <option value="skill_book">秘籍</option>
                              <option value="furnace">丹爐</option>
                              <option value="robe">法袍</option>
                              <option value="artifact">靈器</option>
                          </select>
                      </div>
                      <div className="h-60 overflow-y-auto custom-scrollbar grid grid-cols-1 gap-1 border border-gray-800 p-2 bg-black/50">
                          {Object.entries(ITEM_DB)
                             .filter(([_, item]) => gmItemFilter === 'all' || item.type === gmItemFilter)
                             .map(([key, item]) => (
                              <div key={key} className="flex justify-between items-center p-2 bg-[#1a1a1a] hover:bg-[#252525] border border-gray-800 text-sm">
                                  <div className={RARITY_COLORS[item.rarity]}>{item.name}</div>
                                  <button onClick={() => gmAddItem(key)} className="text-green-500 hover:text-green-400 p-1">
                                      <PlusCircle size={16}/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </Modal>
      )}
      
      {/* EXPORT/IMPORT MODAL */}
      {showIO && (
          <Modal title={showIO === 'export' ? '匯出存檔' : '匯入存檔'} onClose={() => setShowIO(null)}>
              {showIO === 'export' ? (
                  <div className="space-y-4">
                      <p className="text-sm text-gray-400">請複製下方代碼妥善保存：</p>
                      <textarea readOnly className="w-full h-32 bg-black border border-gray-600 p-2 text-xs text-green-500 font-mono" value={ioText} />
                      <Button onClick={() => { navigator.clipboard.writeText(ioText); alert("已複製"); }}>複製代碼</Button>
                  </div>
              ) : (
                  <div className="space-y-4">
                       <textarea className="w-full h-32 bg-black border border-gray-600 p-2 text-xs text-white font-mono" placeholder="在此貼上存檔代碼..." value={ioText} onChange={e => setIoText(e.target.value)} />
                       <Button onClick={() => {
                           try {
                               const parsed = JSON.parse(atob(ioText));
                               if (parsed.name) {
                                   setGameState(parsed);
                                   setShowIO(null);
                                   addLog("存檔匯入成功", 'system');
                               } else alert("無效的存檔");
                           } catch (e) { alert("代碼錯誤"); }
                       }}>確認匯入</Button>
                  </div>
              )}
          </Modal>
      )}

      {/* BULK SELL MODAL */}
      {showBulkSell && (
          <BulkSellModal 
            inventory={gameState.inventory.filter(i => 
                i.uid !== gameState.equip.weapon && 
                i.uid !== gameState.equip.armor && 
                i.uid !== gameState.equip.furnace && 
                i.uid !== gameState.equip.robe && 
                i.uid !== gameState.equip.artifact
            )} 
            onClose={() => setShowBulkSell(false)} 
            onConfirm={(itemsToSell) => {
              let total = 0;
              const newInv = [...gameState.inventory];
              const newEquip = { ...gameState.equip };
              
              itemsToSell.forEach(item => {
                  const db = ITEM_DB[item.id];
                  if(db) total += Math.floor(db.price * 0.3);
                  // Remove from inv array
                  const idx = newInv.findIndex(i => i.uid === item.uid);
                  if (idx > -1) newInv.splice(idx, 1);
              });
              
              setGameState(prev => ({ ...prev, stones: prev.stones + total, inventory: newInv }));
              addLog(`批量販售 ${itemsToSell.length} 件物品，獲得 ${total} 靈石`, 'gain');
              setShowBulkSell(false);
          }} />
      )}

    </div>
  );
};

export default App;