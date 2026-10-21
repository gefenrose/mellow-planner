# Mellow 🌿 — a free visual planner

A self-contained, independent, mobile-first visual day planner. No subscription, login, npm install, or database is required. Core functionality persists in your own browser.

## Use it

1. Unzip and open `index.html` in a browser for a quick trial. If your browser blocks local file storage, serve the folder over HTTP instead (`python3 -m http.server 8000`) and visit `http://localhost:8000`.
2. For installation on iPhone, publish the folder on a free **HTTPS** static host, such as GitHub Pages, Cloudflare Pages, or Vercel. Open that URL in Safari, tap Share → Add to Home Screen. The service worker caches the core app for offline opening after the first online visit.
3. In **Settings**, select English or Hebrew, set appearance, export/import backups, or erase local data.

## Features

- **Today**: visual, color-coded timeline; week picker; create, edit, schedule, complete, and delete tasks; unscheduled inbox; optional Google Calendar events beside your plan.
- **Tasks**: search, priority sorting, drag to reorder, categories, task notes, and checkable/editable subtasks.
- **Routines**: build sequences of timed steps, save them, and add them to any selected day's available slots. Repeat-day chips are informational, not automatic recurring scheduling.
- **Focus**: start/pause/reset a timer with time presets and optional linked task, sound, vibration, and session history. Browser support and background execution vary.
- **AI Planner / offline smart suggestions**: deterministic, keyword-based task parsing, rough step breakdown, time estimates, and free-slot scheduling; this is **not** a generative LLM. Preview and edit results before saving. It operates offline with no API key.
- **Gemini AI (optional)**: genuine LLM suggestions via Google's Gemini `gemini-2.5-flash` REST endpoint. Requires your own Google AI Studio API key and a working Google free-tier quota. Because Mellow is entirely static, the API call originates in the browser and is suitable **only for private experimentation with your own key**, not a shared production service. Never share the key, restrict it in Google Cloud, and use a trusted device. The key is kept only in the current browser tab's session storage and is never added to the app's saved backup. If Gemini fails, Mellow falls back to offline suggestions.
- **Local-only default storage**: tasks are stored in `localStorage`, not synced between devices; export JSON backups regularly. Never treat browser local storage as a durable cross-device backup.

## Privacy

Offline mode does not transmit task text. When Gemini mode is selected, the submitted brain dump and existing busy **time ranges** (not task titles) are sent to Google. The free tier has rate limits and can change; Google may use free-tier inputs to improve its products. See [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [API key security](https://ai.google.dev/gemini-api/docs/generate-content/api-key), and [Gemini reference](https://ai.google.dev/api).

## Limitations

- This is a functional prototype with its own original branding and layouts.
- Tasks stay in this browser and do not sync between devices. An optional Google Calendar connection can show events alongside Today, create Google events, and send scheduled tasks; its access token and loaded events stay in the current browser session.
- Browsers on iOS may suspend timers and background notifications. The timer uses a target timestamp to update correctly when you return.
- Date/time inputs and notification support vary across browsers.
- The Google Gemini browser-based option is experimental; a server-side authenticated proxy is recommended for a widely shared deployment.

## Developer notes

This app has no build dependencies: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, and `assets/`. Static hosting only. No third-party JavaScript runtime dependencies. Interactions were exercised in a headless browser; Gemini was not tested with a live API key.
