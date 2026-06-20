# Abhyas

Mobile-first PWA for tracking SSC practice from physical books.

## Features

- Pre-seeded topics with page ranges and answer key paste (continuous, numbered, Pinnacle `133.(b)` format)
- Practice sessions with selection feedback; full answer review at session end
- Mistake bank and analytics with **advanced multi-filter** panels
- **Light / dark mode** toggle
- Offline PWA — data stored locally per device

## Development

```bash
npm install
npm run dev
```

## Install on Android (offline, no laptop needed)

**Your laptop IP (`192.168.x.x`) cannot host a reliable offline PWA.** Android needs a trusted HTTPS URL (not self-signed, not a local network address). When the laptop is off, that origin is dead — the home-screen icon still points there.

Use free static hosting instead:

1. Build the app:

```bash
npm run build
```

2. Deploy the `dist` folder to [Netlify Drop](https://app.netlify.com/drop) (drag and drop — no account required for a quick URL).

3. On your phone, open the **Netlify HTTPS URL** (e.g. `https://something-random.netlify.app`).

4. Let the app fully load, then Chrome → **Install app** / **Add to Home screen**.

5. Open the installed app once while online. After that it works offline — **laptop not needed**.

Remove any old home-screen shortcuts that point to `192.168.x.x`.

### About storage numbers

Android “App info” often shows **total Chrome storage** (can be GB), not just this app. This app’s cached shell is under ~1 MB; your practice data is stored in IndexedDB on the phone.

### LAN preview (testing only)

To test on your phone while developing (laptop must stay on):

```bash
npm run preview:lan
```

Open the `https://192.168.x.x:4173` URL and accept the certificate warning. This is **not** suitable for permanent offline install.

## Data storage

All progress is saved in **IndexedDB on each phone**. Two phones do not share data automatically.

## Stack

React · TypeScript · Vite · Tailwind CSS · Dexie · Zustand · Recharts · vite-plugin-pwa
