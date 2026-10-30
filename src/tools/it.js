import { mount, field, grid, primary, result, details, renderDetails, hint, row, textarea, button, renderTable, table, copyButton, esc, toast, downloadButton, download } from '../ui.js';
import { parseIp, ipToString, subnet, vlsm, prefixFromMask, parseCidr } from '../lib/ipv4.js';
import { parseIpv6, expand, compress, subnet6 } from '../lib/ipv6.js';
import { macInfo, randomMac } from '../lib/mac.js';
import { decodeJwt } from '../lib/jwt.js';
import { parseTimestamp, toLocalInputValue, describeDate, parseDateInput, durationBetween } from '../lib/timestamp.js';
import { describeCron, nextRuns } from '../lib/cron.js';
import { diffLines, diffStats, toUnified } from '../lib/diff.js';
import { parseCsv, toCsv, detectDelimiter } from '../lib/csv.js';
import { transferTime, iotBudget, formatBytes } from '../lib/bandwidth.js';
import { parseCertificate } from '../lib/x509.js';
import { encodeBase64, decodeBase64, bytesToBase64 } from '../lib/base64.js';
import { num } from '../lib/number.js';

const yes = b => (b ? 'yes' : 'no');

export const it = [
  {
    id: 'network', icon: '◫', name: 'IPv4 Subnet Calculator', category: 'IT & Network', tags: ['cidr', 'subrede', 'máscara', 'netmask', 'wildcard', 'vlsm'],
    description: 'Network, broadcast, host range, usable hosts, wildcard, class. Accepts 10.0.0.0/24 or a dotted mask.',
    pt: { name: 'Calculadora de sub-rede IPv4', description: 'Rede, broadcast, faixa de hosts, hosts úteis, wildcard, classe. Aceita 10.0.0.0/24 ou máscara decimal.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'n-ip', label: 'IPv4 address or CIDR', value: '192.168.10.15/24' }),
          field({ id: 'n-pfx', label: 'Prefix or mask (if not in CIDR)', value: '24' })) +
          details('n-res', 3),
        calc(q) {
          const { ip, prefix } = parseCidr(q('#n-ip').value, q('#n-pfx').value);
          const s = subnet(ip, prefix);
          renderDetails(q('#n-res'), [
            ['Subnet mask', ipToString(s.mask)], ['Binary mask', s.binaryMask], ['Wildcard', ipToString(s.wildcard)],
            ['Network', ipToString(s.network)], ['Broadcast', ipToString(s.broadcast)], ['Usable hosts', String(s.usable)],
            ['First host', ipToString(s.firstHost)], ['Last host', ipToString(s.lastHost)], ['Addresses', String(s.total)],
            ['Class', s.class], ['Private (RFC 1918)', yes(s.private)], ['CIDR', `${ipToString(ip)}/${prefix}`],
          ]);
        },
      });
    },
  },
  {
    id: 'vlsm', icon: '⊞', name: 'VLSM Planner', category: 'IT & Network', tags: ['vlsm', 'subrede', 'plano', 'endereçamento', 'sub-redes'],
    description: 'Allocate variable-length subnets for a list of host requirements inside one block.',
    pt: { name: 'Planejador VLSM', description: 'Aloca sub-redes de tamanhos variáveis para uma lista de necessidades de hosts dentro de um bloco.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'vl-parent', label: 'Parent block', value: '192.168.0.0/24' })) +
          textarea({ id: 'vl-req', label: 'Requirements (name, hosts — one per line)', value: 'LAN-Vendas, 100\nLAN-TI, 50\nWAN-Link, 2', rows: 5, mono: true }) +
          `<div class="table-wrap">${table('vl-table')}</div><p class="hint" id="vl-free"></p>` + hint('Largest requirements are placed first to avoid fragmentation. /30 is the smallest block used.'),
        calc(q) {
          const reqs = q('#vl-req').value.split(/\n/).map(l => l.trim()).filter(Boolean).map(l => {
            const [name, hosts] = l.split(/[,;\t]+/);
            if (!name || !(Number(hosts) >= 1)) throw new Error(`Invalid line: "${l}"`);
            return { name: name.trim(), hosts: Number(hosts) };
          });
          const r = vlsm(q('#vl-parent').value, reqs);
          renderTable(q('#vl-table'), ['Name', 'Network', 'Range', 'Usable', 'Required'], r.subnets.map(s => [s.name, `${ipToString(s.network)}/${s.prefix}`, `${ipToString(s.firstHost)} – ${ipToString(s.lastHost)}`, s.usable, s.hosts]));
          q('#vl-free').textContent = `Remaining addresses in the parent block: ${r.remaining}`;
        },
      });
    },
  },
  {
    id: 'ipv6', icon: '6', name: 'IPv6 Tools', category: 'IT & Network', tags: ['ipv6', 'prefixo', 'compressão', 'rfc 5952', 'link-local'],
    description: 'Expand and compress IPv6, classify the address, and compute the subnet range.',
    pt: { name: 'Ferramentas IPv6', description: 'Expande e comprime IPv6, classifica o endereço e calcula a faixa da sub-rede.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'v6-ip', label: 'IPv6 address or CIDR', value: '2001:db8:abcd:1234::1/64' })) + details('v6-res', 2),
        calc(q) {
          const s = subnet6(q('#v6-ip').value);
          renderDetails(q('#v6-res'), [
            ['Compressed (RFC 5952)', s.compressed], ['Expanded', expand(s.ip)], ['Type', s.type], ['Prefix', `/${s.prefix}`],
            ['Network', s.networkCompressed], ['Last address', s.lastCompressed], ['Addresses', s.count.toString()], ['/64 subnets inside', s.subnets64 ? s.subnets64.toString() : 'n/a (prefix longer than /64)'],
          ]);
        },
      });
    },
  },
  {
    id: 'mac', icon: '▤', name: 'MAC Address Tool', category: 'IT & Network', tags: ['mac', 'oui', 'fabricante', 'eui-64', 'multicast', 'vendor'],
    description: 'Format MAC addresses, identify the vendor from the OUI, derive EUI-64, generate random ones.',
    pt: { name: 'Ferramenta de endereço MAC', description: 'Formata MAC, identifica o fabricante pelo OUI, gera EUI-64 e MACs aleatórios.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'mac-in', label: 'MAC address', value: 'B8:27:EB:12:34:56' }), field({ id: 'mac-rand', label: 'Random', type: 'select', options: [['local', 'locally administered (safe for tests)'], ['global', 'global-looking']] })) +
          row(button({ id: 'mac-gen', label: 'Generate random', secondary: true })) + details('mac-res', 3) + details('mac-fmt', 3),
        calc(q) {
          const m = macInfo(q('#mac-in').value);
          renderDetails(q('#mac-res'), [['Vendor (OUI)', m.vendor], ['OUI', m.oui], ['Multicast', yes(m.multicast)], ['Locally administered', yes(m.locallyAdministered)], ['Broadcast', yes(m.broadcast)], ['EUI-64 link-local', m.eui64LinkLocal, '', 'wide']]);
          renderDetails(q('#mac-fmt'), Object.entries(m.formats).map(([k, v]) => [k, v]));
        },
      });
      root.querySelector('#mac-gen').onclick = () => { root.querySelector('#mac-in').value = randomMac(root.querySelector('#mac-rand').value === 'local'); root.querySelector('#mac-in').dispatchEvent(new Event('input', { bubbles: true })); };
    },
  },
  {
    id: 'uuid', icon: '◇', name: 'UUID Generator', category: 'IT & Network', tags: ['uuid', 'guid', 'identificador', 'v4', 'v7'],
    description: 'Random UUID v4 (and time-ordered v7) with bulk generation, using secure browser randomness.',
    pt: { name: 'Gerador de UUID', description: 'UUID v4 aleatório (e v7 ordenado por tempo), com geração em lote e aleatoriedade segura do navegador.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'uu-ver', label: 'Version', type: 'select', options: [['4', 'v4 (random)'], ['7', 'v7 (time-ordered)']] }), field({ id: 'uu-n', label: 'Count', type: 'number', value: 1, min: 1, max: 1000, step: 1 }), field({ id: 'uu-up', label: 'Uppercase', type: 'select', options: [['no', 'no'], ['yes', 'yes']] })) +
          row(primary('uu-gen', 'Generate')) +
          `<pre class="code" id="uu-out"></pre>` + row(copyButton('uu-out')),
        calc(q) {
          const n = Math.min(1000, Math.max(1, num(q('#uu-n').value) || 1));
          const list = Array.from({ length: n }, () => (q('#uu-ver').value === '7' ? uuidV7() : crypto.randomUUID()));
          q('#uu-out').textContent = list.map(u => (q('#uu-up').value === 'yes' ? u.toUpperCase() : u)).join('\n');
        },
      });
    },
  },
  {
    id: 'jwt', icon: '⌁', name: 'JWT Decoder', category: 'IT & Network', tags: ['jwt', 'token', 'bearer', 'exp', 'claims'],
    description: 'Inspect header and payload, convert time claims, flag expiry and alg none. No signature verification.',
    pt: { name: 'Decodificador JWT', description: 'Inspeciona cabeçalho e payload, converte datas, indica expiração e alg none. Sem verificar assinatura.' },
    render(root) {
      mount(root, {
        html: textarea({ id: 'jwt-in', label: 'JSON Web Token', placeholder: 'eyJhbGciOiJIUzI1NiJ9…', rows: 4 }) +
          `<div class="split"><div class="field"><label>Header</label><textarea id="jwt-h" readonly class="mono"></textarea></div><div class="field"><label>Payload</label><textarea id="jwt-p" readonly class="mono"></textarea></div></div>` +
          `<div id="jwt-warn" class="chips"></div>` + details('jwt-times', 2) +
          hint('Decoding does not verify the signature or prove the token is trustworthy.'),
        calc(q) {
          const v = q('#jwt-in').value.trim();
          if (!v) { q('#jwt-h').value = ''; q('#jwt-p').value = ''; q('#jwt-times').innerHTML = ''; q('#jwt-warn').innerHTML = ''; return; }
          const j = decodeJwt(v);
          q('#jwt-h').value = JSON.stringify(j.header, null, 2);
          q('#jwt-p').value = JSON.stringify(j.payload, null, 2);
          q('#jwt-warn').innerHTML = j.warnings.map(w => `<span class="chip warn">${esc(w)}</span>`).join('') || '<span class="chip ok">No warnings. Signature not verified.</span>';
          renderDetails(q('#jwt-times'), j.times.map(x => [x.label, x.date.toISOString()]));
        },
      });
    },
  },
  {
    id: 'json', icon: '{}', name: 'JSON Formatter', category: 'IT & Network', tags: ['json', 'formatar', 'minificar', 'validar'],
    description: 'Validate, pretty-print, minify and sort keys, with the error position.',
    pt: { name: 'Formatador JSON', description: 'Valida, formata, minifica e ordena chaves, com a posição do erro.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'js-indent', label: 'Indent', type: 'select', options: [['2', '2 spaces'], ['4', '4 spaces'], ['t', 'tab'], ['0', 'minified']], selected: '2' }), field({ id: 'js-sort', label: 'Sort keys', type: 'select', options: [['no', 'no'], ['yes', 'yes']] })) +
          `<div class="split"><div class="field"><label>Input</label><textarea id="js-in" class="mono" placeholder='{"system":"edge-gateway"}'></textarea></div><div class="field"><label>Output</label><textarea id="js-out" class="mono" readonly></textarea></div></div>` +
          row(copyButton('js-out')) + `<p class="status" id="js-status">Ready.</p>`,
        calc(q) {
          const raw = q('#js-in').value;
          if (!raw.trim()) { q('#js-status').textContent = 'Ready.'; q('#js-status').className = 'status'; return; }
          try {
            let obj = JSON.parse(raw);
            if (q('#js-sort').value === 'yes') obj = sortKeys(obj);
            const ind = q('#js-indent').value;
            q('#js-out').value = JSON.stringify(obj, null, ind === 't' ? '\t' : Number(ind));
            q('#js-status').textContent = `Valid JSON · ${raw.length} chars`; q('#js-status').className = 'status ok';
          } catch (e) {
            q('#js-status').textContent = `Invalid JSON: ${e.message}`; q('#js-status').className = 'status error';
          }
        },
      });
    },
  },
  {
    id: 'timestamp', icon: '◷', name: 'Timestamp Converter', category: 'IT & Network', tags: ['unix', 'epoch', 'data', 'iso', 'utc', 'milissegundos'],
    description: 'Unix seconds, milliseconds, microseconds or nanoseconds (auto-detected), ISO dates, UTC and local time.',
    pt: { name: 'Conversor de timestamp', description: 'Unix em segundos, milissegundos, microssegundos ou nanossegundos (detectados automaticamente), datas ISO, UTC e local.' },
    render(root) {
      mount(root, {
        html: grid(
          field({ id: 'ts-unix', label: 'Unix timestamp', value: String(Math.floor(Date.now() / 1000)), hint: 'Seconds, ms, µs or ns — detected automatically.' }),
          field({ id: 'ts-iso', label: 'Local date/time', type: 'datetime-local', value: toLocalInputValue(new Date()).slice(0, 16), step: 1 }),
          field({ id: 'ts-text', label: 'Or any date string', placeholder: '2026-01-05T09:07:03Z' })) +
          row(button({ id: 'ts-now', label: 'Use current time', secondary: true })) + details('ts-res', 2),
        calc(q) {
          let date;
          if (q('#ts-text').value.trim()) date = parseDateInput(q('#ts-text').value);
          else if (document.activeElement && document.activeElement.id === 'ts-iso') date = parseDateInput(q('#ts-iso').value);
          else { const r = parseTimestamp(q('#ts-unix').value); date = r.date; q('#ts-unix').dataset.unit = r.unit; }
          const d = describeDate(date);
          renderDetails(q('#ts-res'), [
            ['Unix seconds', d.unixSeconds], ['Unix ms', d.unixMs], ['ISO 8601 (UTC)', d.iso], ['UTC', d.utc], ['Local', d.local], ['Local with offset', `${d.localIsoLike}`],
            ['Timezone', d.timezone], ['ISO week / day of year', `W${String(d.isoWeek).padStart(2, '0')} / ${d.dayOfYear}`], ['Weekday', d.weekday], ['Relative', d.relative],
          ]);
          q('#ts-iso').value = toLocalInputValue(date).slice(0, 16);
        },
      });
      root.querySelector('#ts-now').onclick = () => { root.querySelector('#ts-text').value = ''; root.querySelector('#ts-unix').value = String(Math.floor(Date.now() / 1000)); root.querySelector('#ts-unix').dispatchEvent(new Event('input', { bubbles: true })); };
    },
  },
  {
    id: 'cron', icon: '⏱', name: 'Cron Explainer', category: 'IT & Network', tags: ['cron', 'agendamento', 'schedule', 'crontab'],
    description: 'Explain a 5-field cron expression and list its next run times in local time.',
    pt: { name: 'Explicador de cron', description: 'Explica uma expressão cron de 5 campos e lista as próximas execuções no horário local.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'cr-expr', label: 'Cron expression', value: '*/15 9-17 * * 1-5' })) + hint('minute · hour · day-of-month · month · day-of-week. Aliases: @daily, @hourly, @weekly…') +
          details('cr-desc', 1) + `<pre class="code" id="cr-next"></pre>`,
        calc(q) {
          const expr = q('#cr-expr').value;
          renderDetails(q('#cr-desc'), [['Meaning', describeCron(expr), '', 'wide']]);
          q('#cr-next').textContent = nextRuns(expr, 8).map(d => d.toString()).join('\n');
        },
      });
    },
  },
  {
    id: 'regex', icon: '.*', name: 'Regex Tester', category: 'IT & Network', tags: ['regex', 'expressão regular', 'match', 'padrão'],
    description: 'Test a regular expression against text: matches, positions and capture groups.',
    pt: { name: 'Testador de expressão regular', description: 'Testa uma expressão regular em um texto: correspondências, posições e grupos de captura.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 're-pat', label: 'Pattern', value: '(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})' }), field({ id: 're-flags', label: 'Flags', value: 'g' })) +
          textarea({ id: 're-text', label: 'Text', value: 'gw 10.0.0.1 and 192.168.1.20 are hosts', rows: 4 }) +
          details('re-res', 1) + `<pre class="code" id="re-out"></pre>`,
        calc(q) {
          const flags = q('#re-flags').value.replace(/[^gimsuy]/g, '');
          const re = new RegExp(q('#re-pat').value, flags.includes('g') ? flags : flags + 'g');
          const text = q('#re-text').value;
          const matches = [...text.matchAll(re)];
          renderDetails(q('#re-res'), [['Matches', matches.length]]);
          q('#re-out').textContent = matches.map((m, i) => `#${i + 1} "${m[0]}" @${m.index}${m.length > 1 ? `\n   groups: ${m.slice(1).map((g, j) => `$${j + 1}=${g ?? 'undefined'}`).join('  ')}` : ''}`).join('\n') || 'No match.';
        },
      });
    },
  },
  {
    id: 'diff', icon: '±', name: 'Text Diff', category: 'IT & Network', tags: ['diff', 'comparar', 'config', 'running-config', 'texto'],
    description: 'Line-by-line comparison of two texts or configurations, with optional whitespace tolerance.',
    pt: { name: 'Comparador de textos', description: 'Comparação linha a linha de dois textos ou configurações, com tolerância opcional a espaços.' },
    render(root) {
      mount(root, {
        html: `<div class="split"><div class="field"><label>Original (A)</label><textarea id="df-a" class="mono" rows="10">hostname edge-01\nvlan 10\nntp server 10.0.0.5</textarea></div><div class="field"><label>Changed (B)</label><textarea id="df-b" class="mono" rows="10">hostname edge-02\nvlan 10\nvlan 20\nntp server 10.0.0.5</textarea></div></div>` +
          grid(field({ id: 'df-ws', label: 'Ignore whitespace', type: 'select', options: [['no', 'no'], ['yes', 'yes']] })) +
          details('df-stats', 3) + `<div class="code diff" id="df-out"></div>` + row(copyButton('df-raw', 'Copy as unified diff')) + `<pre class="code" id="df-raw" hidden></pre>`,
        calc(q) {
          const d = diffLines(q('#df-a').value, q('#df-b').value, { ignoreWhitespace: q('#df-ws').value === 'yes' });
          const s = diffStats(d);
          renderDetails(q('#df-stats'), [['Added', s.added, 'ok'], ['Removed', s.removed, s.removed ? 'fault' : ''], ['Unchanged', s.same]]);
          q('#df-out').innerHTML = d.map(x => `<div class="${x.type}"><span class="ln">${x.a ?? ''}</span><span class="ln">${x.b ?? ''}</span>${x.type === 'add' ? '+' : x.type === 'del' ? '-' : ' '} ${esc(x.text)}</div>`).join('');
          q('#df-raw').textContent = toUnified(d, 'A', 'B');
        },
      });
    },
  },
  {
    id: 'csv', icon: '▧', name: 'CSV ↔ JSON', category: 'IT & Network', tags: ['csv', 'json', 'planilha', 'excel', 'conversão'],
    description: 'Convert CSV to JSON and back, with RFC 4180 quoting and automatic delimiter detection.',
    pt: { name: 'CSV ↔ JSON', description: 'Converte CSV em JSON e vice-versa, com aspas RFC 4180 e detecção automática do separador.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'cv-mode', label: 'Direction', type: 'select', options: [['csv2json', 'CSV → JSON'], ['json2csv', 'JSON → CSV']] }), field({ id: 'cv-delim', label: 'Delimiter', type: 'select', options: [['auto', 'auto-detect'], [',', ','], [';', ';'], ['\t', 'tab'], ['|', '|']] })) +
          `<div class="split"><div class="field"><label>Input</label><textarea id="cv-in" class="mono" rows="12">name,qty,price\nValve,3,12.5\n"Pump, large",1,800</textarea></div><div class="field"><label>Output</label><textarea id="cv-out" class="mono" rows="12" readonly></textarea></div></div>` +
          row(copyButton('cv-out'), downloadButton('cv-dl')) + `<p class="status" id="cv-status"></p>`,
        calc(q) {
          const mode = q('#cv-mode').value;
          if (mode === 'csv2json') {
            const text = q('#cv-in').value;
            const d = q('#cv-delim').value === 'auto' ? detectDelimiter(text) : q('#cv-delim').value;
            q('#cv-out').value = JSON.stringify(parseCsv(text, { delimiter: d }), null, 2);
          } else {
            const data = JSON.parse(q('#cv-in').value);
            q('#cv-out').value = toCsv(data, { delimiter: q('#cv-delim').value === 'auto' ? ',' : q('#cv-delim').value });
          }
          q('#cv-status').textContent = 'Converted.'; q('#cv-status').className = 'status ok';
        },
      });
      root.querySelector('#cv-dl').onclick = () => { const out = root.querySelector('#cv-out').value; if (!out) return toast('Nothing to download'); download(root.querySelector('#cv-mode').value === 'csv2json' ? 'converted.json' : 'converted.csv', out, 'text/plain'); };
    },
  },
  {
    id: 'bandwidth', icon: '⇣', name: 'Transfer & IoT Data Budget', category: 'IT & Network', tags: ['banda', 'largura de banda', 'tempo', 'iot', 'dados', 'mensagens', 'telemetria'],
    description: 'Transfer time for a file at a given link speed, and monthly data for a fleet of IoT devices.',
    pt: { name: 'Transferência e consumo de dados IoT', description: 'Tempo de transferência de um arquivo na velocidade do link e consumo mensal de uma frota de dispositivos IoT.' },
    render(root) {
      mount(root, {
        html: `<h2 class="sub-title">File transfer</h2>` + grid(
          field({ id: 'bw-size', label: 'Size', type: 'number', value: 1 }),
          field({ id: 'bw-su', label: 'Unit', type: 'select', options: ['B', 'KB', 'MB', 'GB', 'TB', 'KiB', 'MiB', 'GiB'].map(u => [u, u]), selected: 'GB' }),
          field({ id: 'bw-ov', label: 'Protocol overhead (%)', type: 'number', value: 5 })) +
          grid(
            field({ id: 'bw-rate', label: 'Link speed', type: 'number', value: 100 }),
            field({ id: 'bw-ru', label: 'Unit', type: 'select', options: ['bit/s', 'kbit/s', 'Mbit/s', 'Gbit/s', 'B/s', 'KB/s', 'MB/s'].map(u => [u, u]), selected: 'Mbit/s' })) +
          result({ id: 'bw-out', size: 'small' }) +
          `<h2 class="sub-title">IoT fleet</h2>` + grid(
            field({ id: 'io-dev', label: 'Devices', type: 'number', value: 500, step: 1 }),
            field({ id: 'io-pay', label: 'Payload per message (bytes)', type: 'number', value: 200 }),
            field({ id: 'io-int', label: 'Interval (seconds)', type: 'number', value: 60 })) +
          grid(field({ id: 'io-ovh', label: 'Protocol overhead per message (bytes)', type: 'number', value: 60 })) + details('io-res', 3),
        calc(q) {
          const tt = transferTime({ size: num(q('#bw-size').value), sizeUnit: q('#bw-su').value, rate: num(q('#bw-rate').value), rateUnit: q('#bw-ru').value, overheadPct: num(q('#bw-ov').value) || 0 });
          q('#bw-out').textContent = tt.text;
          const io = iotBudget({ devices: num(q('#io-dev').value), payloadBytes: num(q('#io-pay').value), intervalSec: num(q('#io-int').value), overheadBytes: num(q('#io-ovh').value) || 0 });
          renderDetails(q('#io-res'), [['Per message', formatBytes(io.perMessage)], ['Per device / day', formatBytes(io.perDeviceDay)], ['Fleet / month', formatBytes(io.totalMonth)], ['Average bit rate', `${Math.round(io.avgBps)} bit/s`]]);
        },
      });
    },
  },
  {
    id: 'x509', icon: '⚿', name: 'Certificate Inspector', category: 'IT & Network', tags: ['certificado', 'x509', 'pem', 'tls', 'ssl', 'san', 'validade'],
    description: 'Paste a PEM certificate: subject, issuer, validity, key type, SANs, CA flag. Runs locally.',
    pt: { name: 'Inspetor de certificado', description: 'Cole um certificado PEM: titular, emissor, validade, tipo de chave, SANs e flag de CA. Roda localmente.' },
    render(root) {
      mount(root, {
        html: textarea({ id: 'x5-pem', label: 'PEM certificate', placeholder: '-----BEGIN CERTIFICATE-----\n…', rows: 8 }) + details('x5-res', 2) + `<p class="hint" id="x5-san"></p>`,
        calc(q) {
          const v = q('#x5-pem').value.trim();
          if (!v) { q('#x5-res').innerHTML = ''; q('#x5-san').textContent = ''; return; }
          const c = parseCertificate(v);
          const status = c.expired ? 'Expired' : c.notYetValid ? 'Not yet valid' : `Valid (${c.daysRemaining} days left)`;
          renderDetails(q('#x5-res'), [
            ['Subject', c.subject, '', 'wide'], ['Issuer', c.issuer, '', 'wide'], ['Status', status, c.expired || c.notYetValid ? 'fault' : 'ok'],
            ['Not before', c.notBefore.toISOString()], ['Not after', c.notAfter.toISOString()], ['Signature', c.signatureAlgorithm],
            ['Public key', c.publicKey], ['Serial', c.serial], ['Self-signed', yes(c.selfSigned)], ['CA', c.isCa === null ? 'not set' : yes(c.isCa)],
          ]);
          q('#x5-san').textContent = c.subjectAltNames.length ? `SAN: ${c.subjectAltNames.join(', ')}` : 'No subjectAltName extension.';
        },
      });
    },
  },
  {
    id: 'base64', icon: '⟨/⟩', name: 'Base64 Encoder', category: 'IT & Network', tags: ['base64', 'base64url', 'encode', 'decode', 'api', 'payload'],
    description: 'UTF-8 safe Base64 and Base64url encoding and decoding for payloads and APIs.',
    pt: { name: 'Codificador Base64', description: 'Codificação e decodificação Base64 e Base64url seguras para UTF-8, para payloads e APIs.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'b6-mode', label: 'Mode', type: 'select', options: [['enc', 'Encode'], ['dec', 'Decode']] }), field({ id: 'b6-url', label: 'Alphabet', type: 'select', options: [['std', 'Standard (+ /)'], ['url', 'URL-safe (- _)']] })) +
          `<div class="split"><div class="field"><label>Input</label><textarea id="b6-in" class="mono"></textarea></div><div class="field"><label>Output</label><textarea id="b6-out" class="mono" readonly></textarea></div></div>` +
          row(copyButton('b6-out')) + `<p class="status" id="b6-status">UTF-8 safe.</p>`,
        calc(q) {
          const mode = q('#b6-mode').value, url = q('#b6-url').value === 'url';
          try {
            q('#b6-out').value = mode === 'enc' ? encodeBase64(q('#b6-in').value, { url }) : decodeBase64(q('#b6-in').value);
            q('#b6-status').textContent = mode === 'enc' ? 'Encoded.' : 'Decoded.'; q('#b6-status').className = 'status ok';
          } catch (e) { q('#b6-out').value = ''; q('#b6-status').textContent = e.message; q('#b6-status').className = 'status error'; }
        },
      });
    },
  },
];

function uuidV7() {
  const ms = BigInt(Date.now());
  const b = crypto.getRandomValues(new Uint8Array(16));
  for (let i = 0; i < 6; i++) b[i] = Number((ms >> BigInt(40 - i * 8)) & 0xffn);
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])]));
  return v;
}
