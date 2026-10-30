/* Tool registry. Each tool: { id, icon, name, category, description, tags, pt: { name, description }, render(root) }. */
import { engineering } from './engineering.js';
import { science } from './science.js';
import { finance } from './finance.js';
import { it } from './it.js';
import { security } from './security.js';
import { ot } from './ot.js';

export const tools = [...engineering, ...science, ...finance, ...it, ...security, ...ot];

export const categories = ['Engineering', 'Science & Math', 'Finance & Planning', 'IT & Network', 'Cybersecurity', 'OT & IoT'];

const ids = tools.map(t => t.id);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) throw new Error(`Duplicate tool ids: ${dup.join(', ')}`);
