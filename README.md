# Mellow 🌿 — a free visual planner

A self-contained, independent, mobile-first visual day planner. No subscription, login, npm install, or database is required. Core functionality persists in your own browser.

## Use it

1. Unzip and open `index.html` in a browser for a quick trial. If your browser blocks local file storage, serve the folder over HTTP instead (`python3 -m http.server 8000`) and visit `http://localhost:8000`.
2. For installation on iPhone, publish the folder on a free **HTTPS** static host, such as GitHub Pages, Cloudflare Pages, or Vercel. Open that URL in Safari, tap Share → Add to Home Screen. The service worker caches the core app for offline opening after the first online visit.
3. In **Settings**, select English or Hebrew, set appearance, export/import backups, or erase local data.

## Features

- **Today**: visual, color-coded timeline; week picker; create, edit, schedule, complete, and delete tasks; unscheduled inbox; optional Google Calendar events beside your plan.
- **Calendar**: a navigable month grid with Hebrew RTL-aware controls, task previews, and a selected-day agenda that combines local tasks with connected Google Calendar events.
- **Habits**: create, edit, delete, schedule by weekday, and mark recurring habits each day. Habit definitions and completion history persist locally and are included in backups.
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

AI help now lives directly inside task and habit creation instead of a separate **AI & Writing** page. Task breakdown and habit suggestions use the selected provider when configured, retain free offline suggestions, and only populate editable fields until the user explicitly saves.

Open **Settings → AI provider**, select **Google Gemini**, **Groq**, or **OpenAI**, enter a model name (defaults are provided), and paste a personal API key. **Test connection** sends a generic test message. The key is kept in browser `sessionStorage` for the current tab/session, not in persistent app data or exported backups. Selected provider/model preferences and journal writing/AI results are saved with local planner data and included in JSON backups. Writing and day summaries are sent only when the user presses the corresponding AI button. API calls may incur charges and depend on the provider's model access, network, browser CORS policy, and quota. This implementation makes direct HTTPS calls to the provider from the browser, not through an authenticated server proxy. **That is not secure enough for shared/production credentials**; scripts, extensions, or users with device access can potentially extract the key. For a production deployment use an authenticated backend proxy and provider-side rate limits. No test with real provider credentials was performed as part of this change.

## Today checklists and next-task countdown

The **Today** page displays saved task subtasks directly inside their parent cards in both Day sections and Day sequence, with completion checkboxes linked to the existing local task data. A compact progress count updates when steps are checked. The **Day sequence** shows a live, localized countdown to the next future *incomplete* scheduled Mellow task, including tasks on upcoming dates; Google events and unscheduled tasks are excluded. The countdown updates in-place every 15 seconds and on returning to the tab. Drag-and-drop ignores subtask interactions.

### Collapsible subtasks on Today

Every Today task checklist has a small chevron next to its Subtasks label. Select it to collapse or reopen that checklist; the completed/total count stays visible. Each task's collapse preference is saved in `db.settings.homeSubtasksCollapsed` and survives rerenders and reloads, with checkboxes still editable when expanded. The control is keyboard-accessible, labels are localized in English and Hebrew, and no full page redraw is needed for toggling.

## Site-wide visual system (v45)

Mellow has an original, Apple-inspired **grouped-list** interface designed to feel familiar alongside Reminders and Notes, without copying proprietary Apple components or assets. The site-wide `apple-ui.css` applies a single visual system throughout Today, Tasks, Habits, Settings, Google Calendar integration, date search, editors and dialogs:

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

### iPhone screenshot visual repairs (v49)

- Task and routine editors have separate, independently scrollable form contents; headers and action footers no longer overlay and hide rows while scrolling.
- Native iOS date/time inputs in task, routine and AI journal editors are contained by a dedicated full-width field shell with a visible outer focus ring.
- AI Daily Summary date field uses a predictable mobile single-column / desktop two-column grid, respecting card padding and Hebrew RTL layout.
- Global Search has a single accessible focus ring rather than a second inset purple outline. Search and month jump overlays align to the top of the screen and remain scrollable even when the keyboard appears.
- Existing task, calendar, data-storage and drag functionality is unchanged.

### Hebrew month/week arrows (v50)

Month-jump and Today week navigation chevrons now reflect RTL semantics in Hebrew: previous points right and next points left. English keeps the LTR left/right appearance. The previous/next date offsets remain unchanged, and the week buttons use localized screen-reader labels. Refreshed asset versions and PWA cache for reliable update delivery.


## Kawaii plushie design refresh (v51)

- The original Mellow app now uses a pastel kawaii theme with lavender, strawberry-pink, cream, gentle mint, pill controls, satin-like surfaces and subtle decoration.
- \`kawaii-ui.css\` loads **after** \`apple-ui.css\`, keeping the layout and accessibility fixes while changing the visual presentation throughout Today, Tasks, Habits, Settings, date search and editors.
- Five transparent original **PNG** sticker assets are in \`assets/\`: \`kawaii-bunny.png\`, \`kawaii-bear.png\`, \`kawaii-bow.png\`, \`kawaii-flower.png\`, and \`kawaii-ribbon.png\`. Decorative stickers use CSS pseudo-elements with \`pointer-events:none\` and do not interfere with tapping, form input, or dragging.
- Responsive mobile and Hebrew RTL layout is supported. Dark mode, reduced-motion, increased contrast and forced-colors accommodations remain available.
- The five sticker files are cached for offline use by the PWA, versioned with the app shell (v51).

The stickers are original software-generated illustrations, not photographs of manufactured plush toys. This is a visual makeover only: persisted task, calendar, routine, AI and subtasks data are unchanged.


### Higher-detail transparent kawaii stickers (v52)

Replaced all five decorative PNGs in place with newly drawn, higher-resolution (224×224) transparent illustrations. The bunny and bear now use layered shading, fur-fiber texture, embroidered facial features, sewn seams and dimensional fabric bows; the standalone bow and ribbon show satin folds and reflected highlights; and the flower features detailed layered petals, botanical leaves and centers. These are original textured **illustrations**, not actual plush-toy photographs.

Decorative placements are slightly larger where space permits and remain small at iPhone widths. No interactive control has a sticker overlay; no task, calendar, AI, storage or DnD logic was changed. Asset query versions and service worker cache were bumped to v52.

### Three-column calendar and habits release (v53)

- Today, Calendar, and Habits now share a responsive planner layout: compact month navigation, the active day view, and recurring rituals on desktop; mobile switches those panes with large tab controls.
- The month calendar supports real date navigation and Hebrew RTL semantics. It previews local tasks in each date and shows local tasks plus loaded Google Calendar events in the selected-day agenda.
- Habits support create, edit, delete, weekday recurrence, daily completion, seven-day progress, local persistence, import/export, and additive backwards-compatible `habits` / `habitLog` fields in the existing version-1 data schema.
- Decorative artwork was replaced with original high-detail transparent PNG renderings: plush bunny and teddy, satin bow and ribbon, flowers, and a cozy books/cup/candle/cat-lamp still life. Functional Lucide SVG icons remain for accessible controls.
- The app shell and offline cache were refreshed to v53. Existing tasks, routines, Google Calendar links, drag-and-drop, AI settings, and older version-1 backups remain supported.
- v54 corrects the mobile Habits pane mapping so the rituals tab opens the editable habit list, while preserving the desktop three-column order.

### Photorealistic mockup-fidelity dashboard (v55)

- Rebuilt Today as a close functional interpretation of the supplied blush-pastel three-column mockup: a decorated left navigation rail, central next-task/timeline area, and a right calendar, task-progress, habits, and cozy-scene rail.
- Added original high-detail raster artwork for the peeking teddy, floral tea still life, cherry branch, bunny logo, and cat-lamp/books scene. Decorative art uses PNG; functional controls keep accessible Lucide icons.
- Removed Routines from top-level navigation. Saved routines now live inside Tasks, and every main add-task control opens a chooser for a task, reusable routine, or Google Calendar event.
- Mobile uses a six-item safe-area-aware bottom navigation plus three large Today-pane tabs. The 390px iPhone and 412px Android breakpoints preserve touch targets, RTL order, scrolling, and modal containment.
- Existing version-1 local data remains compatible. Tasks, habits, routines, Google Calendar links, AI/BYOK settings, backups, drag-and-drop, and offline support continue to use the existing storage model.
- The PWA shell and decorative assets are cached as `mellow-offline-v55`.

### Date-led navigation and embedded creation tools (v56)

- Today now places the Day sections / Timeline switch directly below the next-task hero. The teddy peeks over that hero beside a clickable weekday/date, with the cherry blossom branch above it.
- Selecting the weekday or date opens the existing functional month spread. Calendar is no longer a top-level page; Google Calendar events and task syncing remain available inside Today, add-event, search, and Settings flows.
- Tasks now uses the same decorated hero language as Today and no longer repeats a broken TODO title. Small steps and Routines are collapsible sections inside the task editor, and a saved routine can fill a new task's title, time, duration, emoji, and steps.
- Habits no longer shows Month overview. Its clickable weekday/date opens the month spread, the cozy cat/books/flowers image has a softer 48px crop, and the new-habit form includes an inline AI/offline suggestion tool.
- AI & Writing is no longer a separate navigation page. Task breakdown and habit generation live directly in their creation forms; provider/key configuration remains in Settings. The separate Habit data settings card was removed.
- The PWA shell is cached as `mellow-offline-v56`; existing tasks, routines, habits, AI settings, Google links, and backups remain schema-compatible.

### Clearer headers and navigation art (v57)

- Today uses a static weekday heading on desktop because the month spread is already visible there; mobile keeps the tappable weekday/date month picker, and the redundant Today button is gone.
- The sidebar bunny is smaller and reserved below navigation, the logo lockup is tighter, and the extra bow sticker was removed.
- A consistent teddy peeks over the page-header card on Today, Tasks, Habits and Settings. Task empty states now use the plush bunny instead of the leaf icon.
- The PWA cache is `mellow-offline-v57`.

### Today header alignment polish (v59)

- The teddy is anchored to and peeks over the next-task card instead of floating above the weekday.
- The weekday/date has no translucent chip; the cherry branch sits in its own space directly above it.
- Next-task text starts farther to the right so the tea/books/candle artwork cannot cover it.
- The PWA cache is `mellow-offline-v59`.

### Language-aware artwork layout (v60)

- The mobile Today view now opens directly to the Day plan without the Day plan / Daily rituals switcher.
- The Today teddy sits at weekday level while peeking over the next-task card: right in English and left in Hebrew.
- Horizontal artwork-and-copy compositions reverse with the interface direction, including the next-task and Tasks headers.
- The PWA cache is `mellow-offline-v60`.

### Notion-style database workspace (v66)

- Reframed Mellow as a quiet Notion-inspired workspace: a flat white/gray canvas, thin dividers, document headings, database-like task rows, restrained blue accents, and compact utility panels.
- Removed the proposed global Share/Search/Favorite toolbar. The interface keeps only contextual actions such as New task, New habit, month navigation, and row controls.
- Desktop retains the functional three-part planner composition while Hebrew and English reverse the sidebar and content direction correctly. Mobile keeps a four-item safe-area bottom navigation and the full day plan at 390px-class widths.
- Today, Tasks, Habits, Settings, task/event creation, collapsible Small steps and Routines, the month dialog, Google Calendar, AI helpers, drag-and-drop, local persistence, and version-1 backup compatibility remain intact.
- Decorative plush/card treatments were removed in this mode; the small bunny mark was still present in v66 and is removed by the v67 follow-up below. The PWA cache was `mellow-offline-v66`.

### Rabbit-free header and persistent next-task card (v67)

- Removed visible rabbit artwork from the website while retaining the Mellow wordmark and accessible functional icons.
- Rebuilt the New task and New habit header actions as polished, single-line 44px buttons with consistent icon spacing, hover, and keyboard focus states.
- Moved the live Until your next task card into the shared Today layout so it remains visible in both Day sections and Timeline.
- The PWA cache is `mellow-offline-v67`.

### Matching add-action placement (v70)

- Tasks and Habits now use the same shared responsive 1080px title row, placing their polished add action at the opposite edge from the page title in both RTL and LTR.
- The PWA cache is `mellow-offline-v70`.
