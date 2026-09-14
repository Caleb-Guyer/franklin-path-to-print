export type Category =
  'People' | 'Places' | 'Books' | 'Publications' | 'Business' | 'Events' | 'Ideas' | 'Decisions';
export type Difficulty = 1 | 2 | 3 | 4;
export interface Fact {
  id: string;
  sourcePages: number[];
  chapter: number;
  category: Category;
  label: string;
  prompt: string;
  answer: string;
  aliases: string[];
  difficulty: Difficulty;
  details: string;
}
export interface Character {
  id: string;
  name: string;
  role: string;
  relation: string;
  factIds: string[];
  sourcePages: number[];
  chapter: number;
}
export interface Location {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  factIds: string[];
  sourcePages: number[];
}
export interface Event {
  id: string;
  chapter: number;
  title: string;
  era: string;
  location: string;
  narration: string;
  factIds: string[];
  sourcePages: number[];
  order: number;
  decision?: { prompt: string; options: string[]; actual: number; outcome: string };
  dialogue?: {
    speaker: string;
    line: string;
    reply: string;
    options: string[];
    actual: number;
    significance: string;
  };
}
export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  era: string;
  place: string;
  boss: string;
  sourcePages: number[];
}
export type QuestionType =
  'recall' | 'blank' | 'person' | 'place' | 'reason' | 'choice' | 'boolean' | 'order' | 'match';
export interface Question {
  id: string;
  factIds: string[];
  chapter: number;
  category: Category;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  answer: string;
  aliases: string[];
  explanation: string;
  sourcePages: number[];
  options?: string[];
  sequence?: string[];
  pairs?: [string, string][];
}
