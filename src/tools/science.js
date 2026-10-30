import { mount, field, grid, result, details, renderDetails, hint, textarea } from '../ui.js';
import { evaluate, supportedFunctions } from '../lib/expr.js';
import { describe, parseNumbers } from '../lib/stats.js';
import { parseBase, toAllBases, toGray, fromGray, toBcd, fromBcd, groupDigits, twosComplement } from '../lib/base.js';
import { formatNumber, num } from '../lib/number.js';

const f = n => (Number.isFinite(n) ? formatNumber(n) : '—');

export const science = [
  {
    id: 'scientific', icon: '∑', name: 'Scientific Calculator', category: 'Science & Math', tags: ['calculadora', 'seno', 'cosseno', 'log', 'raiz', 'trigonometria'],
    description: 'Arithmetic, trigonometry (degrees), roots, logarithms, factorial. Accepts × ÷ − π.',
    pt: { name: 'Calculadora científica', description: 'Aritmética, trigonometria (graus), raízes, logaritmos, fatorial. Aceita × ÷ − π.' },
    render(root) {
      mount(root, {
        html: field({ id: 'sc-expr', label: 'Expression', value: 'sin(30) + sqrt(16) * 2', hint: `Functions: ${supportedFunctions.join(', ')}. Constants: pi, e, tau. Trig uses degrees.` }) +
          result({ id: 'sc-out', size: 'small' }),
        calc(q) {
          q('#sc-out').textContent = f(evaluate(q('#sc-expr').value));
        },
      });
    },
  },
  {
    id: 'statistics', icon: '▥', name: 'Statistics Calculator', category: 'Science & Math', tags: ['média', 'mediana', 'desvio', 'quartil', 'variância'],
    description: 'Mean, median, mode, quartiles, IQR, population and sample variance / standard deviation.',
    pt: { name: 'Calculadora estatística', description: 'Média, mediana, moda, quartis, IQR, variância e desvio padrão populacionais e amostrais.' },
    render(root) {
      mount(root, {
        html: textarea({ id: 'st-in', label: 'Numbers (comma, space, semicolon or new line)', value: '12, 15, 18, 22, 24, 29', rows: 4 }) + details('st-res', 3),
        calc(q) {
          const d = describe(parseNumbers(q('#st-in').value));
          renderDetails(q('#st-res'), [
            ['Count', d.count], ['Sum', f(d.sum)], ['Mean', f(d.mean)], ['Median', f(d.median)], ['Mode', d.mode.length ? d.mode.map(f).join(', ') : 'none'],
            ['Min / Max', `${f(d.min)} / ${f(d.max)}`], ['Range', f(d.range)], ['Q1 / Q3', `${f(d.q1)} / ${f(d.q3)}`], ['IQR', f(d.iqr)],
            ['Variance (population)', f(d.popVariance)], ['Std dev (population)', f(d.popStdDev)],
            ['Variance (sample)', f(d.sampleVariance)], ['Std dev (sample)', f(d.sampleStdDev)], ['Coefficient of variation', `${f(d.cv)} %`],
          ]);
        },
      });
    },
  },
  {
    id: 'baseconverter', icon: '₂', name: 'Number Base Converter', category: 'Science & Math', tags: ['binário', 'hexadecimal', 'octal', 'bits', 'hex'],
    description: 'Binary, octal, decimal and hexadecimal, with arbitrary precision and two’s complement.',
    pt: { name: 'Conversor de bases numéricas', description: 'Binário, octal, decimal e hexadecimal, com precisão arbitrária e complemento de dois.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'bc-val', label: 'Number', value: 'FF' }),
          field({ id: 'bc-base', label: 'Input base', type: 'select', options: [['2', 'Binary (2)'], ['8', 'Octal (8)'], ['10', 'Decimal (10)'], ['16', 'Hexadecimal (16)']], selected: '16' }),
          field({ id: 'bc-bits', label: 'Two’s complement width', type: 'select', options: [['0', 'off'], ['8', '8 bit'], ['16', '16 bit'], ['32', '32 bit'], ['64', '64 bit']], selected: '0' })) +
          details('bc-res', 2),
        calc(q) {
          let n = parseBase(q('#bc-val').value, Number(q('#bc-base').value));
          const bits = Number(q('#bc-bits').value);
          const a = toAllBases(n);
          const rows = [['Binary', groupDigits(a.binary, 4)], ['Octal', a.octal], ['Decimal', a.decimal], ['Hexadecimal', `0x${a.hexadecimal}`]];
          if (bits) {
            const signed = n >= 1n << BigInt(bits - 1) ? n - (1n << BigInt(bits)) : n;
            const tc = twosComplement(signed, bits);
            rows.push([`${bits}-bit signed`, String(signed)], [`${bits}-bit hex`, `0x${tc.toString(16).toUpperCase().padStart(bits / 4, '0')}`]);
          }
          renderDetails(q('#bc-res'), rows);
        },
      });
    },
  },
  {
    id: 'codes', icon: '▦', name: 'BCD & Gray Code', category: 'Science & Math', tags: ['bcd', 'gray', 'encoder', 'codificação', 'binário'],
    description: 'Decimal ↔ packed BCD and binary ↔ Gray code, used by encoders and older PLC I/O.',
    pt: { name: 'BCD e código Gray', description: 'Decimal ↔ BCD compactado e binário ↔ código Gray, usados em encoders e E/S de CLPs antigos.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'cd-mode', label: 'Convert', type: 'select', options: [['dec2bcd', 'Decimal → BCD'], ['bcd2dec', 'BCD → decimal'], ['bin2gray', 'Binary → Gray'], ['gray2bin', 'Gray → binary']] }),
          field({ id: 'cd-val', label: 'Value', value: '1234' })) +
          result({ id: 'cd-out', size: 'small', mono: true }),
        calc(q) {
          const mode = q('#cd-mode').value, v = q('#cd-val').value.trim();
          let out;
          if (mode === 'dec2bcd') out = toBcd(parseBase(v, 10));
          else if (mode === 'bcd2dec') out = String(fromBcd(v));
          else if (mode === 'bin2gray') out = toGray(parseBase(v, 2)).toString(2).padStart(v.length, '0');
          else out = fromGray(parseBase(v, 2)).toString(2).padStart(v.length, '0');
          q('#cd-out').textContent = out;
        },
      });
    },
  },
  {
    id: 'chemistry', icon: '⚗', name: 'Molarity Calculator', category: 'Science & Math', tags: ['molar', 'mol', 'solução', 'química', 'concentração'],
    description: 'Molarity, moles or volume from the other two quantities (M = n / V).',
    pt: { name: 'Calculadora de molaridade', description: 'Molaridade, mols ou volume a partir das outras duas grandezas (M = n / V).' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'ch-t', label: 'Solve for', type: 'select', options: [['M', 'Molarity (mol/L)'], ['n', 'Moles (mol)'], ['V', 'Volume (L)']] }),
          field({ id: 'ch-a', label: 'Known A', type: 'number', value: 0.5 }),
          field({ id: 'ch-b', label: 'Known B', type: 'number', value: 2 })) +
          result({ id: 'ch-out' }) + hint('M = n / V. Use compatible units and follow laboratory safety procedures.'),
        calc(q) {
          const t = q('#ch-t').value, a = num(q('#ch-a').value), b = num(q('#ch-b').value);
          const labels = { M: ['Moles (mol)', 'Volume (L)'], n: ['Molarity (mol/L)', 'Volume (L)'], V: ['Molarity (mol/L)', 'Moles (mol)'] };
          q('#ch-a').previousElementSibling.textContent = labels[t][0];
          q('#ch-b').previousElementSibling.textContent = labels[t][1];
          if (!(a >= 0 && b > 0) && t !== 'V') throw new Error('Enter non-negative values; volume must be positive');
          if (t === 'V' && !(a > 0 && b >= 0)) throw new Error('Molarity must be positive to compute volume');
          const r = t === 'M' ? a / b : t === 'n' ? a * b : b / a;
          q('#ch-out').textContent = `${f(r)} ${t === 'M' ? 'mol/L' : t === 'n' ? 'mol' : 'L'}`;
        },
      });
    },
  },
];
