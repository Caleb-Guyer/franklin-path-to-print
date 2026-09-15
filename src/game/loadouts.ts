import { chapters } from '../data/chapters';
import { factById } from '../data/facts';

export type WeaponKind =
  | 'bow'
  | 'axe'
  | 'rapier'
  | 'boomerang'
  | 'hammer'
  | 'spear'
  | 'daggers'
  | 'crossbow'
  | 'fan'
  | 'glaive'
  | 'scatter'
  | 'comet';
export interface Weapon {
  kind: WeaponKind;
  name: string;
  action: string;
  color: string;
  damage: number;
  cooldown: number;
  reach: number;
  speed: number;
}
// These are fantasy game equipment, not claims about historical weapons Franklin used.
export const weapons: Weapon[] = [
  {
    kind: 'bow',
    name: 'Bow & arrow',
    action: 'Hold attack to fire arrows.',
    color: '#ffd18a',
    damage: 1,
    cooldown: 0.29,
    reach: 680,
    speed: 770,
  },
  {
    kind: 'axe',
    name: 'Woodcutter’s axe',
    action: 'A heavy swing hits everything in front.',
    color: '#ffc48c',
    damage: 3,
    cooldown: 0.52,
    reach: 115,
    speed: 0,
  },
  {
    kind: 'rapier',
    name: 'Rapier',
    action: 'Fast thrusts. Keep the combo going.',
    color: '#c5f3f1',
    damage: 1,
    cooldown: 0.18,
    reach: 106,
    speed: 0,
  },
  {
    kind: 'boomerang',
    name: 'Boomerang',
    action: 'Hits on the way out and on the return.',
    color: '#8ff0cb',
    damage: 2,
    cooldown: 0.65,
    reach: 370,
    speed: 540,
  },
  {
    kind: 'hammer',
    name: 'Forge hammer',
    action: 'Slam the ground. Send out a shockwave.',
    color: '#ffc387',
    damage: 3,
    cooldown: 0.75,
    reach: 150,
    speed: 460,
  },
  {
    kind: 'spear',
    name: 'Spear',
    action: 'Strike from beyond an enemy’s reach.',
    color: '#bfe6f5',
    damage: 2,
    cooldown: 0.36,
    reach: 165,
    speed: 0,
  },
  {
    kind: 'daggers',
    name: 'Throwing daggers',
    action: 'A quick spread of three blades.',
    color: '#d6c8ff',
    damage: 1,
    cooldown: 0.34,
    reach: 500,
    speed: 670,
  },
  {
    kind: 'crossbow',
    name: 'Crossbow',
    action: 'Bolts pierce a whole line of enemies.',
    color: '#ffcb88',
    damage: 3,
    cooldown: 0.6,
    reach: 830,
    speed: 1050,
  },
  {
    kind: 'fan',
    name: 'Wind fan',
    action: 'Push enemies back with a wide gust.',
    color: '#9fe9d8',
    damage: 1,
    cooldown: 0.48,
    reach: 370,
    speed: 470,
  },
  {
    kind: 'glaive',
    name: 'Glaive',
    action: 'Spin and strike on both sides.',
    color: '#ecb8ef',
    damage: 2,
    cooldown: 0.43,
    reach: 118,
    speed: 0,
  },
  {
    kind: 'scatter',
    name: 'Scatter blaster',
    action: 'Five shots. Strongest up close.',
    color: '#f5cd81',
    damage: 1,
    cooldown: 0.62,
    reach: 410,
    speed: 760,
  },
  {
    kind: 'comet',
    name: 'Comet staff',
    action: 'Launch a bursting orb of starlight.',
    color: '#b2caff',
    damage: 3,
    cooldown: 0.64,
    reach: 700,
    speed: 580,
  },
];

const summaries: [string, string, string[]][] = [
  [
    'Growing up, Franklin wanted more than his father’s candle shop. His curiosity led him toward printing.',
    'His father taught him that being useful means being honest, too.',
    ['f024', 'f026', 'f027', 'f036'],
  ],
  [
    'Printing gave Franklin access to books and a way to find his own voice. He practiced writing by rebuilding pieces from The Spectator.',
    'He published anonymous pieces in his brother’s newspaper. Their conflict pushed him toward independence.',
    ['f044', 'f055', 'f057', 'f060'],
  ],
  [
    'Franklin left Boston to make a new start. He reached Philadelphia tired, hungry and with very little money.',
    'He looked for printing work. Starting over meant using the skill he already had.',
    ['f061', 'f063', 'f072', 'f073', 'f076', 'f079'],
  ],
  [
    'Governor Keith encouraged Franklin to open his own printing shop. Franklin’s father thought he was too young.',
    'Franklin trusted the governor’s promises and went to London to get equipment.',
    ['f084', 'f088', 'f096', 'f098', 'f111'],
  ],
  [
    'In London, Franklin discovered that Keith’s promised support was worthless. He had to find work as a printer.',
    'Mistakes involving friendships and money gave him more lessons about judgment, including his own conduct.',
    ['f111', 'f113', 'f116', 'f128', 'f146'],
  ],
  [
    'Franklin built his reputation in London through hard work and practical habits. He drank water while other workers spent money on beer.',
    'He also earned opportunities through swimming and the people he met.',
    ['f130', 'f135', 'f140', 'f145'],
  ],
  [
    'Franklin returned to Philadelphia to work for Denham as a merchant’s clerk. Denham’s death sent him back to printing.',
    'Working for Keimer sharpened his skills, but another quarrel made independence more attractive.',
    ['f144', 'f148', 'f151', 'f158', 'f159', 'f160'],
  ],
  [
    'Franklin and Meredith opened a printing shop. Skill, steady work and other people’s trust helped the business survive.',
    'Franklin came to value truth, sincerity and integrity as guides for dealing with people.',
    ['f169', 'f171', 'f172', 'f186'],
  ],
  [
    'Franklin formed the Junto: a group of friends who met to discuss ideas and improve themselves.',
    'Useful questions and thoughtful discussion mattered more than winning an argument. His work habits also built his reputation.',
    ['f175', 'f176', 'f187', 'f188', 'f248'],
  ],
  [
    'Franklin used writing and better printing to build a newspaper business. He paid back what he owed Vernon.',
    'When the Meredith partnership ended, friends helped finance the business so Franklin could continue on his own.',
    ['f190', 'f193', 'f195', 'f197', 'f201'],
  ],
  [
    'Writing about paper money brought Franklin more printing work. His business grew through useful skills and dependable service.',
    'He worked hard and made that industry visible. Reputation helped him win people’s trust.',
    ['f205', 'f206', 'f207', 'f212'],
  ],
  [
    'Franklin married Miss Read and described trying to repair his earlier neglect. They worked together to support their household.',
    'He also helped start a subscription library, turning a shared interest in reading into a public benefit.',
    ['f220', 'f222', 'f229'],
  ],
];

export const levelLessons = summaries.map(([first, second, factIds], index) => ({
  title: chapters[index].title,
  lines: [first, second],
  factIds,
  sourcePages: [...new Set(factIds.flatMap((id) => factById[id].sourcePages))],
}));
