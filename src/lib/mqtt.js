/* MQTT topic validation and wildcard matching (MQTT 3.1.1 / 5.0 rules). */
export function validateTopicFilter(filter) {
  if (typeof filter !== 'string' || !filter.length) throw new Error('Topic filter cannot be empty');
  if (new TextEncoder().encode(filter).length > 65535) throw new Error('Topic exceeds 65535 bytes');
  if (filter.includes('\u0000')) throw new Error('Topic cannot contain the null character');
  const levels = filter.split('/');
  levels.forEach((lvl, i) => {
    if (lvl.includes('#') && (lvl !== '#' || i !== levels.length - 1)) throw new Error('"#" must be the last level and stand alone');
    if (lvl.includes('+') && lvl !== '+') throw new Error('"+" must occupy an entire level');
  });
  return { levels: levels.length, hasWildcards: /[+#]/.test(filter), shared: filter.startsWith('$share/') };
}

export function validateTopicName(topic) {
  if (typeof topic !== 'string' || !topic.length) throw new Error('Topic name cannot be empty');
  if (/[+#]/.test(topic)) throw new Error('Published topic names cannot contain wildcards');
  return true;
}

export function topicMatches(filter, topic) {
  validateTopicFilter(filter);
  let f = filter;
  if (f.startsWith('$share/')) f = f.split('/').slice(2).join('/'); // $share/group/filter
  const fl = f.split('/'), tl = topic.split('/');
  // Topics starting with $ never match wildcards at the first level
  if (topic.startsWith('$') && (fl[0] === '+' || fl[0] === '#')) return false;
  for (let i = 0; i < fl.length; i++) {
    if (fl[i] === '#') return true;
    if (i >= tl.length) return false;
    if (fl[i] !== '+' && fl[i] !== tl[i]) return false;
  }
  return fl.length === tl.length;
}

export function sparkplugParse(topic) {
  // spBv1.0/<group_id>/<message_type>/<edge_node_id>[/<device_id>]
  const p = topic.split('/');
  if (p[0] !== 'spBv1.0' || p.length < 4) return null;
  return { namespace: p[0], group: p[1], messageType: p[2], edgeNode: p[3], device: p[4] || null };
}
