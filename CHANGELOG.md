# Changelog

## 2.0.0 — 2026-10-30

### Added
- **52 tools** (up from 19), including OT/IoT frame builders and register converters, PT100/thermocouple, cable voltage drop, OEE, VLSM, IPv6, MAC lookup, cron explainer, regex tester, text diff, CSV ↔ JSON, certificate inspector, HMAC, file checksums, CVSS 3.1, TOTP, hex dump, Modbus RTU/TCP frame builder, PLC address mapping, MQTT topic tester and serial line timing.
- **Hash-based routing.** Each tool has its own URL (`#/modbus`); Back and Forward work.
- **Favourites and recents** in the sidebar; favourites toggle without resetting the open tool.
- **Remembered inputs** per tool, stored on the device only.
- **Settings page** (*About & settings*): language, theme, compact mode, export and import of settings, reset.
- **Bilingual interface**: English and Português (Brasil), with localised tool names and descriptions.
- **Light theme** and system-theme support, plus `Ctrl/⌘ + Shift + L` to cycle themes.
- **Keyboard support**: `/` to search, `Esc` to close or go back, `Ctrl/⌘ + Enter` to recalculate; keyboard-operable cards.
- **PWA**: PNG icons (192, 512 and maskable 512), manifest shortcuts, install button and an in-app update banner.
- **Unit tests** (`npm test`) for the pure calculation modules: 29 test groups.
- `src/lib/` pure modules, `src/tools/` category modules, and a registry with duplicate-id checking.

### Changed
- Source reorganised into `src/` (`app.js`, `ui.js`, `i18n.js`, `storage.js`, `tools/`, `lib/`). The old single-file `app.js` is removed.
- Service worker uses a versioned cache with stale-while-revalidate; caches from older versions are deleted on activation.
- Stored data uses the `forge-tools:` key namespace. The v1 favourites key is migrated automatically.
- Unit conversion now covers mass flow, torque, speed, area, frequency, data rate and more.
- Expression evaluator rewritten as a shunting-yard parser: no `eval`/`Function`, supports `× ÷ −`, unary minus with correct precedence (`-2^2 = -4`), scientific notation and variables.
- Statistics report population and sample variance, quartiles, IQR, mode and coefficient of variation.
- Timestamp tool detects seconds, milliseconds, microseconds and nanoseconds; shows local and UTC values with the offset and ISO week.
- IPv4 tools reject octets with leading zeros and show the wildcard mask and address class.

### Fixed
- **Scientific calculator:** `sin`, `cos` and `tan` always failed with "Unsupported expression" (the validator rejected the `I` in `Math.PI`). The default expression now evaluates.
- **Scientific calculator:** the hint promised `× ÷` support, which the code did not implement.
- **Timestamp:** the local date/time field received UTC wall-clock time, so it was off by the timezone offset; seconds were dropped.
- **Timestamp:** invalid or out-of-range values raised an uncaught `RangeError` instead of a message.
- **Favourites:** toggling a favourite rebuilt the open tool and erased what the user had typed.
- **Favourites:** corrupted `localStorage` data stopped the whole app from rendering.
- **Logo** linked to `#home`, which did nothing; it now returns to the dashboard.
- **Theme button** toggled a class that had no CSS, so nothing changed; the light theme is now implemented.
- **Loan calculator** kept the previous result on invalid input without telling the user; it now explains the problem.
- **Markup** produced `NaN%` for zero cost; **Molarity** showed `∞` for zero concentration when solving for volume.
- **Password generator** did not regenerate when the symbols option changed; generation is now unbiased (rejection sampling) and guarantees one character from each enabled set.
- **Modbus** did not recalculate when the register family changed.
- **Base64** decoding silently replaced invalid UTF-8 with replacement characters; it now reports an error.
- **Dashboard cards** were not focusable or operable with the keyboard.
- The README pointed to a `forge-tools` repository; the correct name is `industrial-toolkit`.

### Removed
- The legacy single-file `app.js` (replaced by `src/app.js` and the `src/` modules).

## 1.1.0 — 2026-07-12

- Expanded the suite to 19 browser-local tools across finance, science, mathematics, electrical engineering, process instrumentation, IT, OT/IoT and cybersecurity.
- Added a scientific calculator, statistics, base conversion, molarity, Ohm's Law, 4–20 mA scaling, loan/interest, markup/margin, UUID, JWT decoding and CRC-32.
- Added a web manifest and service worker for installable, offline-capable use.

## 1.0.0 — 2026-07-12

- Initial public release of ForgeTools.
- Added an offline dashboard and eight utilities spanning engineering, IT/network, cybersecurity and OT/IoT workflows.
- Added tool search, browser-local favourites and responsive navigation.
