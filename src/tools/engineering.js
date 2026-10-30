import { mount, field, grid, result, details, renderDetails, hint, esc } from '../ui.js';
import { units, temperatureUnits, convert } from '../lib/units.js';
import { ohm, divider, colorBands, resistorFromBands, formatOhms, threePhase, motor, ratioToDb, dbToRatio, dbmToMw, mwToDbm, thermal, voltageDrop } from '../lib/electrical.js';
import { scale, signalPresets, namurStatus, loopBudget, wireResistance, standardSections } from '../lib/scaling.js';
import { rtdResistance, rtdTemperature } from '../lib/rtd.js';
import { mvToCelsius, celsiusToMv, compensate, thermocouples } from '../lib/thermocouple.js';
import { oee } from '../lib/oee.js';
import { formatNumber, num } from '../lib/number.js';

const f = n => (Number.isFinite(n) ? formatNumber(n) : '—');

export const engineering = [
  {
    id: 'units', icon: '⇄', name: 'Unit Converter', category: 'Engineering', tags: ['convert', 'conversão', 'unidades', 'si'],
    description: 'Length, mass, pressure, flow, power, energy, torque, speed, area and data.',
    pt: { name: 'Conversor de unidades', description: 'Comprimento, massa, pressão, vazão, potência, energia, torque, velocidade, área e dados.' },
    render(root) {
      const groups = [...Object.keys(units), 'Temperature'];
      const listFor = g => (g === 'Temperature' ? temperatureUnits : Object.keys(units[g]));
      mount(root, {
        html: grid(
          field({ id: 'u-type', label: 'Measurement type', type: 'select', options: groups.map(g => [g, g]) }),
          field({ id: 'u-from', label: 'From', type: 'select', options: listFor(groups[0]).map(u => [u, u]), persist: false }),
          field({ id: 'u-to', label: 'To', type: 'select', options: listFor(groups[0]).map(u => [u, u]), persist: false })) +
          grid(field({ id: 'u-val', label: 'Value', type: 'number', value: 1 })) +
          result({ id: 'u-out', value: '—' }) +
          hint('SI definitions where applicable; temperatures use their standard formulas.'),
        calc(q) {
          const g = q('#u-type').value, from = q('#u-from'), to = q('#u-to');
          if (from.dataset.group !== g) {
            const opts = listFor(g).map(u => `<option>${esc(u)}</option>`).join('');
            from.innerHTML = opts; to.innerHTML = opts; to.selectedIndex = Math.min(1, to.options.length - 1);
            from.dataset.group = g;
          }
          const v = convert(g, num(q('#u-val').value), from.value, to.value);
          q('#u-out').textContent = `${f(v)} ${to.value}`;
        },
      });
    },
  },
  {
    id: 'electrical', icon: 'ϟ', name: 'Ohm’s Law Calculator', category: 'Engineering', tags: ['ohm', 'tensão', 'corrente', 'potência'],
    description: 'Solve voltage, current, resistance or power from any two known values.',
    pt: { name: 'Lei de Ohm', description: 'Calcule tensão, corrente, resistência ou potência a partir de dois valores conhecidos.' },
    render(root) {
      const opts = [['V', 'Voltage (V)'], ['I', 'Current (A)'], ['R', 'Resistance (Ω)'], ['P', 'Power (W)']];
      mount(root, {
        html: grid(
          field({ id: 'e-a', label: 'Known 1', type: 'select', options: opts, selected: 'V' }),
          field({ id: 'e-av', label: 'Value 1', type: 'number', value: 24 }),
          field({ id: 'e-b', label: 'Known 2', type: 'select', options: opts, selected: 'R' })) +
          grid(field({ id: 'e-bv', label: 'Value 2', type: 'number', value: 12 })) +
          details('e-res', 4),
        calc(q) {
          const a = q('#e-a').value, b = q('#e-b').value;
          if (a === b) throw new Error('Choose two different known quantities');
          const r = ohm({ [a]: num(q('#e-av').value), [b]: num(q('#e-bv').value) });
          renderDetails(q('#e-res'), [['Voltage', `${f(r.V)} V`], ['Current', `${f(r.I)} A`], ['Resistance', `${f(r.R)} Ω`], ['Power', `${f(r.P)} W`]]);
        },
      });
    },
  },
  {
    id: 'signal', icon: '◒', name: '4–20 mA Signal Converter', category: 'Engineering', tags: ['analog', 'transmitter', 'namur', 'loop', 'clp', 'plc'],
    description: 'Scale a process value to and from a 4–20 mA loop, with NAMUR NE 43 fault flags.',
    pt: { name: 'Conversor de sinal 4–20 mA', description: 'Escalona valor de processo para e de uma malha 4–20 mA, com alarmes NAMUR NE 43.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 's-mode', label: 'Mode', type: 'select', options: [['current', 'Current → process value'], ['process', 'Process value → current']] }),
          field({ id: 's-val', label: 'Value', type: 'number', value: 12, hint: 'mA in current mode; engineering units in process mode' }),
          field({ id: 's-preset', label: 'Preset range', type: 'select', options: Object.keys(signalPresets).map(k => [k, k]), persist: false })) +
          grid(field({ id: 's-min', label: 'Range min', type: 'number', value: 0 }), field({ id: 's-max', label: 'Range max', type: 'number', value: 100 })) +
          result({ id: 's-out' }) + details('s-status', 1),
        calc(q) {
          const preset = q('#s-preset');
          if (preset.dataset.last !== preset.value) { preset.dataset.last = preset.value; const [mn, mx] = signalPresets[preset.value]; q('#s-min').value = mn; q('#s-max').value = mx; }
          const mode = q('#s-mode').value, v = num(q('#s-val').value), mn = num(q('#s-min').value), mx = num(q('#s-max').value);
          q('#s-val').previousElementSibling.textContent = mode === 'current' ? 'Current (mA)' : 'Process value';
          if (mode === 'current') {
            const x = scale(v, 4, 20, mn, mx);
            q('#s-out').textContent = f(x);
            const st = namurStatus(v);
            renderDetails(q('#s-status'), [['NAMUR NE 43', st.text, st.level === 'ok' ? 'ok' : st.level === 'warn' ? 'warn' : 'fault', 'wide']]);
          } else {
            const mA = scale(v, mn, mx, 4, 20);
            q('#s-out').textContent = `${f(mA)} mA`;
            const st = namurStatus(mA);
            renderDetails(q('#s-status'), [['NAMUR NE 43', st.text, st.level === 'ok' ? 'ok' : st.level === 'warn' ? 'warn' : 'fault', 'wide']]);
          }
        },
      });
    },
  },
  {
    id: 'scaling', icon: '⇵', name: 'Linear Scaling', category: 'Engineering', tags: ['raw', 'clp', 'escala', '0-10v', 'adc'],
    description: 'Map any raw range to engineering units: 0–10 V, 1–5 V, PLC raw counts, 12/16-bit ADC.',
    pt: { name: 'Escalonamento linear', description: 'Converte qualquer faixa bruta em unidades de engenharia: 0–10 V, 1–5 V, contagens de CLP, ADC de 12/16 bits.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'l-raw', label: 'Raw value', type: 'number', value: 16384 }),
          field({ id: 'l-in', label: 'Input range (preset)', type: 'select', options: Object.keys(signalPresets).map(k => [k, k]), selected: '0–65535 (16-bit)' }),
          field({ id: 'l-eng', label: 'Engineering range', type: 'select', options: [['custom', 'custom']], selected: 'custom' })) +
          grid(
            field({ id: 'l-imin', label: 'Input min', type: 'number', value: 0 }), field({ id: 'l-imax', label: 'Input max', type: 'number', value: 65535 }),
            field({ id: 'l-omin', label: 'Output min', type: 'number', value: 0 })) +
          grid(field({ id: 'l-omax', label: 'Output max', type: 'number', value: 150, hint: 'Negative range is fine: swap min and max to invert.' }), field({ id: 'l-unit', label: 'Unit', value: '°C', persist: true })) +
          result({ id: 'l-out' }),
        calc(q) {
          const p = q('#l-in');
          if (p.dataset.last !== p.value) { p.dataset.last = p.value; const [a, b] = signalPresets[p.value]; q('#l-imin').value = a; q('#l-imax').value = b; }
          const x = scale(num(q('#l-raw').value), num(q('#l-imin').value), num(q('#l-imax').value), num(q('#l-omin').value), num(q('#l-omax').value));
          q('#l-out').textContent = `${f(x)} ${q('#l-unit').value}`;
        },
      });
    },
  },
  {
    id: 'loop', icon: '⊓', name: '4–20 mA Loop Budget', category: 'Engineering', tags: ['malha', 'fonte', 'transmissor', 'barreira', 'resistor'],
    description: 'Check whether a supply voltage can drive a current loop through every resistor in series.',
    pt: { name: 'Orçamento de malha 4–20 mA', description: 'Verifica se a tensão da fonte alimenta a malha passando por todas as resistências em série.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'lb-supply', label: 'Supply (V DC)', type: 'number', value: 24 }),
          field({ id: 'lb-tx', label: 'Transmitter min voltage (V)', type: 'number', value: 12 }),
          field({ id: 'lb-wire', label: 'Wire resistance (Ω)', type: 'number', value: 10 })) +
          grid(field({ id: 'lb-loads', label: 'Series loads (Ω, comma-separated)', value: '250, 50', hint: 'Resistor, barrier, indicator, PLC input…' })) +
          details('lb-res', 3),
        calc(q) {
          const loads = q('#lb-loads').value.split(/[,;\s]+/).filter(Boolean).map(Number);
          if (loads.some(x => !Number.isFinite(x) || x < 0)) throw new Error('Loads must be non-negative numbers');
          const r = loopBudget({ supply: num(q('#lb-supply').value), transmitterMin: num(q('#lb-tx').value), loads, wireResistance: num(q('#lb-wire').value) || 0 });
          renderDetails(q('#lb-res'), [
            ['Total loop resistance', `${f(r.loadOhms)} Ω`], ['Drop at 20 mA', `${f(r.dropAtMax)} V`], ['Transmitter voltage at 20 mA', `${f(r.transmitterVoltage)} V`],
            ['Max loop resistance', `${f(r.maxLoad)} Ω`], ['Margin', `${f(r.margin)} V`, r.ok ? 'ok' : 'fault'], ['Verdict', r.ok ? 'Loop closes' : 'Insufficient supply voltage', r.ok ? 'ok' : 'fault'],
          ]);
        },
      });
    },
  },
  {
    id: 'cable', icon: '━', name: 'Cable Voltage Drop', category: 'Engineering', tags: ['bitola', 'cabo', 'awg', 'queda', 'alimentação'],
    description: 'Voltage drop and load voltage for copper or aluminium cable, DC or three-phase, with AWG support.',
    pt: { name: 'Queda de tensão em cabo', description: 'Queda de tensão e tensão na carga para cabo de cobre ou alumínio, CC ou trifásico, com suporte a AWG.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'c-v', label: 'Source voltage (V)', type: 'number', value: 24 }),
          field({ id: 'c-i', label: 'Current (A)', type: 'number', value: 5 }),
          field({ id: 'c-l', label: 'One-way length (m)', type: 'number', value: 50 })) +
          grid(
            field({ id: 'c-sec', label: 'Cross-section', type: 'select', options: standardSections.map(s => [String(s), `${s} mm²`]), selected: '1.5' }),
            field({ id: 'c-mat', label: 'Material', type: 'select', options: [['copper', 'Copper'], ['aluminium', 'Aluminium']] }),
            field({ id: 'c-ph', label: 'System', type: 'select', options: [['dc', 'DC / single-phase'], ['three', 'Three-phase']] })) +
          grid(field({ id: 'c-pf', label: 'Power factor (AC)', type: 'number', value: 0.9, step: 0.01, min: 0, max: 1 })) +
          details('c-res', 3),
        calc(q) {
          const r = voltageDrop({ volts: num(q('#c-v').value), amps: num(q('#c-i').value), lengthM: num(q('#c-l').value), areaMm2: num(q('#c-sec').value), material: q('#c-mat').value, phases: q('#c-ph').value, pf: num(q('#c-pf').value) || 1 });
          renderDetails(q('#c-res'), [
            ['Voltage drop', `${f(r.drop)} V`], ['Drop', `${f(r.percent)} %`, r.percent > 5 ? 'fault' : r.percent > 3 ? 'warn' : 'ok'], ['Voltage at load', `${f(r.loadVoltage)} V`],
            ['Loop resistance', `${f(r.resistanceLoop)} Ω`],
          ]);
        },
      });
    },
  },
  {
    id: 'rtd', icon: '°', name: 'PT100 / PT1000 RTD', category: 'Engineering', tags: ['pt100', 'pt1000', 'temperatura', 'iec 60751', 'sensor'],
    description: 'Convert RTD resistance to temperature and back (IEC 60751, Callendar–Van Dusen).',
    pt: { name: 'RTD PT100 / PT1000', description: 'Converte resistência de RTD em temperatura e vice-versa (IEC 60751, Callendar–Van Dusen).' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'rt-mode', label: 'Convert', type: 'select', options: [['t2r', 'Temperature → resistance'], ['r2t', 'Resistance → temperature']] }),
          field({ id: 'rt-sensor', label: 'Sensor', type: 'select', options: [['100', 'PT100'], ['1000', 'PT1000']] }),
          field({ id: 'rt-val', label: 'Value', type: 'number', value: 100 })) +
          details('rt-res', 2),
        calc(q) {
          const r0 = Number(q('#rt-sensor').value), x = num(q('#rt-val').value);
          const isT = q('#rt-mode').value === 't2r';
          q('#rt-val').previousElementSibling.textContent = isT ? 'Temperature (°C)' : 'Resistance (Ω)';
          if (isT) renderDetails(q('#rt-res'), [['Resistance', `${f(rtdResistance(x, r0))} Ω`], ['Range', '−200 to 850 °C']]);
          else renderDetails(q('#rt-res'), [['Temperature', `${f(rtdTemperature(x, r0))} °C`], ['Range', `${f(rtdResistance(-200, r0))} to ${f(rtdResistance(850, r0))} Ω`]]);
        },
      });
    },
  },
  {
    id: 'thermocouple', icon: '⚡', name: 'Thermocouple Converter', category: 'Engineering', tags: ['termopar', 'mv', 'type k', 'type j', 'cold junction', 'its-90'],
    description: 'Type K, J, T, E, N: mV ↔ °C (NIST ITS-90) with cold-junction compensation.',
    pt: { name: 'Conversor de termopar', description: 'Tipos K, J, T, E, N: mV ↔ °C (NIST ITS-90) com compensação de junta fria.' },
    render(root) {
      const types = Object.entries(thermocouples).map(([k, v]) => [k, v.name]);
      mount(root, {
        html: grid(
          field({ id: 'tc-type', label: 'Type', type: 'select', options: types, selected: 'K' }),
          field({ id: 'tc-mode', label: 'Convert', type: 'select', options: [['mv2c', 'mV → °C'], ['c2mv', '°C → mV']] }),
          field({ id: 'tc-val', label: 'Value', type: 'number', value: 4.096 })) +
          grid(field({ id: 'tc-cj', label: 'Cold-junction temperature (°C)', type: 'number', value: 25, hint: 'Only used for mV → °C with compensation.' })) +
          details('tc-res', 3),
        calc(q) {
          const type = q('#tc-type').value, x = num(q('#tc-val').value), cj = num(q('#tc-cj').value);
          if (q('#tc-mode').value === 'c2mv') {
            renderDetails(q('#tc-res'), [['Thermocouple output', `${f(celsiusToMv(type, x))} mV`]]);
          } else {
            const raw = mvToCelsius(type, x);
            const comp = compensate(type, x, cj);
            renderDetails(q('#tc-res'), [['Hot junction (uncompensated)', `${f(raw)} °C`], ['Hot junction (compensated)', `${f(comp)} °C`], ['Cold junction used', `${f(cj)} °C`]]);
          }
        },
      });
    },
  },
  {
    id: 'divider', icon: '⊥', name: 'Voltage Divider', category: 'Engineering', tags: ['resistores', 'divisor', 'adc', 'sensor'],
    description: 'Output voltage, divider current and resistor power for a two-resistor divider.',
    pt: { name: 'Divisor de tensão', description: 'Tensão de saída, corrente do divisor e potência nos resistores para um divisor de dois resistores.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'dv-vin', label: 'Vin (V)', type: 'number', value: 24 }),
          field({ id: 'dv-r1', label: 'R1 top (Ω)', type: 'number', value: 10000 }),
          field({ id: 'dv-r2', label: 'R2 bottom (Ω)', type: 'number', value: 3300 })) +
          details('dv-res', 2),
        calc(q) {
          const r = divider({ vin: num(q('#dv-vin').value), r1: num(q('#dv-r1').value), r2: num(q('#dv-r2').value) });
          renderDetails(q('#dv-res'), [['Vout', `${f(r.vout)} V`], ['Current', `${f(r.current * 1000)} mA`], ['P R1', `${f(r.powerR1 * 1000)} mW`], ['P R2', `${f(r.powerR2 * 1000)} mW`]]);
        },
      });
    },
  },
  {
    id: 'resistor', icon: '▮', name: 'Resistor Colour Code', category: 'Engineering', tags: ['cores', 'resistor', 'banda', 'tolerância'],
    description: '4- and 5-band resistor colour codes to value and tolerance range.',
    pt: { name: 'Código de cores de resistor', description: 'Código de cores de 4 e 5 faixas para valor e faixa de tolerância.' },
    render(root) {
      const colours = [...colorBands, 'gold', 'silver'];
      const opt = colours.map(c => [c, c]);
      mount(root, {
        html: grid(
          field({ id: 'rc-n', label: 'Bands', type: 'select', options: [['4', '4 bands'], ['5', '5 bands']], selected: '4' }),
          field({ id: 'rc-b1', label: 'Band 1', type: 'select', options: opt, selected: 'yellow' }),
          field({ id: 'rc-b2', label: 'Band 2', type: 'select', options: opt, selected: 'violet' })) +
          grid(
            field({ id: 'rc-b3', label: 'Band 3', type: 'select', options: opt, selected: 'red' }),
            field({ id: 'rc-b4', label: 'Multiplier', type: 'select', options: opt, selected: 'gold' }),
            field({ id: 'rc-b5', label: 'Tolerance', type: 'select', options: [...opt, ['none', 'none (20%)']], selected: 'gold' })) +
          result({ id: 'rc-out', size: 'small' }) + hint(`Digit bands: ${colorBands.join(', ')}. Multipliers add gold (×0.1) and silver (×0.01).`),
        calc(q) {
          const n = q('#rc-n').value;
          q('#rc-b3').closest('.field').style.display = n === '5' ? '' : 'none';
          q('#rc-b5').closest('.field').style.display = '';
          let bands;
          if (n === '4') bands = [q('#rc-b1').value, q('#rc-b2').value, q('#rc-b4').value, q('#rc-b5').value];
          else bands = [q('#rc-b1').value, q('#rc-b2').value, q('#rc-b3').value, q('#rc-b4').value, q('#rc-b5').value];
          if (n === '4' && bands[3] === 'none') bands[3] = 'none';
          const r = resistorFromBands(bands);
          q('#rc-out').textContent = `${formatOhms(r.value)} ±${r.tolerance}%  (${formatOhms(r.min)} – ${formatOhms(r.max)})`;
        },
      });
    },
  },
  {
    id: 'threephase', icon: '∿', name: 'Three-Phase Power', category: 'Engineering', tags: ['trifásico', 'kva', 'kw', 'fator de potência', 'motor', 'corrente'],
    description: 'kW, kVA, kvar and line current from voltage, current and power factor; or the reverse from kW.',
    pt: { name: 'Potência trifásica', description: 'kW, kVA, kvar e corrente de linha a partir de tensão, corrente e fator de potência; ou o inverso a partir de kW.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'tp-mode', label: 'Solve from', type: 'select', options: [['iv', 'Voltage + current'], ['kw', 'kW (motor nameplate)']] }),
          field({ id: 'tp-v', label: 'Line voltage (V)', type: 'number', value: 380 }),
          field({ id: 'tp-i', label: 'Line current (A)', type: 'number', value: 10 })) +
          grid(
            field({ id: 'tp-pf', label: 'Power factor', type: 'number', value: 0.85, step: 0.01, min: 0, max: 1 }),
            field({ id: 'tp-kw', label: 'Output kW', type: 'number', value: 5.5 }),
            field({ id: 'tp-eff', label: 'Efficiency (0–1)', type: 'number', value: 0.9, step: 0.01, min: 0, max: 1 })) +
          details('tp-res', 3),
        calc(q) {
          const mode = q('#tp-mode').value;
          q('#tp-i').closest('.field').style.display = mode === 'iv' ? '' : 'none';
          q('#tp-kw').closest('.field').style.display = mode === 'kw' ? '' : 'none';
          q('#tp-eff').closest('.field').style.display = mode === 'kw' ? '' : 'none';
          const base = { vLine: num(q('#tp-v').value), pf: num(q('#tp-pf').value) };
          const r = mode === 'iv' ? threePhase({ ...base, iLine: num(q('#tp-i').value) }) : threePhase({ ...base, kW: num(q('#tp-kw').value), efficiency: num(q('#tp-eff').value) });
          renderDetails(q('#tp-res'), [['Active power', `${f(r.kW)} kW`], ['Apparent power', `${f(r.kVA)} kVA`], ['Reactive power', `${f(r.kvar)} kvar`], ['Line current', `${f(r.iLine)} A`], ['Phase voltage', `${f(r.vPhase)} V`]]);
        },
      });
    },
  },
  {
    id: 'motor', icon: '⟳', name: 'Motor Speed & Slip', category: 'Engineering', tags: ['motor', 'rpm', 'polos', 'escorregamento', 'inversor'],
    description: 'Synchronous speed, slip and rotor frequency for an induction motor.',
    pt: { name: 'Velocidade e escorregamento de motor', description: 'Velocidade síncrona, escorregamento e frequência do rotor de um motor de indução.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'm-hz', label: 'Frequency (Hz)', type: 'number', value: 60 }),
          field({ id: 'm-poles', label: 'Poles', type: 'select', options: [['2', '2'], ['4', '4'], ['6', '6'], ['8', '8'], ['10', '10'], ['12', '12']], selected: '4' }),
          field({ id: 'm-rpm', label: 'Measured RPM (optional)', type: 'number', value: 1750 })) +
          details('m-res', 3),
        calc(q) {
          const rpm = q('#m-rpm').value === '' ? NaN : num(q('#m-rpm').value);
          const r = motor({ hz: num(q('#m-hz').value), poles: Number(q('#m-poles').value), rpmActual: rpm });
          renderDetails(q('#m-res'), [['Synchronous speed', `${f(r.syncRpm)} rpm`], ['Angular speed', `${f(r.radPerSec)} rad/s`], ['Slip', Number.isFinite(r.slipPct) ? `${f(r.slipPct)} %` : '—'], ['Rotor frequency', Number.isFinite(r.rotorHz) ? `${f(r.rotorHz)} Hz` : '—']]);
        },
      });
    },
  },
  {
    id: 'decibel', icon: 'dB', name: 'dB / dBm Converter', category: 'Engineering', tags: ['rf', 'rssi', 'antena', 'potência', 'wireless', 'ganho'],
    description: 'Convert dBm ↔ mW and power or voltage ratios ↔ dB (RF, wireless, link budgets).',
    pt: { name: 'Conversor dB / dBm', description: 'Converte dBm ↔ mW e razões de potência ou tensão ↔ dB (RF, sem fio, orçamento de enlace).' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'db-mode', label: 'Convert', type: 'select', options: [['dbm', 'dBm → mW'], ['mw', 'mW → dBm'], ['ratio', 'Ratio → dB'], ['db', 'dB → ratio']] }),
          field({ id: 'db-kind', label: 'Ratio type', type: 'select', options: [['power', 'Power (10·log)'], ['voltage', 'Voltage / current (20·log)']] }),
          field({ id: 'db-val', label: 'Value', type: 'number', value: 0 })) +
          result({ id: 'db-out', size: 'small' }),
        calc(q) {
          const mode = q('#db-mode').value, x = num(q('#db-val').value), kind = q('#db-kind').value;
          let out;
          if (mode === 'dbm') out = `${f(dbmToMw(x))} mW`;
          else if (mode === 'mw') out = `${f(mwToDbm(x))} dBm`;
          else if (mode === 'ratio') out = `${f(ratioToDb(x, kind))} dB`;
          else out = `${f(dbToRatio(x, kind))}`;
          q('#db-out').textContent = out;
        },
      });
    },
  },
  {
    id: 'thermal', icon: '♨', name: 'Thermal Rise', category: 'Engineering', tags: ['dissipação', 'térmica', 'junção', 'rth', 'calor'],
    description: 'Junction temperature rise from dissipated power and thermal resistance.',
    pt: { name: 'Elevação térmica', description: 'Elevação da temperatura de junção a partir da potência dissipada e da resistência térmica.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'th-p', label: 'Dissipated power (W)', type: 'number', value: 2 }),
          field({ id: 'th-r', label: 'Rθ junction-ambient (°C/W)', type: 'number', value: 40 }),
          field({ id: 'th-ta', label: 'Ambient (°C)', type: 'number', value: 40 })) +
          grid(field({ id: 'th-tmax', label: 'Max junction (°C)', type: 'number', value: 125 })) +
          details('th-res', 3),
        calc(q) {
          const r = thermal({ powerW: num(q('#th-p').value), rthJA: num(q('#th-r').value), ambientC: num(q('#th-ta').value), tjMaxC: num(q('#th-tmax').value) });
          renderDetails(q('#th-res'), [['Temperature rise', `${f(r.rise)} °C`], ['Junction', `${f(r.junction)} °C`, r.margin < 0 ? 'fault' : 'ok'], ['Margin', `${f(r.margin)} °C`], ['Max power', `${f(r.maxPower)} W`]]);
        },
      });
    },
  },
  {
    id: 'oee', icon: '▰', name: 'OEE Calculator', category: 'Engineering', tags: ['oee', 'indústria 4.0', 'disponibilidade', 'performance', 'qualidade', 'mes'],
    description: 'Overall Equipment Effectiveness: availability × performance × quality, with loss breakdown.',
    pt: { name: 'Calculadora de OEE', description: 'Eficiência Global do Equipamento: disponibilidade × performance × qualidade, com decomposição das perdas.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'oe-plan', label: 'Planned time (min)', type: 'number', value: 480 }),
          field({ id: 'oe-down', label: 'Downtime (min)', type: 'number', value: 60 }),
          field({ id: 'oe-ideal', label: 'Ideal cycle time (s/unit)', type: 'number', value: 1 })) +
          grid(
            field({ id: 'oe-total', label: 'Total units produced', type: 'number', value: 19271 }),
            field({ id: 'oe-good', label: 'Good units', type: 'number', value: 18848 })) +
          result({ id: 'oe-out' }) + details('oe-res', 4),
        calc(q) {
          const r = oee({ plannedMin: num(q('#oe-plan').value), downtimeMin: num(q('#oe-down').value), idealCycleSec: num(q('#oe-ideal').value), totalCount: num(q('#oe-total').value), goodCount: num(q('#oe-good').value) });
          q('#oe-out').textContent = `OEE ${(r.oee * 100).toFixed(1)}%`;
          renderDetails(q('#oe-res'), [
            ['Availability', `${(r.availability * 100).toFixed(1)}%`], ['Performance', `${(r.performance * 100).toFixed(1)}%`], ['Quality', `${(r.quality * 100).toFixed(1)}%`], ['Takt', `${f(r.taktSec)} s`],
            ['Downtime loss', `${f(r.lossAvailabilityMin)} min`], ['Speed loss', `${f(r.lossPerformanceMin)} min`], ['Quality loss', `${f(r.lossQualityMin)} min`],
            r.performanceWarning ? ['Note', r.performanceWarning, 'warn', 'wide'] : null,
          ]);
        },
      });
    },
  },
];

