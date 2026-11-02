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

This app has no build dependencies: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, and `assets/`. Static hosting only. No third-party JavaScript runtime dependencies. Interface icons come from the locally bundled Lucide Static SVG sprite (`lucide-static` 1.61.0, ISC license; see `assets/lucide/`). Interactions were exercised in a headless browser; Gemini was not tested with a live API key.

## Linked Google Calendar synchronization

Linked timed tasks synchronize title, notes, date, start time and duration in both directions. Local edits sync shortly after interactions; remote changes are checked every 30 seconds while the page is visible and connected, on focus, and on refresh. Individual linked-task deletion queues a durable Google deletion; cancelled Google events remove unchanged linked tasks. Removing a task from the schedule removes its Google event and retains the local task. Completion remains local.

Google authentication is session-only: reconnect after reload or token expiry. Pending local edits/deletions survive offline periods. No background server or closed-app synchronization is provided. Concurrent edits preserve the local version as a separate unlinked task and accept the Google version on the linked task. Existing links without a synchronization baseline are reconciled conservatively, keeping a separate local copy if values differ. Google all-day conversions retain the task as an unlinked copy. Conditional writes use ETags; failed requests retain pending work. Bulk erase/remove-samples actions intentionally do not delete Google events.

## AI journal and BYOK providers

An **AI & Writing** tab supports date-specific end-of-day summaries from task names and completion states (not calendar event details or task notes), free-writing entries saved locally, and optional AI help organizing, reflecting on, or polishing the text. Generated responses are previews until the user explicitly saves them. Existing task-editor **Break down this task** suggestions use the same selected provider; offline suggestions remain available, including when the provider fails.

Open **Settings → AI provider**, select **Google Gemini**, **Groq**, or **OpenAI**, enter a model name (defaults are provided), and paste a personal API key. **Test connection** sends a generic test message. The key is kept in browser `sessionStorage` for the current tab/session, not in persistent app data or exported backups. Selected provider/model preferences and journal writing/AI results are saved with local planner data and included in JSON backups. Writing and day summaries are sent only when the user presses the corresponding AI button. API calls may incur charges and depend on the provider's model access, network, browser CORS policy, and quota. This implementation makes direct HTTPS calls to the provider from the browser, not through an authenticated server proxy. **That is not secure enough for shared/production credentials**; scripts, extensions, or users with device access can potentially extract the key. For a production deployment use an authenticated backend proxy and provider-side rate limits. No test with real provider credentials was performed as part of this change.

## Today checklists and next-task countdown

The **Today** page displays saved task subtasks directly inside their parent cards in both Day sections and Day sequence, with completion checkboxes linked to the existing local task data. A compact progress count updates when steps are checked. The **Day sequence** shows a live, localized countdown to the next future *incomplete* scheduled Mellow task, including tasks on upcoming dates; Google events and unscheduled tasks are excluded. The countdown updates in-place every 15 seconds and on returning to the tab. Drag-and-drop ignores subtask interactions.

### Collapsible subtasks on Today

Every Today task checklist has a small chevron next to its Subtasks label. Select it to collapse or reopen that checklist; the completed/total count stays visible. Each task's collapse preference is saved in `db.settings.homeSubtasksCollapsed` and survives rerenders and reloads, with checkboxes still editable when expanded. The control is keyboard-accessible, labels are localized in English and Hebrew, and no full page redraw is needed for toggling.

## Site-wide visual system (v45)

Mellow has an original, Apple-inspired **grouped-list** interface designed to feel familiar alongside Reminders and Notes, without copying proprietary Apple components or assets. The site-wide `apple-ui.css` is loaded last and applies a single visual system throughout Today, Tasks, Routines, AI & Writing, Settings, Google Calendar, date search, editors and dialogs:

- Native Apple system font stacks where available, clearer headings and readable secondary text
- Quiet white/inset grouped surfaces, subtle separators and very limited shadows
- Lavender action color, category and priority cues that remain recognizable by text/icons
- Consistent interactive targets (typically at least 44px), safe-area-aware five-tab mobile navigation and mobile-first forms
- Light and dark schemes, `prefers-reduced-motion`, increased-contrast and forced-colors accommodations
- A keyboard skip link, translated navigation landmarks, selected-tab state and modal focus containment

This is an interface refresh. Existing scheduling, task data, routines, AI API, syncing, drag-and-drop and persistence behavior are not intentionally changed.

### Selected date contrast and drag text selection (v46)

In light mode the selected day in the Today week strip and date-jump calendar uses dark text on pale lavender. Dark mode retains its own selected-date colors. During day-view drag and task-list reordering, text selection and iOS touch callouts are disabled from gesture start through drag end/cancellation, then automatically restored; normal text input and selection outside dragging are unchanged.

### Touch drag repair (v47)

Touching a task title/icon in Today now initiates a drag on movement rather than native page scrolling. Tapping still opens the task. The visible drag grips are larger and have `touch-action: none`, including the dedicated grip on Tasks lists. The existing long-press fallback for other card areas has a shorter activation period and a more forgiving movement tolerance. A non-passive `touchmove` handler cancels page panning only for active drags, while the rest of the page and subtask controls remain scrollable. While dragging, edge auto-scroll works in both the day-sections and timeline views. Normal text-selection behavior returns on release.

### Field alignment and containment (v48)

Fixed forms and inputs that could run beyond their cards, appear shifted to one side or stretch unexpectedly after the site-wide design refresh. In particular, the 80px task emoji field stays compact, nested search input sits flush inside its search container, subtask editing fields fit their rows, iOS date/time inputs are allowed to shrink within their grid column, and Google Calendar/Settings fields and action groups wrap inside cards. The fixes use logical inline sizing for Hebrew RTL and English LTR and preserve native input behavior. On narrow devices, editor columns stack and all text-like fields stay within the available dialog width; checkboxes and drag affordances retain their distinct dimensions.
