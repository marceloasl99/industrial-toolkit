/* Unit conversion tables. Every factor converts the unit into the group's SI base. */
export const units = {
  Length: { metre: 1, kilometre: 1000, centimetre: 0.01, millimetre: 0.001, micrometre: 1e-6, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344, 'nautical mile': 1852 },
  Mass: { kilogram: 1, gram: 0.001, milligram: 1e-6, tonne: 1000, pound: 0.45359237, ounce: 0.028349523125 },
  Pressure: { pascal: 1, kilopascal: 1000, megapascal: 1e6, bar: 100000, millibar: 100, psi: 6894.757293168, atmosphere: 101325, 'mmHg (torr)': 133.322368, 'inH2O (4 °C)': 249.08891, 'kgf/cm²': 98066.5 },
  Flow: { 'cubic metre / hour': 1, 'cubic metre / second': 3600, 'litre / minute': 0.06, 'litre / second': 3.6, 'litre / hour': 0.001, 'gallon (US) / minute': 0.227124707, 'cubic foot / minute': 1.69901082 },
  'Mass flow': { 'kilogram / second': 1, 'kilogram / hour': 1 / 3600, 'tonne / hour': 1000 / 3600, 'pound / hour': 0.45359237 / 3600, 'pound / second': 0.45359237 },
  Power: { watt: 1, kilowatt: 1000, megawatt: 1e6, 'horsepower (mech.)': 745.699872, 'horsepower (metric)': 735.49875, 'BTU / hour': 0.29307107 },
  Energy: { joule: 1, kilojoule: 1000, megajoule: 1e6, 'watt-hour': 3600, 'kilowatt-hour': 3600000, 'BTU (IT)': 1055.05585262, calorie: 4.184, kilocalorie: 4184 },
  Torque: { 'newton-metre': 1, 'kilonewton-metre': 1000, 'kilogram-force metre': 9.80665, 'pound-force foot': 1.3558179483, 'pound-force inch': 0.1129848290 },
  Speed: { 'metre / second': 1, 'kilometre / hour': 1 / 3.6, 'mile / hour': 0.44704, 'foot / second': 0.3048, knot: 0.514444444 },
  Volume: { litre: 1, millilitre: 0.001, 'cubic metre': 1000, 'cubic centimetre': 0.001, 'gallon (US)': 3.785411784, 'gallon (UK)': 4.54609, 'cubic foot': 28.316846592, 'barrel (oil)': 158.987294928 },
  Area: { 'square metre': 1, 'square centimetre': 1e-4, 'square millimetre': 1e-6, hectare: 1e4, 'square kilometre': 1e6, 'square foot': 0.09290304, 'square inch': 0.00064516, acre: 4046.8564224 },
  Frequency: { hertz: 1, kilohertz: 1e3, megahertz: 1e6, gigahertz: 1e9, 'rpm (rev/min)': 1 / 60 },
  'Data size': { bit: 1 / 8, byte: 1, kilobyte: 1000, megabyte: 1e6, gigabyte: 1e9, terabyte: 1e12, kibibyte: 1024, mebibyte: 1048576, gibibyte: 1073741824, tebibyte: 1099511627776 },
  'Data rate': { 'bit / second': 1, 'kilobit / second': 1e3, 'megabit / second': 1e6, 'gigabit / second': 1e9, 'byte / second': 8, 'kilobyte / second': 8e3, 'megabyte / second': 8e6 },
};

export const temperatureUnits = ['Celsius', 'Fahrenheit', 'Kelvin', 'Rankine'];

export function toCelsius(value, unit) {
  switch (unit) {
    case 'Celsius': return value;
    case 'Fahrenheit': return (value - 32) * 5 / 9;
    case 'Kelvin': return value - 273.15;
    case 'Rankine': return (value - 491.67) * 5 / 9;
    default: throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

export function fromCelsius(c, unit) {
  switch (unit) {
    case 'Celsius': return c;
    case 'Fahrenheit': return c * 9 / 5 + 32;
    case 'Kelvin': return c + 273.15;
    case 'Rankine': return (c + 273.15) * 9 / 5;
    default: throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

/** Convert `value` from one unit to another inside `group` ('Temperature' is handled separately). */
export function convert(group, value, from, to) {
  if (!Number.isFinite(value)) throw new Error('Enter a number');
  if (group === 'Temperature') return fromCelsius(toCelsius(value, from), to);
  const table = units[group];
  if (!table) throw new Error(`Unknown group: ${group}`);
  if (!(from in table) || !(to in table)) throw new Error('Unknown unit');
  return value * table[from] / table[to];
}
