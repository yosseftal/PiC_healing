# Wave 12 manual release evidence template

Use only after tickets06/07/08 are implemented and a concrete current preview is available.
Source: approved09 AC-11 requires physical mobile keyboard/visual viewport, safe-area, zoom, and Hebrew screen-reader checks.
Chromium emulation does not prove these results. Do not include credentials or personal therapeutic data in this record.

## Record each result

- Build/commit and preview URL:
- Device, OS, browser, screen-reader name/version:
- Locale(s), zoom/font scale, orientation:
- Check performed, observed result, pass/fail or unavailable:
- Any reproduction details for a failure:

## Checks

1. Physical mobile keyboard: name/symptom fields and Gate login/signup forms remain reachable with keyboard open.
   Focused field, status, and submit/reset controls are reachable through internal scrolling; main viewport stays bounded.
2. Physical safe-area/orientation: Sheet/Gate close and primary controls are not obscured by notch/home indicator,
   browser chrome, or orientation changes. Record the actual device and what was checked.
3. Browser/text zoom: check200% zoom/font enlargement in Hebrew and English. Labels/messages remain readable,
   actions reachable, and long content scrolls within its intended region without losing the active inquiry.
4. Hebrew screen reader: navigate main inquiry, blind-rating reveal, Player/Terminal, Sheet reset, and account Gate.
   Verify meaningful labels, order, current-language announcements, hidden prior ratings, one modal focus owner,
   keeping work focused by default, cancellation/restoration, field-linked validation, and one truthful success status.
5. Repeat relevant reset/Gate interactions after changing locale while the surface is open. Preserve typed input,
   current session, pending Finish kind, and focus. Dismissal must preserve work; discard must be explicit.

Automated08/09 coverage and remote Auth/RLS evidence are separate. Missing manual checks remain unverified.
