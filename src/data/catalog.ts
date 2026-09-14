import { facts } from './facts';
import { characters } from './characters';
import { events } from './chapters';
export const cards = facts.map((f) => ({
  ...f,
  relatedCharacters: characters.filter((c) => c.factIds.includes(f.id)).map((c) => c.id),
  relatedEvents: events.filter((e) => e.factIds.includes(f.id)).map((e) => e.id),
}));
export const books = cards.filter((c) => c.category === 'Books');
export const publications = cards.filter((c) => c.category === 'Publications');
export const virtues = cards.filter((c) => c.category === 'Ideas');
export const timeline = [...events].sort((a, b) => a.order - b.order);
