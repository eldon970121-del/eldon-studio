# PROJECT_STATE.md — Eldon Studio Site
> Machine-readable snapshot for AI assistants. Updated: 2026-04-04.
> Always read this file before starting any task. Update it after completing any functional sprint.

---

## 1. Business Overview

**Eldon Studio** — A cinematic portrait photographer's official website.
- Primary language: bilingual EN / ZH (locale toggle)
- Visual identity: dark, cinematic, minimal — no bright palettes
- Deployed on **Vercel** (`vercel.json` configured)

---

## 2. Tech Stack


| Layer | Choice |
|---|---|
| Framework | Vite + React 18 |
| Styling | Tailwind CSS + CSS custom properties (`--site-*` tokens) |
| Animation | Framer Motion (`motion`, `useMotionValue`, `useSpring`) |
| Persistence | IndexedDB (`usePersistence` hook) + Supabase Storage (image upload) |
| Auth | Supabase Auth; admin matched by `VITE_ADMIN_EMAIL` env var |
| Routing | No router — `view` state in `App.jsx`: `'home' | 'lab' | 'booking'` |

---

## 3. Environment Variables (`.env.local`)

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAIL
VITE_LUMINA_URL        # default: http://127.0.0.1:5173
```

---

## 4. View / Routing Model

`App.jsx` manages a single `view` state (no React Router):

| `view` value | What renders |
|---|---|
| `'home'` | Full single-page site (HeroCover → HeroSection → PracticeSection → StorySection → PortfolioMasonry → BookingProjectsSection → Footer) |
| `'lab'` | `LuminaLabPage` (replaces entire body) |
| `'booking'` | `BookingProjectsSection` focused view |
| `selectedPortfolioId !== null` | `DetailView` overlay |

---

## 5. Component Map

### Navigation — `src/components/navigation/SiteNavigation.jsx`

**`ImmersiveNavbar`** (fixed top pill, `z-[110]`)
- Props: `profile, copy, locale, isSolid, isLabView, isBookingView, isAdmin, isBookingAdminMode, userEmail, onToggleLocale, onToggleBookingAdminMode, onOpenLab, onOpenBooking, onOpenAdmin, onGoHome, onOpenAuth, onSignOut`
- Desktop nav links (in order), driven by `copy.hero.*` keys (bilingual):
  1. **Portfolio** (`navPortfolio`) → `href="#gallery"`, calls `onGoHome()` if in lab/booking view
  2. **Approach** (`navApproach`) → `href="#practice"`
  3. **Commission** (`navCommission`) → calls `onOpenBooking()` — opens pricing/enquiry page
  4. **Studio** (`navStudio`) → `href="#story"`
- Note: "Client Area" label has been removed; `Commission` is the enquiry entry; client proofing portal is via `?slug=xxx`
- Note: LAB (`onOpenLab`) is NOT in the top nav; accessible via other entry points
- Right slot: language toggle + admin button (if admin) + user badge / sign-in button

**`DetailUtilityBar`** (fixed top-right, `z-[120]`, only shown in detail / booking views)
- Language toggle + booking admin mode toggle + user email badge + sign-out

### Home Page Sections (all in `src/components/sections/`)

| Component | `id` anchor | Purpose |
|---|---|---|
| `HeroCover` | `#top` | Full-screen cinematic hero with film-strip carousel |
| `HeroSection` | — | Text intro / tagline |
| `PracticeSection` | `#practice` | Approach / services table rows |
| `StorySection` | `#story` | About / narrative copy |
| `PortfolioMasonry` | `#gallery` | Portfolio grid with narrative filter bar |
| `BookingProjectsSection` | — | Booking packages |
| `Footer` | — | Footer |

### Portfolio Gallery — `src/components/sections/PortfolioMasonry.jsx`

**Props:** `portfolios, isAdmin, onAdd, onOpen, onEdit, onDelete, copy, locale`

**Narrative Filter Bar** (added 2026-04-04):
- State: `activeNarrative` ∈ `["ALL", "STUDIO", "EXPLORATION", "ARCHIVE"]`
- Filtered array: `filtered = activeNarrative === "ALL" ? portfolios : portfolios.filter(p => p.narrative === activeNarrative)`
- UI: horizontal flex row, `justify-center`, `mb-16`, buttons styled `text-[10px] uppercase tracking-[0.2em]`
- Active style: `border-b border-white pb-1 text-white` | Inactive: `text-gray-500 hover:text-white`

**Portfolio data shape:**
```js
{
  id: Number,
  narrative: "STUDIO" | "EXPLORATION" | "ARCHIVE",  // NEW field
  title: { en: string, zh: string },
  description: { en: string, zh: string },
  images: [{ id, url, isCover }]
}
```

### Initial Portfolio Data (`src/App.jsx` — `initialPortfolios`)

| id | Title (EN) | Narrative |
|---|---|---|
| 1 | Male Portraiture | STUDIO |
| 2 | Emotional Narratives | STUDIO |
| 3 | Light & Shadow | STUDIO |
| 4 | Urban Stillness | EXPLORATION |
| 5 | Quiet Interiors | STUDIO |
| 6 | Midnight Silence | EXPLORATION |

> Note: No ARCHIVE entries exist in seed data yet. Admin can add via CRUD.

### Detail View — `src/components/detail/DetailView.jsx`
- Fullscreen overlay triggered by `selectedPortfolioId !== null`
- Contains Lightbox for individual image browsing
- Admin CRUD (edit / delete portfolio, manage images)

### Lab Page — `src/components/lab/LuminaLabPage.jsx`
- Entry point for Lumina Lab aesthetic analysis tool
- Two modes toggled at top: `single` | `series`
- Scoped under `#lumina-lab-app` (CSS isolation)
- Analysis data flows through `src/services/aestheticAnalysis.js`
- See dedicated Lab section below for full API spec

---

## 6. Lab Page — Lumina Lab (`view = 'lab'`)

### Modes
- **Single mode** (`mode: 'single'`): phases `upload → analyzing → result`
- **Series mode** (`mode: 'series'`): phases `upload → analyzing → result`; 2–12 frames

### Analysis Service (`src/services/aestheticAnalysis.js`)
- `analyzeAestheticImage(file, locale)` — pure client-side, no API call
- `buildSeriesNarrative(seriesResults[], locale)` — aggregates series into narrative

### Analysis Data Shape
```
aesthetic_dashboard
  .emotional_resonance.{ melancholy_isolation, power_grit, mystery_unknown, intimacy_warmth }
  .color_analysis.{ dominant_tone, visual_weight_breakdown, color_psychology }
  .lighting_deconstruction.{ lighting_type, light_ratio_evaluation, spatial_depth }
  .actionable_advice: string[]
  .social_media_copy: string
  .platform_recommendations.{ xiaohongshu, douyin }.{ strategy, titles[], caption }
```

### Maturity Score
`mystery*0.38 + melancholy*0.32 + power*0.18 + intimacy*0.12`
Calculated by `calcMaturityScore(analysis)`.

### Series Coherence Score
`Math.round(Math.max(0, Math.min(100, 100 - (std/30)*100)))` where std = std dev of per-frame Maturity Scores. Displayed with purple gauge (`#c180ff`).

### Lab Layout (grid `xl:grid-cols-12`)
- Left col (`col-span-8`): `flex flex-col`; image fills `flex-1 min-h-0` with `object-cover`
- Right col (`col-span-4`): natural height, sets row height

### Lab CSS Isolation
- All custom CSS scoped to `#lumina-lab-app`
- Classes: `.glass-panel`, `.glass-noir`, `.glass-edge`
- Font tokens: `font-lab-headline`, `font-lab-body`, `font-lab-label`
- Fonts loaded in `index.html`: Noto Serif, Manrope, Space Grotesk, Material Symbols

---

## 7. Admin System

- Auth: `useAdminAuth` hook + Supabase Auth
- Admin detected: `userEmail.toLowerCase() === VITE_ADMIN_EMAIL`
- Admin features: portfolio CRUD, image upload to Supabase Storage, profile editor, booking admin mode
- Admin components: `AdminDataPanel`, `PortfolioEditorModal`, `ProfileEditorModal`, `ConfirmDialog`
- PAM (Project Admin Manager): `src/pages/AdminDashboardPage.jsx`, `src/pages/ProofManagerPage.jsx`

---

## 8. Client Portal

- `src/pages/ClientPortalPage.jsx` + `src/pages/ClientProofingPage.jsx`
- Mock data: `src/pages/mockClientData.js`
- PAM service: `src/services/pamService.js`

---

## 9. Persistence Layer

- `usePersistence` hook: wraps IndexedDB for portfolios + profile
- Supabase Storage: image upload/delete via `src/services/cloudStorage.js`
- `processPortfolioImage`: `src/utils/processPortfolioImage.js`
- **Important:** `narrative` field is preserved through the normalization function in `App.jsx` (~line 1168)

---

## 10. Styling System

CSS custom properties (defined in `src/index.css`):
```
--site-bg-deep      dark base background
--site-text         primary text (near-white on dark)
--site-muted        subdued text
--site-muted-strong slightly less subdued
--site-accent       brand accent color (teal-ish)
--site-border       subtle border
--site-border-soft  even more subtle
--site-border-strong hover-state border
```

Tailwind config extends:
- `font-label`, `font-lab-headline`, `font-lab-body`, `font-lab-label`
- `shadow-soft`
- Custom breakpoint utilities

Global classes (utility-style):
- `section-space`: vertical section padding
- `section-kicker`: small uppercase eyebrow label
- `editorial-title`: large heading treatment
- `editorial-copy`: body copy treatment
- `micro-button`: interactive button reset

---

## 11. Known Issues / TODO

- [ ] JS bundle ~772kB (Vite warns >500kB) — needs dynamic import splitting
- [ ] No ARCHIVE-narrative portfolios in seed data — admin must add
- [ ] Lab analysis results are not persisted (reset on refresh — intentional)
- [ ] LAB entry point removed from top nav — needs an alternative discoverable entry (e.g., hero CTA or footer)

---

## 12. File Tree (key files only)

```
src/
├── App.jsx                          # Root: state, data, view routing
├── main.jsx                         # Vite entry
├── index.css                        # Global styles + CSS tokens
├── components/
│   ├── navigation/SiteNavigation.jsx  # ImmersiveNavbar + DetailUtilityBar
│   ├── sections/
│   │   ├── HeroCover.jsx
│   │   ├── HeroSection.jsx
│   │   ├── PracticeSection.jsx
│   │   ├── StorySection.jsx
│   │   ├── PortfolioMasonry.jsx      # Gallery grid + narrative filter
│   │   ├── BookingProjectsSection.jsx
│   │   └── AestheticLabSection.jsx  # Removed from render, file kept
│   ├── detail/DetailView.jsx
│   ├── lab/LuminaLabPage.jsx
│   ├── admin/AdminDataPanel.jsx
│   ├── modals/                      # PortfolioEditorModal, ProfileEditorModal, ConfirmDialog
│   ├── auth/AuthModal.jsx
│   ├── pam/                         # PAM UI components
│   ├── layout/Footer.jsx
│   └── ui/                          # RevealBlock, siteControls (buttons, icons, toggles)
├── pages/
│   ├── AdminDashboardPage.jsx
│   ├── ProofManagerPage.jsx
│   ├── ClientPortalPage.jsx
│   ├── ClientProofingPage.jsx
│   └── mockClientData.js
├── hooks/
│   ├── usePersistence.js
│   ├── useAdminAuth.js
│   ├── useReveal.js
│   └── useLocalStorageState.js
├── services/
│   ├── aestheticAnalysis.js
│   ├── cloudStorage.js
│   ├── booking.js
│   └── pamService.js
├── lib/
│   ├── supabaseClient.js
│   └── bookingProjects.js
└── utils/
    ├── siteHelpers.js               # getLocalizedText, getCoverImage, toLocalizedField
    └── processPortfolioImage.js
```
