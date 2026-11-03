# Design QA

- Source visual: `/var/folders/dm/1zj9mnz53yx2kh46_c7k4xtw0000gn/T/codex-clipboard-7e12381a-ab36-4704-8b2a-6926b49fbcde.png`
- Latest correction reference: `/var/folders/dm/1zj9mnz53yx2kh46_c7k4xtw0000gn/T/TemporaryItems/NSIRD_screencaptureui_lkoIBu/Screenshot 2026-11-03 at 7.30.37.png`
- Implementation checked at: `http://127.0.0.1:4175/`
- Desktop comparison viewport: 1536 × 1024
- Mobile comparison viewports: 390 × 844 and 412 × 915

## Visual comparison

- Pass: blush/cream palette, soft glass cards, rounded radii, lavender actions, Hebrew RTL typography, and the left/center/right desktop composition match the supplied dashboard closely.
- Pass: the sidebar uses a tighter bunny-mark/Mellow lockup, four-item navigation, and a smaller plush bunny reserved below the controls; the redundant bow stickers are absent.
- Pass: Today uses a static weekday/date without a translucent chip below the cherry branch on desktop, with no redundant Today button. The teddy now rests on the top edge of the next-task card, whose text is offset far enough right to stay clear of the tea/books/candle artwork.
- Pass: the right rail contains a navigable month, live task progress, interactive habit tiles, and the cat-lamp/books/hydrangea scene.
- Pass: decorative placements use physical left/right positioning so RTL text does not mirror the teddy, tea still life, bow, or logo incorrectly.
- Pass: mobile reduces Today to two large pane tabs, retains four safe-area-aware navigation items, has no horizontal overflow at 390px or 412px, and keeps dialogs and timeline content within the viewport.
- Pass: the same teddy peeks above the header card on Today, Tasks, Habits and Settings. Tasks uses the plush bunny, centered with the text, for its empty state; Habits keeps its 48px image crop radius.

## Functional comparison

- Pass: Hebrew previous/next month controls moved November 2026 → December 2026 → November 2026.
- Pass: the Today weekday/date is intentionally non-interactive on desktop, where the month spread is already visible. At 390px it remains tappable and opens the month dialog; the Habits date continues to open the same dialog.
- Pass: Calendar and AI & Writing are absent from desktop and mobile navigation while Google Calendar and AI provider settings remain available.
- Pass: Small steps and Routines are collapsible inside the task editor; applying the sample routine filled title, emoji, 08:30–09:05 time, 35-minute duration, and three editable steps.
- Pass: the habit form's embedded AI/offline action converted “לשתות יותר מים” into a reviewable water habit without saving it automatically.
- Pass: Settings no longer contains the Habit data card.
- Pass: browser console contained no errors or warnings during desktop and mobile flows.
- Pass: all 57 service-worker core files exist and the cache version is `mellow-offline-v60`.

## Resolved findings

### v60 language-aware artwork and mobile Today

- Pass: Today at 390 × 844 contains no Day plan / Daily rituals tab switcher and the Day plan remains visible.
- Pass: the Today teddy and tea still life swap sides between English LTR and Hebrew RTL without covering the weekday or next-task copy.
- Pass: the Tasks header teddy and flower branch swap to the opposite side of the heading in both languages.
- Pass: desktop Today at 1280 × 900 keeps the month calendar visible while the teddy rests on the next-task card at weekday level.
- Pass: browser console contained no errors or warnings throughout the English and Hebrew desktop/mobile checks.

- P1 resolved: decorative images initially mirrored with RTL and placed the teddy/tea opposite the source visual; switched those assets to physical positioning.
- P2 resolved: the mobile calendar Today control measured 40px high, and compact task icon/check controls had narrow hit areas; raised the calendar control to 44px and expanded task hit areas without enlarging their visual glyphs.
- P2 accepted: dynamic task and habit counts intentionally reflect the user's real data instead of copying the source visual's example values.
- P3 accepted: the standalone AI journal implementation remains in the source and backups for backwards compatibility, but it is no longer exposed as a page.
- P2 resolved: the task empty state briefly rendered both its new bunny image and an older decorative pseudo-element; the old sticker was removed and the single bunny/text pair was centered.

final result: passed
