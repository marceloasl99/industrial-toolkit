import { mount, field, grid, result, details, renderDetails, hint, row, textarea, button, copyButton, renderTable, table } from '../ui.js';
import { families, referenceToOffset, offsetToReference, buildPdu, buildRtu, buildTcp, decodeFrame, functionCodes } from '../lib/modbus.js';
import { decode32, encode32, decode16, decode64, parseWords, orders } from '../lib/registers.js';
import { parseAddress, toNotations, vendors } from '../lib/plc.js';
import { validateTopicFilter, topicMatches, sparkplugParse } from '../lib/mqtt.js';
import { toHexString, hex } from '../lib/crc.js';
import { num } from '../lib/number.js';

const f = n => (Number.isFinite(n) ? String(n) : '—');

export const ot = [
  {
    id: 'modbus', icon: '⎍', name: 'Modbus Register Helper', category: 'OT & IoT', tags: ['modbus', 'registrador', 'endereço', 'holding', 'clp', 'offset'],
    description: 'Reference numbers (40001, 400001) to zero-based protocol offsets, with range checks and the function code.',
    pt: { name: 'Auxiliar de registradores Modbus', description: 'Números de referência (40001, 400001) para offsets de protocolo base zero, com verificação de faixa e código de função.' },
    render(root) {
      const fam = Object.entries(families).map(([k, v]) => [k, `${v.name} (${v.start}…)`]);
      mount(root, {
        html: grid(
          field({ id: 'mb-fam', label: 'Register family', type: 'select', options: fam, selected: '4' }),
          field({ id: 'mb-ref', label: 'Reference number', type: 'number', value: 40001, step: 1 }),
          field({ id: 'mb-six', label: 'Notation', type: 'select', options: [['5', '5-digit (40001)'], ['6', '6-digit (400001)']] })) +
          details('mb-res', 3) +
          hint('Device manuals may use one-based labels or zero-based protocol offsets. Verify before writing to a controller.'),
        calc(q) {
          const r = referenceToOffset(Number(q('#mb-fam').value), num(q('#mb-ref').value));
          const six = q('#mb-six').value === '6';
          renderDetails(q('#mb-res'), [
            ['Protocol offset (dec)', r.offset], ['Protocol offset (hex)', `0x${hex(r.offset, 4)}`], ['Read function', r.read], ['Write function', r.write],
            ['Equivalent 6-digit', offsetToReference(Number(q('#mb-fam').value), r.offset, true)], ['Equivalent 5-digit', offsetToReference(Number(q('#mb-fam').value), r.offset, false)],
          ]);
          void six;
        },
      });
    },
  },
  {
    id: 'modbusframe', icon: '▞', name: 'Modbus Frame Builder & Decoder', category: 'OT & IoT', tags: ['rtu', 'tcp', 'crc', 'mbap', 'quadro', 'frame', 'pdu'],
    description: 'Build RTU/TCP request frames with CRC-16, or decode a hex frame and explain each field.',
    pt: { name: 'Montador e decodificador de quadros Modbus', description: 'Monta quadros de requisição RTU/TCP com CRC-16, ou decodifica um quadro em hex e explica cada campo.' },
    render(root) {
      mount(root, {
        html: `<h2 class="sub-title">Build a request</h2>` + grid(
          field({ id: 'mf-uid', label: 'Unit ID', type: 'number', value: 1, min: 0, max: 255, step: 1 }),
          field({ id: 'mf-fc', label: 'Function', type: 'select', options: [1, 2, 3, 4, 5, 6].map(c => [c, `FC${String(c).padStart(2, '0')} ${functionCodes[c]}`]), selected: '3' }),
          field({ id: 'mf-addr', label: 'Start address (0-based)', type: 'number', value: 0, step: 1 })) +
          grid(
            field({ id: 'mf-qty', label: 'Quantity (read) / value (write)', type: 'number', value: 10, step: 1 }),
            field({ id: 'mf-mode', label: 'Frame', type: 'select', options: [['rtu', 'RTU (serial, + CRC-16)'], ['tcp', 'TCP (MBAP header)']] })) +
          result({ id: 'mf-out', mono: true, size: 'small' }) + details('mf-fields', 2) +
          `<h2 class="sub-title">Decode a frame</h2>` + textarea({ id: 'mf-in', label: 'Hex bytes', value: '01 03 00 00 00 0A C5 CD', rows: 2 }) +
          grid(field({ id: 'mf-dmode', label: 'Frame type', type: 'select', options: [['rtu', 'RTU'], ['tcp', 'TCP']] })) + details('mf-dec', 2),
        calc(q) {
          const fc = Number(q('#mf-fc').value);
          const isWrite = fc === 5 || fc === 6;
          const value = num(q('#mf-qty').value);
          const pdu = buildPdu(isWrite ? { fc, address: num(q('#mf-addr').value), value: fc === 5 ? (value ? 1 : 0) : value } : { fc, address: num(q('#mf-addr').value), quantity: value });
          const frame = q('#mf-mode').value === 'rtu' ? buildRtu(num(q('#mf-uid').value), pdu) : buildTcp(num(q('#mf-uid').value), pdu);
          q('#mf-out').textContent = toHexString(frame);
          renderDetails(q('#mf-fields'), [['PDU', toHexString(pdu)], ['Frame length', `${frame.length} bytes`]]);
          const d = decodeFrame(q('#mf-in').value, q('#mf-dmode').value);
          renderDetails(q('#mf-dec'), [
            ['Unit ID', d.unitId], ...(d.mode === 'rtu' ? [['CRC', d.crcOk ? 'valid' : `invalid (got ${hex(d.crcGot, 4)}, want ${hex(d.crcWant, 4)})`, d.crcOk ? 'ok' : 'fault']] : [['MBAP length', d.lengthOk ? 'consistent' : 'mismatch', d.lengthOk ? 'ok' : 'fault'], ['Transaction ID', d.transactionId]]),
            ...d.fields, ...(d.exception ? [['Type', 'exception', 'fault']] : []),
          ]);
        },
      });
    },
  },
  {
    id: 'registers', icon: '⧉', name: 'Register Type Converter', category: 'OT & IoT', tags: ['float', 'float32', 'int32', 'endian', 'word swap', 'ieee 754', 'cdab', 'clp'],
    description: 'Two or four 16-bit registers ↔ float32, int32, uint32, float64. All four byte/word orders.',
    pt: { name: 'Conversor de tipos de registrador', description: 'Dois ou quatro registradores de 16 bits ↔ float32, int32, uint32, float64. Todas as quatro ordens de bytes/palavras.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'rg-mode', label: 'Direction', type: 'select', options: [['dec', 'Registers → value'], ['enc', 'Value → registers']] }),
          field({ id: 'rg-order', label: 'Word/byte order', type: 'select', options: Object.entries(orders), selected: 'ABCD' }),
          field({ id: 'rg-type', label: 'Type', type: 'select', options: [['float32', 'float32 (IEEE 754)'], ['int32', 'int32'], ['uint32', 'uint32']] })) +
          textarea({ id: 'rg-in', label: 'Registers (decimal or 0x hex, space separated)', value: '0x3F80 0x0000', rows: 2, mono: true, persist: true }) +
          result({ id: 'rg-out', size: 'small' }) + details('rg-res', 3) +
          hint('Shown: the 32-bit value under each interpretation so you can match what the device documents.'),
        calc(q) {
          const order = q('#rg-order').value, type = q('#rg-type').value;
          if (q('#rg-mode').value === 'dec') {
            const words = parseWords(q('#rg-in').value);
            const r = decode32(words, order);
            q('#rg-out').textContent = `${type === 'float32' ? r.float32 : type === 'int32' ? r.int32 : r.uint32}`;
            renderDetails(q('#rg-res'), [['float32', f(r.float32)], ['int32', r.int32], ['uint32', r.uint32], ['Wire bytes', r.hex], ...(words.length >= 4 ? Object.entries(decode64(words, order)).map(([k, v]) => [k, String(v)]) : [])]);
          } else {
            const value = type === 'float32' ? Number(q('#rg-in').value) : BigInt(q('#rg-in').value.trim());
            const regs = encode32(type === 'float32' ? value : Number(value), type, order);
            q('#rg-out').textContent = regs.map(x => `0x${hex(x, 4)}`).join(' ') + `  (${regs.join(', ')})`;
            renderDetails(q('#rg-res'), [['Register 1', `${regs[0]}`], ['Register 2', `${regs[1]}`]]);
          }
        },
      });
    },
  },
  {
    id: 'plcaddr', icon: '⇆', name: 'PLC Address Converter', category: 'OT & IoT', tags: ['siemens', 'allen-bradley', 'schneider', 'modicon', 'mw', 'db', 'n7', 'endereço clp'],
    description: 'Map Schneider %MW, Siemens DB/M/I/Q, Allen-Bradley N7/B3 addresses to Modbus references and back.',
    pt: { name: 'Conversor de endereços de CLP', description: 'Mapeia endereços Schneider %MW, Siemens DB/M/I/Q e Allen-Bradley N7/B3 para referências Modbus e vice-versa.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'pa-vendor', label: 'Vendor notation', type: 'select', options: Object.entries(vendors) }), field({ id: 'pa-addr', label: 'Address', value: '%MW10' })) +
          details('pa-res', 2) + `<p class="hint" id="pa-note"></p>` +
          hint('Mappings depend on the gateway and memory configuration. Confirm with the device documentation.'),
        calc(q) {
          const vendor = q('#pa-vendor').value;
          const examples = { schneider: '%MW10', siemens: 'DB1.DBW20', ab: 'N7:5', modbus: '40011' };
          if (q('#pa-addr').dataset.vendor !== vendor) { q('#pa-addr').dataset.vendor = vendor; q('#pa-addr').value = examples[vendor]; }
          const p = parseAddress(vendor, q('#pa-addr').value);
          const n = toNotations(p);
          renderDetails(q('#pa-res'), [
            ['Register family', n.family], ['Protocol offset', `${n.offset} (${n.hex})`], ['Modbus 5-digit', n.modbus5], ['Modbus 6-digit', n.modbus6],
            ...['schneider', 'ab', 'siemens'].filter(k => n[k]).map(k => [k, n[k]]),
          ]);
          q('#pa-note').textContent = p.note;
        },
      });
    },
  },
  {
    id: 'mqtt', icon: '⇌', name: 'MQTT Topic Tester', category: 'OT & IoT', tags: ['mqtt', 'topic', 'wildcard', 'sparkplug', 'iot', 'broker'],
    description: 'Check MQTT filters and topics against wildcards (+ and #), validate syntax, decode Sparkplug B topics.',
    pt: { name: 'Testador de tópicos MQTT', description: 'Verifica filtros e tópicos MQTT com curingas (+ e #), valida a sintaxe e decodifica tópicos Sparkplug B.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'mq-filter', label: 'Subscription filter', value: 'plant/+/line1/#' }), field({ id: 'mq-topic', label: 'Published topic', value: 'plant/a/line1/temp/sensor-1' })) +
          details('mq-res', 2) + textarea({ id: 'mq-list', label: 'Test topics (one per line)', rows: 5, value: 'plant/a/line1/temp\nplant/b/line2/temp\n$SYS/broker/load\nspBv1.0/plant/NDATA/edge1/dev1', mono: true }) +
          `<div class="table-wrap"><table class="data" id="mq-table"></table></div>`,
        calc(q) {
          const filter = q('#mq-filter').value, topic = q('#mq-topic').value;
          const v = validateTopicFilter(filter);
          const sp = sparkplugParse(topic);
          renderDetails(q('#mq-res'), [
            ['Filter levels', v.levels], ['Wildcards', v.hasWildcards ? 'yes' : 'no'], ['Shared subscription', v.shared ? 'yes' : 'no'],
            ['Topic matches filter', topicMatches(filter, topic) ? 'yes' : 'no', topicMatches(filter, topic) ? 'ok' : 'warn'],
            ...(sp ? [['Sparkplug B', `group=${sp.group} type=${sp.messageType} node=${sp.edgeNode}${sp.device ? ' device=' + sp.device : ''}`, '', 'wide']] : []),
          ]);
          const rows = q('#mq-list').value.split('\n').map(s => s.trim()).filter(Boolean).map(t => [t, topicMatches(filter, t) ? '✔' : '—']);
          renderTable(q('#mq-table'), ['Topic', 'Matches filter'], rows);
        },
      });
    },
  },
  {
    id: 'rs485', icon: '⇋', name: 'Serial Line Settings', category: 'OT & IoT', tags: ['serial', 'rs485', 'rs232', 'baud', 'parity', 'timeout', 'modbus rtu'],
    description: 'Frame time, character time and Modbus RTU silent interval for a given baud rate and framing.',
    pt: { name: 'Configuração de linha serial', description: 'Tempo de quadro, tempo de caractere e intervalo de silêncio do Modbus RTU para uma taxa e enquadramento.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'sr-baud', label: 'Baud rate', type: 'select', options: [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(b => [String(b), String(b)]), selected: '9600' }),
          field({ id: 'sr-bits', label: 'Bits per char (incl. start/stop/parity)', type: 'select', options: [['10', '10 (8N1 / 8E1 / 8O1)'], ['11', '11 (8N2)'], ['9', '9 (7E1 / 7O1)']], selected: '10' }),
          field({ id: 'sr-len', label: 'Frame length (bytes)', type: 'number', value: 8 })) +
          details('sr-res', 3),
        calc(q) {
          const baud = Number(q('#sr-baud').value), bits = Number(q('#sr-bits').value), len = num(q('#sr-len').value);
          const charMs = bits / baud * 1000;
          const frameMs = charMs * len;
          // Modbus RTU: 3.5 char silent interval for baud ≤ 19200; fixed 1.75 ms above
          const t35 = baud <= 19200 ? 3.5 * charMs : 1.75;
          const t15 = baud <= 19200 ? 1.5 * charMs : 0.75;
          renderDetails(q('#sr-res'), [['Character time', `${charMs.toFixed(3)} ms`], ['Frame time', `${frameMs.toFixed(2)} ms`], ['3.5-char silence', `${t35.toFixed(2)} ms`], ['1.5-char max gap', `${t15.toFixed(2)} ms`], ['Max RTU frame', '256 bytes']]);
        },
      });
    },
  },
];
