export const rankingPath = 'cahaya_public/usrah_bersih_202611';

export function standings({sessions, sums}) {
  if (!Number.isInteger(sessions) || sessions < 0 || sessions > 33 ||
      !Array.isArray(sums) || sums.length !== 6 ||
      !Array.from(sums).every(sum => Number.isInteger(sum) && sum >= 0 && sum <= sessions * 100)) {
    throw new Error('Ringkasan peringkat tidak valid.');
  }
  const rows = sums.map((sum, i) => ({usrah:i + 1, sum, average:sessions ? sum / sessions : null}));
  rows.sort((a, b) => b.sum - a.sum || a.usrah - b.usrah);
  rows.forEach((row, i) => {
    row.rank = !sessions ? null : i && row.sum === rows[i - 1].sum ? rows[i - 1].rank : i + 1;
  });
  return rows;
}
