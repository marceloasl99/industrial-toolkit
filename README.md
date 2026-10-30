# ForgeTools — Engineering Utility Suite

> 52 offline, browser-local converters, calculators and diagnostic tools for IT, OT, IoT, cybersecurity and Industry 4.0.

ForgeTools is an original, dependency-free web application for technicians, developers, engineers, analysts and operations teams. Every calculation runs in your browser: there is no account, no telemetry, no analytics and no server. Opened from any static host, it installs as a Progressive Web App and keeps working offline.

- **52 tools** across engineering, science, finance, IT & networking, cybersecurity and OT/IoT.
- **Private by design.** Inputs never leave the page. Certificate, JWT, TOTP and file-checksum tools all run locally.
- **Installable.** Add it to your home screen or desktop from the browser; it opens in its own window.
- **Bilingual interface.** English and Português (Brasil), switched in *About & settings*. Tool names and descriptions are localised.
- **No build step, no dependencies.** Plain HTML, CSS and ES modules. The unit tests use `node:test`, which ships with Node.
- **Remembers your work.** Favourites, recent tools and the last inputs of each tool are kept in `localStorage` on your device only.

---

## Quick start

Open `index.html` in a modern browser, or serve the folder:

```bash
python -m http.server 8080
# then visit http://localhost:8080
```

Requirements: a current evergreen browser (Chrome, Edge, Firefox, Safari). Running the unit tests requires Node.js 18 or newer.

## Tools

| Category | Tool | What it does |
| --- | --- | --- |
| Engineering | Unit Converter | Length, mass, pressure, flow, power, energy, torque, speed, area and data. |
| Engineering | Ohm’s Law Calculator | Solve voltage, current, resistance or power from any two known values. |
| Engineering | 4–20 mA Signal Converter | Scale a process value to and from a 4–20 mA loop, with NAMUR NE 43 fault flags. |
| Engineering | Linear Scaling | Map any raw range to engineering units: 0–10 V, 1–5 V, PLC raw counts, 12/16-bit ADC. |
| Engineering | 4–20 mA Loop Budget | Check whether a supply voltage can drive a current loop through every resistor in series. |
| Engineering | Cable Voltage Drop | Voltage drop and load voltage for copper or aluminium cable, DC or three-phase, with AWG support. |
| Engineering | PT100 / PT1000 RTD | Convert RTD resistance to temperature and back (IEC 60751, Callendar–Van Dusen). |
| Engineering | Thermocouple Converter | Type K, J, T, E, N: mV ↔ °C (NIST ITS-90) with cold-junction compensation. |
| Engineering | Voltage Divider | Output voltage, divider current and resistor power for a two-resistor divider. |
| Engineering | Resistor Colour Code | 4- and 5-band resistor colour codes to value and tolerance range. |
| Engineering | Three-Phase Power | kW, kVA, kvar and line current from voltage, current and power factor; or the reverse from kW. |
| Engineering | Motor Speed & Slip | Synchronous speed, slip and rotor frequency for an induction motor. |
| Engineering | dB / dBm Converter | Convert dBm ↔ mW and power or voltage ratios ↔ dB (RF, wireless, link budgets). |
| Engineering | Thermal Rise | Junction temperature rise from dissipated power and thermal resistance. |
| Engineering | OEE Calculator | Overall Equipment Effectiveness: availability × performance × quality, with loss breakdown. |
| Science & Math | Scientific Calculator | Arithmetic, trigonometry (degrees), roots, logarithms, factorial. Accepts × ÷ − π. |
| Science & Math | Statistics Calculator | Mean, median, mode, quartiles, IQR, population and sample variance / standard deviation. |
| Science & Math | Number Base Converter | Binary, octal, decimal and hexadecimal, with arbitrary precision and two’s complement. |
| Science & Math | BCD & Gray Code | Decimal ↔ packed BCD and binary ↔ Gray code, used by encoders and older PLC I/O. |
| Science & Math | Molarity Calculator | Molarity, moles or volume from the other two quantities (M = n / V). |
| Finance & Planning | Loan & Amortisation | Monthly payment, total interest and a full amortisation schedule. |
| Finance & Planning | Compound Growth | Future value of a principal with periodic contributions and compounding frequency. |
| Finance & Planning | Markup & Margin | Selling price, gross profit, markup and gross margin; converts between markup and margin. |
| IT & Network | IPv4 Subnet Calculator | Network, broadcast, host range, usable hosts, wildcard, class. Accepts 10.0.0.0/24 or a dotted mask. |
| IT & Network | VLSM Planner | Allocate variable-length subnets for a list of host requirements inside one block. |
| IT & Network | IPv6 Tools | Expand and compress IPv6, classify the address, and compute the subnet range. |
| IT & Network | MAC Address Tool | Format MAC addresses, identify the vendor from the OUI, derive EUI-64, generate random ones. |
| IT & Network | UUID Generator | Random UUID v4 (and time-ordered v7) with bulk generation, using secure browser randomness. |
| IT & Network | JWT Decoder | Inspect header and payload, convert time claims, flag expiry and alg none. No signature verification. |
| IT & Network | JSON Formatter | Validate, pretty-print, minify and sort keys, with the error position. |
| IT & Network | Timestamp Converter | Unix seconds, milliseconds, microseconds or nanoseconds (auto-detected), ISO dates, UTC and local time. |
| IT & Network | Cron Explainer | Explain a 5-field cron expression and list its next run times in local time. |
| IT & Network | Regex Tester | Test a regular expression against text: matches, positions and capture groups. |
| IT & Network | Text Diff | Line-by-line comparison of two texts or configurations, with optional whitespace tolerance. |
| IT & Network | CSV ↔ JSON | Convert CSV to JSON and back, with RFC 4180 quoting and automatic delimiter detection. |
| IT & Network | Transfer & IoT Data Budget | Transfer time for a file at a given link speed, and monthly data for a fleet of IoT devices. |
| IT & Network | Certificate Inspector | Paste a PEM certificate: subject, issuer, validity, key type, SANs, CA flag. Runs locally. |
| IT & Network | Base64 Encoder | UTF-8 safe Base64 and Base64url encoding and decoding for payloads and APIs. |
| Cybersecurity | Hash Generator | SHA-1, SHA-256, SHA-384, SHA-512 of text, via Web Crypto. Hex and Base64 output. |
| Cybersecurity | HMAC Generator | HMAC-SHA256/384/512 with a secret key; verify a provided signature. Useful for webhooks and API signing. |
| Cybersecurity | File Checksum | Hash a local file (firmware, ISO, backup) with SHA-256/512 and CRC-32. Nothing is uploaded. |
| Cybersecurity | Checksum Calculator | CRC-32, CRC-16 (Modbus, CCITT, XMODEM), CRC-8, LRC and XOR over text or hex bytes. |
| Cybersecurity | Password & Passphrase | Unbiased random passwords and passphrases, with entropy and crack-time estimates. |
| Cybersecurity | TOTP Code Generator | RFC 6238 one-time codes from a Base32 secret, for testing MFA integrations. Runs locally. |
| Cybersecurity | CVSS 3.1 Calculator | Base score, severity and vector string from the eight CVSS 3.1 base metrics. Paste a vector to decode it. |
| Cybersecurity | Hex Dump & Strings | xxd-style hex view of pasted bytes or text, string extraction and entropy. Good for firmware triage. |
| OT & IoT | Modbus Register Helper | Reference numbers (40001, 400001) to zero-based protocol offsets, with range checks and the function code. |
| OT & IoT | Modbus Frame Builder & Decoder | Build RTU/TCP request frames with CRC-16, or decode a hex frame and explain each field. |
| OT & IoT | Register Type Converter | Two or four 16-bit registers ↔ float32, int32, uint32, float64. All four byte/word orders. |
| OT & IoT | PLC Address Converter | Map Schneider %MW, Siemens DB/M/I/Q, Allen-Bradley N7/B3 addresses to Modbus references and back. |
| OT & IoT | MQTT Topic Tester | Check MQTT filters and topics against wildcards (+ and #), validate syntax, decode Sparkplug B topics. |
| OT & IoT | Serial Line Settings | Frame time, character time and Modbus RTU silent interval for a given baud rate and framing. |

Use the search box (or `Ctrl+K` / `⌘K`, or `/`) to find a tool by name, description or tag: searching *PLC*, *CLP*, *subnet*, *senha* or *modbus* finds the right tool even when the wording differs.

## Features

### Navigation and workflow
- **Dashboard** grouped by category, with a hero summary and search across names, descriptions and tags.
- **Favourites** (★) pinned at the top of the sidebar, and **Recent** tools for quick return.
- **Hash routing.** Every tool has its own link (`#/modbus`, `#/network`…), so you can bookmark or share a specific tool. Browser Back and Forward work.
- **Remembered inputs.** Each tool restores what you last typed, so a 4–20 mA scaling or a subnet plan is still there after a reload.
- **Live results.** Results update as you type; `Ctrl/⌘ + Enter` forces a recalculation.
- **Clear errors.** Invalid input shows a message explaining what to fix, instead of a blank or `NaN` result.

### Appearance and accessibility
- Theme: follow the system, or force dark or light (`Ctrl/⌘ + Shift + L` cycles them).
- Compact mode hides the hero and descriptions for dense dashboards and tablets in the field.
- Keyboard-operable cards and controls with visible focus rings; skip-link; ARIA labels on icon-only buttons.
- Responsive layout down to phone width with no horizontal scrolling.

### Data and privacy
- **Export / import** all favourites and settings as a single JSON file, to move your setup between machines.
- **Reset** clears favourites, recents, saved inputs and settings.
- Nothing is sent over the network. Fonts are system fonts; the only request is for the app's own files.

### Offline and installation
- A service worker precaches the shell and serves cached files immediately (stale-while-revalidate), so the app loads without a connection.
- When a new version is deployed, a banner offers to reload. Old caches are removed automatically.
- The web manifest provides 192 and 512 px PNG icons (including a maskable icon) and shortcuts to Modbus, Subnet, 4–20 mA and Units.

## Notes on accuracy

These tools are aids for engineering judgement, not substitutes for a standard, a datasheet or a commissioning procedure.

- **Modbus addresses.** Reference numbers are one-based; protocol offsets are zero-based. Device manuals differ in whether they use 5-digit (`40001`) or 6-digit (`400001`) notation, and some gateways remap addresses. Verify before writing to a controller.
- **PLC address mappings** (Schneider, Siemens, Allen-Bradley → Modbus) depend on gateway and memory configuration. The tool shows the convention it assumes.
- **NAMUR NE 43** fault and saturation thresholds are shown for information. Your transmitter's configuration governs the actual alarm behaviour.
- **Thermocouples** use the NIST ITS-90 inverse polynomials. Cold-junction compensation assumes the reference junction temperature you enter.
- **CVSS** implements the FIRST CVSS v3.1 base-score equations. Temporal and environmental metrics are not included.
- **TOTP, JWT and certificate tools** are for testing and inspection. The JWT decoder does not verify signatures. Do not paste production secrets, MFA seeds or private keys into any web page, including this one.
- **Password strength** estimates assume an offline attack at 10¹⁰ guesses per second against a fast hash. Real risk depends on the hashing scheme used by the system that stores the password.
- **Cron** is evaluated in your browser's local time zone. Daylight-saving transitions follow the browser's calendar.
- **Subnets.** `/31` links use two usable addresses (RFC 3021); `/32` is a single host. The IPv4 and VLSM tools reject octets with leading zeros, which some systems read as octal.

Always validate conversions and protocol conventions against the relevant equipment manual and your organisation's procedures before applying a value in production.

## Project structure

```text
industrial-toolkit/
├── index.html            # App shell: sidebar, topbar, router target
├── styles.css            # Design tokens (light/dark), components, responsive rules
├── manifest.json         # PWA manifest: icons, shortcuts, colours
├── sw.js                 # Service worker (versioned cache, stale-while-revalidate)
├── assets/
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-512-maskable.png
├── src/
│   ├── app.js            # Router, navigation, search, favourites, recents, settings, PWA hooks
│   ├── ui.js             # Shared UI helpers: form fields, results, tables, copy, download, mount()
│   ├── i18n.js           # English and pt-BR strings, localised tool metadata
│   ├── storage.js        # Guarded localStorage (namespaced keys, export/import)
│   ├── version.js        # Single source of truth for the app version
│   ├── tools/            # One module per category; each exports tool definitions
│   │   ├── index.js      # Registry: builds the tool list and checks for duplicate ids
│   │   ├── engineering.js
│   │   ├── science.js
│   │   ├── finance.js
│   │   ├── it.js
│   │   ├── security.js
│   │   └── ot.js
│   └── lib/              # Pure, DOM-free logic (fully unit-tested)
│       ├── expr.js       # Safe expression evaluator (shunting-yard, no eval)
│       ├── ipv4.js       # Subnetting, VLSM, parsing
│       ├── ipv6.js       # Parsing, RFC 5952 compression, subnets (BigInt)
│       ├── modbus.js     # References, function codes, RTU/TCP frames, exception codes
│       ├── registers.js  # 16-bit words ↔ float32/int32/uint32/float64 with byte/word order
│       ├── crc.js        # CRC-32, CRC-16 variants, CRC-8, LRC, XOR
│       ├── thermocouple.js, rtd.js, scaling.js, electrical.js, units.js
│       ├── cvss.js, totp.js, password.js, x509.js, hexdump.js
│       ├── cron.js, timestamp.js, mqtt.js, plc.js, mac.js, jwt.js
│       ├── finance.js, stats.js, base.js, base64.js, csv.js, diff.js
│       ├── oee.js, bandwidth.js, number.js
│       └── …
├── tests/
│   └── lib.test.js       # 29 test groups covering the lib/ modules
├── scripts/
│   └── make-icons.mjs    # Regenerates the PNG icons (no dependencies)
├── package.json
├── CHANGELOG.md
├── task.md               # v1.x delivery checklist (outdated, see Status)
├── LICENSE
└── README.md
```

Design rule: **`src/lib/` never touches the DOM.** Every calculation is a plain function that takes numbers or strings and returns plain data, which is what makes it testable. The `src/tools/` modules only wire inputs to those functions and render the results.

## Development

```bash
npm test          # runs node --test (unit tests for src/lib)
npm start         # static server on port 8080
npm run icons     # regenerate assets/icon-*.png
```

### Adding a tool

1. Put the calculation in `src/lib/<topic>.js` as a pure function and add tests to `tests/lib.test.js`.
2. Add a tool object to the matching file in `src/tools/`:

   ```js
   {
     id: 'my-tool', icon: '◎', name: 'My Tool', category: 'OT & IoT',
     tags: ['keyword', 'synonym'],                       // extra search terms, any language
     description: 'One sentence in English.',
     pt: { name: 'Meu utilitário', description: 'Uma frase em português.' },
     render(root) {
       mount(root, {
         html: field({ id: 'x', label: 'Input', type: 'number', value: 1 }) + details('out', 2),
         calc(q) { renderDetails(q('#out'), [['Result', String(num(q('#x').value) * 2)]]); },
       });
     },
   }
   ```

3. Ids must be unique; `src/tools/index.js` throws at load time if they are not.
4. Keep the same category names in English, and translate them in `categoryPt` inside `src/app.js`.

`mount()` runs `calc` once on render, re-runs it on input changes, shows any thrown error in a message box, and handles copy buttons (`copyButton('out-id')`). Inputs are persisted automatically unless marked `persist: false` (for example, sample data that should always reset).

## Releasing

1. Update `src/version.js` and `package.json`.
2. Bump `CACHE_VERSION` in `sw.js` (keep it equal to the app version). Old caches are removed on activation.
3. Add an entry to `CHANGELOG.md`.
4. Run `npm test` and load the app once from a local server to check the console is clean.
5. Commit, tag, and push. GitHub Pages serves the new version; installed copies update on their next visit.

## Publish with GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`.
3. Save. The site is published at `https://marceloasl99.github.io/industrial-toolkit/`.

## Status

**Version 2.0.0 (2026-10-30).** Released to `main`. Functional, but not fully validated: read the limitations below before relying on any tool for a production decision.

### What has been verified

- `npm test`: 29 of 29 test groups pass. They cover the `src/lib/` calculation modules, including RFC vectors for HOTP/TOTP and the CRC check values.
- Headless Chromium: all 52 tools render with their default inputs, with no console errors and no error boxes.
- Spot checks in the browser: scientific calculator (`sin(30) + sqrt(16) * 2` = 8.5), subnet details, Modbus RTU frame and CRC (`01 03 00 00 00 0A C5 CD`), CVSS vector for Log4Shell (9.8, Critical), PT100 at 100 °C (138.5 Ω), JWT warnings (`alg: none`, expired token).
- Persistence: favourites do not clear the open tool's inputs; inputs are restored after reload; corrupted `localStorage` does not blank the app.

### Known limitations

- **Logic tested, UI not.** `src/tools/*` has no automated tests. Only the default inputs of each tool were exercised, plus the spot checks above. Edge cases in the UI (invalid combinations, empty fields, mode switches) are untested.
- **X.509 parser is untested on real certificates.** `src/lib/x509.js` is a minimal DER reader. It has not been run against certificates from real CAs, and it does not check chains or signatures.
- **Thermocouple coefficients** follow the NIST ITS-90 polynomials and were checked at a few points. They have not been compared against a full reference table.
- **Industrial conventions are not validated on hardware.** Modbus reference-to-offset mapping, PLC address conversion (Schneider, Siemens, Allen-Bradley), NAMUR NE 43 thresholds and the serial-line timing are conventions. They need checking against your own devices and manuals.
- **Password crack-time** is a rough offline-attack model (10¹⁰ guesses/s), not a security audit.
- **Cron** uses the browser's local time zone. Daylight-saving transitions are not tested.
- **Crypto availability.** Hash, HMAC, TOTP and file checksum use Web Crypto, which requires a secure context. Opening `index.html` from disk (`file://`) may disable these in some browsers; serve the folder over HTTP or HTTPS.
- **Installation.** The service worker is disabled on `file://`. The PWA install flow and the new icons have not been tested on a real device, and the icons have not been reviewed visually.
- **Browsers.** Tested only in headless Chromium. Firefox and Safari have not been checked.
- **Language.** Navigation, tool names, descriptions and categories are bilingual. Tool labels, hints and error messages are in English. This README is in English only.
- **Build and CI.** There is no linter, type checker or GitHub Actions workflow. Tests run only when someone runs `npm test`.
- **Documentation.** `task.md` is the v1.x checklist and is not maintained.

### Pending work

1. Translate tool labels, hints and error messages to pt-BR (the `pt` field currently covers names and descriptions only).
2. Add a GitHub Actions workflow that runs `npm test` on every push.
3. Add behaviour tests for the tools (for example, with a headless browser script like the one used for QA).
4. Validate the X.509 parser against real certificates and add the results as fixtures.
5. Validate the Modbus, PLC and NAMUR conventions against at least one real device or a vendor manual.
6. Review the generated icons visually and test the install flow on Android and desktop Chrome.
7. Replace `task.md` with a current checklist, or remove it.
8. Add a pt-BR version of this README.

## Licence

MIT © 2026 Marcelo A. S. L. See [LICENSE](LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
