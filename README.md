# Battery + Quad Stat Clock

A simple, customizable clockface for Fitbit Sense and Versa 3.

Features:

- Battery monitor — color-coded bar across the top shows charge at a glance; different gradient while charging. Fills a gap left by most stock clockfaces.
- Four configurable corners — set each independently to steps, heart rate, weather (icon + temperature), calories, active minutes, location, or nothing. Adjust in the Fitbit app settings.
- Custom background — pick any photo from your phone.
- Native Fitbit weather — uses the built-in weather service. No third-party API keys, no signups. Toggle Celsius and Fahrenheit. Forty weather conditions, each with its own icon.
- Large central time and date, designed for at-a-glance readability.
- Battery-conscious — heart-rate sensor activates only when you've assigned it to a corner.
- Privacy-respecting — all data stays on your device. No external API calls.

Weather icons: meteocons by Bas Milius (MIT) and lucide (ISC).

---

This project was originally developed in [Fitbit Studio][studio], the
browser-based IDE that Fitbit retired in 2023. The instructions below explain
how to build, run, and iterate on it locally using the official command-line
SDK instead.

[studio]: https://studio.fitbit.com

## Prerequisites

- **Node.js** — the SDK supports current LTS lines. Node 18 or 20 is a safe
  pick; install via [nvm](https://github.com/nvm-sh/nvm) if you want to keep
  it isolated from your system Node.
- **A Fitbit Developer account** — sign up at
  https://dev.fitbit.com/. The CLI authenticates against this account on
  first use.
- **A `vulcan`-class device** (Versa 3 or Sense) running current firmware,
  paired to the Fitbit mobile app on a phone you can also put into developer
  mode. The simulator is no longer distributed for Linux, so a physical
  device is the realistic path on this machine.

## Local setup

```bash
# from the repo root
npm install
```

`npm install` pulls in `@fitbit/sdk` (the build toolchain). Install the CLI
globally — it is the interactive front-end you'll use day to day:

```bash
npm install -g @fitbit/sdk-cli
```

Then start the CLI from the repo root:

```bash
fitbit
```

The first run opens a browser to log in to your Fitbit developer account and
caches credentials under `~/.config/fitbit/` (or the platform equivalent).

## Putting the device and phone into developer mode

1. **On the watch**: Settings → Developer Bridge → toggle on. It will display
   "Waiting for connection".
2. **In the Fitbit mobile app on your phone**: open your account settings →
   Developer Menu → enable Developer Bridge. The clockface in question must
   be the one currently selected on the watch, otherwise the bridge does not
   come up.
3. The phone must be on the same Wi-Fi as the workstation running the CLI so
   the device can reach the bridge. If you do not see your watch in
   `connect device`, this is almost always why.

## Build / install / debug loop

Inside the `fitbit` prompt:

```text
fitbit$ connect device     # picks the watch
fitbit$ connect phone      # picks the companion (the paired phone)
fitbit$ bi                 # build + install in one go
fitbit$ logs               # stream console.log from device + companion
```

Other useful commands:

- `build` — only build (output `.fba` bundle lands in `build/`).
- `install` — push the last build without rebuilding.
- `screenshot` — save a PNG of what the watch is currently showing.
- `setAppPackageDir <path>` — point the CLI at a different working tree.
- `help` — list everything.

`Ctrl+C` exits the REPL. Logs continue streaming until you exit.

## What lives where

```
app/             Watch-side JavaScript (runs on the device).
companion/       Phone-side JavaScript (runs in the Fitbit mobile app sandbox).
common/          Shared modules imported by both sides.
  weather/       Weather producer (companion) + consumer (device).
resources/       SVG view, CSS, weather icons, background art.
package.json     Fitbit app manifest + npm dependencies.
```

See `CLAUDE.md` for an architectural deep-dive (messaging, file transfer,
permissions, gotchas).

## Configuration that lives in `package.json`

The `fitbit` block of `package.json` is the app manifest:

- `appUUID` — generated when the project was created. Keep it stable across
  builds; changing it produces a "different app" on the device.
- `appType: "clockface"` — flags this as a watch face rather than a regular
  app.
- `buildTargets: ["vulcan"]` — Versa 3 / Sense. Add `meson` (Versa 4) or
  `gemini` (Versa 2) if you want to publish to those, but each adds asset
  variants you have to provide.
- `requestedPermissions` — the watch will only grant APIs that are listed
  here. The current set covers activity, heart rate, location, calendar,
  sleep, and background execution.
- `iconFile: "resources/icon.png"` — referenced by the manifest but not yet
  committed to the repo. Add a 80×80 PNG before publishing.

## Troubleshooting

- **"No connection with the companion"** in device logs: phone is asleep, the
  Fitbit app was killed, or developer bridge dropped. Re-toggle developer
  bridge in the mobile app.
- **Build complains about a missing font**: custom font assets are not in
  the repo. Either drop the font files into `resources/fonts/` (creating that
  directory) or change `resources/styles.css` to use one of the system fonts.
- **`bi` succeeds but the watch keeps showing the old face**: clockfaces
  don't auto-launch after install — long-press the current face and pick
  yours from the list, or remove the previously installed copy first.
