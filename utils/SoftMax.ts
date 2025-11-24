import { smartSearchTurbo } from './Fuzzy';

type RawResult = { item: string; score: number };
type ProbResult = { item: string; probability: number };

const softmax = (results: RawResult[]): ProbResult[] => {
  if (results.length === 0) return [];
  const expScores = results.map((r) => Math.exp(r.score));
  const sum = expScores.reduce((a, b) => a + b, 0);
  return results.map((r, i) => ({ item: r.item, probability: expScores[i] / sum }));
};

export const smartSearchWithProbabilities = (query: string, items: string[]): ProbResult[] => {
  const raw = smartSearchTurbo(query, items);
  return softmax(raw);
};
