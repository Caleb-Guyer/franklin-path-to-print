import { facts, factById } from './facts';
import { eventById } from './chapters';
import type { Question } from './types';
const choiceOptions: Record<string, string[]> = {
  f019: ['Abiah Folger', 'Miss Read', 'Mrs. Godfrey', 'Mrs. T—'],
  f025: ['George Brownell', 'Matthew Adams', 'John Collins', 'William Coleman'],
  f031: ['John Bunyan', 'Plutarch', 'Defoe', 'Dr. Mather'],
  f044: ['The Spectator', 'The New England Courant', 'The Boston News-Letter', 'The Busy Body'],
  f055: ['The New England Courant', 'The Boston News-Letter', 'The Spectator', 'The Busy Body'],
  f063: ['William Bradford', 'Andrew Bradford', 'Keimer', 'Palmer'],
  f078: ['The Crooked Billet', 'The Three Mariners', 'The Horns', 'Batson’s Coffee-house'],
  f084: ['Sir William Keith', 'Governor Burnet', 'Major Gordon', 'Andrew Hamilton'],
  f103: ['Miss Read’s mother', 'Josiah Franklin', 'Mrs. Godfrey', 'John Collins'],
  f109: ['Mr. Denham', 'Andrew Hamilton', 'Sir William Keith', 'Robert Holmes'],
  f126: ['Sir Hans Sloane', 'Dr. Mandeville', 'Dr. Pemberton', 'Lyons'],
  f130: ['Water-American', 'The Busy Body', 'The Spectator', 'The Chapel Ghost'],
  f154: ['George Webb', 'David Harry', 'Stephen Potts', 'Hugh Meredith'],
  f175: ['The Junto', 'The Witty Club', 'The Every-night club', 'The New England Courant'],
  f189: ['George Webb', 'Joseph Breintnal', 'William Coleman', 'Robert Grace'],
  f229: ['A subscription library', 'A stationery shop', 'A fishing wharf', 'A newspaper'],
};
const reasonIds = new Set([
  'f024',
  'f027',
  'f043',
  'f046',
  'f054',
  'f057',
  'f077',
  'f080',
  'f082',
  'f088',
  'f099',
  'f113',
  'f114',
  'f128',
  'f135',
  'f143',
  'f151',
  'f152',
  'f158',
  'f159',
  'f168',
  'f170',
  'f187',
  'f198',
  'f203',
  'f206',
  'f212',
  'f216',
  'f221',
  'f224',
  'f239',
  'f240',
  'f243',
  'f246',
  'f247',
]);
export const questions: Question[] = facts.map((f, i) => ({
  id: 'q' + f.id.slice(1),
  factIds: [f.id],
  chapter: f.chapter,
  category: f.category,
  difficulty: f.difficulty,
  type: choiceOptions[f.id]
    ? 'choice'
    : f.id === 'f208' || f.id === 'f218'
      ? 'boolean'
      : reasonIds.has(f.id)
        ? 'reason'
        : f.prompt.startsWith('Who')
          ? 'person'
          : f.category === 'Places'
            ? 'place'
            : i % 7 === 0
              ? 'blank'
              : 'recall',
  prompt: f.prompt,
  answer: f.answer,
  aliases: f.aliases,
  explanation: f.details,
  sourcePages: f.sourcePages,
  options: choiceOptions[f.id]
    ? [
        f.answer,
        ...choiceOptions[f.id].filter(
          (x) =>
            x.toLowerCase().replace(/[’']/g, '') !== f.answer.toLowerCase().replace(/[’']/g, ''),
        ),
      ].slice(0, 4)
    : f.id === 'f208' || f.id === 'f218'
      ? ['Yes', 'No']
      : undefined,
}));

const orderSets: [string, string, string[]][] = [
  ['order01', 'Reconstruct the early education and apprenticeship.', ['e04', 'e06', 'e08', 'e12']],
  ['order02', 'Put the first journey in order.', ['e13', 'e14', 'e15', 'e16', 'e17']],
  ['order03', 'Follow the promised printing business.', ['e19', 'e20', 'e22', 'e24', 'e25']],
  ['order04', 'Put the London experiences in order.', ['e25', 'e26', 'e29', 'e30', 'e33']],
  ['order05', 'Reconstruct the return to Philadelphia.', ['e34', 'e35', 'e36', 'e37', 'e38']],
  ['order06', 'Trace the independent printing venture.', ['e38', 'e39', 'e41', 'e47', 'e48']],
  ['order07', 'Follow the newspaper and the partnership.', ['e47', 'e48', 'e49', 'e50', 'e51']],
  ['order08', 'Reconstruct the closing family and library account.', ['e56', 'e57', 'e58', 'e59']],
  [
    'order09',
    'From hidden essays to London employment: put these in order.',
    ['e12', 'e13', 'e19', 'e25', 'e26'],
  ],
  [
    'order10',
    'Trace the change of professions around the return voyage.',
    ['e30', 'e34', 'e35', 'e36', 'e37'],
  ],
  [
    'order11',
    'From childhood organizing to a public library: put these in order.',
    ['e05', 'e43', 'e41', 'e57', 'e59'],
  ],
  [
    'order12',
    'Put the two failed promises and later repair in order.',
    ['e22', 'e25', 'e26', 'e57'],
  ],
];
for (const [id, prompt, eventIds] of orderSets) {
  const es = eventIds.map((id) => eventById[id]);
  const factIds = [...new Set(es.flatMap((e) => e.factIds))];
  questions.push({
    id,
    factIds,
    chapter: Math.max(...es.map((e) => e.chapter)),
    category: 'Events',
    difficulty: 3,
    type: 'order',
    prompt,
    answer: es.map((e) => e.title).join(' → '),
    aliases: [],
    explanation: es.map((e) => `${e.title}: ${e.era}.`).join(' '),
    sourcePages: [...new Set(es.flatMap((e) => e.sourcePages))].sort((a, b) => a - b),
    sequence: es.map((e) => e.title),
  });
}
const matchingSets: [string, string, string[], string[]][] = [
  [
    'match01',
    'Match each family member to the supported role.',
    ['Uncle Benjamin', 'Abiah Folger', 'Peter Folger', 'Cousin Samuel'],
    ['14', '19', '20', '30'],
  ],
  [
    'match02',
    'Match each reading exercise to its purpose.',
    [
      'Turn prose into verse',
      'Reorder jumbled hints',
      'Reconstruct the Spectator',
      'Board himself',
    ],
    ['46', '47', '45', '49'],
  ],
  [
    'match03',
    'Match each printer to the correct clue.',
    ['William Bradford', 'Andrew Bradford', 'Palmer', 'Watts'],
    ['63', '79', '116', '129'],
  ],
  [
    'match04',
    'Match each friend to the memorable connection.',
    ['Matthew Adams', 'John Collins', 'Joseph Watson', 'George Webb'],
    ['39', '42', '105', '154'],
  ],
  [
    'match05',
    'Match each author to the named work.',
    ['Defoe', 'Dr. Mather', 'Wollaston', 'Mandeville'],
    ['34', '35', '120', '124'],
  ],
  [
    'match06',
    'Match each Junto member to a trade or trait.',
    ['Nicholas Scull', 'William Parsons', 'William Maugridge', 'Robert Grace'],
    ['180', '181', '182', '183'],
  ],
  [
    'match07',
    'Match each sum to its context.',
    [
      'First customer',
      'New house annual rent',
      'Library initial payment',
      'Library annual payment',
    ],
    ['173', '171', '227', '228'],
  ],
  [
    'match08',
    'Match each date to the event.',
    [
      'London arrival',
      'Departure from Gravesend',
      'Return to Philadelphia',
      'Marriage to Miss Read',
    ],
    ['111', '147', '148', '220'],
  ],
];
const overrides: Record<string, string[]> = {
  match01: ['Silk dyer and namesake', 'Franklin’s mother', 'Maternal grandfather', 'Cutler'],
  match02: [
    'Expand the vocabulary',
    'Arrange thoughts',
    'Compare remembered writing with its model',
    'Save money and study time',
  ],
  match03: [
    'New York referral to his son',
    'Philadelphia host and rival',
    'First London employer',
    'Second London employer',
  ],
  match04: [
    'Private library lender',
    'Childhood debating friend',
    'Died in Franklin’s arms',
    'Former Oxford scholar',
  ],
  match06: ['Surveyor', 'Originally a shoemaker', 'Joiner and mechanic', 'Enjoyed punning'],
};
for (const [id, prompt, labels, nums] of matchingSets) {
  const fs = nums.map((n) => factById['f' + n.padStart(3, '0')]);
  const pairs = labels.map(
    (label, i) => [label, overrides[id]?.[i] ?? fs[i].answer] as [string, string],
  );
  questions.push({
    id,
    factIds: fs.map((f) => f.id),
    chapter: Math.max(...fs.map((f) => f.chapter)),
    category:
      id === 'match05'
        ? 'Books'
        : id === 'match08'
          ? 'Events'
          : id === 'match07'
            ? 'Business'
            : 'People',
    difficulty: 3,
    type: 'match',
    prompt,
    answer: pairs.map(([a, b]) => `${a} — ${b}`).join('; '),
    aliases: [],
    explanation: fs.map((f) => f.details).join(' '),
    sourcePages: [...new Set(fs.flatMap((f) => f.sourcePages))].sort((a, b) => a - b),
    pairs,
  });
}
export const questionById = Object.fromEntries(questions.map((q) => [q.id, q])) as Record<
  string,
  Question
>;
