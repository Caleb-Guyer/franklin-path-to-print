import source from './source.json' with { type: 'json' };

export type ChapterId = 1 | 2 | 3;
export type SourceRef = `${ChapterId}.${number}`;
export interface Line {
  speaker: string;
  text: string;
  refs: SourceRef[];
  exact?: boolean;
}
export interface Memory {
  id: string;
  name: string;
  lines: Line[];
  takeaway: string;
}
export interface Mission {
  id: ChapterId;
  title: string;
  subtitle: string;
  genre: string;
  objective: string;
  description: string;
  controls: string;
  color: string;
  memories: Memory[];
}
const voice = (text: string, ...refs: SourceRef[]): Line => ({
  speaker: 'Douglass · retold',
  text,
  refs,
});

export const missions: Mission[] = [
  {
    id: 1,
    title: 'A name of my own',
    subtitle: 'What they tried to take',
    genre: 'Moonlit platformer',
    color: '#e8bb86',
    objective: 'Follow four lights through the night.',
    description:
      'Leap the gaps and dash through drifting veils. Four lanterns reveal a childhood that slavery tried to erase.',
    controls: 'A / D move · Space double jump · Shift dash',
    memories: [
      {
        id: 'identity',
        name: 'The missing birthday',
        takeaway: 'Withholding knowledge is a form of control.',
        lines: [
          voice(
            'I was born in Tuckahoe, Maryland. White children could tell their ages. I could not even ask my enslaver about mine.',
            '1.1',
          ),
          voice(
            'I had never seen an authentic record of my age. Keeping people ignorant of their own lives was part of slavery’s power.',
            '1.1',
          ),
        ],
      },
      {
        id: 'mother',
        name: 'Twelve miles after dark',
        takeaway: 'Separation attacked family bonds; Harriet still made the journey.',
        lines: [
          voice(
            'My mother was Harriet Bailey. We were separated while I was an infant. After a day of field labor, she walked about twelve miles to see me at night.',
            '1.2',
            '1.3',
            '1.4',
          ),
          voice(
            'I remember only four or five short visits. She died when I was about seven; I was not allowed to attend her illness, death, or burial.',
            '1.4',
          ),
        ],
      },
      {
        id: 'condition',
        name: 'A life treated as property',
        takeaway: 'Slavery turned family relationships into an instrument of profit.',
        lines: [
          voice(
            'My father was white. Some whispered that my enslaver was my father, but I could not know whether that was true.',
            '1.3',
            '1.5',
          ),
          voice(
            'The law made children of enslaved women follow their mothers’ condition. A slaveholder could be both a child’s father and that child’s enslaver.',
            '1.5',
          ),
        ],
      },
      {
        id: 'witness',
        name: 'The first terrible lesson',
        takeaway: 'Witnessing violence exposed the terror behind the system.',
        lines: [
          voice(
            'Captain Anthony was my first enslaver; Plummer was his violent overseer. Anthony’s own cruelty became a terrible lesson for me.',
            '1.8',
          ),
          voice(
            'When Anthony brutally whipped my Aunt Hester, I hid in a closet, afraid I would be next. I had previously lived with my grandmother, away from these scenes.',
            '1.8',
            '1.9',
            '1.10',
          ),
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'What the songs carry',
    subtitle: 'Listen beneath the surface',
    genre: 'River navigation',
    color: '#9ce5d6',
    objective: 'Navigate the current. Hear four parts of the story.',
    description:
      'Steer through the rings, dodge the rocks, and hear why a song can sound joyful while carrying grief. Surge for speed; slow down for control.',
    controls: 'A / D steer · Shift surge · Space slow down',
    memories: [
      {
        id: 'river',
        name: 'The Sally Lloyd',
        takeaway: 'The river carried plantation wealth and people under coercion.',
        lines: [
          voice(
            'Colonel Edward Lloyd’s home plantation stood beside Miles River. Its tobacco, corn, and wheat went to market in Baltimore aboard the Sally Lloyd.',
            '2.1',
          ),
          voice(
            'Captain Thomas Auld commanded the sloop, with an enslaved crew. Captain Anthony was Lloyd’s clerk and superintendent—the overseer of the overseers.',
            '2.1',
          ),
        ],
      },
      {
        id: 'allowance',
        name: 'The other side of abundance',
        takeaway: 'A wealthy plantation did not mean adequate lives for its workers.',
        lines: [
          voice(
            'Adults received a monthly allowance of eight pounds of pork, or fish instead, and a bushel of corn meal. Young children received only two coarse shirts a year.',
            '2.3',
          ),
          voice(
            'There were no proper beds. After field work came washing, mending, and cooking. Lack of time to sleep was even worse than lack of beds.',
            '2.4',
          ),
        ],
      },
      {
        id: 'farm',
        name: 'The Great House Farm',
        takeaway: 'A small privilege within slavery was still part of slavery.',
        lines: [
          voice(
            'The Great House Farm was the center of the estate: supplies, skilled work, and decisions for the surrounding farms. Enslaved workers did its trades.',
            '2.2',
            '2.7',
          ),
          voice(
            'Being sent there on an errand was prized: it suggested trust and offered time away from field labor and the driver’s lash.',
            '2.7',
          ),
        ],
      },
      {
        id: 'songs',
        name: 'Hear what is really there',
        takeaway: 'The songs testify to sorrow and a longing for deliverance.',
        lines: [
          voice(
            'People sang on their way to the Great House Farm. Outsiders heard the singing and imagined contentment. That was a terrible mistake.',
            '2.8',
            '2.10',
            '2.12',
          ),
          voice(
            'The songs carried anguish and a prayer for deliverance. As a child I did not fully understand them; in remembering them, I recognized slavery’s dehumanizing power.',
            '2.11',
            '2.12',
          ),
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'The price of truth',
    subtitle: 'An estate built on silence',
    genre: 'First-person investigation',
    color: '#c5b5ee',
    objective: 'Find four testimonies. Reach the final light.',
    description:
      'Follow the compass to four testimonies. Use cover to stay out of the moving veil’s sight, and uncover the truth behind wealth, fear, and silence.',
    controls: 'W A S D move · ← / → or drag to look · E inspect · Shift sprint',
    memories: [
      {
        id: 'garden',
        name: 'The garden fence',
        takeaway: 'Luxury and deprivation existed side by side.',
        lines: [
          voice(
            'Lloyd’s garden drew visitors with its abundant fruit. Hungry enslaved people risked punishment for taking it.',
            '3.1',
          ),
          voice(
            'Lloyd coated the fence with tar. Tar on someone’s body was treated as proof of entering—or trying to enter—the garden, and punished.',
            '3.1',
          ),
        ],
      },
      {
        id: 'stable',
        name: 'The stable',
        takeaway: 'Arbitrary power made safety impossible to earn.',
        lines: [
          voice(
            'Old Barney and young Barney, father and son, cared for Lloyd’s fine horses. They could be punished over the horses’ appearance or Lloyd’s mood.',
            '3.2',
            '3.3',
          ),
          voice(
            'Their actual care did not guarantee safety. They could not contradict unjust accusations. Douglass’s description exposes power without accountability.',
            '3.3',
          ),
        ],
      },
      {
        id: 'road',
        name: 'A stranger on the road',
        takeaway: 'The reported conversation shows the cost of speaking honestly.',
        lines: [
          {
            speaker: 'Colonel Lloyd · reported exchange',
            text: 'Well, does the colonel treat you well?',
            refs: ['3.4'],
            exact: true,
          },
          {
            speaker: 'Unnamed enslaved man · reported exchange',
            text: 'No, sir,',
            refs: ['3.4'],
            exact: true,
          },
          voice(
            'The man did not recognize Lloyd. Two or three weeks later, he was sold to a Georgia trader for having found fault with his enslaver.',
            '3.4',
            '3.5',
          ),
        ],
      },
      {
        id: 'silence',
        name: 'What silence means',
        takeaway: 'An answer shaped by fear is not evidence of consent.',
        lines: [
          voice(
            'Slaveholders sent spies to learn what people really thought. Fear led enslaved people to praise their enslavers to strangers and suppress the truth.',
            '3.6',
          ),
          voice(
            'Saying that an enslaver was kind could be self-protection or a comparison with even crueler men. Douglass asks us to look beneath those words.',
            '3.6',
          ),
        ],
      },
    ],
  },
];

export interface DouglassQuestion {
  id: string;
  chapter: ChapterId;
  topic: 'Identity & family' | 'Power & violence' | 'Work & wealth' | 'Voice & meaning';
  prompt: string;
  choices: [string, string, string, string];
  answer: number;
  explanation: string;
  refs: SourceRef[];
}
type QuestionRow = [
  ChapterId,
  DouglassQuestion['topic'],
  string,
  string,
  string,
  string,
  string,
  string,
  SourceRef[],
];
const rows: QuestionRow[] = [
  [
    1,
    'Identity & family',
    'Where does Douglass say he was born?',
    'Tuckahoe, Maryland',
    'Baltimore, Maryland',
    'The city of Annapolis',
    'Georgia',
    'He places his birth in Tuckahoe, near Hillsborough, in Talbot County, Maryland.',
    ['1.1'],
  ],
  [
    1,
    'Identity & family',
    'Why can Douglass not give an exact age?',
    'He had never seen an authentic record of it.',
    'He forgot the birthday his mother taught him.',
    'The record was lost on the Sally Lloyd.',
    'He was born after the Narrative was written.',
    'He connects the missing record to enslavers’ desire to keep enslaved people ignorant of their ages.',
    ['1.1'],
  ],
  [
    1,
    'Power & violence',
    'What does the contrast with white children establish?',
    'Enslaved children were denied ordinary knowledge of their own lives.',
    'White children also knew nothing about their birthdays.',
    'Douglass received the same privileges as other children.',
    'Douglass wanted to leave Maryland to study calendars.',
    'The comparison makes deprivation of identity visible through a familiar childhood fact.',
    ['1.1'],
  ],
  [
    1,
    'Identity & family',
    'Who was Harriet Bailey?',
    'Douglass’s mother',
    'Captain Anthony’s daughter',
    'Colonel Lloyd’s gardener',
    'The commander of the Sally Lloyd',
    'Harriet Bailey was his mother; they were separated while he was an infant.',
    ['1.2', '1.3'],
  ],
  [
    1,
    'Identity & family',
    'How did Harriet manage to visit her son?',
    'She walked about twelve miles at night after field work.',
    'She came on the Sally Lloyd every morning.',
    'She was given regular days away from work.',
    'She lived beside him throughout his childhood.',
    'Her short nighttime visits required a long walk after a day of labor.',
    ['1.4'],
  ],
  [
    1,
    'Power & violence',
    'What does Douglass suggest early mother-child separation does?',
    'Damages the development of family affection',
    'Protects families from being separated later',
    'Guarantees children an education',
    'Lets mothers choose where their children live',
    'He suggests it hinders and destroys natural affection between mother and child.',
    ['1.3'],
  ],
  [
    1,
    'Identity & family',
    'Which statement about Douglass’s father is supported?',
    'He was white; the rumor that he was Douglass’s enslaver remains unconfirmed.',
    'Douglass proves Colonel Lloyd was his father.',
    'Douglass gives his father’s full name and birthday.',
    'Douglass says his father commanded the Sally Lloyd.',
    'He distinguishes what he was told about his father’s race from an unverified rumor about identity.',
    ['1.3', '1.5'],
  ],
  [
    1,
    'Power & violence',
    'What condition did the law assign children of enslaved women?',
    'They followed the condition of their mothers.',
    'They automatically became free if their father was white.',
    'They became free when their mothers died.',
    'Their status depended on which plantation they lived on.',
    'Douglass explains how this rule allowed slaveholders to enslave their own children.',
    ['1.5'],
  ],
  [
    1,
    'Identity & family',
    'What happened when Harriet died?',
    'Douglass was not allowed to attend her illness, death, or burial.',
    'Douglass was allowed to stay with her until she died.',
    'He immediately learned his father’s identity.',
    'His whole family was freed.',
    'He was about seven and learned of her death only after it happened.',
    ['1.4'],
  ],
  [
    1,
    'Power & violence',
    'Which pair correctly identifies enslaver and overseer in Chapter I?',
    'Captain Anthony and Plummer',
    'Colonel Lloyd and Harriet Bailey',
    'Thomas Auld and young Barney',
    'Old Barney and Captain Anthony',
    'Anthony was Douglass’s first enslaver; Plummer oversaw Anthony’s farms and enslaved people.',
    ['1.8'],
  ],
  [
    1,
    'Power & violence',
    'How did the child Douglass react to Aunt Hester’s whipping?',
    'He hid in a closet, terrified that he would be next.',
    'He confidently challenged Anthony.',
    'He assumed Hester would be freed afterward.',
    'He left for Baltimore aboard the sloop.',
    'His fear and hiding reveal how violence terrorized witnesses as well as its immediate victim.',
    ['1.10'],
  ],
  [
    1,
    'Voice & meaning',
    'Why does Douglass describe witnessing Aunt Hester’s suffering?',
    'It marks a terrible awakening to the brutality of slavery.',
    'It proves Anthony was generally humane.',
    'It celebrates the plantation’s rules.',
    'It explains why Douglass became a sailor.',
    'He presents it as an unforgettable entrance into the terror of slavery.',
    ['1.8', '1.10'],
  ],
  [
    2,
    'Work & wealth',
    'What was the Sally Lloyd?',
    'A sloop carrying plantation products to Baltimore',
    'The name of Colonel Lloyd’s home plantation',
    'A newspaper printed by Captain Anthony',
    'A garden near Tuckahoe',
    'The vessel carried tobacco, corn, and wheat from the plantation economy to market.',
    ['2.1'],
  ],
  [
    2,
    'Work & wealth',
    'Which river bordered Lloyd’s home plantation?',
    'Miles River',
    'The river beside a Georgia trader’s home',
    'A river Douglass does not name',
    'A river in Boston',
    'Douglass locates the home plantation on Miles River, in Talbot County.',
    ['2.1'],
  ],
  [
    2,
    'Work & wealth',
    'Who commanded the Sally Lloyd?',
    'Captain Thomas Auld',
    'Captain Anthony',
    'Mr. Plummer',
    'Old Barney',
    'Thomas Auld commanded the vessel; its other crew members were enslaved by Lloyd.',
    ['2.1'],
  ],
  [
    2,
    'Work & wealth',
    'What was Anthony’s position on Lloyd’s estate?',
    'Clerk and superintendent',
    'Chief gardener',
    'One of the horse keepers',
    'A visitor from Baltimore',
    'Douglass describes him as the overseer of the overseers.',
    ['2.1'],
  ],
  [
    2,
    'Work & wealth',
    'Which statement describes the adults’ food allowance?',
    'Pork or fish, plus corn meal, issued monthly',
    'Unlimited fruit from the garden',
    'Fresh meals whenever they needed them',
    'Only food grown on their own private farms',
    'The chapter specifies eight pounds of pork or equivalent fish and one bushel of corn meal per month.',
    ['2.3'],
  ],
  [
    2,
    'Work & wealth',
    'What clothing was allotted to children too young for field work?',
    'Two coarse linen shirts per year',
    'The same full clothing allowance as adults',
    'New shoes and jackets each month',
    'Fine clothes from the Great House',
    'When their shirts wore out, these children had to wait until the next allowance.',
    ['2.3'],
  ],
  [
    2,
    'Work & wealth',
    'Why was lack of sleep especially severe?',
    'Necessary chores consumed the hours after field labor.',
    'Everyone was permitted to sleep only aboard the sloop.',
    'The plantation provided beds but forbade their use.',
    'Children had to sing through the entire night.',
    'Washing, mending, and cooking cut into already limited sleeping time.',
    ['2.4'],
  ],
  [
    2,
    'Work & wealth',
    'What was the Great House Farm’s role?',
    'The central workplace and administrative hub for the estate',
    'A free community outside the plantation system',
    'A school run for the enslaved children',
    'A market located in Georgia',
    'Skilled trades, supplies, and decisions for the other farms were concentrated there.',
    ['2.2', '2.7'],
  ],
  [
    2,
    'Power & violence',
    'Why were errands to the Great House Farm valued?',
    'They offered a brief escape from field labor and signaled trust.',
    'They permanently freed whoever was chosen.',
    'They guaranteed admission to a school.',
    'They paid enough to purchase the plantation.',
    'A small privilege and respite within slavery did not amount to freedom.',
    ['2.7'],
  ],
  [
    2,
    'Voice & meaning',
    'What mistake did some outsiders make about the songs?',
    'They treated singing as evidence of happiness in slavery.',
    'They understood every song as testimony against slavery.',
    'They thought nobody sang near the Great House Farm.',
    'They believed the songs were written by Lloyd.',
    'Douglass explicitly rejects singing as proof of contentment.',
    ['2.12'],
  ],
  [
    2,
    'Voice & meaning',
    'What do the songs communicate in Douglass’s interpretation?',
    'Sorrow, anguish, and a prayer for deliverance',
    'Approval of the plantation’s living conditions',
    'A promise to stop speaking to strangers',
    'Instructions for tending Lloyd’s horses',
    'The songs bear witness against slavery, even when a tune seems joyful.',
    ['2.11', '2.12'],
  ],
  [
    2,
    'Voice & meaning',
    'How does the narrator’s understanding differ from his childhood understanding?',
    'Looking back, he can interpret a meaning the child did not fully grasp.',
    'As a child he knew more about the songs than he does when writing.',
    'He decides the songs had no meaning at all.',
    'He concludes that outsiders had always understood correctly.',
    'The adult narrator gives meaning to experiences that overwhelmed the child.',
    ['2.11'],
  ],
  [
    3,
    'Work & wealth',
    'What contrast does Lloyd’s garden reveal?',
    'Abundant luxury alongside the hunger of enslaved people',
    'Equal access to food for everyone',
    'An estate with no valuable possessions',
    'A place where workers freely chose their jobs',
    'Fine fruit attracted visitors while hungry people risked punishment for taking it.',
    ['3.1'],
  ],
  [
    3,
    'Power & violence',
    'Why was the garden fence coated with tar?',
    'Marks of tar could be used as evidence to punish people.',
    'It made the garden open to all visitors.',
    'It paid the gardeners for their work.',
    'It protected the Sally Lloyd from storms.',
    'Even tar interpreted as proof of an attempt to enter could lead to punishment.',
    ['3.1'],
  ],
  [
    3,
    'Identity & family',
    'How were old Barney and young Barney related?',
    'Father and son',
    'Brothers',
    'Uncle and nephew',
    'They were unrelated overseers',
    'The father and son were enslaved men responsible for Lloyd’s horses.',
    ['3.3'],
  ],
  [
    3,
    'Work & wealth',
    'What was the Barneys’ work?',
    'Caring for Lloyd’s horses and stable establishment',
    'Commanding the Sally Lloyd',
    'Supervising every farm on the estate',
    'Maintaining the fruit garden',
    'The chapter connects elaborate wealth in the stables with the insecurity of the people maintaining it.',
    ['3.2', '3.3'],
  ],
  [
    3,
    'Power & violence',
    'Why could good work fail to protect the Barneys?',
    'Punishment depended on Lloyd’s suspicions and mood.',
    'They were free to contradict Lloyd whenever he complained.',
    'They had authority over Lloyd.',
    'Only proven deliberate harm could be punished.',
    'The arbitrary accusations show that safety did not follow fair or consistent rules.',
    ['3.3'],
  ],
  [
    3,
    'Power & violence',
    'Why did the man on the road speak openly about Lloyd?',
    'He did not recognize that the stranger was Lloyd himself.',
    'Lloyd promised that criticism could never be punished.',
    'He already knew he had been freed.',
    'He had been sent by Douglass to deliver a speech.',
    'The reported encounter depends on the man not recognizing his own enslaver.',
    ['3.4', '3.5'],
  ],
  [
    3,
    'Power & violence',
    'What followed the roadside conversation?',
    'The man was sold to a Georgia trader.',
    'The man was made superintendent.',
    'Lloyd changed all the plantation’s rules.',
    'The man was given a permanent position on the sloop.',
    'Douglass calls this a penalty for telling the simple truth.',
    ['3.5'],
  ],
  [
    3,
    'Voice & meaning',
    'Why might an enslaved person praise an enslaver to a stranger?',
    'Fear of spies and retaliation could make praise a means of protection.',
    'Such praise always proved the system was kind.',
    'Everyone had a legal duty to publish flattering books.',
    'No one knew there were other plantations.',
    'Douglass warns readers not to interpret coerced statements as evidence of contentment.',
    ['3.6'],
  ],
  [
    3,
    'Voice & meaning',
    'What did slaveholders use spies to learn?',
    'Enslaved people’s real views and feelings about their condition',
    'The location of a lost birthday record',
    'How many songs had been written in Baltimore',
    'The proper route for the Sally Lloyd',
    'Surveillance encouraged people to keep their thoughts to themselves.',
    ['3.6'],
  ],
  [
    3,
    'Voice & meaning',
    'What connects the singing in Chapter II and praise in Chapter III?',
    'Appearances can conceal suffering when people live under coercion.',
    'Both prove that enslaved people were content.',
    'Both show that Lloyd had no control over anyone.',
    'Both are stories about freedom already achieved.',
    'A joyful sound or favorable answer must be read in the context of fear, grief, and unequal power.',
    ['2.12', '3.6'],
  ],
  [
    3,
    'Voice & meaning',
    'Which claim best captures the roadside anecdote’s purpose?',
    'Truth becomes dangerous when one person has unchecked power over another.',
    'Every complaint led to fair investigation.',
    'Lloyd knew all the people he enslaved by sight.',
    'All strangers offered a safe chance to speak freely.',
    'The sale after an honest answer illustrates the coercion behind outward silence and praise.',
    ['3.4', '3.5', '3.6'],
  ],
  [
    3,
    'Voice & meaning',
    'What should a reader question across these three chapters?',
    'Who controls information, resources, and the freedom to speak',
    'Whether fine gardens mean everyone has enough food',
    'Only the exact price of each carriage',
    'Whether slavery is justified by a cheerful song',
    'Douglass’s examples connect denied identity, material deprivation, violence, and enforced silence.',
    ['1.1', '2.3', '2.12', '3.6'],
  ],
];
export const questions: DouglassQuestion[] = rows.map((r, i) => {
  const [chapter, topic, prompt, correct, b, c, d, explanation, refs] = r;
  const choices = [correct, b, c, d];
  const offset = (i * 7 + 1) % 4;
  const rotated = [
    ...choices.slice(offset),
    ...choices.slice(0, offset),
  ] as DouglassQuestion['choices'];
  return {
    id: `d-${i + 1}`,
    chapter,
    topic,
    prompt,
    choices: rotated,
    answer: rotated.indexOf(correct),
    explanation,
    refs,
  };
});
export function passage(ref: SourceRef) {
  const [chapter, paragraph] = ref.split('.').map(Number);
  return source.find((s) => s.chapter === chapter)?.paragraphs[paragraph - 1];
}
export function sourceLink(chapter: number) {
  return `https://www.gutenberg.org/files/23/23-h/23-h.htm#link2HCH000${chapter}`;
}
export { source };
