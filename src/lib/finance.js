/* Finance helpers. Rates are annual percentages unless stated. */
export function loan({ principal, annualRate, months }) {
  if (!(principal > 0)) throw new Error('Principal must be positive');
  if (!(months > 0) || !Number.isInteger(months)) throw new Error('Term must be a whole number of months');
  if (!(annualRate >= 0)) throw new Error('Rate cannot be negative');
  const r = annualRate / 1200;
  const payment = r ? principal * r * (1 + r) ** months / ((1 + r) ** months - 1) : principal / months;
  const total = payment * months;
  const schedule = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const amort = payment - interest;
    balance = Math.max(0, balance - amort);
    schedule.push({ month: m, payment, interest, principal: amort, balance });
  }
  return { payment, total, interest: total - principal, monthlyRate: r, schedule };
}

export function compound({ principal, annualRate, years, perYear = 12, contribution = 0 }) {
  if (!(principal >= 0) || !(years > 0) || !(annualRate >= 0)) throw new Error('Enter valid values');
  const n = Math.round(years * perYear), r = annualRate / 100 / perYear;
  let balance = principal, contributed = principal;
  for (let i = 0; i < n; i++) { balance = balance * (1 + r) + contribution; contributed += contribution; }
  return { balance, contributed, growth: balance - contributed, periods: n };
}

export function markup({ cost, markupPct }) {
  if (!(cost > 0)) throw new Error('Cost must be positive');
  if (!(markupPct > -100)) throw new Error('Markup must be greater than −100%');
  const price = cost * (1 + markupPct / 100);
  return { price, profit: price - cost, markupPct, marginPct: (price - cost) / price * 100 };
}

export function marginToMarkup(marginPct) {
  if (!(marginPct < 100)) throw new Error('Margin must be below 100%');
  return marginPct / (100 - marginPct) * 100;
}
