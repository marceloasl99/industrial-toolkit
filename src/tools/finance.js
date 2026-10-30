import { mount, field, grid, result, details, renderDetails, hint, row, button, renderTable, table } from '../ui.js';
import { loan, compound, markup, marginToMarkup } from '../lib/finance.js';
import { formatMoney, formatNumber, num } from '../lib/number.js';

export const finance = [
  {
    id: 'loan', icon: '¤', name: 'Loan & Amortisation', category: 'Finance & Planning', tags: ['empréstimo', 'juros', 'parcela', 'amortização', 'financiamento', 'tabela'],
    description: 'Monthly payment, total interest and a full amortisation schedule.',
    pt: { name: 'Empréstimo e amortização', description: 'Parcela mensal, juros totais e tabela completa de amortização.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'ln-p', label: 'Principal', type: 'number', value: 10000 }),
          field({ id: 'ln-r', label: 'Annual rate (%)', type: 'number', value: 8 }),
          field({ id: 'ln-m', label: 'Term (months)', type: 'number', value: 36, step: 1 })) +
          details('ln-res', 3) +
          row(button({ id: 'ln-toggle', label: 'Show schedule', secondary: true })) +
          `<div id="ln-table-wrap" hidden>${table('ln-table')}</div>` +
          hint('Estimate only: excludes fees, taxes, insurance and lender-specific rounding.'),
        calc(q) {
          const r = loan({ principal: num(q('#ln-p').value), annualRate: num(q('#ln-r').value), months: num(q('#ln-m').value) });
          renderDetails(q('#ln-res'), [['Monthly payment', formatMoney(r.payment)], ['Total repaid', formatMoney(r.total)], ['Total interest', formatMoney(r.interest)]]);
          renderTable(q('#ln-table'), ['Month', 'Payment', 'Interest', 'Principal', 'Balance'], r.schedule.map(s => [s.month, formatMoney(s.payment), formatMoney(s.interest), formatMoney(s.principal), formatMoney(s.balance)]));
        },
      });
      root.querySelector('#ln-toggle').onclick = e => {
        const wrap = root.querySelector('#ln-table-wrap'); wrap.hidden = !wrap.hidden;
        e.currentTarget.textContent = wrap.hidden ? 'Show schedule' : 'Hide schedule';
      };
    },
  },
  {
    id: 'compound', icon: '↗', name: 'Compound Growth', category: 'Finance & Planning', tags: ['juros compostos', 'investimento', 'aporte', 'crescimento'],
    description: 'Future value of a principal with periodic contributions and compounding frequency.',
    pt: { name: 'Juros compostos', description: 'Valor futuro de um capital com aportes periódicos e frequência de capitalização.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'cp-p', label: 'Initial amount', type: 'number', value: 1000 }),
          field({ id: 'cp-r', label: 'Annual rate (%)', type: 'number', value: 10 }),
          field({ id: 'cp-y', label: 'Years', type: 'number', value: 10 })) +
          grid(
            field({ id: 'cp-c', label: 'Contribution per period', type: 'number', value: 100 }),
            field({ id: 'cp-f', label: 'Periods per year', type: 'select', options: [['1', 'Yearly'], ['4', 'Quarterly'], ['12', 'Monthly'], ['52', 'Weekly']], selected: '12' })) +
          details('cp-res', 3),
        calc(q) {
          const r = compound({ principal: num(q('#cp-p').value), annualRate: num(q('#cp-r').value), years: num(q('#cp-y').value), perYear: Number(q('#cp-f').value), contribution: num(q('#cp-c').value) || 0 });
          renderDetails(q('#cp-res'), [['Final balance', formatMoney(r.balance)], ['Total contributed', formatMoney(r.contributed)], ['Growth', formatMoney(r.growth)], ['Periods', r.periods]]);
        },
      });
    },
  },
  {
    id: 'markup', icon: '%', name: 'Markup & Margin', category: 'Finance & Planning', tags: ['markup', 'margem', 'preço', 'lucro', 'venda'],
    description: 'Selling price, gross profit, markup and gross margin; converts between markup and margin.',
    pt: { name: 'Markup e margem', description: 'Preço de venda, lucro bruto, markup e margem bruta; converte entre markup e margem.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'mk-cost', label: 'Cost', type: 'number', value: 100 }),
          field({ id: 'mk-pct', label: 'Markup (%)', type: 'number', value: 30 }),
          field({ id: 'mk-mg', label: 'Or target margin (%)', type: 'number', value: '', hint: 'Leave empty to use markup. Margin overrides markup when filled.' })) +
          details('mk-res', 3),
        calc(q) {
          const cost = num(q('#mk-cost').value);
          const mgRaw = q('#mk-mg').value;
          const pct = mgRaw === '' ? num(q('#mk-pct').value) : marginToMarkup(num(mgRaw));
          const r = markup({ cost, markupPct: pct });
          renderDetails(q('#mk-res'), [['Selling price', formatMoney(r.price)], ['Gross profit', formatMoney(r.profit)], ['Markup', `${formatNumber(r.markupPct)}%`], ['Gross margin', `${formatNumber(r.marginPct)}%`]]);
        },
      });
    },
  },
];
