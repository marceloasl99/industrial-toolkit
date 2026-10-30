/*
 * Safe arithmetic expression evaluator (shunting-yard). No eval, no Function().
 * Supports + - * / % ^ (right-assoc), unary minus, parentheses, scientific notation,
 * × ÷ − symbols, constants (pi, e, tau), variables, and a fixed function table.
 * Trigonometry works in degrees by default; pass { radians: true } to switch.
 */
const FUNCTIONS = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
  ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  fact: n => { if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error('fact() needs an integer 0–170'); let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
};
const TRIG = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'];
const CONSTANTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };
const OPS = { '+': [1, 'L'], '-': [1, 'L'], '*': [2, 'L'], '/': [2, 'L'], '%': [2, 'L'], '^': [4, 'R'], neg: [3, 'R'] };

export const supportedFunctions = [...Object.keys(FUNCTIONS), ...TRIG].sort();
export const supportedConstants = Object.keys(CONSTANTS);

function tokenize(input) {
  const s = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi').replace(/,/g, '.');
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i);
      if (!m || m[0] === '.') throw new Error(`Invalid number at position ${i + 1}`);
      tokens.push({ t: 'num', v: Number(m[0]) }); i += m[0].length; continue;
    }
    if (/[a-z_]/i.test(c)) {
      const m = s.slice(i).match(/^[a-z_][a-z0-9_]*/i);
      i += m[0].length;
      const rest = s.slice(i);
      tokens.push({ t: /^\s*\(/.test(rest) ? 'fn' : 'var', v: m[0].toLowerCase() });
      continue;
    }
    if ('+-*/%^()'.includes(c)) { tokens.push({ t: c }); i++; continue; }
    throw new Error(`Unsupported character "${c}"`);
  }
  return tokens;
}

function toRpn(tokens) {
  const out = [], stack = [];
  let prev = 'start'; // 'start' | 'value' | 'op' | '('
  for (const tok of tokens) {
    if (tok.t === 'num' || tok.t === 'var') {
      if (prev === 'value') throw new Error('Missing operator between values');
      out.push(tok); prev = 'value';
    } else if (tok.t === 'fn') {
      if (prev === 'value') throw new Error('Missing operator before function');
      stack.push(tok); prev = 'op';
    } else if (tok.t === '(') {
      if (prev === 'value') throw new Error('Missing operator before "("');
      stack.push(tok); prev = '(';
    } else if (tok.t === ')') {
      if (prev !== 'value') throw new Error('Empty parentheses or dangling operator');
      while (stack.length && stack[stack.length - 1].t !== '(') out.push(stack.pop());
      if (!stack.length) throw new Error('Unbalanced parentheses');
      stack.pop();
      if (stack.length && stack[stack.length - 1].t === 'fn') out.push(stack.pop());
      prev = 'value';
    } else {
      let op = tok.t;
      const unaryPos = prev !== 'value';
      if (unaryPos && op === '-') op = 'neg';
      else if (unaryPos && op === '+') continue;
      else if (unaryPos) throw new Error(`Unexpected operator "${op}"`);
      const [p, assoc] = OPS[op];
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.t === '(' || top.t === 'fn') break;
        const [tp] = OPS[top.t];
        if (tp > p || (tp === p && assoc === 'L')) out.push(stack.pop()); else break;
      }
      stack.push({ t: op });
      prev = 'op';
    }
  }
  if (prev === 'op') throw new Error('Expression ends with an operator');
  while (stack.length) {
    const s = stack.pop();
    if (s.t === '(') throw new Error('Unbalanced parentheses');
    out.push(s);
  }
  return out;
}

export function evaluate(input, { variables = {}, radians = false } = {}) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('Enter an expression');
  const rpn = toRpn(tokenize(input));
  const toRad = x => radians ? x : x * Math.PI / 180;
  const fromRad = x => radians ? x : x * 180 / Math.PI;
  const trig = { sin: x => Math.sin(toRad(x)), cos: x => Math.cos(toRad(x)), tan: x => Math.tan(toRad(x)), asin: x => fromRad(Math.asin(x)), acos: x => fromRad(Math.acos(x)), atan: x => fromRad(Math.atan(x)) };
  const st = [];
  const pop = () => { if (!st.length) throw new Error('Malformed expression'); return st.pop(); };
  for (const tok of rpn) {
    if (tok.t === 'num') st.push(tok.v);
    else if (tok.t === 'var') {
      if (tok.v in variables) { const v = Number(variables[tok.v]); if (!Number.isFinite(v)) throw new Error(`Variable "${tok.v}" has no numeric value`); st.push(v); }
      else if (tok.v in CONSTANTS) st.push(CONSTANTS[tok.v]);
      else if (tok.v in FUNCTIONS || TRIG.includes(tok.v)) throw new Error(`${tok.v}() needs parentheses`);
      else throw new Error(`Unknown identifier "${tok.v}"`);
    } else if (tok.t === 'fn') {
      const f = trig[tok.v] || FUNCTIONS[tok.v];
      if (!f) throw new Error(`Unknown function "${tok.v}"`);
      st.push(f(pop()));
    } else if (tok.t === 'neg') st.push(-pop());
    else {
      const b = pop(), a = pop();
      switch (tok.t) {
        case '+': st.push(a + b); break;
        case '-': st.push(a - b); break;
        case '*': st.push(a * b); break;
        case '/': st.push(a / b); break;
        case '%': st.push(a % b); break;
        case '^': st.push(a ** b); break;
      }
    }
  }
  if (st.length !== 1) throw new Error('Malformed expression');
  const v = st[0];
  if (!Number.isFinite(v)) throw new Error('Result is not finite (division by zero or overflow)');
  return v;
}

/** Extract variable names used by an expression (for custom formula tools). */
export function variablesIn(input) {
  return [...new Set(tokenize(input).filter(t => t.t === 'var' && !(t.v in CONSTANTS)).map(t => t.v))];
}
