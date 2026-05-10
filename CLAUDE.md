# CLAUDE.md

Guidance for working with this Fitbit clockface codebase.

## What this is

A Fitbit clockface (`appType: "clockface"`) targeting `vulcan` (Versa 3 / Sense),
originally developed in the now-discontinued Fitbit Studio web IDE. The
`@fitbit/sdk` is pinned at `~6.0.0` (see `package.json`).

## Architecture

A Fitbit app is split across three execution contexts. Code is organised into
matching directories:

- `app/` — runs on the **watch** (device JS runtime, very limited APIs, no
  network). Entry point: `app/index.js`. Drives the UI, sensors, and renders
  weather data delivered from the companion.
- `companion/` — runs on the **paired phone** (Fitbit mobile app's JS sandbox).
  Has network and geolocation. Entry point: `companion/index.js`. Currently
  bootstraps the weather module and triggers an initial fetch.
- `common/` — modules imported by both sides. Anything in here must be careful
  to use only APIs available in whichever context imports it.
- `resources/` — SVG views (`index.view`), CSS (`styles.css`), widget
  definitions (`widget.defs`), and PNG icons (weather conditions, background).

Communication between watch and phone goes over `messaging` (small JSON
messages, e.g. the request that asks the phone to fetch weather) and
`file-transfer` (CBOR-encoded payloads, e.g. the weather result file delivered
back to the watch). See `common/weather/`.

## Weather subsystem

Three files implement a producer/consumer pair sharing constants. The data
source is Fitbit's native [Companion Weather API][fitbit-weather] (introduced
in SDK 5.2), so there's no third-party HTTP fetch and no API key.

- `common/weather/common.js` — shared constants: `WEATHER_MESSAGE_KEY`,
  `WEATHER_DATA_FILE`, `WEATHER_ERROR_FILE`. Also exports `iconForCondition`,
  which maps the 47-value `WeatherCondition` enum to the bundled OWM-style
  icon names (`01d`/`01n` for clear, `10d`/`10n` for rain, etc.). Conditions
  without a Day/Night suffix in the enum get the suffix from the caller's
  `isDay` flag.
- `common/weather/device.js` — imported by `app/index.js`. Caches the last
  weather result on disk, sends an empty `messaging` ping to the companion
  when the cache is stale, and listens on `file-transfer` `inbox` for the
  response. Monkey-patches `inbox.nextFile` to siphon off its own files
  (`weather.cbor` / `weather_error.cbor`) without breaking other consumers.
- `common/weather/phone.js` — imported by `companion/index.js`. On message
  from the device, calls `weather.getWeatherData({ temperatureUnit: "Celsius" })`
  and enqueues the result as CBOR via `outbox`.

The CBOR payload sent device-ward is intentionally minimal:
`{ temperatureC, condition, location, timestamp }`. Day/night for icon
selection is determined on the device side at render time using the watch's
local clock (06:00–18:59 = day), so the icon can update across sunset
without a refetch.

[fitbit-weather]: https://dev.fitbit.com/build/reference/companion-api/weather/

## UI / view

`resources/index.view` is the SVG document tree. Element IDs that
`app/index.js` reaches into: `view`, `background`, `battery`, `clock`, `date`,
`step-data`, `heart-data`, `weather`, `temperature`.

`resources/styles.css` styles those elements. Custom fonts referenced
(`Seville-Book-Condensed`, `Seville-Bold-Condensed`, `Colfax-Bold`) need to
exist in the resources/fonts area for a build — if a build complains about a
missing font, that is why.

The `monoDigits` helper in `common/utils.js` maps digits to Unicode code
points `\x10`–`\x19`. This is a font trick: the custom clock font has
fixed-width digit glyphs at those code points, so swapping to them avoids the
proportional-width jitter the default digits would cause.

## Build & run (no Fitbit Studio)

The repo is built with the official `@fitbit/sdk-cli` (installed globally —
invoke as `fitbit`). See `README.md` for the full setup. The day-to-day
commands inside the REPL are:

- `bi` — build and install to a connected device + companion
- `build` — produce a `.fba` bundle in `build/`
- `install` — push the last build to the connected device
- `screenshot` — capture the current device screen
- `logout` / `login` — re-authenticate against Fitbit's service

The watch and phone must both be in Developer Bridge mode and the CLI
selects them with `connect device` / `connect phone`.

## Conventions when editing

- The codebase is plain ES modules — no TypeScript, no bundler config beyond
  what the Fitbit SDK provides. Keep new code in the same style.
- Keep watch-side code small. The device runtime has tight memory limits and
  no `fetch`, no `setTimeout` precision guarantees. Push anything network- or
  geolocation-related into `companion/`.
- When adding messaging fields, update `common/weather/common.js` (or a new
  `common/<feature>/common.js`) with shared keys so both sides agree.
- `requestedPermissions` in `package.json` is the source of truth for what the
  app can do. Removing a feature should also remove its permission.
- The app icon path in `package.json` is `resources/icon.png`, but no such
  file exists in the repo yet — builds will warn. Add one before publishing.

## Things to be careful about

- `inbox.nextFile` patching in `common/weather/device.js` runs at module load.
  If another module ever wants the same trick, they must compose, not replace.
- `app/index.js` calls `weather.fetch()` immediately at startup *and* on a
  25 s `setInterval`, while the maximum cache age is 300 s. The interval is
  cheap because the cache short-circuits, but if the cache logic ever changes
  the interval becomes a battery drain — keep them coordinated.
- `peerSocket` may not be `OPEN` when the watch boots before the phone
  reconnects; the device-side fetch handles this by surfacing an error
  through `onerror`. New messaging code should do the same instead of
  silently dropping messages.
