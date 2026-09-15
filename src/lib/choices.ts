import { facts, factById } from '../data/facts';
import type { Question } from '../data/types';

const canonical = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]/g, '');
const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0);
function family(prompt: string, answer: string, category: string) {
  if (/\b\d{4}\b/.test(answer))
    return /January|February|March|April|May|June|July|August|September|October|November|December/i.test(
      answer,
    )
      ? 'date'
      : 'year';
  if (/how long|how many years/i.test(prompt)) return 'duration';
  if (/what age|at what age|how old/i.test(prompt)) return 'age';
  if (
    /year|date|when|how long|how many|what age|at what age|how old|what size|how much/i.test(prompt)
  )
    return /pound|shilling|pence|penny|guinea/i.test(answer) ? 'money' : 'number';
  if (/related|relation|relationship|to whom|which uncle/i.test(prompt)) return 'relation';
  if (
    /^who|^whose|which (?:printer|governor|friend|man|person|pirate|tradesman|acquaintance)/i.test(
      prompt,
    )
  )
    return 'name';
  if (/^where|which.*(?:village|town|city)|in what.*(?:place|town)/i.test(prompt)) return 'place';
  if (
    /why|what was wrong|what.*(?:caused|reason|purpose|uncertaint|weakness|obstacle)|how did/i.test(
      prompt,
    )
  )
    return 'reason';
  if (/trade|profession|occupation|businesses/i.test(prompt)) return 'trade';
  if (category === 'Books' || category === 'Publications') return 'publication';
  if (category === 'People') return 'name';
  return category;
}

/** Choices only reuse the supplied source bank. Source formats remain available for audit. */
export function multipleChoice(q: Question): Question {
  if ((q.type === 'choice' || q.type === 'boolean') && q.options?.length)
    return { ...q, type: 'choice' };
  // This prompt asks for two people, so every option must be a pair of source names.
  if (q.id === 'q197')
    return {
      ...q,
      type: 'choice',
      options: [
        q.answer,
        ...[
          ['f160', 'f154'],
          ['f063', 'f110'],
          ['f084', 'f109'],
        ].map((ids) => ids.map((id) => factById[id].answer).join(' and ')),
      ],
    };
  if (q.type === 'order' && q.sequence) {
    const index = hash(q.id) % (q.sequence.length - 1),
      answer = q.sequence[index + 1];
    return {
      ...q,
      type: 'choice',
      prompt: `What comes immediately after “${q.sequence[index]}” in this sequence?`,
      answer,
      aliases: [],
      options: [answer, ...q.sequence.filter((s) => s !== answer).slice(0, 3)],
    };
  }
  if (q.type === 'match' && q.pairs) {
    const pair = q.pairs[hash(q.id) % q.pairs.length];
    return {
      ...q,
      type: 'choice',
      prompt: `${q.prompt} Which connection belongs to “${pair[0]}”?`,
      answer: pair[1],
      aliases: [],
      options: [
        pair[1],
        ...q.pairs
          .map((p) => p[1])
          .filter((s) => s !== pair[1])
          .slice(0, 3),
      ],
    };
  }
  const accepted = new Set([q.answer, ...q.aliases].map(canonical));
  const group = family(q.prompt, q.answer, q.category);
  const topicWords = new Set(
    (q.prompt + ' ' + q.answer)
      .toLowerCase()
      .match(/[a-z]{5,}/g)
      ?.filter(
        (word) =>
          ![
            'franklin',
            'which',
            'whose',
            'about',
            'after',
            'before',
            'first',
            'would',
            'their',
            'there',
          ].includes(word),
      ) ?? [],
  );
  const candidates = facts.filter(
    (f) =>
      !q.factIds.includes(f.id) &&
      ![f.answer, ...f.aliases].some((s) => accepted.has(canonical(s))),
  );
  const score = (f: (typeof facts)[number]) =>
    (family(f.prompt, f.answer, f.category) === group ? 100 : 0) +
    (f.category === q.category ? 15 : 0) +
    (f.chapter === q.chapter ? 7 : 0) -
    Math.abs(f.answer.length - q.answer.length) * 0.15 +
    [...topicWords].filter((word) => (f.prompt + ' ' + f.details).toLowerCase().includes(word))
      .length *
      5;
  const ranked = candidates.map((fact) => ({
    fact,
    score: score(fact),
    tie: hash(q.id + fact.id),
  }));
  ranked.sort((a, b) => b.score - a.score || a.tie - b.tie);
  const options = [q.answer],
    used = new Set(accepted);
  for (const { fact: f } of ranked) {
    if (used.has(canonical(f.answer))) continue;
    options.push(f.answer);
    [f.answer, ...f.aliases].forEach((a) => used.add(canonical(a)));
    if (options.length === 4) break;
  }
  return { ...q, type: 'choice', options };
}
