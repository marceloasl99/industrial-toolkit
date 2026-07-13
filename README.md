# ForgeTools — Engineering Utility Suite

> Offline-first converters and practical utilities for IT, OT, IoT, cybersecurity, and Industry 4.0.

ForgeTools is an original, dependency-free web application designed for technicians, developers, engineers, analysts, and operations teams. It keeps common calculations and transformations private: every included tool runs locally in the browser, with no account, telemetry, or server required. Once opened from a web server, it can also be installed as a small Progressive Web App (PWA).

## Included tools

| Domain | Tool | What it does |
| --- | --- | --- |
| Engineering | Unit Converter | Convert length, mass, pressure, flow, power, energy, data size, and temperature. |
| Engineering | Ohm’s Law Calculator | Solve common voltage, current, resistance, and power relationships. |
| Engineering | 4–20 mA Signal Converter | Scale a linear process value to or from an analog current loop. |
| Science & Math | Scientific Calculator | Calculate arithmetic, trigonometry, roots, and logarithms. |
| Science & Math | Statistics Calculator | Find mean, median, variance, standard deviation, and range. |
| Science & Math | Number Base Converter | Translate binary, octal, decimal, and hexadecimal numbers. |
| Science & Math | Molarity Calculator | Calculate solution molarity, amount of substance, or volume. |
| Finance & Planning | Loan & Interest Calculator | Estimate payments, repayment total, and interest. |
| Finance & Planning | Markup & Margin Calculator | Calculate selling price, gross profit, and gross margin. |
| IT & Network | IPv4 Subnet Calculator | Find subnet masks, networks, broadcasts, usable hosts, and address ranges. |
| IT & Network | UUID Generator | Create cryptographically random UUID v4 identifiers. |
| IT & Network | JWT Decoder | Inspect JWT header and payload locally without signature verification. |
| Cybersecurity | SHA Hash Generator | Generate SHA-256 and SHA-512 digests using Web Crypto. |
| Cybersecurity | CRC-32 Checksum | Detect accidental changes in text payloads; not a cryptographic control. |
| Cybersecurity | Password Generator | Create passwords with cryptographically secure browser randomness. |
| IT & Network | JSON Formatter | Validate, pretty-print, and minify JSON locally. |
| IT & Network | Timestamp Converter | Translate Unix timestamps, local date/time input, and UTC values. |
| OT & IoT | Modbus Register Helper | Convert common reference labels into zero-based Modbus protocol offsets. |
| OT & IoT | Base64 Encoder | UTF-8 safe text encoding and decoding for payloads and APIs. |

## Features

- Polished category dashboard for engineering, finance, science, IT, OT/IoT, and cybersecurity workflows, with an original visual system and codebase.
- Instant search (`Ctrl+K` / `Cmd+K`) and persistent favorites stored only in `localStorage`.
- Responsive, dark-first interface that works on desktops, tablets, and phones.
- Static HTML, CSS, and JavaScript, plus an optional service worker: ideal for GitHub Pages and offline use.
- No build step and no third-party dependency.

## Run locally

Download or clone the repository and open `index.html` in a modern browser. For the closest production behavior, serve the folder with any static server.

```bash
# Example with Python, if installed
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Publish with GitHub Pages

1. Create a GitHub repository named `forge-tools` under `marceloasl99`.
2. Upload the contents of this project to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose `main`, then `/ (root)`.
5. Save. GitHub will publish the static site at `https://marceloasl99.github.io/forge-tools/`.

## Safety note

This project is intended for productivity, education, and operational support. Always validate conversions and industrial protocol address conventions against the relevant equipment manual and your organization’s procedures before applying a value in production.

## Project structure

```text
forge-tools/
├── index.html       # App shell and accessible templates
├── styles.css       # Responsive design system and components
├── app.js           # Tool registry, UI, and browser-only logic
├── assets/favicon.svg
├── LICENSE
└── README.md
```

## License

MIT © 2026 Marcelo A. S. L.
