import { factById } from './facts';
import type { Character } from './types';
const rows = `
josiah|Josiah Franklin|Father; chandler and soap-boiler|Father|17,18,19,23,24,26,27,28,29,88
abiah|Abiah Folger|Mother|Mother; Peter Folger’s daughter|19,20,29
grandfather|Thomas Franklin (grandfather)|Ancestral patriarch|Paternal grandfather|9,10,11
thomas|Thomas Franklin (uncle)|Smith, scrivener, public-spirited uncle|Father’s brother|12,13,231
john-uncle|John Franklin (uncle)|Dyer at Banbury|Father’s brother and apprenticeship master|10,11
benjamin-uncle|Benjamin Franklin (uncle)|Silk dyer, shorthand inventor|Father’s brother; namesake|14,15,16
peter|Peter Folger|Writer on liberty of conscience|Maternal grandfather|20,21,22,233
brownell|George Brownell|Writing and arithmetic teacher|Teacher|25
samuel|Samuel Franklin|Cutler|Cousin; uncle Benjamin’s son|30
john-brother|John Franklin (brother)|Settled at Newport|Brother|89,90,235
josiah-brother|Josiah Franklin (brother)|Went away to sea|Brother|234
james|James Franklin|Boston printer|Brother and apprenticeship master|36,37,38,55,57,58,59,60,87
adams|Matthew Adams|Tradesman with a library|Book lender|39
collins|John Collins|Bookish friend, later post-office clerk|Childhood friend; debating partner and borrower|42,61,89,92,93,94,95
worthilake|Captain Worthilake|Drowned with his two daughters|Subject of Franklin’s ballad|40
william-bradford|William Bradford|New York printer|Andrew’s father; referral to Philadelphia|63,64,80
andrew-bradford|Andrew Bradford|Philadelphia printer and postmaster|Early host, competitor and publisher|79,80,190,193,215,216
rose|Aquila Rose|Printer, poet, Assembly clerk|His death creates the suggested opening|64,81,211
brown|Dr. Brown|Innkeeper near Burlington|Journey acquaintance|68
read|Miss Read|Later wife and shop partner|Early host’s daughter; later wife|74,103,119,149,220,221,222
read-mother|Mrs. Read|Mother of Miss Read|Delays the early match|103,217,220
keimer|Keimer|Printer, stationer, former French prophet|Employer and later competitor|80,81,82,99,100,101,102,132,159,162,189,191,213,214
holmes|Robert Holmes|Sloop master|Brother-in-law|83,84
keith|Sir William Keith|Governor who promises support|Unreliable would-be patron|84,85,86,96,97,98,108,111,113,240
french|Colonel French|Keith’s companion|Assists introductions|85,110
vernon|Vernon|John’s friend; owner of entrusted money|Creditor|89,93,195
burnet|Governor Burnet|Governor; interested in books|New York host; later newspaper subject|92,192
osborne|Charles Osborne|Scrivener’s clerk; later lawyer|Reading-circle friend|104,106,107
watson|Joseph Watson|Scrivener’s clerk|Reading-circle friend|104,105,106
ralph|James Ralph|Merchant’s clerk, aspiring poet|Friend, companion in London and borrower|104,107,117,118,119,121,127,128,146,242,243
bard|Dr. Bard|Governor’s secretary|Conveys Keith’s excuses|108
denham|Mr. Denham|Quaker merchant|Friend, mentor and employer|109,113,143,144,151
hamilton|Andrew Hamilton|Lawyer and Assembly member|Friend and business patron|110,114,194,207
riddlesden|Riddlesden|Attorney|Harmed the Read family; schemed against Hamilton|112,114
palmer|Palmer|London printer|First London employer|116,120,121
wilcox|Wilcox|Second-hand bookseller|London lender of books|122
lyons|Lyons|Surgeon and author|Introduces Mandeville and Pemberton|123
mandeville|Dr. Mandeville|Author of The Fable of the Bees|London acquaintance|124
pemberton|Dr. Pemberton|Coffee-house acquaintance|Promises a chance to see Newton|123,125
sloane|Sir Hans Sloane|Collector of curiosities|Buys Franklin’s asbestos purse|126
newton|Sir Isaac Newton|The hoped-for meeting|A meeting was promised but never occurred|125
mrs-t|Mrs. T—|Milliner associated with Ralph|Rejects Franklin’s advances|128
watts|Watts|London master printer|Second London employer|129,130,132,133,135
wygate|Wygate|Educated printer and swimming pupil|Friend proposing European travels|140,141,142
wyndham|Sir William Wyndham|Father of prospective swimming pupils|Makes an offer Franklin cannot undertake|145
rogers|Rogers|Potter|Miss Read’s earlier husband|149,221
gordon|Major Gordon|Keith’s successor|Governor on Franklin’s return|245
meredith|Hugh Meredith|Welsh Pennsylvanian; pressman|Coworker and business partner|152,160,161,196,198,199,200,201,202,249,250
potts|Stephen Potts|Countryman trained in binding|Coworker and Junto member|153
webb|George Webb|Former Oxford student|Indentured coworker; discloses newspaper plan|154,155,156,189
harry|David Harry|Keimer’s apprentice; later printer|Pupil and competitor|157,214
bustill|Samuel Bustill|Provincial secretary|Burlington acquaintance|165
decow|Isaac Decow|Surveyor-general|Burlington adviser|166
house|George House|Acquaintance who finds a customer|Brings the first paying customer|172,173
mickle|Samuel Mickle|Persistent pessimist|Warns the new printer of failure|174
breintnal|Joseph Breintnal|Deed copier, poet|Junto friend and source of business|178,186,190,209
godfrey|Thomas Godfrey|Glazier and mathematician|Housemate and Junto member|171,179,219
scull|Nicholas Scull|Surveyor; later surveyor-general|Junto member|180
parsons|William Parsons|Shoemaker; later surveyor-general|Junto member|181
maugridge|William Maugridge|Joiner and mechanic|Junto member|182
grace|Robert Grace|Generous friend of some fortune|Junto member, lender and meeting host|183,197,201,223
coleman|William Coleman|Clerk, merchant, later provincial judge|Junto friend and lender|184,197,201
baird|Dr. Baird|Witness to Franklin’s industry|Defends the new printer at a club|188
whitmarsh|Whitmarsh|Compositor from London|Employee|210
mrs-godfrey|Mrs. Godfrey|Housemate and matchmaker|Arranges the unsuccessful courtship|217,218,219
brockden|Brockden / Brogden|Scrivener (spellings in the scan)|Formalizes library proposals; earlier clerks’ employer|104,225
`;
export const characters: Character[] = rows
  .trim()
  .split('\n')
  .map((row) => {
    const [id, name, role, relation, spec] = row.split('|');
    const factIds = spec.split(',').map((n) => 'f' + n.padStart(3, '0'));
    return {
      id,
      name,
      role,
      relation,
      factIds,
      sourcePages: [...new Set(factIds.flatMap((id) => factById[id].sourcePages))],
      chapter: Math.min(...factIds.map((id) => factById[id].chapter)),
    };
  });
export const relationships = [
  ['josiah', 'abiah', 'spouses'],
  ['josiah', 'james', 'father / son'],
  ['abiah', 'peter', 'daughter / father'],
  ['josiah', 'benjamin-uncle', 'brothers'],
  ['benjamin-uncle', 'samuel', 'father / son'],
  ['william-bradford', 'andrew-bradford', 'father / son'],
  ['keith', 'holmes', 'letter introduces Franklin'],
  ['keith', 'bard', 'governor / secretary'],
  ['keith', 'french', 'visit Franklin together'],
  ['denham', 'keith', 'exposes false promises'],
  ['ralph', 'osborne', 'poetry rivalry'],
  ['ralph', 'mrs-t', 'companions'],
  ['hamilton', 'riddlesden', 'target of a scheme'],
  ['keimer', 'meredith', 'master / pressman'],
  ['keimer', 'webb', 'purchases service'],
  ['keimer', 'harry', 'master, later employee'],
  ['grace', 'coleman', 'independent offers of help'],
  ['read', 'rogers', 'earlier marriage'],
  ['godfrey', 'mrs-godfrey', 'spouses'],
  ['rose', 'andrew-bradford', 'principal hand'],
];
