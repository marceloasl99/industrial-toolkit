import { mount, field, grid, primary, result, details, renderDetails, hint, row, textarea, button, copyButton, downloadButton, esc, readFileAsText, toast, renderTable, table } from '../ui.js';
import { crc32, crc16Modbus, crc16CcittFalse, crc16Xmodem, crc8, lrc, xorChecksum, hex, bytesOf, parseHexBytes } from '../lib/crc.js';
import { generatePassword, generatePassphrase, analyzePassword, buildAlphabet } from '../lib/password.js';
import { totp, hmac } from '../lib/totp.js';
import { base32ToBytes, bytesToBase32, bytesToBase64, base64ToBytes } from '../lib/base64.js';
import { baseScore, parseVector, metrics } from '../lib/cvss.js';
import { hexdump, extractStrings, parseHexdumpInput, entropyOf } from '../lib/hexdump.js';
import { num } from '../lib/number.js';

const hexOf = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

export const security = [
  {
    id: 'hash', icon: '#', name: 'Hash Generator', category: 'Cybersecurity', tags: ['sha', 'sha256', 'sha512', 'sha3', 'digest', 'hash'],
    description: 'SHA-1, SHA-256, SHA-384, SHA-512 of text, via Web Crypto. Hex and Base64 output.',
    pt: { name: 'Gerador de hash', description: 'SHA-1, SHA-256, SHA-384 e SHA-512 de texto, via Web Crypto. Saída em hexadecimal e Base64.' },
    render(root) {
      mount(root, {
        html: textarea({ id: 'h-in', label: 'Text (UTF-8)', rows: 4, mono: false, placeholder: 'Type or paste text…' }) +
          grid(field({ id: 'h-alg', label: 'Algorithm', type: 'select', options: [['SHA-256', 'SHA-256'], ['SHA-512', 'SHA-512'], ['SHA-384', 'SHA-384'], ['SHA-1', 'SHA-1 (legacy)']] }), field({ id: 'h-out', label: 'Output', type: 'select', options: [['hex', 'hex'], ['base64', 'base64']] })) +
          result({ id: 'h-res', mono: true, value: '—' }) + row(copyButton('h-res')),
        calc: async q => {
          const bytes = await crypto.subtle.digest(q('#h-alg').value, new TextEncoder().encode(q('#h-in').value));
          q('#h-res').textContent = q('#h-out').value === 'base64' ? bytesToBase64(new Uint8Array(bytes)) : hexOf(bytes);
        },
      });
    },
  },
  {
    id: 'hmac', icon: '⊛', name: 'HMAC Generator', category: 'Cybersecurity', tags: ['hmac', 'assinatura', 'webhook', 'api', 'signature'],
    description: 'HMAC-SHA256/384/512 with a secret key; verify a provided signature. Useful for webhooks and API signing.',
    pt: { name: 'Gerador HMAC', description: 'HMAC-SHA256/384/512 com chave secreta; verifica uma assinatura informada. Útil para webhooks e assinatura de APIs.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'hm-key', label: 'Secret key', type: 'password' }), field({ id: 'hm-alg', label: 'Algorithm', type: 'select', options: [['SHA-256', 'HMAC-SHA256'], ['SHA-384', 'HMAC-SHA384'], ['SHA-512', 'HMAC-SHA512']] })) +
          textarea({ id: 'hm-msg', label: 'Message', rows: 4, mono: false }) +
          grid(field({ id: 'hm-sig', label: 'Expected signature (optional, hex or base64)', placeholder: 'leave empty to just compute' })) +
          result({ id: 'hm-res', mono: true }) + `<p class="status" id="hm-cmp"></p>`,
        calc: async q => {
          if (!q('#hm-key').value) { q('#hm-res').textContent = '—'; q('#hm-cmp').textContent = 'Enter a secret key to compute the HMAC.'; q('#hm-cmp').className = 'status'; return; }
          const key = new TextEncoder().encode(q('#hm-key').value), msg = new TextEncoder().encode(q('#hm-msg').value);
          const mac = await hmac(q('#hm-alg').value, key, msg);
          const h = hexOf(mac);
          q('#hm-res').textContent = h;
          const exp = q('#hm-sig').value.trim();
          if (!exp) { q('#hm-cmp').textContent = ''; return; }
          const expHex = /^[0-9a-f]+$/i.test(exp) && exp.length === h.length ? exp.toLowerCase() : bytesToHexString(base64ToBytes(exp));
          const ok = expHex === h;
          q('#hm-cmp').textContent = ok ? 'Signature matches.' : 'Signature does NOT match.';
          q('#hm-cmp').className = `status ${ok ? 'ok' : 'error'}`;
        },
      });
    },
  },
  {
    id: 'filehash', icon: '▤', name: 'File Checksum', category: 'Cybersecurity', tags: ['arquivo', 'firmware', 'iso', 'verificar', 'sha256', 'hash de arquivo'],
    description: 'Hash a local file (firmware, ISO, backup) with SHA-256/512 and CRC-32. Nothing is uploaded.',
    pt: { name: 'Checksum de arquivo', description: 'Calcula SHA-256/512 e CRC-32 de um arquivo local (firmware, ISO, backup). Nada é enviado.' },
    render(root) {
      mount(root, {
        html: `<div class="field"><label for="fh-file">File</label><input type="file" id="fh-file" data-no-persist /></div>` +
          grid(field({ id: 'fh-expect', label: 'Expected SHA-256 (optional)', placeholder: 'paste the vendor’s published hash' })) +
          details('fh-res', 1) + `<p class="status" id="fh-cmp"></p>` + hint('Files are read in your browser. Large files may take a moment.'),
        calc: async q => {
          const file = q('#fh-file').files[0];
          if (!file) return;
          const buf = await file.arrayBuffer();
          const sha256 = hexOf(await crypto.subtle.digest('SHA-256', buf));
          const sha512 = hexOf(await crypto.subtle.digest('SHA-512', buf));
          renderDetails(q('#fh-res'), [['File', `${file.name} · ${file.size.toLocaleString('en-US')} bytes`, '', 'wide'], ['SHA-256', sha256, '', 'wide'], ['SHA-512', sha512, '', 'wide'], ['CRC-32', hex(crc32(new Uint8Array(buf)), 8)]]);
          const exp = q('#fh-expect').value.trim().toLowerCase();
          if (exp) { const ok = exp === sha256; q('#fh-cmp').textContent = ok ? 'SHA-256 matches the expected value.' : 'SHA-256 does NOT match.'; q('#fh-cmp').className = `status ${ok ? 'ok' : 'error'}`; }
        },
      });
    },
  },
  {
    id: 'checksum', icon: '✓', name: 'Checksum Calculator', category: 'Cybersecurity', tags: ['crc', 'crc16', 'lrc', 'xor', 'modbus', 'checksum', 'nmea'],
    description: 'CRC-32, CRC-16 (Modbus, CCITT, XMODEM), CRC-8, LRC and XOR over text or hex bytes.',
    pt: { name: 'Calculadora de checksum', description: 'CRC-32, CRC-16 (Modbus, CCITT, XMODEM), CRC-8, LRC e XOR sobre texto ou bytes em hexadecimal.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'ck-mode', label: 'Input as', type: 'select', options: [['text', 'Text (UTF-8)'], ['hex', 'Hex bytes']] })) +
          textarea({ id: 'ck-in', label: 'Payload', rows: 3, value: '123456789' }) + details('ck-res', 3) +
          hint('CRC and LRC detect accidental errors. They are not cryptographic integrity controls.'),
        calc(q) {
          const bytes = q('#ck-mode').value === 'hex' ? parseHexBytes(q('#ck-in').value) : bytesOf(q('#ck-in').value);
          renderDetails(q('#ck-res'), [
            ['CRC-32', hex(crc32(bytes), 8)], ['CRC-16/MODBUS', hex(crc16Modbus(bytes), 4)], ['CRC-16/CCITT-FALSE', hex(crc16CcittFalse(bytes), 4)],
            ['CRC-16/XMODEM', hex(crc16Xmodem(bytes), 4)], ['CRC-8 (poly 07)', hex(crc8(bytes), 2)], ['LRC (Modbus ASCII)', hex(lrc(bytes), 2)], ['XOR', hex(xorChecksum(bytes), 2)],
          ]);
        },
      });
    },
  },
  {
    id: 'password', icon: '⚿', name: 'Password & Passphrase', category: 'Cybersecurity', tags: ['senha', 'password', 'gerador', 'passphrase', 'entropia', 'força'],
    description: 'Unbiased random passwords and passphrases, with entropy and crack-time estimates.',
    pt: { name: 'Senha e frase-senha', description: 'Senhas e frases-senha aleatórias sem viés, com entropia e estimativa de tempo de quebra.' },
    render(root) {
      mount(root, {
        html: `<div class="range-line"><label for="pw-len">Length</label><input id="pw-len" type="range" min="8" max="64" value="20" data-no-persist /><strong id="pw-len-v">20</strong></div>` +
          `<div class="button-row"><label class="check"><input type="checkbox" id="pw-u" checked /> A–Z</label><label class="check"><input type="checkbox" id="pw-l" checked /> a–z</label><label class="check"><input type="checkbox" id="pw-d" checked /> 0–9</label><label class="check"><input type="checkbox" id="pw-s" checked /> symbols</label><label class="check"><input type="checkbox" id="pw-amb" /> exclude ambiguous (0O1lI)</label></div>` +
          row(button({ id: 'pw-gen', label: 'Generate', extra: { 'data-primary': true } }), copyButton('pw-out')) +
          result({ id: 'pw-out', mono: true }) +
          `<div class="meter" id="pw-meter"><i style="width:0"></i></div>` + details('pw-res', 3) +
          `<h2 class="sub-title">Passphrase</h2>` + row(button({ id: 'pp-gen', label: 'New passphrase', secondary: true }), copyButton('pp-out')) + result({ id: 'pp-out', mono: true, value: '—' }),
        calc(q) {
          const len = Number(q('#pw-len').value);
          q('#pw-len-v').textContent = len;
          const opts = { upper: q('#pw-u').checked, lower: q('#pw-l').checked, digits: q('#pw-d').checked, symbols: q('#pw-s').checked, excludeAmbiguous: q('#pw-amb').checked };
          const pw = generatePassword(len, opts);
          q('#pw-out').textContent = pw;
          const a = analyzePassword(pw);
          const meter = q('#pw-meter');
          meter.className = `meter ${a.rating.includes('weak') ? 'weak' : a.rating === 'fair' ? 'fair' : ''}`;
          meter.firstElementChild.style.width = `${Math.min(100, a.entropyBits / 1.28)}%`;
          renderDetails(q('#pw-res'), [['Entropy', `${a.entropyBits.toFixed(1)} bits`], ['Rating', a.rating], ['Offline crack time (10¹⁰/s)', a.crackTime, '', 'wide'], ...a.notes.map(n => ['Note', n, 'warn', 'wide'])].filter(Boolean));
        },
      });
      root.querySelector('#pp-gen').onclick = () => { const { phrase, entropyBits } = generatePassphrase(4, '-', true, true); root.querySelector('#pp-out').textContent = `${phrase}   (${entropyBits.toFixed(0)} bits)`; };
      root.querySelector('#pp-gen').click();
    },
  },
  {
    id: 'totp', icon: '⏲', name: 'TOTP Code Generator', category: 'Cybersecurity', tags: ['totp', 'mfa', '2fa', 'otp', 'autenticador', 'rfc 6238'],
    description: 'RFC 6238 one-time codes from a Base32 secret, for testing MFA integrations. Runs locally.',
    pt: { name: 'Gerador de código TOTP', description: 'Códigos de uso único RFC 6238 a partir de um segredo Base32, para testar integrações de MFA. Roda localmente.' },
    render(root) {
      mount(root, {
        html: grid(field({ id: 'to-sec', label: 'Base32 secret', type: 'password', placeholder: 'JBSWY3DPEHPK3PXP' }), field({ id: 'to-dig', label: 'Digits', type: 'select', options: [['6', '6'], ['8', '8']] }), field({ id: 'to-alg', label: 'Algorithm', type: 'select', options: [['SHA-1', 'SHA-1'], ['SHA-256', 'SHA-256'], ['SHA-512', 'SHA-512']] })) +
          result({ id: 'to-code', size: 'small' }) + `<p class="status" id="to-meta"></p>` +
          hint('Your secret is not stored. Use test secrets only; never paste production MFA seeds into a web page.'),
        calc: async q => {
          const r = await totp(q('#to-sec').value.trim() || 'JBSWY3DPEHPK3PXP', { digits: Number(q('#to-dig').value), algorithm: q('#to-alg').value });
          q('#to-code').textContent = r.code.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
          q('#to-meta').textContent = `Valid for ${r.secondsLeft}s · previous ${r.previous} · next ${r.next}`;
        },
      });
    },
  },
  {
    id: 'cvss', icon: '☣', name: 'CVSS 3.1 Calculator', category: 'Cybersecurity', tags: ['cvss', 'vulnerabilidade', 'score', 'severidade', 'cve'],
    description: 'Base score, severity and vector string from the eight CVSS 3.1 base metrics. Paste a vector to decode it.',
    pt: { name: 'Calculadora CVSS 3.1', description: 'Pontuação base, severidade e vetor a partir das oito métricas base do CVSS 3.1. Cole um vetor para decodificá-lo.' },
    render(root) {
      const keys = Object.keys(metrics);
      mount(root, {
        html: field({ id: 'cv-vec', label: 'Vector (optional paste)', value: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', hint: 'Editing the selects below overwrites this field.' }) +
          `<div class="control-grid">${keys.map(k => field({ id: `cv-${k}`, label: metrics[k].name, type: 'select', options: Object.entries(metrics[k].values).map(([v, [l]]) => [v, `${l} (${v})`]) })).join('')}</div>` +
          result({ id: 'cv-score', size: 'small' }) + details('cv-res', 2),
        calc(q) {
          const sel = {};
          const vec = q('#cv-vec');
          if (document.activeElement === vec) Object.assign(sel, parseVector(vec.value));
          for (const k of keys) {
            const el = q(`#cv-${k}`);
            if (document.activeElement !== vec && sel[k] && el.value !== sel[k]) el.value = sel[k];
            sel[k] = el.value;
          }
          const r = baseScore(sel);
          q('#cv-score').textContent = `${r.score.toFixed(1)} · ${r.severity}`;
          vec.value = r.vector;
          renderDetails(q('#cv-res'), [['Impact sub-score', r.impact.toFixed(2)], ['Exploitability sub-score', r.exploitability.toFixed(2)]]);
        },
      });
    },
  },
  {
    id: 'hexdump', icon: '⌸', name: 'Hex Dump & Strings', category: 'Cybersecurity', tags: ['hexdump', 'xxd', 'binário', 'strings', 'entropia', 'forense'],
    description: 'xxd-style hex view of pasted bytes or text, string extraction and entropy. Good for firmware triage.',
    pt: { name: 'Hex dump e strings', description: 'Visualização hexadecimal no estilo xxd de bytes ou texto colados, extração de strings e entropia. Útil para análise de firmware.' },
    render(root) {
      mount(root, {
        html: textarea({ id: 'hd-in', label: 'Hex (or xxd output) or plain text', rows: 6, value: '48 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21 00 01 02' }) +
          grid(field({ id: 'hd-mode', label: 'Input is', type: 'select', options: [['hex', 'hex / xxd dump'], ['text', 'plain text']] }), field({ id: 'hd-min', label: 'Min string length', type: 'number', value: 4 })) +
          details('hd-res', 2) + `<pre class="code" id="hd-out"></pre>` + `<pre class="code" id="hd-str"></pre>`,
        calc(q) {
          const bytes = q('#hd-mode').value === 'hex' ? parseHexdumpInput(q('#hd-in').value) : new TextEncoder().encode(q('#hd-in').value);
          renderDetails(q('#hd-res'), [['Bytes', bytes.length], ['Entropy', `${entropyOf(bytes).toFixed(3)} bits/byte (8 = random)`, '', 'wide']]);
          q('#hd-out').textContent = hexdump(bytes);
          const strs = extractStrings(bytes, num(q('#hd-min').value) || 4);
          q('#hd-str').textContent = strs.map(s => `${s.offset.toString(16).padStart(8, '0')}  ${s.text}`).join('\n') || 'No printable strings.';
        },
      });
    },
  },
];

function bytesToHexString(bytes) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join(''); }
