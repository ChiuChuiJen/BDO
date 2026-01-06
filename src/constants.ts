
import { ItemDef, MapDef, ElementType, EnemyPool, SkillDef } from './types';

export const VERSION = "v0.9.95 Content Update";

export const PROLOGUE_TEXT = `鴻蒙初判，天地未分之際，混沌中孕育出無數神魔。
其中，<span class="text-red-500 font-bold">黑龍一族</span> 以肉身強橫著稱，統御萬界，莫敢不從。
然盛極必衰，一場名為「諸神黃昏」的浩劫席捲諸天，黑龍皇與天外邪魔同歸於盡，其隕落之地化為禁區——<span class="text-red-500 font-bold">黑龍塚</span>。

萬載歲月流轉，修真界宗門林立，強者為尊。
凡人如螻蟻，唯有踏上修仙之路，方能掌握自己的命運。

你，<PLAYER_NAME>，本是一介資質平平的凡人，卻在一次採藥途中，無意間闖入了一處上古遺跡，獲得了一枚散發著幽古氣息的令牌——【黑龍令】。
傳說得此令者，可開啟黑龍塚，繼承黑龍一族的無上傳承。

然而，匹夫無罪，懷璧其罪。
黑龍令現世的消息不脛而走，引來了無數貪婪的目光。正道偽君子欲奪寶證道，魔道梟雄欲煉化真龍之血。
前路漫漫，荊棘叢生。
是身死道消，化為黃土一杯？
還是逆天而行，登臨絕頂，重鑄黑龍榮光？

這一切的傳奇，將從你踏入修真界的那一刻開始書寫......`;

export const REALMS = ["凡人", "練氣", "築基", "金丹", "元嬰", "化神", "合體", "大乘", "飛升"];

export const ELEMENTS: ElementType[] = ['gold', 'wood', 'earth', 'water', 'fire', 'physical', 'ice', 'thunder', 'dark', 'light', 'chaos'];

export const ELEM_NAMES: Record<string, string> = { 
  gold: '金', wood: '木', earth: '土', water: '水', fire: '火', 
  physical: '物', ice: '冰', thunder: '雷', dark: '暗', light: '光', chaos: '混', none: '無' 
};

export const ELEM_COLORS: Record<string, string> = {
  gold: 'text-yellow-400',
  wood: 'text-green-500',
  water: 'text-blue-400',
  fire: 'text-red-500',
  earth: 'text-orange-400',
  physical: 'text-gray-300',
  ice: 'text-cyan-300',
  thunder: 'text-purple-400',
  dark: 'text-indigo-900',
  light: 'text-yellow-100 drop-shadow-[0_0_5px_rgba(255,255,200,0.8)]',
  chaos: 'text-red-700',
  none: 'text-gray-500'
};

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  rare: 'text-cyan-400',
  epic: 'text-purple-400',
  legend: 'text-amber-400',
  myth: 'text-red-600 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]'
};

// Attack Element vs Defender Element -> Strong/Weak
export const ELEM_COUNTER: Record<string, ElementType[]> = { 
  gold: ['wood', 'light'], 
  wood: ['earth', 'thunder'], 
  earth: ['water', 'thunder'], 
  water: ['fire', 'chaos'], 
  fire: ['gold', 'ice', 'wood'],
  ice: ['fire', 'earth'],
  thunder: ['water', 'gold'],
  dark: ['light', 'gold'],
  light: ['dark', 'chaos'],
  physical: ['wood'], 
  chaos: ['light', 'dark', 'gold', 'wood', 'water', 'fire', 'earth']
};

export const SKILL_DB: Record<string, SkillDef> = {
    // Gold
    's_gold_1': { id: 's_gold_1', name: '金刃斬', element: 'gold', type: 'active', mpCost: 20, cooldown: 6, desc: '造成120%傷害，10%機率破防(-20%防禦) 5秒', dmgScale: 1.2 },
    's_gold_2': { id: 's_gold_2', name: '鋼骨護體', element: 'gold', type: 'active', mpCost: 30, cooldown: 20, desc: '防禦力+25%，持續10秒' },
    's_gold_3': { id: 's_gold_3', name: '破甲印', element: 'gold', type: 'passive', mpCost: 0, cooldown: 0, desc: '攻擊時5%機率無視30%防禦' },
    // Wood
    's_wood_1': { id: 's_wood_1', name: '生機纏繞', element: 'wood', type: 'active', mpCost: 25, cooldown: 10, desc: '纏繞敵人3秒(無法閃避)，傷害係數0.5', dmgScale: 0.5 },
    's_wood_2': { id: 's_wood_2', name: '回春術', element: 'wood', type: 'active', mpCost: 40, cooldown: 18, desc: '回復20%最大生命值' },
    's_wood_3': { id: 's_wood_3', name: '靈根滋養', element: 'wood', type: 'passive', mpCost: 0, cooldown: 0, desc: '每回合自動回復1%最大生命' },
    // Water
    's_water_1': { id: 's_water_1', name: '水刃波', element: 'water', type: 'active', mpCost: 20, cooldown: 7, desc: '造成110%傷害，降低敵人攻擊10% 4秒', dmgScale: 1.1 },
    's_water_2': { id: 's_water_2', name: '冰膚訣', element: 'water', type: 'active', mpCost: 35, cooldown: 22, desc: '受傷減少15%，持續8秒' },
    's_water_3': { id: 's_water_3', name: '凝水心法', element: 'water', type: 'passive', mpCost: 0, cooldown: 0, desc: '最大MP+10%' },
    // Fire
    's_fire_1': { id: 's_fire_1', name: '火焰彈', element: 'fire', type: 'active', mpCost: 25, cooldown: 6, desc: '造成130%傷害，附加燃燒(每秒10%攻) 5秒', dmgScale: 1.3 },
    's_fire_2': { id: 's_fire_2', name: '炎息爆發', element: 'fire', type: 'active', mpCost: 40, cooldown: 25, desc: '攻擊力+20%，持續8秒' },
    's_fire_3': { id: 's_fire_3', name: '焚血之力', element: 'fire', type: 'passive', mpCost: 0, cooldown: 0, desc: '生命低於30%時，傷害+15%' },
    // Earth
    's_earth_1': { id: 's_earth_1', name: '岩甲術', element: 'earth', type: 'active', mpCost: 35, cooldown: 25, desc: '防禦力+30%，持續12秒' },
    's_earth_2': { id: 's_earth_2', name: '大地震擊', element: 'earth', type: 'active', mpCost: 45, cooldown: 12, desc: '造成120%傷害，暈眩2秒', dmgScale: 1.2 },
    's_earth_3': { id: 's_earth_3', name: '厚土根基', element: 'earth', type: 'passive', mpCost: 0, cooldown: 0, desc: '最大生命值+10%' },
    // Light
    's_light_1': { id: 's_light_1', name: '聖光斬', element: 'light', type: 'active', mpCost: 30, cooldown: 7, desc: '造成115%傷害，對暗系+30%額外傷害', dmgScale: 1.15 },
    's_light_2': { id: 's_light_2', name: '淨化之光', element: 'light', type: 'active', mpCost: 50, cooldown: 20, desc: '解除自身所有負面狀態，並回血10%' },
    's_light_3': { id: 's_light_3', name: '光明守護', element: 'light', type: 'passive', mpCost: 0, cooldown: 0, desc: '受暗屬性傷害-15%' },
    // Dark
    's_dark_1': { id: 's_dark_1', name: '暗影噬擊', element: 'dark', type: 'active', mpCost: 30, cooldown: 8, desc: '造成110%傷害，吸血20%', dmgScale: 1.1 },
    's_dark_2': { id: 's_dark_2', name: '虛弱詛咒', element: 'dark', type: 'active', mpCost: 35, cooldown: 18, desc: '敵人攻擊力-20%，持續8秒' },
    's_dark_3': { id: 's_dark_3', name: '黑暗共鳴', element: 'dark', type: 'passive', mpCost: 0, cooldown: 0, desc: '每次攻擊回復3點MP' } 
};

export const ITEM_DB: Record<string, ItemDef> = {
    // Consumables - Updated: Removed Math.min clamping to allow effective max restoration
    'hp_s': { id: 'hp_s', type:'use', name:'回春丹(小)', price:10, rarity: 'common', effect: (s)=>{s.hp += 50; return 'HP+50';} },
    'mp_s': { id: 'mp_s', type:'use', name:'聚氣丹(小)', price:15, rarity: 'common', effect: (s)=>{s.mp += 30; return 'MP+30';} },
    'bt_base': { id: 'bt_base', type:'use', name:'築基丹', price:500, rarity: 'rare', desc:'練氣突破+15%', effect: (s)=>{ return '僅突破時生效'; } },
    'bt_gold': { id: 'bt_gold', type:'use', name:'結金丹', price:2000, rarity: 'rare', desc:'築基突破+15%', effect: (s)=>{ return '僅突破時生效'; } },
    'bt_soul': { id: 'bt_soul', type:'use', name:'凝嬰丹', price:5000, rarity: 'epic', desc:'金丹突破+20%', effect: (s)=>{ return '僅突破時生效'; } },
    
    // Skill Books
    'bk_random': { id: 'bk_random', type:'use', name:'泥如可寶典', price:5000, rarity:'epic', desc:'隨機獲得一本基礎技能書' },
    
    'bk_gold_1': { id: 'bk_gold_1', type: 'skill_book', name: '金刃斬秘籍', price: 500, rarity: 'common', desc: '學習技能：金刃斬', reqMp: 20 },
    'bk_gold_2': { id: 'bk_gold_2', type: 'skill_book', name: '鋼骨護體秘籍', price: 500, rarity: 'common', desc: '學習技能：鋼骨護體', reqMp: 30 },
    'bk_gold_3': { id: 'bk_gold_3', type: 'skill_book', name: '破甲印心得', price: 800, rarity: 'rare', desc: '學習被動：破甲印' },
    
    'bk_wood_1': { id: 'bk_wood_1', type: 'skill_book', name: '生機纏繞卷軸', price: 500, rarity: 'common', desc: '學習技能：生機纏繞', reqMp: 25 },
    'bk_wood_2': { id: 'bk_wood_2', type: 'skill_book', name: '回春術秘籍', price: 600, rarity: 'common', desc: '學習技能：回春術', reqMp: 40 },
    'bk_wood_3': { id: 'bk_wood_3', type: 'skill_book', name: '靈根滋養法', price: 800, rarity: 'rare', desc: '學習被動：靈根滋養' },

    'bk_water_1': { id: 'bk_water_1', type: 'skill_book', name: '水刃波圖譜', price: 500, rarity: 'common', desc: '學習技能：水刃波', reqMp: 20 },
    'bk_water_2': { id: 'bk_water_2', type: 'skill_book', name: '冰膚訣秘籍', price: 600, rarity: 'common', desc: '學習技能：冰膚訣', reqMp: 35 },
    'bk_water_3': { id: 'bk_water_3', type: 'skill_book', name: '凝水心法', price: 800, rarity: 'rare', desc: '學習被動：凝水心法' },

    'bk_fire_1': { id: 'bk_fire_1', type: 'skill_book', name: '火焰彈秘籍', price: 500, rarity: 'common', desc: '學習技能：火焰彈', reqMp: 25 },
    'bk_fire_2': { id: 'bk_fire_2', type: 'skill_book', name: '炎息爆發術', price: 600, rarity: 'common', desc: '學習技能：炎息爆發', reqMp: 40 },
    'bk_fire_3': { id: 'bk_fire_3', type: 'skill_book', name: '焚血殘卷', price: 800, rarity: 'rare', desc: '學習被動：焚血之力' },

    'bk_earth_1': { id: 'bk_earth_1', type: 'skill_book', name: '岩甲術秘籍', price: 500, rarity: 'common', desc: '學習技能：岩甲術', reqMp: 35 },
    'bk_earth_2': { id: 'bk_earth_2', type: 'skill_book', name: '大地震擊卷', price: 600, rarity: 'common', desc: '學習技能：大地震擊', reqMp: 45 },
    'bk_earth_3': { id: 'bk_earth_3', type: 'skill_book', name: '厚土真經', price: 800, rarity: 'rare', desc: '學習被動：厚土根基' },

    'bk_light_1': { id: 'bk_light_1', type: 'skill_book', name: '聖光斬秘籍', price: 600, rarity: 'common', desc: '學習技能：聖光斬', reqMp: 30 },
    'bk_light_2': { id: 'bk_light_2', type: 'skill_book', name: '淨化之光術', price: 700, rarity: 'common', desc: '學習技能：淨化之光', reqMp: 50 },
    'bk_light_3': { id: 'bk_light_3', type: 'skill_book', name: '光明守護卷', price: 900, rarity: 'rare', desc: '學習被動：光明守護' },

    'bk_dark_1': { id: 'bk_dark_1', type: 'skill_book', name: '暗影噬擊錄', price: 600, rarity: 'common', desc: '學習技能：暗影噬擊', reqMp: 30 },
    'bk_dark_2': { id: 'bk_dark_2', type: 'skill_book', name: '虛弱詛咒書', price: 700, rarity: 'common', desc: '學習技能：虛弱詛咒', reqMp: 35 },
    'bk_dark_3': { id: 'bk_dark_3', type: 'skill_book', name: '黑暗共鳴篇', price: 900, rarity: 'rare', desc: '學習被動：黑暗共鳴' },

    // Weapons
    'w_iron': { id: 'w_iron', type:'weapon', name:'斬鐵長劍', val:120, rarity:'common', price:200 },
    'w_wind': { id: 'w_wind', type:'weapon', name:'風刃短刀', val:95, rarity:'common', price:200 },
    'w_dark': { id: 'w_dark', type:'weapon', name:'黑鋼裂魂劍', val:180, rarity:'rare', price:1000 },
    'w_fire': { id: 'w_fire', type:'weapon', name:'赤焰裁決斧', val:200, rarity:'rare', price:1200 },
    'w_holy': { id: 'w_holy', type:'weapon', name:'天啟聖劍', val:240, rarity:'epic', price:5000 },
    'w_drag': { id: 'w_drag', type:'weapon', name:'龍炎滅世斧', val:280, rarity:'epic', price:6000 },
    'w_fate': { id: 'w_fate', type:'weapon', name:'命運裁決者', val:320, rarity:'legend', price:20000 },
    'w_chaos': { id: 'w_chaos', type:'weapon', name:'萬象歸一', val:350, rarity:'myth', price:99999 },

    // Armor
    'a_iron': { id: 'a_iron', type:'armor', name:'鐵衛護甲', val:120, rarity:'common', price:200 },
    'a_wind': { id: 'a_wind', type:'armor', name:'風行皮甲', val:90, rarity:'common', price:200 },
    'a_dark': { id: 'a_dark', type:'armor', name:'黑曜守護鎧', val:180, rarity:'rare', price:1000 },
    'a_holy': { id: 'a_holy', type:'armor', name:'聖域鎧甲', val:230, rarity:'epic', price:5000 },
    'a_god':  { id: 'a_god', type:'armor', name:'神代守望者', val:300, rarity:'legend', price:20000 },
    'a_all':  { id: 'a_all', type:'armor', name:'萬界庇護', val:330, rarity:'myth', price:99999 },

    'f_rare': { id: 'f_rare', type:'furnace', name:'下品聚靈爐', val:3, rarity:'rare', desc:'突破+3%', price:1000 },
    'f_epic': { id: 'f_epic', type:'furnace', name:'中品凝元爐', val:6, rarity:'epic', desc:'突破+6%', price:5000 },
    'f_legend': { id: 'f_legend', type:'furnace', name:'太初混元爐', val:15, rarity:'legend', desc:'突破+15%', price:50000 },

    'r_rare': { id: 'r_rare', type:'robe', name:'靈絲護體袍', val:5, rarity:'rare', desc:'心魔-5%', price:1000 },
    'r_epic': { id: 'r_epic', type:'robe', name:'玄脈穩靈袍', val:10, rarity:'epic', desc:'心魔-10%', price:5000 },
    'r_legend': { id: 'r_legend', type:'robe', name:'天衍道袍', val:100, rarity:'legend', desc:'免疫心魔', price:50000 },

    't_rare': { id: 't_rare', type:'artifact', name:'氣運玉佩', val:2, rarity:'rare', desc:'上限+2%', price:1000 },
    't_epic': { id: 't_epic', type:'artifact', name:'命脈靈珠', val:6, rarity:'epic', desc:'成功+6%', price:5000 },
    't_legend': { id: 't_legend', type:'artifact', name:'因果輪', val:15, rarity:'legend', desc:'成功+15%', price:50000 }
};

export const MAPS: MapDef[] = [
    { id: 0, name: "靈泉谷 (凡人)", minRealm: 0, base: {hp:80, atk:8, def:1, exp:5, stones:1}, drops: ['common'] },
    { id: 1, name: "黑風林 (練氣初)", minRealm: 0, base: {hp:300, atk:20, def:8, exp:30, stones:3}, drops: ['common'] },
    { id: 2, name: "血煞洞 (練氣)", minRealm: 1, base: {hp:1200, atk:60, def:30, exp:80, stones:5}, drops: ['common','rare'] },
    { id: 3, name: "屍魂古窟 (築基初)", minRealm: 1, base: {hp:5000, atk:150, def:80, exp:200, stones:8}, drops: ['rare'] },
    { id: 4, name: "魔焰地宮 (築基)", minRealm: 2, base: {hp:12000, atk:300, def:150, exp:350, stones:15}, drops: ['rare','epic'] },
    { id: 5, name: "雷鳴峰 (金丹初)", minRealm: 2, base: {hp:25000, atk:500, def:300, exp:700, stones:25}, drops: ['epic'] },
    { id: 6, name: "九幽冥域 (金丹)", minRealm: 3, base: {hp:60000, atk:900, def:600, exp:1200, stones:50}, drops: ['epic'] },
    { id: 7, name: "星墜虛空 (元嬰)", minRealm: 4, base: {hp:150000, atk:1500, def:1000, exp:4000, stones:100}, drops: ['epic','legend'] },
    { id: 8, name: "天外仙墟 (化神)", minRealm: 5, base: {hp:350000, atk:3000, def:2000, exp:12000, stones:200}, drops: ['legend'] },
    { id: 9, name: "飛升試煉 (大乘)", minRealm: 6, base: {hp:1000000, atk:5000, def:4000, exp:30000, stones:500}, drops: ['legend','myth'] },
    { id: 99, name: "☣️ 魔域結界 (走火入魔)", minRealm: 0, base: {hp:3000, atk:200, def:10, exp:1, stones:0}, drops: [] }
];

// Helper for default mods
const M = { hp: 1, atk: 1, def: 1 }; 
const Tank = { hp: 1.5, atk: 0.8, def: 1.5 };
const Dmg = { hp: 0.8, atk: 1.4, def: 0.8 };
const Speed = { hp: 0.9, atk: 1.1, def: 0.9, spd: 1.2 };
const BossMod = { hp: 5, atk: 1.5, def: 1.5 };
const MiniMod = { hp: 3, atk: 1.2, def: 1.2 };
const EliteMod = { hp: 1.5, atk: 1.2, def: 1.1 };

export const MONSTER_POOLS: Record<number, EnemyPool> = {
  // Layer 0: Mortal
  0: {
    common: [
      { name: "荒原野狼", element: 'physical', modifiers: Speed },
      { name: "砂地蜥蜴", element: 'earth', modifiers: Tank },
      { name: "流浪盜匪", element: 'physical', modifiers: M },
      { name: "枯木魔鼠", element: 'wood', modifiers: Speed },
      { name: "荒骨骷髏", element: 'dark', modifiers: M },
      { name: "沙塵毒蠍", element: 'earth', modifiers: Dmg },
      { name: "低階史萊姆", element: 'water', modifiers: M },
      { name: "野生獵犬", element: 'physical', modifiers: Speed },
      { name: "荒原蝙蝠", element: 'physical', modifiers: Speed },
      { name: "破舊自動傀儡", element: 'gold', modifiers: Tank },
    ],
    elite: [
      { name: "狂暴野狼王", element: 'physical', modifiers: EliteMod },
      { name: "重裝盜匪隊長", element: 'gold', modifiers: EliteMod },
      { name: "毒尾巨蠍", element: 'earth', modifiers: EliteMod },
      { name: "骷髏戰士長", element: 'dark', modifiers: EliteMod },
    ],
    miniboss: [
      { name: "荒原屠戮者", element: 'physical', modifiers: MiniMod },
      { name: "沙塵操偶師", element: 'earth', modifiers: MiniMod },
      { name: "破舊守關傀儡", element: 'gold', modifiers: MiniMod },
    ],
    boss: [
      { name: "荒原霸主・巨牙狼王", element: 'physical', modifiers: BossMod },
      { name: "試煉監督者・鐵骨傀儡", element: 'gold', modifiers: BossMod },
    ]
  },
  // Layer 1: Qi Refinement Initial
  1: {
      common: [{ name: "幽林狼", element: 'wood', modifiers: Speed }, { name: "食人花", element: 'wood', modifiers: Tank }, { name: "劇毒蜘蛛", element: 'wood', modifiers: Dmg }],
      elite: [{ name: "千年樹妖", element: 'wood', modifiers: EliteMod }],
      miniboss: [{ name: "森林守護者", element: 'wood', modifiers: MiniMod }],
      boss: [{ name: "翠綠夢魘・森之主", element: 'wood', modifiers: BossMod }]
  },
  // Layer 2: Qi Refinement Full
  2: { 
      common: [{ name: "嗜血蝙蝠", element: 'dark', modifiers: Speed }, { name: "赤焰狐", element: 'fire', modifiers: Dmg }, { name: "血煞屍傀", element: 'physical', modifiers: Tank }],
      elite: [{ name: "血池巨魔", element: 'water', modifiers: EliteMod }],
      miniboss: [{ name: "血煞魔將", element: 'fire', modifiers: MiniMod }],
      boss: [{ name: "血海老祖・分身", element: 'dark', modifiers: BossMod }]
  },
  // Layer 3: Foundation Initial
  3: { 
      common: [{ name: "腐屍", element: 'earth', modifiers: Tank }, { name: "遊蕩怨靈", element: 'dark', modifiers: Dmg }, { name: "白骨兵", element: 'physical', modifiers: M }],
      elite: [{ name: "骷髏將軍", element: 'physical', modifiers: EliteMod }],
      miniboss: [{ name: "屍王", element: 'earth', modifiers: MiniMod }],
      boss: [{ name: "萬年屍皇", element: 'dark', modifiers: BossMod }]
  },
  // Layer 4: Foundation Full
  4: { 
      common: [{ name: "地獄獵犬", element: 'fire', modifiers: Speed }, { name: "魔焰守衛", element: 'fire', modifiers: Tank }, { name: "魅魔", element: 'dark', modifiers: Dmg }],
      elite: [{ name: "炎魔統理", element: 'fire', modifiers: EliteMod }],
      miniboss: [{ name: "深淵領主", element: 'dark', modifiers: MiniMod }],
      boss: [{ name: "魔焰君王・薩格斯", element: 'fire', modifiers: BossMod }]
  },
  // Layer 5: Golden Core Initial
  5: { 
      common: [{ name: "雷鳥", element: 'thunder', modifiers: Speed }, { name: "閃電豹", element: 'thunder', modifiers: Dmg }, { name: "鐵甲犀牛", element: 'gold', modifiers: Tank }],
      elite: [{ name: "轟雷巨人", element: 'earth', modifiers: EliteMod }],
      miniboss: [{ name: "紫電麒麟", element: 'thunder', modifiers: MiniMod }],
      boss: [{ name: "九天雷神・殘魂", element: 'thunder', modifiers: BossMod }]
  },
  // Layer 6: Golden Core Full
  6: { 
      common: [{ name: "幽冥鬼卒", element: 'dark', modifiers: M }, { name: "攝魂怪", element: 'dark', modifiers: Dmg }, { name: "寒冰骨龍", element: 'ice', modifiers: Tank }],
      elite: [{ name: "冥河擺渡人", element: 'water', modifiers: EliteMod }],
      miniboss: [{ name: "判官筆吏", element: 'dark', modifiers: MiniMod }],
      boss: [{ name: "幽冥鬼帝", element: 'dark', modifiers: BossMod }]
  },
  // Layer 7: Nascent Soul
  7: { 
      common: [{ name: "虛空行者", element: 'chaos', modifiers: Speed }, { name: "星光獸", element: 'light', modifiers: M }, { name: "隕石巨像", element: 'earth', modifiers: Tank }],
      elite: [{ name: "虛空掠奪者", element: 'chaos', modifiers: EliteMod }],
      miniboss: [{ name: "星界執法者", element: 'light', modifiers: MiniMod }],
      boss: [{ name: "吞星巨獸", element: 'chaos', modifiers: BossMod }]
  },
  // Layer 8: Deity Transformation
  8: { 
      common: [{ name: "古仙遺蛻", element: 'gold', modifiers: Tank }, { name: "破碎虛靈", element: 'chaos', modifiers: Dmg }, { name: "天魔眷屬", element: 'dark', modifiers: Speed }],
      elite: [{ name: "墮落天仙", element: 'light', modifiers: EliteMod }],
      miniboss: [{ name: "太古魔神・虛影", element: 'dark', modifiers: MiniMod }],
      boss: [{ name: "天外邪魔・本體", element: 'chaos', modifiers: BossMod }]
  },
  // Layer 9: Mahayana
  9: { 
      common: [{ name: "心魔化身", element: 'chaos', modifiers: M }, { name: "天道傀儡", element: 'light', modifiers: Tank }, { name: "雷劫化身", element: 'thunder', modifiers: Dmg }],
      elite: [{ name: "五行執法者", element: 'gold', modifiers: EliteMod }],
      miniboss: [{ name: "半步真仙", element: 'light', modifiers: MiniMod }],
      boss: [{ name: "黑龍皇・殘念", element: 'dark', modifiers: BossMod }]
  }
};