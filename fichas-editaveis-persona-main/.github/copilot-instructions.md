# Copilot Instructions for AI Coding Agents

## Project Overview
Browser-based character sheet for Persona tabletop RPGs. Single-page, vanilla JavaScript (`app.js`), HTML (`index.html`), and CSS (`styles.css`). No frameworks or build step. Recent UX additions: toast notifications (no `alert` usage), required field indicators (`*`), inline validation highlights, auto-resize textareas, spell row reordering, HP/PM current fields, and mobile-friendly touch targets.

## Architecture & Data Flow
- **Tabs/Views:** Tabs (Geral, Persona, Equipamentos, Magias, Vínculos, Anotações) toggle matching `.view` divs.
- **Character Data:** Inputs/selects are referenced via the `ids` map in `app.js`; state is held in DOM and persisted via `localStorage` snapshot/import/export.
- **Arcana & Affinities:** Dynamically populated; do not hardcode options in HTML. See arrays/builders in `app.js`.
- **Spell Table:** Rows support reordering via ↑/↓ buttons (`moveSpellRow` keeps snapshot order aligned).
- **HP/PM:** Includes current HP/PM fields with validation against max values.
- **PDF/PNG Export:** Uses `pdf-lib` and `html2canvas` via CDN. Calls are direct DOM interactions, not modules.

## Developer Workflows
- **No Build Step:** Runs directly in browser; no npm/bundler/tests.
- **Debugging:** Use DevTools; no source maps/transpile.
- **Live Editing:** Reload page to see changes.
- **Notifications:** Use `showToast(message, type, duration)` (types: `success`, `error`, `info`). Avoid `alert`.

## Project-Specific Patterns
- **DOM Shortcuts:** `$` / `$$` for `querySelector` / `querySelectorAll`.
- **ID Naming:** IDs match sheet fields (e.g., `CharName`, `PerArcana`). Update `ids` when adding fields.
- **Dynamic Selects:** Build arcana/affinity options in JS only; no hardcoded HTML options.
- **Validation:** Required fields marked with `field-required-indicator` (`*`). Use `input-error` class for inline highlight; messaging via `showToast`.
- **Localization:** Keep Brazilian Portuguese for UI/code strings.
- **Textareas:** Auto-resize logic present; keep `resize: none` and rely on JS expansion.

## External Dependencies
- **pdf-lib** and **html2canvas** via CDN. Do not add new dependencies unless essential.

## Example Patterns
- New tab: add tab entry and matching `.view` in `index.html`; wire tab logic in `app.js`.
- New field: add input/select in `index.html`, update `ids` in `app.js`, include in snapshot/import/export if needed.
- New validation: mark required with indicator, add `input-error` handling, surface feedback with `showToast`.

## Key Files
- `index.html`: Structure, tabs, views, required indicators.
- `app.js`: Logic, DOM wiring, snapshots, toasts, validation, spell reorder.
- `styles.css`: Theme, transitions, toasts, validation states, mobile touch tweaks.

---
If any section is unclear or missing, please specify what needs improvement or additional detail.