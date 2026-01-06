
export type ElementType = 'gold' | 'wood' | 'earth' | 'water' | 'fire' | 'physical' | 'ice' | 'thunder' | 'dark' | 'light' | 'chaos' | 'none';
export type Rarity = 'common' | 'rare' | 'epic' | 'legend' | 'myth';
export type ItemType = 'weapon' | 'armor' | 'furnace' | 'robe' | 'artifact' | 'use' | 'skill_book';

export interface ItemDef {
  id: string;
  type: ItemType;
  name: string;
  val?: number; // Base value (Atk, Def, etc.)
  rarity: Rarity;
  price: number;
  desc?: string;
  effect?: (state: GameState) => string;
  reqMp?: number; // Display only
}

export interface ItemInstance {
  uid: string;
  id: string;
  finalVal: number;
  elements: ElementType[];
}

export interface MapDef {
  id: number;
  name: string;
  minRealm: number;
  base: {
    hp: number;
    atk: number;
    def: number;
    exp: number;
    stones: number;
  };
  drops: Rarity[];
}

export interface EnemyTemplate {
  name: string;
  element: ElementType;
  modifiers: {
    hp: number;
    atk: number;
    def: number;
    spd?: number; // AGI equivalent
  };
}

export interface EnemyPool {
  common: EnemyTemplate[];
  elite: EnemyTemplate[];
  miniboss: EnemyTemplate[];
  boss: EnemyTemplate[];
}

export interface Stats {
  gold: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'normal' | 'gain' | 'warn' | 'system' | 'combat' | 'drop';
}

export interface CombatEntity {
  name: string;
  maxHp: number;
  curHp: number;
  maxMp: number;
  curMp: number;
  atk: number;
  def: number;
  element: ElementType; // Main element for enemy
  avatar?: string;
  buffs: Buff[];
}

export interface Buff {
  id: string;
  name: string;
  type: 'stun' | 'def_mod' | 'atk_mod' | 'dot' | 'speed_mod';
  val: number;
  duration: number; // rounds
}

export interface SkillDef {
  id: string;
  name: string;
  element: ElementType;
  type: 'active' | 'passive';
  mpCost: number;
  cooldown: number; // rounds
  desc: string;
  dmgScale?: number;
  effect?: (battle: BattleState, caster: 'player'|'enemy') => void;
}

export interface BattleState {
  active: boolean;
  auto: boolean;
  round: number;
  player: CombatEntity;
  enemy: CombatEntity;
  logs: string[]; // Battle specific logs
  result: 'ongoing' | 'win' | 'loss' | 'escaped' | null;
  rewards?: {
    exp: number;
    stones: number;
    drops: ItemInstance[];
  };
  finalRewards?: {
    exp: number;
    stones: number;
    drops: ItemInstance[];
  };
  enemyRarity: 'common' | 'elite' | 'miniboss' | 'boss';
  mapId: number;
  cooldowns: Record<string, number>; // Skill ID -> Rounds remaining
}

export interface GameState {
  name: string;
  isGM: boolean;
  seenPrologue: boolean;
  realm: number;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  demon: number;
  stones: number;
  injury: number;
  stats: Stats;
  freePoints: number;
  mapId: number;
  qiDeviation: boolean;
  inventory: ItemInstance[];
  learnedSkills: string[]; // List of Skill IDs learned
  equip: {
    weapon: string | null;
    armor: string | null;
    furnace: string | null;
    robe: string | null;
    artifact: string | null;
    skill1: string | null; // Skill ID (not Item UID)
    skill2: string | null;
    skill3: string | null;
  };
}