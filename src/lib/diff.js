/* Line diff via longest common subsequence. Returns [{type:'same'|'add'|'del', text, a, b}]. */
export function diffLines(aText, bText, { ignoreWhitespace = false } = {}) {
  const norm = s => ignoreWhitespace ? s.replace(/\s+/g, ' ').trim() : s;
  const a = aText.split(/\r?\n/), b = bText.split(/\r?\n/);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = norm(a[i]) === norm(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (norm(a[i]) === norm(b[j])) { out.push({ type: 'same', text: a[i], a: i + 1, b: j + 1 }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: a[i], a: i + 1 }); i++; }
    else { out.push({ type: 'add', text: b[j], b: j + 1 }); j++; }
  }
  while (i < n) { out.push({ type: 'del', text: a[i], a: i + 1 }); i++; }
  while (j < m) { out.push({ type: 'add', text: b[j], b: j + 1 }); j++; }
  return out;
}

export function diffStats(diff) {
  return { added: diff.filter(d => d.type === 'add').length, removed: diff.filter(d => d.type === 'del').length, same: diff.filter(d => d.type === 'same').length };
}

export function toUnified(diff, aName = 'a', bName = 'b') {
  const lines = [`--- ${aName}`, `+++ ${bName}`];
  for (const d of diff) lines.push((d.type === 'add' ? '+' : d.type === 'del' ? '-' : ' ') + d.text);
  return lines.join('\n');
}
