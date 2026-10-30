/* CVSS v3.1 base score (FIRST specification, section 7). */
export const metrics = {
  AV: { name: 'Attack Vector', values: { N: ['Network', 0.85], A: ['Adjacent', 0.62], L: ['Local', 0.55], P: ['Physical', 0.2] } },
  AC: { name: 'Attack Complexity', values: { L: ['Low', 0.77], H: ['High', 0.44] } },
  PR: { name: 'Privileges Required', values: { N: ['None', 0.85], L: ['Low', 0.62], H: ['High', 0.27] } },
  UI: { name: 'User Interaction', values: { N: ['None', 0.85], R: ['Required', 0.62] } },
  S: { name: 'Scope', values: { U: ['Unchanged', 0], C: ['Changed', 1] } },
  C: { name: 'Confidentiality', values: { H: ['High', 0.56], L: ['Low', 0.22], N: ['None', 0] } },
  I: { name: 'Integrity', values: { H: ['High', 0.56], L: ['Low', 0.22], N: ['None', 0] } },
  A: { name: 'Availability', values: { H: ['High', 0.56], L: ['Low', 0.22], N: ['None', 0] } },
};

function roundUp(x) { const i = Math.round(x * 100000); return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10; }

export function baseScore(sel) {
  for (const k of Object.keys(metrics)) if (!metrics[k].values[sel[k]]) throw new Error(`Missing or invalid ${metrics[k].name}`);
  const changed = sel.S === 'C';
  const pr = sel.PR === 'N' ? 0.85 : sel.PR === 'L' ? (changed ? 0.68 : 0.62) : (changed ? 0.5 : 0.27);
  const iss = 1 - (1 - metrics.C.values[sel.C][1]) * (1 - metrics.I.values[sel.I][1]) * (1 - metrics.A.values[sel.A][1]);
  const impact = changed ? 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15 : 6.42 * iss;
  const exploit = 8.22 * metrics.AV.values[sel.AV][1] * metrics.AC.values[sel.AC][1] * pr * metrics.UI.values[sel.UI][1];
  let score;
  if (impact <= 0) score = 0;
  else if (changed) score = roundUp(Math.min(1.08 * (impact + exploit), 10));
  else score = roundUp(Math.min(impact + exploit, 10));
  const severity = score === 0 ? 'None' : score < 4 ? 'Low' : score < 7 ? 'Medium' : score < 9 ? 'High' : 'Critical';
  const vector = 'CVSS:3.1/' + Object.keys(metrics).map(k => `${k}:${sel[k]}`).join('/');
  return { score, severity, vector, impact: Math.max(0, impact), exploitability: exploit };
}

export function parseVector(text) {
  const s = String(text).trim();
  const sel = {};
  for (const part of s.replace(/^CVSS:3\.[01]\//i, '').split('/')) {
    const [k, v] = part.split(':');
    if (metrics[k]) sel[k] = v;
  }
  return sel;
}
