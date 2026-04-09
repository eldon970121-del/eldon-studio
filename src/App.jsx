import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { usePersistence } from "./hooks/usePersistence";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import {
  getLocalizedText,
  toLocalizedField,
  isEphemeralImageUrl,
} from "./utils/siteHelpers";
import { deleteImagesFromCloud, getStoragePathFromUrl } from "./services/cloudStorage";
import { AuthModal } from "./components/auth/AuthModal";
import { DetailUtilityBar, ImmersiveNavbar } from "./components/navigation/SiteNavigation";
import { HeroCover } from "./components/sections/HeroCover";
import { HeroSection } from "./components/sections/HeroSection";
import { PracticeSection } from "./components/sections/PracticeSection";
import { StorySection } from "./components/sections/StorySection";
import { PortfolioMasonry } from "./components/sections/PortfolioMasonry";
import { BookingProjectsSection } from "./components/sections/BookingProjectsSection";
import { LuminaLab } from "./components/sections/LuminaLab";
import { Footer } from "./components/layout/Footer";
import { PortfolioEditorModal } from "./components/modals/PortfolioEditorModal";
import { ProfileEditorModal } from "./components/modals/ProfileEditorModal";
import { ConfirmDialog } from "./components/modals/ConfirmDialog";
import LuminaUploadCenter from "./components/admin/LuminaUploadCenter";

const LUMINA_URL = import.meta.env.VITE_LUMINA_URL || "http://127.0.0.1:5173";
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();
const DetailView = React.lazy(() =>
  import("./components/detail/DetailView").then((m) => ({ default: m.DetailView })),
);
const LuminaLabPage = React.lazy(() =>
  import("./components/lab/LuminaLabPage").then((m) => ({ default: m.LuminaLabPage })),
);
const LuminaReport = React.lazy(() =>
  import("./components/lab/LuminaReport").then((m) => ({ default: m.LuminaReport })),
);
const AdminDashboardPage = React.lazy(() =>
  import("./pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })),
);
const ClientPortalPage = React.lazy(() =>
  import("./pages/ClientPortalPage").then((m) => ({ default: m.ClientPortalPage })),
);

const fallbackPortfolioContent = {
  title: {
    en: "Untitled Portfolio",
    zh: "未命名摄影集",
  },
  description: {
    en: "A newly added body of work waiting for a fuller note.",
    zh: "一组刚建立的作品，等待更完整的文字说明。",
  },
};

const initialProfile = {
  name: {
    en: "Eldon Studio",
    zh: "Eldon Studio",
  },
  role: {
    en: "Portrait & Editorial Photographer",
    zh: "人像与编辑摄影师",
  },
  email: "hello@eldonstudio.com",
  intro: {
    en: "Eldon Studio approaches portrait commissions as controlled visual systems: slower pacing, disciplined light, and space that keeps the subject exact.",
    zh: "Eldon Studio 将肖像委托视为一套被精准控制的视觉系统：更慢的节奏、克制的光线，以及让人物保持明确存在感的空间。",
  },
  avatarUrl:
    "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80",
};

const PORTFOLIO_API = import.meta.env.VITE_LUMINA_URL
  ? `${import.meta.env.VITE_LUMINA_URL}/api/portfolios`
  : 'http://localhost:3000/api/portfolios';

// ── 占位符：API 未返回前显示空列表（hydrate 会立即拉取）──
const initialPortfolios = [];

/* ── 以下为原硬编码占位图数据，已迁移至 Railway MySQL (lumina_portfolios) ──
const _removedInitialPortfolios = [
  {
    id: 1,
    narrative: "STUDIO",
    title: {
      en: "Male Portraiture",
      zh: "男性肖像",
    },
    description: {
      en: "Close portraits shaped by disciplined light, contour, and a steady emotional gravity.",
      zh: "以克制光线、轮廓结构与稳定情绪重力构成的近距离男性肖像。",
    },
    images: [
      {
        id: 101,
        url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 102,
        url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
      {
        id: 103,
        url: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
  {
    id: 2,
    narrative: "STUDIO",
    title: {
      en: "Emotional Narratives",
      zh: "情绪叙事",
    },
    description: {
      en: "Narrative portrait fragments built through posture, breath, and a quieter emotional undercurrent.",
      zh: "通过姿态、呼吸与更内敛的情绪暗流搭建出的叙事性肖像片段。",
    },
    images: [
      {
        id: 201,
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 202,
        url: "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
      {
        id: 203,
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
  {
    id: 3,
    narrative: "STUDIO",
    title: {
      en: "Light & Shadow",
      zh: "光影结构",
    },
    description: {
      en: "Structured contrast, spare composition, and light that lands only where it is necessary.",
      zh: "结构化反差、极简构图，以及只落在必要之处的光线。",
    },
    images: [
      {
        id: 301,
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 302,
        url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
      {
        id: 303,
        url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
  {
    id: 4,
    narrative: "EXPLORATION",
    title: {
      en: "Urban Stillness",
      zh: "城市静场",
    },
    description: {
      en: "The city slowed down into a quieter tension between architecture, silence, and the figure.",
      zh: "当城市被放慢，建筑、静默与人物之间形成更安静的张力。",
    },
    images: [
      {
        id: 401,
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 402,
        url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
      {
        id: 403,
        url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
  {
    id: 5,
    narrative: "STUDIO",
    title: {
      en: "Quiet Interiors",
      zh: "静室叙景",
    },
    description: {
      en: "Rooms treated as emotional structures, not backdrops, allowing atmosphere to hold the frame.",
      zh: "将室内空间视为情绪结构而非背景，使氛围本身承载画面。",
    },
    images: [
      {
        id: 501,
        url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 502,
        url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
      {
        id: 503,
        url: "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
  {
    id: 6,
    narrative: "EXPLORATION",
    title: {
      en: "Midnight Silence",
      zh: "午夜静默",
    },
    description: {
      en: "Lower light, slower frames, and a darker tonal rhythm shaped around restraint.",
      zh: "更低照度、更慢节奏与围绕克制建立的暗部调性。",
    },
    images: [
      {
        id: 601,
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 602,
        url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
      {
        id: 603,
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
  {
    id: 7,
    narrative: "ARCHIVE",
    title: {
      en: "Street Documentary",
      zh: "街头纪实",
    },
    description: {
      en: "A documentary series shot across three cities — unposed, uncurated, and irreversibly honest.",
      zh: "横跨三座城市拍摄的纪实系列——无摆拍、无筛选，带着不可逆的诚实。",
    },
    images: [
      {
        id: 701,
        url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 702,
        url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
  {
    id: 8,
    narrative: "ARCHIVE",
    title: {
      en: "Cultural Fragments",
      zh: "文化碎片",
    },
    description: {
      en: "Multi-image stories from cultural gatherings, performances, and rituals captured over two years.",
      zh: "两年间记录的文化聚会、演出与仪式，以多图叙事呈现。",
    },
    images: [
      {
        id: 801,
        url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=80",
        isCover: true,
      },
      {
        id: 802,
        url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=80",
        isCover: false,
      },
    ],
  },
]; ── */

const practiceRows = [
  {
    label: { en: "Discipline", zh: "拍摄方向" },
    value: { en: "Portrait · Editorial · Campaign", zh: "肖像 · 编辑摄影 · Campaign" },
  },
  {
    label: { en: "Based In", zh: "常驻城市" },
    value: { en: "Shanghai · Tokyo", zh: "上海 · 东京" },
  },
  {
    label: { en: "Commissions", zh: "委托状态" },
    value: { en: "Selected Projects Only", zh: "仅接受精选委托" },
  },
];

const sideProjects = [
  {
    name: "Lumina App",
    description: {
      en: "A photographer workflow system for scheduling, project notes, delivery, review, and call sheet management.",
      zh: "面向摄影师的工作流系统，覆盖排期、项目备注、交付、复盘与通告单管理。",
    },
    href: LUMINA_URL,
  },
  {
    name: "Frame Notes",
    description: {
      en: "A private system for mood references, lighting studies, and fragments collected for long-form portrait series.",
      zh: "用于长期肖像系列的情绪参考、布光研究与片段资料整理系统。",
    },
    href: "#footer",
  },
];

const manifestoData = [
  {
    id: "light",
    num: "01",
    title: { en: "LIGHT", zh: "光" },
    description: {
      en: "Light is treated as a primary medium — shaped, withheld, and precisely directed to construct the three-dimensional depth that separates a portrait from a record.",
      zh: "光是第一介质，而非布景辅助。在我们的工作中，光被塑造、保留与精确投放，以构建让肖像区别于记录影像的立体纵深。",
    },
    bgImage:
      "https://images.unsplash.com/photo-1604079628040-94301bb21b91?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "emotion",
    num: "02",
    title: { en: "PRESENCE", zh: "在场感" },
    description: {
      en: "We read the intervals between directions — the weight of an exhale, the fraction of a second where something unguarded surfaces and the frame becomes true.",
      zh: "我们阅读每一次指令间隙中的沉默——一次呼气的重量，某个戒备松弛的瞬间。正是那一刻，画面变得真实。",
    },
    bgImage:
      "https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "timeless",
    num: "03",
    title: { en: "PERMANENCE", zh: "永续性" },
    description: {
      en: "The work is stripped of trend, transient styling, and anything that dates the image before the session ends. What remains should hold for decades.",
      zh: "我们刻意剥除一切流行滤镜与过渡性造型选择。任何会让作品快速老化的元素都会被排除在外。留存下来的，应当历经数十年而不失其力量。",
    },
    bgImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop",
  },
];

const siteCopy = {
  en: {
    languageToggle: { en: "EN", zh: "中文" },
    admin: {
      mode: "Admin Mode",
      editProfile: "Edit Profile",
      portfolioDetails: "Portfolio details",
      createStatus: "Create",
      editStatus: "Edit",
      clearFiles: "Clear Files",
      createPortfolio: "Create Portfolio",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      processing: "Processing...",
      saving: "Saving...",
      saveProfile: "Save Profile",
      statusLabel: "Status",
      titleLabel: "Title",
      titleEnLabel: "Title · English",
      titleZhLabel: "Title · Chinese",
      descriptionLabel: "Description",
      descriptionEnLabel: "Description · English",
      descriptionZhLabel: "Description · Chinese",
      titlePlaceholderEn: "Male Portraiture",
      titlePlaceholderZh: "男性肖像",
      descriptionPlaceholderEn: "Describe the emotional weight and visual rhythm of this series.",
      descriptionPlaceholderZh: "描述这一组作品的情绪重心、光线结构与叙事节奏。",
      roleEnLabel: "Role · English",
      roleZhLabel: "Role · Chinese",
      nameEnLabel: "Name · English",
      nameZhLabel: "Name · Chinese",
      introEnLabel: "Introduction · English",
      introZhLabel: "Introduction · Chinese",
      namePlaceholderEn: "Eldon Studio",
      namePlaceholderZh: "Eldon Studio",
      rolePlaceholderEn: "Portrait & Editorial Photographer",
      rolePlaceholderZh: "人像与编辑摄影师",
      introPlaceholderEn:
        "Introduce the studio in a controlled, high-end tone for the English site.",
      introPlaceholderZh: "用更克制、专业的语气，介绍摄影师的工作方式与拍摄方向。",
      emailLabel: "Email",
      avatar: "Avatar",
      photographerDetails: "Photographer details",
      profileTitle: "Edit Photographer Profile",
      profileText:
        "Update the homepage identity, contact details, and portrait avatar. English and Chinese copies are edited separately.",
      browseFiles: "Browse Files",
      removeStagedImage: "Remove staged image",
      removeImagePrefix: "Remove",
      cover: "Cover",
      new: "New",
      saved: "Saved",
      waitingForImages: "Waiting for local images",
      localFilesSelected: "local files selected",
      imagesReadyAfterSave: "images ready after save",
      stagingTitle: "Image staging",
      stagingText:
        "Upload local image files now. You can select the cover and keep English and Chinese text versions aligned before confirming.",
      coverSelection: "Cover selection",
      coverSelectionText:
        "Choose which frame should represent the portfolio inside the archive.",
      createModalTitle: "Create Portfolio",
      editModalTitle: "Edit Portfolio",
      createModalText:
        "Build a new archive entry from real local files. The first selected image becomes the cover automatically unless you choose another frame.",
      editModalText:
        "Update both language versions, upload new local frames, and choose which image should represent the series.",
      uploadHint: "Drag local images here, or click to browse",
      uploadHintSecondary: "Upload additional local images for this portfolio",
      createConfirmText:
        "Confirming will create the portfolio, store these local images in browser persistence, and open the new collection immediately.",
      emptyCoverCreate: "Upload at least one local image to choose a cover for the new portfolio.",
      emptyCoverEdit:
        "Create the portfolio first, upload photographs inside it, then return here to select the cover.",
      titleTooLong: "Title must be 90 characters or fewer.",
      selectImageFirst: "Select at least one local image before creating a portfolio.",
      saveFailed: "Saving failed. Try again.",
      uploadFailed: "Image upload failed. Check Supabase storage settings and try again.",
      supabaseConfigMissing:
        "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
      dataTools: "Data Backup",
      dataToolsText:
        "Export the current browser archive as a JSON backup, or restore a previously exported file without leaving admin mode.",
      dataToolsSummary:
        "Backups include bilingual portfolio fields, photographer profile, cover selections, and locally stored image data.",
      exportBackup: "Export Backup",
      selectBackupFile: "Select Backup File",
      restoreBackup: "Restore Backup",
      selectedBackup: "Selected backup",
      noBackupSelected: "No backup file selected yet.",
      backupFileReady: "Backup file selected and ready to restore.",
      backupExported: "Backup download started.",
      backupImported: "Backup restored to this browser.",
      backupInvalid: "This backup file is invalid or unsupported.",
      backupImportFailed: "Backup import failed. Try another file.",
      backupSelectFirst: "Select a backup file before restoring.",
      backupReplaceTitle: "Restore local backup?",
      backupReplaceText:
        "Restoring will replace the current browser portfolios and photographer profile with the selected backup file.",
      untitled: fallbackPortfolioContent.title.en,
      defaultDescription:
        "A newly added sequence shaped by atmosphere, restraint, and portrait rhythm.",
    },
    hero: {
      cinematicDirection: "Cinematic Portrait Direction",
      navPortfolio: "Portfolio",
      navApproach: "Approach",
      navCommission: "Commission",
      navStudio: "Studio",
      navArchive: "Portfolio",
      navAbout: "Studio",
      navBooking: "Commission",
      navLab: "LAB",
      navLumina: "Lumina App",
      scrollExplore: "Scroll to explore",
      adminEntry: "ADM",
      modulesLabel: "Studio Modules",
      modulesHeading: "A quieter system sits behind the archive.",
      modulesText:
        "The website works as a presentation layer, a controlled image archive, and a direct handoff surface for the Lumina workflow.",
      modulesStatsPortfolios: "Series in archive",
      modulesStatsImages: "Frames managed",
      moduleArchiveTitle: "Image Archive",
      moduleArchiveText: "Browser-side uploads, cover selection, lightbox review, and resilient local persistence.",
      moduleLanguageTitle: "Bilingual Control",
      moduleLanguageText: "English and Chinese remain strictly separated in the interface while sharing one normalised data model.",
      moduleLuminaTitle: "Lumina Integration",
      moduleLuminaText: "Commission briefs and project handoffs route directly into the Lumina scheduling system.",
      visualDirection: "2026 · Visual Direction",
      heading:
        "Portraits shaped by restraint, light, and a deliberate emotional register.",
      viewArchive: "View Portfolio",
      openLumina: "Open Lumina",
      studioNote: "Studio",
      studioNoteText:
        "Each commission resolves as a controlled sequence — not as a collection of isolated frames.",
      portraitSystem: "Portrait System",
      creativeStance: "Creative Stance",
      creativeStanceText:
        "Available for private commissions, editorial portraiture, and art-directed identity work. Styling is always secondary to expression.",
      workflow: "Workflow",
      workflowText:
        "Archive management, post-production delivery, and direct handoff into the Lumina scheduling system.",
      studioPreview: "Studio Preview",
      selectedFrame: "Frame",
      emptyTitle: "Upload work to begin building the archive.",
    },
    practice: {
      label: "Approach",
      heading:
        "The visual system stays minimal so the emotional read lands first.",
      principleLabel: "Working principle",
      principleText:
        "Atmosphere is built through subtraction: fewer visual decisions, more intentional emotional signal.",
      lead:
        "Every tonal shift in the frame serves the subject. Space, styling, and architecture are kept restrained so the emotional centre remains exact and unforced.",
      columns: [
        {
          title: "Subject",
          text: "The figure remains the only true anchor — never one more element inside the composition.",
        },
        {
          title: "Narrative",
          text: "Visual details carry the story without captions explaining what the frame should already hold.",
        },
        {
          title: "Restraint",
          text: "Negative space, shadow, and silence are protected so the final image never feels overworked.",
        },
      ],
    },
    story: {
      label: "Selected Work",
      heading: "Selected sequences.",
      text:
        "These are not categories. They are fragments that hold the visual method and working logic behind Eldon Studio.",
      readingMode: "Approach",
      readingModeText: "Image before text. Atmosphere before explanation. Sequence before moment.",
      sequence: "Sequence",
      selectedSeries: "Selected Series",
      fragment: "Visual Narrative",
      commission: "Editorial Series · Private Commission",
      study: "Study",
    },
    aestheticLab: {
      label: "Lumina Engine",
      heading: "Aesthetic deconstruction for a single frame.",
      text:
        "Upload one photograph and Lumina will reverse-engineer it through emotional color psychology, light-shadow tension, and narrative conflict, then return a structured JSON dashboard ready for downstream tools.",
      uploadLabel: "Image Input",
      uploadHeading: "Upload a frame for reading",
      uploadText:
        "This module is designed as an aesthetic instrument rather than a generic image inspector. It reads color pressure, emotional gravity, and lighting intent before turning the result into machine-readable output.",
      uploadCta: "Drop or select image",
      uploadHint: "Use a portrait, editorial frame, or cinematic still. Analysis starts as soon as the image is selected.",
      replaceImage: "Replace Image",
      previewLabel: "Current frame",
      previewAlt: "Uploaded image preview for aesthetic analysis",
      engineLabel: "Engine Status",
      awaitingImage: "Waiting for an image. Once selected, the engine will read emotional color and light structure automatically.",
      analyzing: "Lumina is dissecting color tension, visual gravity, and light ratio...",
      analysisReady: "Analysis complete. The dashboard and JSON packet are ready below.",
      analysisError: "The image could not be analyzed. Try another file or re-upload the frame.",
      emptyState:
        "No aesthetic reading yet. Upload a frame to generate emotional resonance scores, light deconstruction, actionable grading advice, and social copy.",
      readingLabel: "Critical Reading",
      colorHeading: "Emo-Color Analytics",
      lightHeading: "Light-Shadow Deconstruction",
      adviceLabel: "Actionable Advice",
      copyLabel: "Social Copy",
      platformsLabel: "Platform Output",
      platformsHeading: "Recommended titles and captions will appear here.",
      platformsText:
        "After analysis, Lumina will generate platform-specific publishing suggestions for Xiaohongshu and Douyin based on the emotional structure of the frame.",
      platformLabels: {
        xiaohongshu: "Xiaohongshu",
        douyin: "Douyin",
      },
      platformHeadings: {
        xiaohongshu: "Search-first save-worthy version",
        douyin: "Hook-first completion-driven version",
      },
      recommendedTitlesLabel: "Recommended Titles",
      recommendedCaptionLabel: "Recommended Caption",
      jsonLabel: "JSON Output",
      metricLabels: {
        melancholy_isolation: "Melancholy / Isolation",
        power_grit: "Power / Grit",
        mystery_unknown: "Mystery / Unknown",
        intimacy_warmth: "Intimacy / Warmth",
      },
    },
    gallery: {
      label: "Archive",
      heading: "Photography Archive",
      text:
        "Open a series to manage its photographs, upload new work, and assign the cover frame. Each language version remains separate in the interface.",
      newPortfolio: "New Portfolio",
      addCardLabel: "Add new portfolio",
      addCardBadge: "Admin",
      addCardEyebrow: "New archive entry",
      addCardTitle: "Add portfolio",
      addCardText:
        "Create a new gallery, upload local files, and enter the collection immediately after confirmation.",
      addCardFooter: "Create and manage",
      addCardAction: "Add",
      selectedSeries: "Selected series",
      archiveDetail: "Archive detail",
      open: "Open",
      imagesSuffix: "images",
      noCover: "No cover image",
      filterLabels: {
        ALL: "All",
        STUDIO: "Studio",
        EXPLORATION: "Exploration",
        ARCHIVE: "Humanities",
      },
    },
    detail: {
      back: "Back to Archive",
      label: "Portfolio Detail",
      editPortfolio: "Edit Portfolio",
      deletePortfolio: "Delete Portfolio",
      uploadLocked:
        "Admin mode is required to upload new images, change the cover, or remove photographs from this portfolio.",
      setCover: "Set Cover",
      delete: "Delete",
      closeLightbox: "Close lightbox",
      previousImage: "Previous image",
      nextImage: "Next image",
      imageLabel: "image",
    },
    booking: {
      label: "Commission",
      heading: "Commission a portrait series",
      bookingLabel: "Commission",
      bookingHeading: "Enquire about a commission",
      bookingText:
        "Available for editorial portraiture, campaign production, and long-form commissioned series. Enquiries are reviewed personally and responded to within 24 hours.",
      clientNameLabel: "Name",
      clientNamePlaceholder: "Your name",
      contactEmailLabel: "Email",
      contactEmailPlaceholder: "hello@studio.com",
      shootTypeLabel: "Discipline",
      shootTypePlaceholder: "Select discipline",
      preferredDateLabel: "Preferred Shoot Date",
      budgetRangeLabel: "Production Budget",
      budgetRangePlaceholder: "Select range",
      shootTypeOptions: [
        { value: "portrait", label: "Portrait" },
        { value: "editorial", label: "Editorial" },
        { value: "campaign", label: "Campaign" },
        { value: "commercial", label: "Commercial" },
      ],
      budgetRangeOptions: [
        { value: "under-5k", label: "Under 5K" },
        { value: "5k-10k", label: "5K – 10K" },
        { value: "10k-20k", label: "10K – 20K" },
        { value: "20k-plus", label: "20K+" },
      ],
      bookNow: "Submit Enquiry",
      submitting: "Submitting...",
      connectLumina: "Connect to Lumina scheduling system",
      savedDraft:
        "Your enquiry has been received. A project brief will be prepared and sent to you within 24 hours.",
      sideProjectsLabel: "Personal Work",
      sideProjectsHeading: "Personal systems.",
      learnMore: "Learn More",
      responseNote: "Each enquiry is reviewed personally. Expect a project-fit note and the next step within 24 hours.",
      submitError: "Submission paused. Please try again in a moment.",
      eyebrow: "Private Commissions",
      heroHeading: "Bespoke Portrait Direction",
      heroHeadingItalic: "For the Discerning Eye",
      dialogueHeading: "Begin the Enquiry",
      dialogueText:
        "Each commission is a singular collaboration. Share your brief and creative intent — we will respond within 24 hours to discuss the project in depth.",
      nameLabel: "Name",
      namePlaceholder: "E.g. Julian Vayne",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      projectTypeLabel: "Discipline",
      dateLabel: "Preferred Shoot Date",
      narrativeLabel: "Creative Brief",
      narrativePlaceholder:
        "Describe the atmosphere, references, and intent of the project...",
      sendBtn: "Submit Enquiry",
      sendingBtn: "Sending...",
      successMsg: "Enquiry received. We will be in touch within 24 hours.",
      editPackageLabel: "Edit",
      savePackageLabel: "Save",
      cancelLabel: "Cancel",
      packages: [
        {
          id: "01",
          tier: "FOUNDATION",
          name: "The Editorial",
          description:
            "Designed for individuals and brands requiring refined, high-impact portraiture for editorial use and digital presence.",
          features: [
            "15 Final Selects, Fully Retouched",
            "Half-Day Private Studio Session",
            "Delivery via Private Client Portal",
          ],
          price: "$1,200",
          priceNote: "Starting Rate",
        },
        {
          id: "02",
          tier: "SIGNATURE",
          name: "The Commission",
          description:
            "Comprehensive production for artists, executives, and creative studios requiring a definitive body of work.",
          features: [
            "40 Retouched High-Resolution Deliverables",
            "Full-Day On-Location Production",
            "Art Direction & Styling Consultation",
            "Priority 48-Hour Post-Production",
          ],
          price: "$2,850",
          priceNote: "Starting Rate",
        },
        {
          id: "03",
          tier: "BESPOKE",
          name: "The Collection",
          description:
            "An immersive visual narrative developed across multiple sessions, inclusive of cinematic moving portraits and print licensing.",
          features: [
            "Unlimited Final Deliverables",
            "Multi-Day Production, Travel Included",
            "Cinematic Video Portraits (4K)",
          ],
          price: "Custom",
          priceNote: "Consultation Required",
        },
      ],
    },
    login: {
      open: "Login / Sign Up",
      title: "Account Access",
      text:
        "Sign in or create an account to save your identity on this site. Editing tools remain restricted to the designated administrator.",
      emailLabel: "Email",
      emailPlaceholder: "hello@eldonstudio.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter password",
      signInTab: "Login",
      signUpTab: "Sign Up",
      submitSignIn: "Login",
      submitSignUp: "Create Account",
      submittingSignIn: "Logging in...",
      submittingSignUp: "Creating...",
      signOut: "Sign Out",
      close: "Close",
      authUnavailable:
        "Supabase Auth is not configured yet. Add the Supabase env values and restart the dev server.",
      memberBadge: "Member",
      adminBadge: "Admin",
      signedInAs: "Signed in as",
      signUpSuccess:
        "Account created. Check your email if confirmation is required, or log in immediately if email confirmation is disabled.",
    },
    footer: {
      text:
        "Portrait commissions, editorial series, and archive management — connected through the Lumina workflow.",
      poweredBy: "Powered by Lumina",
    },
    confirm: {
      deleteLabel: "Confirm Delete",
      deletePortfolioTitle: "Delete this portfolio?",
      deletePortfolioText:
        "This action removes the collection and all of its locally stored images.",
      deleteDetailPortfolioText:
        "This action removes the portfolio and every local image stored inside it.",
      deleteImageTitle: "Delete this image?",
      deleteImageText: "The selected image will be removed from this portfolio.",
      cancel: "Cancel",
      delete: "Delete",
    },
    upload: {
      hint: "Drag high-resolution images here, or click to browse",
      subtext:
        "Files stay in staging first, then join the selected portfolio only after confirmation.",
      browse: "Browse Files",
      cancel: "Cancel",
      confirm: "Confirm Upload",
      uploading: "Uploading...",
      uploadFailed: "Upload failed. Check Supabase storage and try again.",
      supabaseConfigMissing:
        "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
    },
  },
  zh: {
    languageToggle: { en: "EN", zh: "中文" },
    admin: {
      mode: "管理模式",
      editProfile: "编辑摄影师资料",
      portfolioDetails: "摄影集信息",
      createStatus: "新建",
      editStatus: "编辑",
      clearFiles: "清空文件",
      createPortfolio: "创建摄影集",
      saveChanges: "保存修改",
      cancel: "取消",
      processing: "处理中...",
      saving: "保存中...",
      saveProfile: "保存资料",
      statusLabel: "状态",
      titleLabel: "标题",
      titleEnLabel: "英文标题",
      titleZhLabel: "中文标题",
      descriptionLabel: "描述",
      descriptionEnLabel: "英文描述",
      descriptionZhLabel: "中文描述",
      titlePlaceholderEn: "Male Portraiture",
      titlePlaceholderZh: "男性肖像",
      descriptionPlaceholderEn: "Describe the emotional weight and visual rhythm of this series.",
      descriptionPlaceholderZh: "描述这一组作品的情绪重心、光线结构与叙事节奏。",
      roleEnLabel: "英文身份",
      roleZhLabel: "中文身份",
      nameEnLabel: "英文名称",
      nameZhLabel: "中文名称",
      introEnLabel: "英文介绍",
      introZhLabel: "中文介绍",
      namePlaceholderEn: "Eldon Studio",
      namePlaceholderZh: "Eldon Studio",
      rolePlaceholderEn: "Portrait & Editorial Photographer",
      rolePlaceholderZh: "人像与编辑摄影师",
      introPlaceholderEn:
        "Introduce the studio in a controlled, high-end tone for the English site.",
      introPlaceholderZh: "用更克制、专业的语气，介绍摄影师的工作方式与拍摄方向。",
      emailLabel: "邮箱",
      avatar: "头像",
      photographerDetails: "摄影师资料",
      profileTitle: "编辑摄影师介绍",
      profileText:
        "更新首页展示的品牌名称、联系信息与头像。中英文文案将分别编辑与保存。",
      browseFiles: "浏览文件",
      removeStagedImage: "移除暂存图片",
      removeImagePrefix: "移除",
      cover: "封面",
      new: "新增",
      saved: "已存储",
      waitingForImages: "等待上传本地图片",
      localFilesSelected: "张本地图片已选择",
      imagesReadyAfterSave: "张图片将在保存后生效",
      stagingTitle: "图片暂存区",
      stagingText:
        "先上传本地图片，再选择封面，并同时整理中英文文案后再确认创建。",
      coverSelection: "封面选择",
      coverSelectionText: "选择该摄影集在首页归档中展示的封面图片。",
      createModalTitle: "创建摄影集",
      editModalTitle: "编辑摄影集",
      createModalText:
        "使用真实本地文件创建新的摄影集。若未手动指定，系统会自动将第一张已选图片设为封面。",
      editModalText:
        "更新中英文内容、追加新的本地图片，并重新选择该系列的封面图。",
      uploadHint: "拖拽本地图片到这里，或点击浏览",
      uploadHintSecondary: "为当前摄影集补充新的本地图片",
      createConfirmText:
        "确认后将创建摄影集，把这些本地图片存入浏览器持久化存储，并直接进入新建摄影集详情页。",
      emptyCoverCreate: "请至少上传一张本地图片，再为新摄影集选择封面。",
      emptyCoverEdit: "请先创建摄影集并在内部上传图片，然后再回到这里选择封面。",
      titleTooLong: "标题长度不能超过 90 个字符。",
      selectImageFirst: "创建摄影集前请至少选择一张本地图片。",
      saveFailed: "保存失败，请重试。",
      uploadFailed: "图片上传失败，请检查 Supabase Storage 配置后重试。",
      supabaseConfigMissing:
        "Supabase 尚未完成配置。请在 .env.local 中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。",
      dataTools: "数据备份",
      dataToolsText:
        "可将当前浏览器中的摄影归档导出为 JSON 备份，也可在管理模式内恢复此前导出的备份文件。",
      dataToolsSummary:
        "备份包含中英文摄影集字段、摄影师资料、封面选择，以及本地持久化保存的图片数据。",
      exportBackup: "导出备份",
      selectBackupFile: "选择备份文件",
      restoreBackup: "恢复备份",
      selectedBackup: "已选备份",
      noBackupSelected: "暂未选择备份文件。",
      backupFileReady: "备份文件已选择，可以恢复。",
      backupExported: "备份下载已开始。",
      backupImported: "备份已恢复到当前浏览器。",
      backupInvalid: "该备份文件无效或暂不支持。",
      backupImportFailed: "恢复备份失败，请尝试其他文件。",
      backupSelectFirst: "恢复前请先选择一个备份文件。",
      backupReplaceTitle: "确认恢复本地备份？",
      backupReplaceText:
        "恢复后会用所选备份文件替换当前浏览器中的摄影集与摄影师资料。",
      untitled: fallbackPortfolioContent.title.zh,
      defaultDescription: "一组围绕氛围、克制与肖像节奏建立的新系列。",
    },
    hero: {
      cinematicDirection: "电影感肖像摄影",
      navPortfolio: "作品集",
      navApproach: "创作理念",
      navCommission: "委托拍摄",
      navStudio: "关于工作室",
      navArchive: "作品集",
      navAbout: "关于工作室",
      navBooking: "委托拍摄",
      navLab: "LAB",
      navLumina: "Lumina 应用",
      scrollExplore: "向下继续浏览",
      adminEntry: "管理",
      modulesLabel: "工作室模块",
      modulesHeading: "在归档背后，还有一套更安静的系统。",
      modulesText:
        "网站承担展示、影像归档与 Lumina 工作流交接三层功能，三者共用同一数据结构。",
      modulesStatsPortfolios: "系列归档数量",
      modulesStatsImages: "画面管理数量",
      moduleArchiveTitle: "影像档案",
      moduleArchiveText: "支持影棚级图片上传、封面选帧、灯箱预览与稳健的本地持久化存储。",
      moduleLanguageTitle: "双语控制",
      moduleLanguageText: "中英文界面严格分离，共享同一套规范化数据模型。",
      moduleLuminaTitle: "Lumina 集成",
      moduleLuminaText: "委托简报与项目交接直接路由至 Lumina 排期系统，无需手动转移。",
      visualDirection: "2026 · 视觉方向",
      heading: "以克制、光线与精准情绪刻度，完成肖像表达。",
      viewArchive: "浏览作品集",
      openLumina: "打开 Lumina",
      studioNote: "工作室",
      studioNoteText: "每一次委托都被理解为一组被控制的序列——而不是孤立画面的偶然堆叠。",
      portraitSystem: "肖像系统",
      creativeStance: "创作立场",
      creativeStanceText:
        "接受私人委托、编辑肖像与艺术指导型身份拍摄。风格化元素始终从属于人物表达。",
      workflow: "工作流",
      workflowText: "影像档案管理、后期成片交付，以及与 Lumina 排期系统的直接衔接。",
      studioPreview: "工作室预览",
      selectedFrame: "当前画面",
      emptyTitle: "上传作品后，即可开始构建影像档案。",
    },
    practice: {
      label: "创作理念",
      heading: "让视觉系统保持最小化，情绪读取才能率先落位。",
      principleLabel: "工作原则",
      principleText: "氛围来自删减：更少的视觉决策，更精准的情绪信号。",
      lead:
        "画面中的每一次明暗变化都服务于被摄者本身。空间、造型与环境元素被控制在足够克制的范围内，让情绪核心保持精确且不被干扰。",
      columns: [
        {
          title: "被摄者",
          text: "人物始终是画面唯一真正的锚点，而非造型体系中的附属元素。",
        },
        {
          title: "叙事",
          text: "视觉细节本身承载叙事，不依赖文字去解释一张照片本该呈现的内容。",
        },
        {
          title: "克制",
          text: "留白、暗部与画面中的静默感都会被保留，确保最终影像不过度加工。",
        },
      ],
    },
    story: {
      label: "精选作品",
      heading: "精选序列。",
      text: "这些并非普通分类，而是承载 Eldon Studio 视觉方法与工作逻辑的若干片段。",
      readingMode: "阅读方式",
      readingModeText: "先看图像，再读文字。让氛围领先于解释，让序列领先于瞬间。",
      sequence: "序列",
      selectedSeries: "精选系列",
      fragment: "视觉叙事",
      commission: "编辑系列 · 私人委托",
      study: "样本研究",
    },
    aestheticLab: {
      label: "Lumina 引擎",
      heading: "针对单张影像的审美拆解。",
      text:
        "上传一张摄影作品后，Lumina 会从情绪色彩心理、光影张力与叙事冲突三个维度逆向拆解画面，并输出可供前端或其他 AI 继续处理的结构化 JSON。",
      uploadLabel: "图像输入",
      uploadHeading: "上传一张画面开始解读",
      uploadText:
        "这不是普通的图片检测器，而是一台偏向审美判断的视觉仪器。它会先读取色彩压力、情绪重力与布光意图，再将结果整理成机器可读的输出。",
      uploadCta: "拖入或选择图片",
      uploadHint: "建议上传肖像、编辑摄影或电影感画面。选中图片后会自动开始分析。",
      replaceImage: "更换图片",
      previewLabel: "当前画面",
      previewAlt: "用于审美分析的上传图片预览",
      engineLabel: "引擎状态",
      awaitingImage: "等待图像输入。选中后将自动开始读取情绪色彩与光影结构。",
      analyzing: "Lumina 正在拆解色彩张力、视觉重力与光比结构...",
      analysisReady: "分析完成，下方已生成仪表盘与 JSON 结果。",
      analysisError: "图片分析失败，请尝试重新上传或更换文件。",
      emptyState:
        "还没有生成审美报告。上传一张画面后，这里会输出情绪共振分值、光影结构分析、后期建议与可直接使用的文案。",
      readingLabel: "审美拆解",
      colorHeading: "情绪色彩分析",
      lightHeading: "光影结构拆解",
      adviceLabel: "可执行建议",
      copyLabel: "社交文案",
      platformsLabel: "平台输出",
      platformsHeading: "分析完成后，这里会生成适配平台的标题与文案。",
      platformsText:
        "Lumina 会根据画面的情绪结构，为小红书与抖音分别生成更适合平台分发逻辑的发布建议。",
      platformLabels: {
        xiaohongshu: "小红书",
        douyin: "抖音",
      },
      platformHeadings: {
        xiaohongshu: "偏搜索与收藏的版本",
        douyin: "偏钩子与完播的版本",
      },
      recommendedTitlesLabel: "推荐标题",
      recommendedCaptionLabel: "推荐文案",
      jsonLabel: "JSON 输出",
      metricLabels: {
        melancholy_isolation: "忧郁 / 孤绝",
        power_grit: "力量 / 粗粝",
        mystery_unknown: "神秘 / 未知",
        intimacy_warmth: "亲密 / 温度",
      },
    },
    gallery: {
      label: "影像档案",
      heading: "摄影档案",
      text: "进入系列后可管理图片、上传新作品并指定封面帧。界面中的中英文版本严格分开管理。",
      newPortfolio: "新建摄影集",
      addCardLabel: "新增摄影集",
      addCardBadge: "管理",
      addCardEyebrow: "新归档条目",
      addCardTitle: "添加摄影集",
      addCardText: "创建新的摄影集，上传本地文件，并在确认后立即进入该集合。",
      addCardFooter: "创建并管理",
      addCardAction: "新增",
      selectedSeries: "精选系列",
      archiveDetail: "归档详情",
      open: "打开",
      imagesSuffix: "张图片",
      noCover: "暂无封面图",
      filterLabels: {
        ALL: "全部",
        STUDIO: "影棚",
        EXPLORATION: "外景",
        ARCHIVE: "人文",
      },
    },
    detail: {
      back: "返回归档",
      label: "摄影集详情",
      editPortfolio: "编辑摄影集",
      deletePortfolio: "删除摄影集",
      uploadLocked: "只有在管理模式下，才可上传图片、修改封面或删除该摄影集中的照片。",
      setCover: "设为封面",
      delete: "删除",
      closeLightbox: "关闭大图预览",
      previousImage: "上一张图片",
      nextImage: "下一张图片",
      imageLabel: "图片",
    },
    booking: {
      label: "委托拍摄",
      heading: "委托一组肖像系列",
      bookingLabel: "委托拍摄",
      bookingHeading: "发起委托询价",
      bookingText:
        "可承接编辑肖像、商业肖像与长期委托系列。每一份询价均由摄影师本人审阅，并在 24 小时内回复。",
      clientNameLabel: "姓名",
      clientNamePlaceholder: "您的姓名",
      contactEmailLabel: "邮箱",
      contactEmailPlaceholder: "hello@studio.com",
      shootTypeLabel: "拍摄方向",
      shootTypePlaceholder: "选择拍摄方向",
      preferredDateLabel: "意向拍摄日期",
      budgetRangeLabel: "制作预算",
      budgetRangePlaceholder: "选择预算区间",
      shootTypeOptions: [
        { value: "portrait", label: "人像" },
        { value: "editorial", label: "编辑摄影" },
        { value: "campaign", label: "品牌 Campaign" },
        { value: "commercial", label: "商业摄影" },
      ],
      budgetRangeOptions: [
        { value: "under-5k", label: "5K 以下" },
        { value: "5k-10k", label: "5K – 10K" },
        { value: "10k-20k", label: "10K – 20K" },
        { value: "20k-plus", label: "20K 以上" },
      ],
      bookNow: "提交询价",
      submitting: "提交中...",
      connectLumina: "接入 Lumina 摄影调度系统",
      savedDraft: "您的询价已收到，我们将在 24 小时内整理项目方案并与您联系。",
      sideProjectsLabel: "个人创作",
      sideProjectsHeading: "个人系统。",
      learnMore: "了解更多",
      responseNote: "每份询价均由摄影师本人审阅，通常在 24 小时内回复项目匹配意见与下一步安排。",
      submitError: "提交暂时未完成，请稍后重试。",
      eyebrow: "私人委托",
      heroHeading: "精工肖像定制",
      heroHeadingItalic: "为懂得欣赏的人而作",
      dialogueHeading: "发起委托",
      dialogueText:
        "每次委托都是一次独特的协作。请分享您的创作构想与项目简报，我们将在 24 小时内联系您深入探讨。",
      nameLabel: "姓名",
      namePlaceholder: "例如 张明",
      emailLabel: "邮箱",
      emailPlaceholder: "your@email.com",
      projectTypeLabel: "拍摄方向",
      dateLabel: "意向拍摄日期",
      narrativeLabel: "创作简报",
      narrativePlaceholder: "请描述项目的氛围、参考风格与创作意图...",
      sendBtn: "提交询价",
      sendingBtn: "提交中...",
      successMsg: "询价已收到，我们将在 24 小时内与您联系。",
      editPackageLabel: "编辑",
      savePackageLabel: "保存",
      cancelLabel: "取消",
      packages: [
        {
          id: "01",
          tier: "基础委托",
          name: "编辑精选",
          description:
            "适合个人品牌与创作者，提供高质量编辑肖像，用于媒体发布与数字内容制作。",
          features: [
            "15 张精选终版，全套精修",
            "半日制私人影棚拍摄",
            "成片通过私密客户空间交付",
          ],
          price: "¥8,800",
          priceNote: "含税起价",
        },
        {
          id: "02",
          tier: "签约委托",
          name: "完整委托",
          description:
            "面向艺术家、高管与创意机构，提供系统性视觉档案记录与完整制作服务。",
          features: [
            "40 张高分辨率精修成片",
            "全天外景拍摄制作",
            "艺术指导与造型咨询",
            "优先级 48 小时后期处理",
          ],
          price: "¥20,800",
          priceNote: "含税起价",
        },
        {
          id: "03",
          tier: "定制委托",
          name: "视觉系列",
          description:
            "跨多次拍摄会话构建沉浸式视觉叙事，含电影感动态影像与印刷授权。",
          features: [
            "无限量终版成片交付",
            "多日制作，含差旅安排",
            "电影感动态肖像（4K）",
          ],
          price: "定制报价",
          priceNote: "需提前咨询",
        },
      ],
    },
    login: {
      open: "登录 / 注册",
      title: "账户访问",
      text:
        "你可以登录或注册以在本站保留身份状态，但编辑权限仅对指定管理员邮箱开放。",
      emailLabel: "邮箱",
      emailPlaceholder: "hello@eldonstudio.com",
      passwordLabel: "密码",
      passwordPlaceholder: "输入密码",
      signInTab: "登录",
      signUpTab: "注册",
      submitSignIn: "登录",
      submitSignUp: "创建账户",
      submittingSignIn: "登录中...",
      submittingSignUp: "创建中...",
      signOut: "退出登录",
      close: "关闭",
      authUnavailable:
        "Supabase Auth 尚未完成配置。请补全环境变量后重启开发服务器。",
      memberBadge: "成员",
      adminBadge: "管理员",
      signedInAs: "当前登录",
      signUpSuccess:
        "账户已创建。如项目启用了邮箱验证，请先完成验证；若未启用，可直接登录使用。",
    },
    footer: {
      text: "肖像委托、编辑系列与影像档案管理——统一接入 Lumina 工作流。",
      poweredBy: "由 Lumina 提供支持",
    },
    confirm: {
      deleteLabel: "删除确认",
      deletePortfolioTitle: "确认删除该摄影集？",
      deletePortfolioText: "此操作会移除该集合及其中所有本地持久化保存的图片。",
      deleteDetailPortfolioText: "此操作会删除该摄影集以及其中全部本地保存的图片。",
      deleteImageTitle: "确认删除这张图片？",
      deleteImageText: "所选图片将从当前摄影集中移除。",
      cancel: "取消",
      delete: "删除",
    },
    upload: {
      hint: "拖拽高清图片至此，或点击浏览",
      subtext: "文件会先进入暂存区，确认后才会加入当前摄影集。",
      browse: "浏览文件",
      cancel: "取消",
      confirm: "确认上传",
      uploading: "上传中...",
      uploadFailed: "上传失败，请检查 Supabase Storage 配置后重试。",
      supabaseConfigMissing:
        "Supabase 尚未完成配置。请在 .env.local 中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。",
    },
  },
};

function toPortfolioShape(portfolio) {
  const initialSeed =
    initialPortfolios.find(
      (seed) =>
        seed.id === portfolio.id ||
        getLocalizedText(seed.title, "en") === portfolio.title ||
        getLocalizedText(seed.title, "zh") === portfolio.title,
    ) || null;
  const images = Array.isArray(portfolio.images) ? portfolio.images : [];
  const normalizedImages = images
    .map((image, index) => {
      const fallbackUrl = initialSeed?.images?.[index]?.url || null;
      const nextUrl = isEphemeralImageUrl(image?.url) ? fallbackUrl : (image?.url ?? image?.publicUrl ?? null);

      if (!nextUrl) {
        return null;
      }

      return {
        id: image.id ?? Date.now() + index,
        url: nextUrl,
        path:
          typeof image?.path === "string" && image.path.length > 0
            ? image.path
            : getStoragePathFromUrl(nextUrl),
        isCover: Boolean(image.isCover),
      };
    })
    .filter(Boolean);

  if (normalizedImages.length > 0 && !normalizedImages.some((image) => image.isCover)) {
    normalizedImages[0].isCover = true;
  }

  return {
    id: portfolio.id ?? Date.now(),
    narrative: portfolio.narrative ?? initialSeed?.narrative,
    title: toLocalizedField(portfolio.title, initialSeed?.title || fallbackPortfolioContent.title),
    description: toLocalizedField(
      portfolio.description,
      initialSeed?.description || fallbackPortfolioContent.description,
    ),
    images: normalizedImages,
  };
}

function toProfileShape(profile) {
  return {
    name: toLocalizedField(profile?.name, initialProfile.name),
    role: toLocalizedField(profile?.role, initialProfile.role),
    email: profile?.email?.trim() || initialProfile.email,
    intro: toLocalizedField(profile?.intro, initialProfile.intro),
    avatarUrl: isEphemeralImageUrl(profile?.avatarUrl)
      ? initialProfile.avatarUrl
      : profile?.avatarUrl || initialProfile.avatarUrl,
  };
}


export default function App() {
  const {
    getInitialLocale,
    persistLocale,
    loadPortfoliosFromStorage,
    savePortfoliosToStorage,
    loadProfileFromStorage,
    saveProfileToStorage,
    createBackupPayload,
    normalizeBackupPayload,
  } = usePersistence({ toPortfolioShape, toProfileShape });
  
  const [portfolios, setPortfolios] = useState(initialPortfolios.map(toPortfolioShape));
  const [profile, setProfile] = useState(toProfileShape(initialProfile));
  const [locale, setLocale] = useState(() => getInitialLocale());
  const [loaded, setLoaded] = useState(false);
  
  const [authUser, setAuthUser] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem('lumina_user');
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [editorState, setEditorState] = useState({ open: false, portfolio: null });
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  
  // 🔥 新增：上传订单管理状态
  const [uploadingOrderNo, setUploadingOrderNo] = useState(null);

  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlView = params.get('view');
    const validViews = ['home', 'lab', 'booking'];
    return validViews.includes(urlView) ? urlView : 'home';
  });
  const [labFiles, setLabFiles] = useState([]);
  const [luminaReportData, setLuminaReportData] = useState(null);
  const [clientSlug, setClientSlug] = useState("");
  const [proofSlug, setProofSlug] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');
    const slug = params.get('slug');
    if (adminParam === 'true') {
      setView('admin');
    } else if (slug) {
      setView('client-portal');
      setClientSlug(slug);
    }
  }, []);

  const copy = siteCopy[locale];
  const userEmail = authUser?.email?.trim() || "";
  
  const isAdmin = Boolean(
    authUser?.role?.toUpperCase() === 'ADMIN' ||
    (userEmail && ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_EMAIL)
  );

  const selectedPortfolio = useMemo(
    () => portfolios.find((item) => item.id === selectedPortfolioId) || null,
    [portfolios, selectedPortfolioId],
  );

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const [storedProfile, storedPortfolios] = await Promise.all([
        loadProfileFromStorage(),
        loadPortfoliosFromStorage(),
      ]);

      if (mounted) {
        if (storedPortfolios) setPortfolios(storedPortfolios);
        if (storedProfile) setProfile(storedProfile);
        setLoaded(true);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, [loadPortfoliosFromStorage, loadProfileFromStorage]);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    savePortfoliosToStorage(portfolios);
  }, [portfolios, loaded, savePortfoliosToStorage]);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    saveProfileToStorage(profile);
  }, [profile, loaded, saveProfileToStorage]);

  useEffect(() => {
    persistLocale(locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.documentElement.classList.toggle("lang-en", locale === "en");
    document.documentElement.classList.toggle("lang-zh", locale === "zh");
    document.title = locale === "zh" ? "Eldon Studio 摄影官网" : "Eldon Studio";
  }, [locale, persistLocale]);

  useEffect(() => {
    function blockMediaContext(event) {
      if (event.target instanceof Element && event.target.closest("img")) {
        event.preventDefault();
      }
    }
    function blockMediaDrag(event) {
      if (event.target instanceof Element && event.target.closest("img")) {
        event.preventDefault();
      }
    }
    window.addEventListener("contextmenu", blockMediaContext, true);
    window.addEventListener("dragstart", blockMediaDrag, true);
    return () => {
      window.removeEventListener("contextmenu", blockMediaContext, true);
      window.removeEventListener("dragstart", blockMediaDrag, true);
    };
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      setIsPastHero(true);
      return undefined;
    }
    let frameId = null;
    function handleScroll() {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const nextValue = window.scrollY > window.innerHeight - 110;
        setIsPastHero((current) => (current === nextValue ? current : nextValue));
      });
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [selectedPortfolio]);

  useEffect(() => {
    if (isAdmin) return;
    setEditorState((current) => (current.open ? { open: false, portfolio: null } : current));
    setProfileEditorOpen(false);
    setBackupFile(null);
    setBackupStatus(null);
    setConfirmState(null);
  }, [isAdmin]);

  async function handleSignOut() {
    localStorage.removeItem('lumina_user');
    setAuthUser(null);
    setAuthModalOpen(false);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch(e) {}
    }
    window.location.reload();
  }

  async function handleSavePortfolio({ id, title, description, coverImageId, images, narrative }) {
    if (!isAdmin) return;
    let createdPortfolioId = null;
    setPortfolios((current) => {
      if (id) {
        return current.map((portfolio) => {
          if (portfolio.id !== id) return portfolio;
          const mergedImages = [...portfolio.images, ...(Array.isArray(images) ? images : [])];
          const nextImages = mergedImages.map((image) => ({
            ...image,
            isCover: coverImageId ? image.id === coverImageId : image.isCover,
          }));
          if (nextImages.length > 0 && !nextImages.some((image) => image.isCover)) {
            nextImages[0].isCover = true;
          }
          return {
            ...portfolio,
            title: toLocalizedField(title, fallbackPortfolioContent.title),
            description: toLocalizedField(description, fallbackPortfolioContent.description),
            images: nextImages,
          };
        });
      }
      const nextId = Date.now();
      createdPortfolioId = nextId;
      const nextImages = (Array.isArray(images) ? images : []).map((image) => ({
        ...image,
        isCover: coverImageId ? image.id === coverImageId : image.isCover,
      }));
      if (nextImages.length > 0 && !nextImages.some((image) => image.isCover)) {
        nextImages[0].isCover = true;
      }
      const nextPortfolio = toPortfolioShape({
        id: nextId, narrative,
        title: toLocalizedField(title, fallbackPortfolioContent.title),
        description: toLocalizedField(description, fallbackPortfolioContent.description),
        images: nextImages,
      });
      return [nextPortfolio, ...current];
    });
    setEditorState({ open: false, portfolio: null });
    if (createdPortfolioId !== null) setSelectedPortfolioId(createdPortfolioId);
  }

  async function handleDeletePortfolio(id) {
    if (!isAdmin) return;
    const targetPortfolio = portfolios.find((portfolio) => portfolio.id === id);
    const imagePaths = (targetPortfolio?.images || []).map((image) => image.path).filter(Boolean);
    try {
      await deleteImagesFromCloud(imagePaths);
    } catch (error) {
      console.error("Failed to delete portfolio images from cloud storage.", error);
      return;
    }
    setPortfolios((current) => current.filter((portfolio) => portfolio.id !== id));
    setConfirmState(null);
    if (selectedPortfolioId === id) setSelectedPortfolioId(null);
  }

  function handleUploadImages(images) {
    if (!isAdmin || !selectedPortfolio) return;
    setPortfolios((current) =>
      current.map((portfolio) => {
        if (portfolio.id !== selectedPortfolio.id) return portfolio;
        const shouldSetCover = portfolio.images.length === 0;
        const nextImages = images.map((image, index) => ({
          ...image,
          isCover: shouldSetCover && index === 0,
        }));
        return { ...portfolio, images: [...portfolio.images, ...nextImages] };
      }),
    );
  }

  function handleSetCover(imageId) {
    if (!isAdmin || !selectedPortfolio) return;
    setPortfolios((current) =>
      current.map((portfolio) =>
        portfolio.id === selectedPortfolio.id
          ? { ...portfolio, images: portfolio.images.map((image) => ({ ...image, isCover: image.id === imageId })) }
          : portfolio,
      ),
    );
  }

  async function handleDeleteImage(imageId) {
    if (!isAdmin || !selectedPortfolio) return;
    const targetImage = selectedPortfolio.images.find((image) => image.id === imageId);
    try {
      await deleteImagesFromCloud([targetImage?.path].filter(Boolean));
    } catch (error) {
      console.error("Failed to delete portfolio image from cloud storage.", error);
      return;
    }
    setPortfolios((current) =>
      current.map((portfolio) => {
        if (portfolio.id !== selectedPortfolio.id) return portfolio;
        const nextImages = portfolio.images.filter((image) => image.id !== imageId);
        if (nextImages.length > 0 && !nextImages.some((image) => image.isCover)) {
          nextImages[0].isCover = true;
        }
        return { ...portfolio, images: nextImages };
      }),
    );
    setConfirmState(null);
  }

  function openCreatePortfolio() {
    if (!isAdmin) return;
    setConfirmState(null);
    setSelectedPortfolioId(null);
    setEditorState({ open: true, portfolio: null });
  }

  function handleBackupFileSelect(file) {
    setBackupFile(file);
    setBackupStatus(file ? { tone: "default", message: copy.admin.backupFileReady } : null);
  }

  function handleExportBackup() {
    if (!isAdmin || typeof window === "undefined") return;
    const payload = createBackupPayload({ portfolios, profile, locale });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `eldon-studio-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
    setBackupStatus({ tone: "success", message: copy.admin.backupExported });
  }

  async function handleRestoreBackup() {
    if (!isAdmin) return;
    if (!backupFile) {
      setBackupStatus({ tone: "error", message: copy.admin.backupSelectFirst });
      return;
    }
    try {
      const raw = await backupFile.text();
      const nextState = normalizeBackupPayload(JSON.parse(raw));
      setConfirmState({
        title: copy.admin.backupReplaceTitle,
        description: copy.admin.backupReplaceText,
        onConfirm: () => {
          setPortfolios(nextState.portfolios);
          setProfile(nextState.profile);
          setLocale(nextState.locale);
          setSelectedPortfolioId(null);
          setEditorState({ open: false, portfolio: null });
          setProfileEditorOpen(false);
          setBackupFile(null);
          setBackupStatus({ tone: "success", message: copy.admin.backupImported });
          setConfirmState(null);
        },
      });
    } catch (error) {
      setBackupStatus({
        tone: "error",
        message: error instanceof SyntaxError || error?.message === "invalid-backup" ? copy.admin.backupInvalid : copy.admin.backupImportFailed,
      });
    }
  }

  const onOpenLab = () => {
    setSelectedPortfolioId(null);
    setLabFiles([]);
    setView("lab");
    window.scrollTo(0, 0);
  };

  const onEnterLab = (files) => {
    setSelectedPortfolioId(null);
    setLabFiles(files);
    setView("lab");
    window.scrollTo(0, 0);
  };

  return (
    <div className={`min-h-screen bg-[color:var(--site-bg)] text-[color:var(--site-text)] ${locale === "zh" ? "lang-zh" : "lang-en"}`} lang={locale === "zh" ? "zh-CN" : "en"}>
      {selectedPortfolio ? (
        <DetailUtilityBar locale={locale} onToggleLocale={setLocale} copy={copy} userEmail={userEmail} isAdmin={isAdmin} onOpenAuth={() => setAuthModalOpen(true)} onSignOut={handleSignOut} />
      ) : view === "client-portal" || view === "admin" || view === "lab" ? null : (
        <ImmersiveNavbar
          profile={profile} copy={copy} locale={locale} isSolid={isPastHero} isAdmin={isAdmin} userEmail={userEmail}
          onToggleLocale={setLocale} onOpenAuth={() => setAuthModalOpen(true)} onSignOut={handleSignOut}
          isLabView={view === "lab"} isBookingView={view === "booking"}
          onOpenLab={onOpenLab}
          onOpenBooking={() => { setSelectedPortfolioId(null); setView("booking"); window.scrollTo(0, 0); }}
          onOpenAdmin={() => { setSelectedPortfolioId(null); setView("admin"); window.scrollTo(0, 0); }}
          onGoHome={() => setView("home")}
        />
      )}

      {view === "client-portal" ? (
        <React.Suspense fallback={<div className="h-screen bg-[#131313]" />}><ClientPortalPage slug={clientSlug} /></React.Suspense>
      ) : view === "booking" ? (
        <>
          <div className="min-h-screen pt-24"><BookingProjectsSection copy={copy} locale={locale} luminaUrl={LUMINA_URL} isAdmin={isAdmin} /></div>
          <Footer profile={profile} copy={copy} locale={locale} luminaUrl={LUMINA_URL} />
        </>
      ) : view === "lab" || view === "client" || view === "admin" || selectedPortfolio ? (
        <React.Suspense fallback={<div className="h-screen bg-[#0a0a0a]" />}>
          {view === "lab" ? (
            <LuminaLabPage copy={copy} locale={locale} initialFiles={labFiles} onExit={() => { setView("home"); setLabFiles([]); window.scrollTo(0,0); }} />
          ) : view === "client" ? (
            <ClientPortalPage slug={clientSlug} onGoHome={() => setView("home")} />
          ) : view === "admin" ? (
            <AdminDashboardPage
              isAdmin={isAdmin} onGoHome={() => setView("home")} copy={copy} locale={locale}
              backupFileName={backupFile?.name || ""} backupStatus={backupStatus}
              onExport={handleExportBackup} onSelectFile={handleBackupFileSelect} onRestore={handleRestoreBackup}
              onStartUpload={(orderNo) => setUploadingOrderNo(orderNo)} // 🔥 注入传片回调
            />
          ) : (
            <DetailView
              portfolio={selectedPortfolio} isAdmin={isAdmin} copy={copy} locale={locale}
              onBack={() => setSelectedPortfolioId(null)}
              onEditPortfolio={() => setEditorState({ open: true, portfolio: selectedPortfolio })}
              onRequestDeletePortfolio={() => setConfirmState({ title: copy.confirm.deletePortfolioTitle, description: copy.confirm.deleteDetailPortfolioText, onConfirm: () => handleDeletePortfolio(selectedPortfolio.id) })}
              onUploadImages={handleUploadImages} onSetCover={handleSetCover}
              onDeleteImage={(imageId) => setConfirmState({ title: copy.confirm.deleteImageTitle, description: copy.confirm.deleteImageText, onConfirm: () => handleDeleteImage(imageId) })}
            />
          )}
        </React.Suspense>
      ) : (
        <>
          <HeroCover portfolios={portfolios} profile={profile} copy={copy} locale={locale} />
          <HeroSection profile={profile} isAdmin={isAdmin} onEditProfile={() => isAdmin && setProfileEditorOpen(true)} copy={copy} locale={locale} practiceRows={practiceRows} manifestoItems={manifestoData} luminaUrl={LUMINA_URL} />
          <PracticeSection copy={copy} locale={locale} />
          <StorySection portfolios={portfolios} copy={copy} locale={locale} />
          <PortfolioMasonry
            portfolios={portfolios} isAdmin={isAdmin} copy={copy} locale={locale}
            onAdd={openCreatePortfolio} onOpen={setSelectedPortfolioId}
            onEdit={(portfolio) => setEditorState({ open: true, portfolio })}
            onDelete={(id) => setConfirmState({ title: copy.confirm.deletePortfolioTitle, description: copy.confirm.deletePortfolioText, onConfirm: () => handleDeletePortfolio(id) })}
          />
          <LuminaLab locale={locale} onEnterLab={onEnterLab} />
          <Footer profile={profile} copy={copy} locale={locale} luminaUrl={LUMINA_URL} />
        </>
      )}

      {editorState.open && <PortfolioEditorModal portfolio={editorState.portfolio} copy={copy} fallbackPortfolioContent={fallbackPortfolioContent} onClose={() => setEditorState({ open: false, portfolio: null })} onSave={handleSavePortfolio} />}
      {profileEditorOpen && <ProfileEditorModal profile={profile} copy={copy} locale={locale} initialProfile={initialProfile} onClose={() => setProfileEditorOpen(false)} onSave={async (nextProfile) => { if (!isAdmin) return; setProfile(toProfileShape(nextProfile)); setProfileEditorOpen(false); }} />}
      <AuthModal copy={copy} isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      {confirmState && <ConfirmDialog title={confirmState.title} description={confirmState.description} copy={copy} onCancel={() => setConfirmState(null)} onConfirm={confirmState.onConfirm} />}

      {/* 🔥 新增：Lumina 传片中心 */}
      <AnimatePresence>
        {uploadingOrderNo && (
          <LuminaUploadCenter 
            orderNo={uploadingOrderNo} 
            onCancel={() => setUploadingOrderNo(null)}
            onComplete={() => {
              setUploadingOrderNo(null);
              // 注意：此处若需要自动刷新 AdminDashboardPage 的订单列表，
              // 可以在该页面内部通过 WebSocket 或重新挂载来触发刷新。
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}