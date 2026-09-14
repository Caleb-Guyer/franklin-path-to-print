import type { Location } from './types';
import { factById } from './facts';
const raw: [string, string, string, number, number, number[]][] = [
  [
    'boston',
    'Boston',
    'Family · school · apprenticeship',
    20,
    15,
    [19, 23, 25, 26, 36, 55, 57, 60, 61],
  ],
  ['newport', 'Newport', 'John · Vernon’s money', 31, 25, [89, 90, 91]],
  ['new-york', 'New York', 'Bradford · Collins · Burnet', 22, 39, [62, 63, 92, 93]],
  ['long-island', 'Long Island', 'The squall and the wet night', 40, 37, [65, 66, 67]],
  ['amboy', 'Amboy', 'The landing before the walk', 16, 50, [67, 68]],
  [
    'burlington',
    'Burlington',
    'A missed boat · currency printing',
    28,
    62,
    [69, 70, 163, 164, 165, 166],
  ],
  [
    'philadelphia',
    'Philadelphia',
    'Three rolls · printing · Junto',
    19,
    78,
    [72, 73, 74, 75, 76, 79, 171, 175, 220, 229],
  ],
  ['newcastle', 'Newcastle', 'Holmes · Keith · public printing', 9, 92, [83, 108, 110, 207]],
  ['block-island', 'Block Island', 'The codfish rationalization', 43, 18, [77]],
  [
    'london',
    'London',
    'Broken promises · Palmer · Watts',
    77,
    54,
    [111, 115, 116, 120, 122, 126, 129, 136],
  ],
  ['gravesend', 'Gravesend', 'The return voyage', 90, 70, [147]],
  ['ecton', 'Ecton', 'The ancestral village', 67, 14, [6, 7, 8, 12]],
  ['banbury', 'Banbury', 'The dyer’s household', 72, 28, [9, 10]],
  ['twyford', 'Twyford', 'The opening page · 1771', 62, 43, [1, 2, 3]],
  ['bristol', 'Bristol', 'Denham’s earlier creditors', 61, 68, [143]],
  ['barbados', 'Barbados', 'Collins · Keimer · Harry', 49, 91, [95, 213, 214]],
  ['carolina', 'North Carolina', 'Meredith returns to farming', 40, 78, [199, 250]],
];
export const locations: Location[] = raw.map(([id, name, subtitle, x, y, spec]) => {
  const factIds = spec.map((n) => 'f' + String(n).padStart(3, '0'));
  return {
    id,
    name,
    subtitle,
    x,
    y,
    factIds,
    sourcePages: [...new Set(factIds.flatMap((id) => factById[id].sourcePages))],
  };
});
