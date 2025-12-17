const normalizedCache = new Map<string, string>();
const digitCache = new Map<string, string>();

export const buildSearchIndex = (items: string[]) => {
  items.forEach((item) => {
    const n = item
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    normalizedCache.set(item, n);
    digitCache.set(item, n.match(/\d+/g)?.join('') || '');
  });
};

const fzfScore = (query: string, target: string) => {
  let score = 0;
  let qi = 0;
  for (let i = 0; i < query.length; i++) {
    const q = query[i];
    const pos = target.indexOf(q, qi);
    if (pos === -1) {
      score -= 8;
    } else {
      const proximity = qi === pos ? 15 : 10 - (pos - qi);
      score += proximity;
      qi = pos + 1;
    }
  }
  return score;
};

const quickSelectTop5 = (
  arr: { item: string; score: number }[],
): { item: string; score: number }[] => {
  if (arr.length <= 5) return arr.sort((a, b) => b.score - a.score);

  const result = [...arr];
  const quickSelect = (left: number, right: number, k: number) => {
    while (left < right) {
      const pivotIndex = Math.floor((left + right) / 2);
      const pivotValue = result[pivotIndex].score;

      let i = left;
      const j = right;
      [result[pivotIndex], result[right]] = [result[right], result[pivotIndex]];

      for (let l = left; l < right; l++) {
        if (result[l].score > pivotValue) {
          [result[i], result[l]] = [result[l], result[i]];
          i++;
        }
      }
      [result[i], result[right]] = [result[right], result[i]];

      if (k === i) return;
      else if (k < i) right = i - 1;
      else left = i + 1;
    }
  };

  quickSelect(0, result.length - 1, 4);
  return result.slice(0, 5).sort((a, b) => b.score - a.score);
};

const hasWordStartingWith = (target: string, query: string): boolean => {
  const words = target.split(/(?<=[a-z])(?=[0-9])|(?<=[0-9])(?=[a-z])/);
  return words.some((word) => word.startsWith(query));
};

export const smartSearchTurbo = (query: string, items: string[]) => {
  const nq = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const digitsQ = nq.match(/\d+/g)?.join('') || '';
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const original = items[i];
    const nt = normalizedCache.get(original)!;

    let score = fzfScore(nq, nt);

    if (nt.startsWith(nq)) score += 120;
    else if (nt.includes(nq)) score += 60;
    else if (hasWordStartingWith(nt, nq)) score += 40;

    const digitsT = digitCache.get(original)!;
    if (digitsQ && digitsQ === digitsT) score += 80;

    if (score >= -10) {
      results.push({ item: original, score });
    }
  }

  if (results.length === 0) return [];

  return quickSelectTop5(results);
};
