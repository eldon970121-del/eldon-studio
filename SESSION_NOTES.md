# Eldon Studio Website Session Notes

Last updated: 2026-03-29
Project path: `/Users/liuchenjun/eldon-studio-site`
Primary app file: `/Users/liuchenjun/eldon-studio-site/src/App.jsx`
Preview URL: `http://127.0.0.1:5175/`

## What This Project Is

This project is the standalone photographer portfolio website for **Eldon Studio**.

It is currently a single-page React app with one large main file:

- `src/App.jsx`

The site is already beyond mockup stage. It contains real local browser-side persistence and real local image upload using browser file APIs.

## Current Feature Status

Implemented and working:

- Homepage hero / story / archive / booking / footer
- Strict Chinese / English language switch
- Admin mode toggle
- Create portfolio flow
- Edit portfolio flow
- Photographer profile editing
- Portfolio detail page
- Lightbox preview
- Local image upload with browser `FileReader` / `File API`
- Cover image selection
- IndexedDB persistence with localStorage fallback
- Basic image protection:
  - prevent right-click on images
  - prevent dragstart on images
- Admin-only JSON backup export / restore for local data

Recently completed in the latest session:

- Added admin backup panel for export / restore of local website data
- Added backup payload validation using type + version checks
- Added bilingual backup UI copy
- Removed the top-left numeric badges from story cards and portfolio cards

## Verified Status

Verified on 2026-03-29:

- `npm run build` passes
- local site responds with `HTTP 200` on `http://127.0.0.1:5175/`
- the app still preserves:
  - bilingual behavior
  - admin mode
  - local upload flow
  - local persistence

## Local Preview

Start dev server with:

```bash
cd /Users/liuchenjun/eldon-studio-site
npm run dev -- --host 127.0.0.1 --port 5175
```

Build check:

```bash
cd /Users/liuchenjun/eldon-studio-site
npm run build
```

Inspect the dev server port:

```bash
lsof -nP -iTCP:5175 -sTCP:LISTEN
curl -I -s http://127.0.0.1:5175
```

## Important Architecture Notes

### App structure

This project is still centered in one file:

- `src/App.jsx`

Key sections inside it:

- translation and localized defaults
- storage helpers
- `LanguageToggle`
- `AdminDataPanel`
- `HeroSection`
- `StorySection`
- `PortfolioMasonry`
- `PortfolioEditorModal`
- `ProfileEditorModal`
- `StagingUploadArea`
- `PortfolioLightbox`
- `DetailView`
- `App`

### Bilingual model

The UI uses a strict locale split:

- `en`: English UI
- `zh`: Chinese UI

Key translation/data helpers:

- `siteCopy`
- `getLocalizedText(...)`
- `toLocalizedField(...)`

Localized content is stored as bilingual objects where applicable:

- `title: { en, zh }`
- `description: { en, zh }`
- `name: { en, zh }`
- `role: { en, zh }`
- `intro: { en, zh }`

Locale persistence:

- localStorage key: `eldon-locale`

### Local persistence

Persistence is browser-side only.

Database constants:

- IndexedDB database: `eldon-studio-site`
- object store: `persistent-state`

Stored keys:

- portfolios IndexedDB key: `eldon-portfolios`
- portfolios localStorage fallback: `eldon-portfolios-fallback`
- profile IndexedDB key: `eldon-profile`
- profile localStorage fallback: `eldon-profile-fallback`
- locale localStorage key: `eldon-locale`

Important behavior:

- the app attempts IndexedDB first
- if IndexedDB is unavailable, it falls back to localStorage
- uploaded images are stored as data URLs
- cover images are normalized so each portfolio always has a cover when possible

### Backup export / restore

Backup support was added in the latest session.

Relevant code:

- backup constants near the top of `src/App.jsx`
- `createBackupPayload(...)`
- `normalizeBackupPayload(...)`
- `AdminDataPanel`
- `handleExportBackup()`
- `handleRestoreBackup()`

Backup format:

- `type: "eldon-studio-backup"`
- `version: 1`
- `exportedAt`
- `locale`
- `profile`
- `portfolios`

What backups include:

- bilingual portfolio data
- photographer profile data
- local image data stored in browser persistence
- cover selection state

Restore behavior:

- restore is admin-only
- restore requires selecting a JSON file
- payload is validated by backup type and version
- restore prompts for confirmation before replacing current local data
- restore also applies the saved locale

### UI details worth preserving

Please preserve these existing behaviors:

- admin-only creation / editing / deletion flows
- staged local upload flow before confirming
- profile avatar local upload
- lightbox navigation
- language persistence across reloads
- right-click / drag blocking on images
- recently removed top-left numeric badges should stay removed unless intentionally redesigned

## Important Files

- Main app:
  - `/Users/liuchenjun/eldon-studio-site/src/App.jsx`
- Session handoff:
  - `/Users/liuchenjun/eldon-studio-site/SESSION_NOTES.md`
- Package config:
  - `/Users/liuchenjun/eldon-studio-site/package.json`

## Cautions For Future AI Tools

- Do not casually rewrite `src/App.jsx` from scratch.
- The file already contains many intertwined behaviors:
  - bilingual data normalization
  - admin create/edit/delete flows
  - profile editing
  - local image persistence
  - backup export / restore
  - lightbox behavior
  - language persistence
- Any refactor should preserve the exact current data model and browser persistence behavior.
- Be careful not to break admin mode while changing visual layout.
- Be careful not to break data URL storage while changing upload logic.
- This project directory is currently **not a git repository**, so do not assume git-based workflows are available here.

## Recommended Next Tasks

Good next steps:

- split `App.jsx` into smaller components without breaking persistence
- refine typography separately for Chinese and English layouts
- add a visible watermark / copyright strategy
- add backup import status polish and maybe backup metadata preview
- connect booking flow more deeply to Lumina
- add manual export/import coverage notes or test checklist

## Good Continuation Prompt For AI Tools

Use this directly in the next session:

```text
继续 Eldon Studio 网站项目，路径是 /Users/liuchenjun/eldon-studio-site。
先读取 /Users/liuchenjun/eldon-studio-site/SESSION_NOTES.md，再检查 5175 端口与当前站点状态。
在不破坏现有中英文双语、管理模式、本地上传和本地备份功能的前提下继续开发。
```
