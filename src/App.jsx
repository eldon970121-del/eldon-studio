import { useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

const DB_NAME = "eldon-studio-site";
const STORE_NAME = "persistent-state";
const STORAGE_KEY = "eldon-portfolios";
const LOCAL_STORAGE_KEY = "eldon-portfolios-fallback";
const PROFILE_STORAGE_KEY = "eldon-profile";
const PROFILE_LOCAL_STORAGE_KEY = "eldon-profile-fallback";
const LOCALE_STORAGE_KEY = "eldon-locale";
const LUMINA_URL = import.meta.env.VITE_LUMINA_URL || "http://127.0.0.1:5173";
const BACKUP_FILE_TYPE = "eldon-studio-backup";
const BACKUP_FILE_VERSION = 1;

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

const initialPortfolios = [
  {
    id: 1,
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
];

const practiceRows = [
  {
    label: { en: "Approach", zh: "工作方式" },
    value: { en: "Portrait / Editorial / Documentary", zh: "肖像 / 编辑 / 纪实" },
  },
  {
    label: { en: "Based In", zh: "常驻城市" },
    value: { en: "Shanghai / Tokyo", zh: "上海 / 东京" },
  },
  {
    label: { en: "Bookings", zh: "预约状态" },
    value: { en: "Selected Projects Only", zh: "仅接受精选项目" },
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
      cinematicDirection: "Cinematic portrait direction",
      navArchive: "Archive",
      navBooking: "Booking",
      navLumina: "Lumina App",
      visualDirection: "Visual direction 2026",
      heading:
        "Portraits framed with restraint, atmosphere, and a cleaner emotional signal.",
      viewArchive: "View Archive",
      openLumina: "Open Lumina",
      studioNote: "Studio note",
      studioNoteText:
        "Each commission is treated as a controlled sequence rather than a one-off image.",
      portraitSystem: "Portrait system",
      creativeStance: "Creative stance",
      creativeStanceText:
        "Built for private commissions, editorial portraiture, and art-directed identity work where styling remains secondary to expression.",
      workflow: "Workflow",
      workflowText:
        "Website archive, local upload management, and direct handoff into Lumina scheduling.",
      studioPreview: "Studio Preview",
      selectedFrame: "Selected Frame",
      emptyTitle: "Upload local work to start shaping the archive.",
    },
    practice: {
      label: "Practice",
      heading:
        "The visual system stays minimal so the emotional read lands first.",
      principleLabel: "Working principle",
      principleText:
        "Atmosphere is built through subtraction: fewer visual decisions, more intentional emotional signal.",
      lead:
        "Every tonal shift in the frame serves the subject. Space, styling, and architecture are kept restrained so the emotional center remains exact and unforced.",
      columns: [
        {
          title: "Portrait",
          text: "The figure remains the only true anchor, never one more element inside the styling.",
        },
        {
          title: "Narrative",
          text: "Details carry the story without asking captions to explain what the frame should already hold.",
        },
        {
          title: "Control",
          text: "Whitespace, darkness, and silence stay protected so the image never feels overworked.",
        },
      ],
    },
    story: {
      label: "Narrative",
      heading: "Selected sequences.",
      text:
        "These are not categories, but fragments that hold the visual method behind Eldon Studio.",
      readingMode: "Reading mode",
      readingModeText: "Image first, text second, atmosphere before explanation.",
      sequence: "Sequence",
      selectedSeries: "Selected series",
      fragment: "Narrative fragment",
      commission: "Editorial sequence / private commission",
      study: "Study",
    },
    gallery: {
      label: "Archive",
      heading: "Photography archive",
      text:
        "Open a portfolio to manage its photographs, upload new work, and set the cover image. Each language version stays separate in the interface.",
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
      label: "Contact",
      heading: "Booking & side projects",
      bookingLabel: "Booking",
      bookingHeading: "Contact for commissions",
      bookingText:
        "Available for editorial portrait, campaign portraiture, and long-form commissioned series. Booking enquiries can later move directly into Lumina scheduling.",
      namePlaceholder: "Name",
      briefPlaceholder: "Project brief",
      bookNow: "Book Now",
      connectLumina: "Connect to Lumina scheduling system",
      savedDraft:
        "The booking request has been saved as a front-end draft and can later connect to a real scheduling endpoint.",
      sideProjectsLabel: "Side Projects",
      sideProjectsHeading: "Personal systems.",
      learnMore: "Learn More",
    },
    footer: {
      text:
        "Portrait commissions, narrative studies, and local archive management connected through Lumina workflow.",
      poweredBy: "Powered by Lumina workflow",
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
      cinematicDirection: "电影感肖像方向",
      navArchive: "作品归档",
      navBooking: "联系预约",
      navLumina: "Lumina 应用",
      visualDirection: "2026 视觉方向",
      heading: "以克制、氛围与更纯净情绪信号完成肖像表达。",
      viewArchive: "查看归档",
      openLumina: "打开 Lumina",
      studioNote: "工作室说明",
      studioNoteText: "每一次委托都被视作一段被控制的序列，而不是单张图像的偶然产出。",
      portraitSystem: "肖像系统",
      creativeStance: "创作立场",
      creativeStanceText:
        "适用于私人与定制委托、编辑肖像与艺术指导型身份拍摄，风格化元素始终从属于人物表达。",
      workflow: "工作流",
      workflowText: "网站归档、本地图片管理，以及与 Lumina 排期系统的直接衔接。",
      studioPreview: "工作室预览",
      selectedFrame: "精选画面",
      emptyTitle: "上传本地作品后，即可开始构建你的摄影归档。",
    },
    practice: {
      label: "实践方法",
      heading: "让视觉系统保持最小化，情绪读取才能率先落位。",
      principleLabel: "工作原则",
      principleText: "氛围来自删减：更少的视觉决定，更准确的情绪信号。",
      lead:
        "画面中的每一次明暗变化都服务于人物本身。空间、造型与建筑被控制在足够克制的范围内，让情绪核心保持精确且不被打断。",
      columns: [
        {
          title: "人物",
          text: "人物始终是唯一真正的锚点，而不是造型体系中的附属元素。",
        },
        {
          title: "叙事",
          text: "细节本身承载叙事，不依赖额外文字去解释一张画面本应表达的内容。",
        },
        {
          title: "控制",
          text: "留白、暗部与安静感都会被保留，避免图像被过度加工。",
        },
      ],
    },
    story: {
      label: "叙事片段",
      heading: "精选序列。",
      text: "这些并非普通分类，而是构成 Eldon Studio 视觉方法的若干片段。",
      readingMode: "阅读方式",
      readingModeText: "先看图像，再读文字，让氛围领先于解释。",
      sequence: "序列",
      selectedSeries: "精选系列",
      fragment: "叙事片段",
      commission: "编辑委托 / 私人定制",
      study: "研究样本",
    },
    gallery: {
      label: "作品归档",
      heading: "摄影档案",
      text: "进入摄影集后可管理图片、继续上传新作品并设置封面。界面中的中英文版本会严格分开显示。",
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
      label: "联系与预约",
      heading: "预约与延伸项目",
      bookingLabel: "预约",
      bookingHeading: "联系进行委托拍摄",
      bookingText:
        "可承接编辑肖像、品牌肖像与长期委托系列。预约线索后续可直接衔接至 Lumina 排期系统。",
      namePlaceholder: "姓名",
      briefPlaceholder: "拍摄需求简介",
      bookNow: "立即预约",
      connectLumina: "接入 Lumina 摄影调度系统",
      savedDraft: "该预约请求已作为前端草稿保存，后续可直接接入真实排期接口。",
      sideProjectsLabel: "个人项目",
      sideProjectsHeading: "个人系统。",
      learnMore: "了解更多",
    },
    footer: {
      text: "肖像委托、叙事研究与本地图像归档管理，统一接入 Lumina 工作流。",
      poweredBy: "由 Lumina 工作流支持",
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
    },
  },
};

function getLocalizedText(value, locale = "en") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[locale] || value.en || value.zh || "";
  }

  return typeof value === "string" ? value : "";
}

function toLocalizedField(value, fallback = { en: "", zh: "" }) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      en: value.en?.trim() || fallback.en || "",
      zh: value.zh?.trim() || value.en?.trim() || fallback.zh || fallback.en || "",
    };
  }

  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return {
      en: fallback.en || "",
      zh: fallback.zh || fallback.en || "",
    };
  }

  if (text === fallback.en || text === fallback.zh) {
    return {
      en: fallback.en || text,
      zh: fallback.zh || text,
    };
  }

  return {
    en: text,
    zh: text,
  };
}

function openPortfolioDb() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadValueFromStorage(indexedDbKey, localStorageKey) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const db = await openPortfolioDb();
    if (db) {
      const result = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(indexedDbKey);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
      });

      if (result !== undefined && result !== null) {
        return result;
      }
    }
  } catch {
    // Fall back to localStorage below.
  }

  try {
    const fallback = window.localStorage.getItem(localStorageKey);
    if (!fallback) {
      return null;
    }

    const parsed = JSON.parse(fallback);
    return parsed ?? null;
  } catch {
    return null;
  }
}

async function loadPortfoliosFromStorage() {
  return loadValueFromStorage(STORAGE_KEY, LOCAL_STORAGE_KEY);
}

async function saveValueToStorage(indexedDbKey, localStorageKey, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const db = await openPortfolioDb();
    if (db) {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(value, indexedDbKey);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  } catch {
    // Keep localStorage fallback.
  }

  try {
    window.localStorage.setItem(localStorageKey, JSON.stringify(value));
  } catch {
    // Ignore fallback persistence issues.
  }
}

async function savePortfoliosToStorage(portfolios) {
  return saveValueToStorage(STORAGE_KEY, LOCAL_STORAGE_KEY, portfolios);
}

async function loadProfileFromStorage() {
  const value = await loadValueFromStorage(PROFILE_STORAGE_KEY, PROFILE_LOCAL_STORAGE_KEY);
  return value && typeof value === "object" ? value : null;
}

async function saveProfileToStorage(profile) {
  return saveValueToStorage(PROFILE_STORAGE_KEY, PROFILE_LOCAL_STORAGE_KEY, profile);
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function toPortfolioShape(portfolio) {
  const images = Array.isArray(portfolio.images) ? portfolio.images : [];
  const initialMatch =
    initialPortfolios.find(
      (seed) =>
        seed.id === portfolio.id ||
        getLocalizedText(seed.title, "en") === portfolio.title ||
        getLocalizedText(seed.title, "zh") === portfolio.title,
    ) || fallbackPortfolioContent;
  const normalizedImages = images
    .filter((image) => image?.url)
    .map((image, index) => ({
      id: image.id ?? Date.now() + index,
      url: image.url,
      isCover: Boolean(image.isCover),
    }));

  if (normalizedImages.length > 0 && !normalizedImages.some((image) => image.isCover)) {
    normalizedImages[0].isCover = true;
  }

  return {
    id: portfolio.id ?? Date.now(),
    title: toLocalizedField(portfolio.title, initialMatch.title || fallbackPortfolioContent.title),
    description: toLocalizedField(
      portfolio.description,
      initialMatch.description || fallbackPortfolioContent.description,
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
    avatarUrl: profile?.avatarUrl || initialProfile.avatarUrl,
  };
}

function createBackupPayload({ portfolios, profile, locale }) {
  return {
    type: BACKUP_FILE_TYPE,
    version: BACKUP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    locale: locale === "zh" ? "zh" : "en",
    profile: toProfileShape(profile),
    portfolios: Array.isArray(portfolios) ? portfolios.map(toPortfolioShape) : [],
  };
}

function normalizeBackupPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("invalid-backup");
  }

  if (
    payload.type !== BACKUP_FILE_TYPE ||
    payload.version !== BACKUP_FILE_VERSION ||
    !Array.isArray(payload.portfolios)
  ) {
    throw new Error("invalid-backup");
  }

  return {
    locale: payload.locale === "zh" ? "zh" : "en",
    profile: toProfileShape(payload.profile),
    portfolios: payload.portfolios.map(toPortfolioShape),
  };
}

function getCoverImage(portfolio) {
  if (!portfolio || !Array.isArray(portfolio.images)) {
    return null;
  }
  return portfolio.images.find((image) => image.isCover) || portfolio.images[0] || null;
}

function useReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isVisible || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: options.threshold ?? 0.18,
        rootMargin: options.rootMargin ?? "0px 0px -10% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, options.rootMargin, options.threshold]);

  return [ref, isVisible];
}

function RevealBlock({ children, className = "", delay = 0, style, ...props }) {
  const [ref, isVisible] = useReveal();

  return (
    <div
      ref={ref}
      {...props}
      className={`${className} transition duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms`, ...(style || {}) }}
    >
      {children}
    </div>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.7]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.6]">
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

function IconArrow({ direction = "left" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 fill-none stroke-current stroke-[1.7] ${direction === "right" ? "rotate-180" : ""}`}
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.8]">
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function AdminActionButton({ label, onClick, tone = "default", children }) {
  const toneClass =
    tone === "danger"
      ? "border-red-500/30 text-red-300 hover:border-red-400/60 hover:text-red-100"
      : "border-[color:var(--site-border)] text-[color:var(--site-muted-strong)] hover:border-[color:var(--site-accent)] hover:text-[color:var(--site-text)]";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={`micro-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-[color:var(--site-bg-deep)]/88 backdrop-blur-md ${toneClass}`}
    >
      {children}
    </button>
  );
}

function AdminToggle({ isAdmin, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle admin mode"
      className={`micro-button fixed bottom-5 right-5 z-[90] flex h-12 w-12 items-center justify-center rounded-2xl border text-[10px] uppercase tracking-[0.36em] backdrop-blur-md ${
        isAdmin
          ? "border-[color:var(--site-accent)] bg-[color:var(--site-accent-soft)] text-[color:var(--site-text)] shadow-soft"
          : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/55 text-[color:var(--site-muted)] hover:border-[color:var(--site-border-strong)] hover:text-[color:var(--site-text)]"
      }`}
    >
      ADM
    </button>
  );
}

function LanguageToggle({ locale, onToggle }) {
  return (
    <div className="fixed right-5 top-5 z-[95] inline-flex rounded-full border border-[color:var(--site-border)] bg-white/86 p-1 shadow-soft backdrop-blur-md">
      {[
        { value: "en", label: "EN" },
        { value: "zh", label: "中文" },
      ].map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onToggle(item.value)}
          className={`micro-button rounded-full px-4 py-2 text-[11px] font-medium uppercase transition ${
            locale === item.value
              ? "bg-[color:var(--site-accent)] text-white"
              : "text-[color:var(--site-muted-strong)] hover:text-[color:var(--site-text)]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function AdminDataPanel({
  copy,
  locale,
  backupFileName,
  backupStatus,
  onExport,
  onSelectFile,
  onRestore,
}) {
  const inputRef = useRef(null);
  const statusClass =
    backupStatus?.tone === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-100"
      : backupStatus?.tone === "success"
        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
        : "border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/58 text-[color:var(--site-muted)]";

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
      <RevealBlock className="overflow-hidden rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.42em] text-[color:var(--site-accent)]">
              {copy.admin.mode}
            </p>
            <h2
              className={`mt-4 font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl ${
                locale === "zh" ? "tracking-[-0.03em]" : "tracking-[-0.05em]"
              }`}
            >
              {copy.admin.dataTools}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.admin.dataToolsText}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.admin.dataTools}
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.admin.dataToolsSummary}
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(event) => onSelectFile(event.target.files?.[0] || null)}
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onExport}
                className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#10131c] transition hover:bg-[color:var(--site-accent-strong)]"
              >
                {copy.admin.exportBackup}
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-5 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
              >
                {copy.admin.selectBackupFile}
              </button>
              <button
                type="button"
                onClick={onRestore}
                className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-5 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
              >
                {copy.admin.restoreBackup}
              </button>
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-panel-soft)]/68 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                {copy.admin.selectedBackup}
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--site-text)]">
                {backupFileName || copy.admin.noBackupSelected}
              </p>
            </div>

            {backupStatus?.message ? (
              <div className={`mt-4 rounded-[1.25rem] border px-4 py-3 text-sm ${statusClass}`}>
                {backupStatus.message}
              </div>
            ) : null}
          </div>
        </div>
      </RevealBlock>
    </section>
  );
}

function HeroCarousel({ items, copy, locale }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => (current >= items.length ? 0 : current));
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [items.length]);

  return (
    items.length === 0 ? (
      <div className="relative flex min-h-[420px] items-end overflow-hidden rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,#1b1d24_0%,#12141a_100%)] p-6 shadow-soft sm:min-h-[560px] sm:p-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.38em] text-[color:var(--site-accent)]">
            {copy.hero.studioPreview}
          </p>
          <p className="mt-4 max-w-sm text-2xl font-semibold tracking-[-0.04em] text-[color:var(--site-text)]">
            {copy.hero.emptyTitle}
          </p>
        </div>
      </div>
    ) : (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-[2rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] shadow-soft sm:min-h-[560px]">
      {items.map((item, index) => (
        <div
          key={`${item.src}-${index}`}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={item.src} alt={getLocalizedText(item.title, locale)} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,17,22,0.08)_0%,rgba(16,17,22,0.16)_35%,rgba(16,17,22,0.72)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(77,144,254,0.16),transparent_24%)]" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,rgba(15,16,20,0)_0%,rgba(15,16,20,0.94)_100%)] px-5 pb-5 pt-20 sm:px-7 sm:pb-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--site-accent)]">
              {copy.hero.selectedFrame}
            </p>
            <p className="mt-3 max-w-sm text-lg font-semibold text-[color:var(--site-text)]">
              {getLocalizedText(items[activeIndex]?.title, locale)}
            </p>
          </div>

          <div className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              {items.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  aria-label={`${copy.hero.selectedFrame} ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    index === activeIndex ? "bg-[color:var(--site-accent)]" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-5 top-5 z-20 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-4 py-2 text-[10px] uppercase tracking-[0.38em] text-[color:var(--site-muted)] backdrop-blur-md sm:right-7 sm:top-7">
        {copy.hero.studioPreview}
      </div>
    </div>
    )
  );
}

function HeroSection({ portfolios, profile, isAdmin, onEditProfile, copy, locale }) {
  const carouselItems = portfolios.flatMap((portfolio) =>
    portfolio.images.map((image) => ({
      src: image.url,
      title: portfolio.title,
    })),
  );

  return (
    <section id="top" className="relative overflow-hidden px-4 pb-8 pt-4 sm:px-6 sm:pb-10 lg:px-10 lg:pb-14">
      <div className="mx-auto max-w-7xl rounded-[2.4rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-6 border-b border-[color:var(--site-border-soft)] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <a href="#top" className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--site-accent)]">
              ES
            </span>
            <span>
              <span className="block text-xl font-semibold tracking-[-0.04em] text-[color:var(--site-text)] sm:text-2xl">
                {getLocalizedText(profile.name, locale)}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.34em] text-[color:var(--site-muted)]">
                {copy.hero.cinematicDirection}
              </span>
            </span>
          </a>

          <nav className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.34em] text-[color:var(--site-muted)]">
            {[
              { href: "#gallery", label: copy.hero.navArchive },
              { href: "#booking", label: copy.hero.navBooking },
              { href: LUMINA_URL, label: copy.hero.navLumina, external: true },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] px-4 py-2 transition hover:border-[color:var(--site-border-strong)] hover:text-[color:var(--site-text)]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="grid gap-6 pt-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[2.1rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft sm:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[color:var(--site-glow)] blur-3xl" />
            <div>
              <div className="mb-8 flex items-center gap-4">
                <img
                  src={profile.avatarUrl}
                  alt={getLocalizedText(profile.name, locale)}
                  className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10 sm:h-20 sm:w-20"
                />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
                    {getLocalizedText(profile.role, locale)}
                  </p>
                  <a
                    href={`mailto:${profile.email}`}
                    className="mt-2 inline-block text-sm text-[color:var(--site-muted-strong)] transition hover:text-[color:var(--site-text)]"
                  >
                    {profile.email}
                  </a>
                </div>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={onEditProfile}
                    className="micro-button ml-auto inline-flex items-center gap-2 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)] hover:text-[color:var(--site-accent)]"
                  >
                    <IconEdit />
                    {copy.admin.editProfile}
                  </button>
                ) : null}
              </div>

              <div className="inline-flex rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/80 px-4 py-2 text-[10px] uppercase tracking-[0.4em] text-[color:var(--site-accent)]">
                {copy.hero.visualDirection}
              </div>

              <h1 className={`mt-8 max-w-2xl font-display text-5xl font-semibold text-[color:var(--site-text)] sm:text-6xl lg:text-7xl ${locale === "zh" ? "leading-[1.06] tracking-[-0.04em]" : "leading-[0.92] tracking-[-0.06em]"}`}>
                {copy.hero.heading}
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-8 text-[color:var(--site-muted)] sm:text-base">
                {getLocalizedText(profile.intro, locale)}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#gallery"
                  className="rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#10131c] transition hover:bg-[color:var(--site-accent-strong)]"
                >
                  {copy.hero.viewArchive}
                </a>
                <a
                  href={LUMINA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-5 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)]"
                >
                  {copy.hero.openLumina}
                </a>
              </div>
            </div>

            <div className="mt-10 rounded-[1.7rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/54 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[color:var(--site-border-soft)] pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                    {copy.hero.studioNote}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted)]">
                    {copy.hero.studioNoteText}
                  </p>
                </div>
                <span className="hidden rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)] sm:inline-flex">
                  {copy.hero.portraitSystem}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
              {practiceRows.map((row) => (
                <div
                  key={getLocalizedText(row.label, "en")}
                  className="rounded-[1.35rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-4 py-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.36em] text-[color:var(--site-muted)]">
                    {getLocalizedText(row.label, locale)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted-strong)]">
                    {getLocalizedText(row.value, locale)}
                  </p>
                </div>
              ))}
            </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-rows-[minmax(0,1fr)_auto]">
            <HeroCarousel items={carouselItems} copy={copy} locale={locale} />

            <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] p-5">
                <p className="text-[10px] uppercase tracking-[0.38em] text-[color:var(--site-accent)]">
                  {copy.hero.creativeStance}
                </p>
                <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--site-muted)]">
                  {copy.hero.creativeStanceText}
                </p>
              </div>

              <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 p-5">
                <p className="text-[10px] uppercase tracking-[0.38em] text-[color:var(--site-muted)]">
                  {copy.hero.workflow}
                </p>
                <p className="mt-4 text-sm leading-7 text-[color:var(--site-text)]">
                  {copy.hero.workflowText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PracticeSection({ copy, locale }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-20">
      <RevealBlock className="rounded-[1.95rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft sm:p-8">
        <p className="mb-4 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
          {copy.practice.label}
        </p>
        <h2 className={`max-w-md font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl ${locale === "zh" ? "leading-[1.14] tracking-[-0.03em]" : "leading-tight tracking-[-0.05em]"}`}>
          {copy.practice.heading}
        </h2>

        <div className="mt-8 rounded-[1.4rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-4">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
            {copy.practice.principleLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted-strong)]">
            {copy.practice.principleText}
          </p>
        </div>
      </RevealBlock>

      <RevealBlock
        delay={120}
        className="rounded-[1.95rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft sm:p-8"
      >
        <p className="max-w-2xl text-base leading-8 text-[color:var(--site-text)]/84">
          {copy.practice.lead}
        </p>

        <div className="mt-8 grid gap-4 border-t border-[color:var(--site-border-soft)] pt-6 sm:grid-cols-3">
          {copy.practice.columns.map((item, index) => (
            <div
              key={item.title}
              className="rounded-[1.45rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-5"
              style={{
                transitionDelay: `${index * 80}ms`,
              }}
            >
              <p className="text-[11px] uppercase tracking-[0.38em] text-[color:var(--site-accent)]">
                {item.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </RevealBlock>
    </section>
  );
}

function StorySection({ portfolios, copy, locale }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 border-t border-[color:var(--site-border-soft)] px-4 py-20 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-10 lg:py-24">
      <RevealBlock className="lg:sticky lg:top-10 lg:h-fit">
        <div className="rounded-[1.9rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft">
          <p className="mb-4 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
            {copy.story.label}
          </p>
          <h2 className={`font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl ${locale === "zh" ? "leading-[1.12] tracking-[-0.03em]" : "tracking-[-0.05em]"}`}>
            {copy.story.heading}
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[color:var(--site-muted)]">
            {copy.story.text}
          </p>

          <div className="mt-8 rounded-[1.4rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 p-4">
            <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
              {copy.story.readingMode}
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--site-muted-strong)]">
              {copy.story.readingModeText}
            </p>
          </div>
        </div>
      </RevealBlock>

      <div className="space-y-8">
        {portfolios.slice(0, 3).map((portfolio, index) => (
          <RevealBlock key={portfolio.id} delay={index * 120}>
            <article className="grid gap-5 rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-5 shadow-soft md:grid-cols-[1.15fr_0.85fr]">
              <div className="relative overflow-hidden rounded-[1.8rem] border border-[color:var(--site-border-soft)]">
                <img
                  src={portfolio.images[(index + 1) % portfolio.images.length]?.url || getCoverImage(portfolio)?.url}
                  alt={getLocalizedText(portfolio.title, locale)}
                  className="h-[320px] w-full object-cover transition duration-700 hover:scale-[1.03] sm:h-[420px]"
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,18,0.06)_0%,rgba(12,13,18,0.22)_38%,rgba(12,13,18,0.84)_100%)]" />
                <div className="absolute right-4 top-4 flex items-start justify-end gap-3">
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
                    {copy.story.sequence}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <div className="rounded-[1.35rem] border border-white/10 bg-[color:var(--site-bg-deep)]/62 p-4 backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-accent)]">
                      {copy.story.selectedSeries}
                    </p>
                    <h3 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.05em] text-[color:var(--site-text)]">
                      {getLocalizedText(portfolio.title, locale)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-muted)]">
                    {copy.story.fragment}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">
                    {getLocalizedText(portfolio.description, locale)}
                  </p>
                </div>

                <div className="mt-8 border-t border-[color:var(--site-border-soft)] pt-4">
                  <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/72 px-4 py-4 text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                    <span>{copy.story.commission}</span>
                    <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                      {copy.story.study}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </RevealBlock>
        ))}
      </div>
    </section>
  );
}

function PortfolioCard({ portfolio, isAdmin, onOpen, onEdit, onDelete, copy, locale }) {
  const coverImage = getCoverImage(portfolio);

  return (
    <article className="group relative overflow-hidden rounded-[1.85rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] shadow-soft transition duration-500 hover:-translate-y-1.5 hover:border-[color:var(--site-border-strong)]">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--site-bg-deep)]">
          {coverImage ? (
            <img
              src={coverImage.url}
              alt={getLocalizedText(portfolio.title, locale)}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center bg-[color:var(--site-bg-deep)]/72 px-6 text-center text-sm text-[color:var(--site-muted)]">
              {copy.gallery.noCover}
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,18,0.08)_0%,rgba(12,13,18,0.2)_34%,rgba(12,13,18,0.82)_100%)]" />

          <div className="absolute right-4 top-4 flex items-start justify-end gap-3">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/72 backdrop-blur-md">
              {portfolio.images.length} {copy.gallery.imagesSuffix}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="rounded-[1.35rem] border border-white/10 bg-[color:var(--site-bg-deep)]/62 p-4 backdrop-blur-md transition duration-500 group-hover:border-white/20">
              <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                {copy.gallery.selectedSeries}
              </p>
              <h3 className="mt-2 text-[1.55rem] font-semibold leading-tight tracking-[-0.05em] text-[color:var(--site-text)]">
                {getLocalizedText(portfolio.title, locale)}
              </h3>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--site-border-soft)] p-5">
          <p className="min-h-[3.75rem] text-sm leading-6 text-[color:var(--site-muted)]">
            {getLocalizedText(portfolio.description, locale)}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-[color:var(--site-border-soft)] pt-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--site-accent)]" />
              {copy.gallery.archiveDetail}
            </div>
            <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)] transition group-hover:bg-white/[0.08]">
              {copy.gallery.open}
            </span>
          </div>
        </div>
      </button>

      {isAdmin ? (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
          <AdminActionButton label={copy.detail.editPortfolio} onClick={onEdit}>
            <IconEdit />
          </AdminActionButton>
          <AdminActionButton label={copy.detail.deletePortfolio} onClick={onDelete} tone="danger">
            <IconTrash />
          </AdminActionButton>
        </div>
      ) : null}
    </article>
  );
}

function AddPortfolioCard({ onClick, copy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copy.gallery.addCardLabel}
      className="micro-button flex min-h-[440px] w-full flex-col items-start justify-between rounded-[1.85rem] border border-dashed bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] px-6 py-6 text-left transition hover:border-[color:var(--site-border-strong)] hover:bg-white/[0.05]"
      style={{ borderColor: "var(--site-border)" }}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <span className="rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted)]">
          {copy.gallery.addCardBadge}
        </span>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl"
          style={{ borderColor: "var(--site-border)", color: "var(--site-accent)" }}
        >
          <IconPlus />
        </span>
      </div>

      <div>
        <span className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
          {copy.gallery.addCardEyebrow}
        </span>
        <p className="mt-3 text-[1.85rem] font-semibold leading-tight tracking-[-0.05em] text-[color:var(--site-text)]">
          {copy.gallery.addCardTitle}
        </p>
        <p className="mt-3 max-w-[18rem] text-sm leading-7 text-[color:var(--site-muted)]">
          {copy.gallery.addCardText}
        </p>
      </div>

      <div className="flex w-full items-center justify-between gap-2 border-t border-[color:var(--site-border-soft)] pt-4 text-[10px] uppercase tracking-[0.3em] text-[color:var(--site-muted)]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[color:var(--site-accent)]" />
          {copy.gallery.addCardFooter}
        </span>
        <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[color:var(--site-muted-strong)]">
          {copy.gallery.addCardAction}
        </span>
      </div>
    </button>
  );
}

function PortfolioMasonry({ portfolios, isAdmin, onAdd, onOpen, onEdit, onDelete, copy, locale }) {
  return (
    <section id="gallery" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-24">
      <RevealBlock className="mb-10 flex flex-col gap-5 border-b border-[color:var(--site-border)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
            {copy.gallery.label}
          </p>
          <h2 className={`font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl ${locale === "zh" ? "tracking-[-0.03em]" : "tracking-[-0.05em]"}`}>
            {copy.gallery.heading}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
          {copy.gallery.text}
        </p>

        {isAdmin ? (
          <button
            type="button"
            onClick={onAdd}
            className="micro-button inline-flex items-center gap-2 self-start rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-[color:var(--site-text)] transition hover:border-[color:var(--site-border-strong)] hover:text-[color:var(--site-accent)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--site-border)] text-[color:var(--site-accent)]">
              <IconPlus />
            </span>
            {copy.gallery.newPortfolio}
          </button>
        ) : null}
      </RevealBlock>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {isAdmin ? (
          <RevealBlock>
            <AddPortfolioCard onClick={onAdd} copy={copy} />
          </RevealBlock>
        ) : null}

        {portfolios.map((portfolio, index) => (
          <RevealBlock key={portfolio.id} delay={index * 60}>
            <PortfolioCard
              portfolio={portfolio}
              isAdmin={isAdmin}
              copy={copy}
              locale={locale}
              onOpen={() => onOpen(portfolio.id)}
              onEdit={() => onEdit(portfolio)}
              onDelete={() => onDelete(portfolio.id)}
            />
          </RevealBlock>
        ))}
      </div>
    </section>
  );
}

function PortfolioEditorModal({ portfolio, onClose, onSave, copy }) {
  const initialTitle = toLocalizedField(portfolio?.title, fallbackPortfolioContent.title);
  const initialDescription = toLocalizedField(
    portfolio?.description,
    fallbackPortfolioContent.description,
  );
  const [titleEn, setTitleEn] = useState(initialTitle.en);
  const [titleZh, setTitleZh] = useState(initialTitle.zh);
  const [descriptionEn, setDescriptionEn] = useState(initialDescription.en);
  const [descriptionZh, setDescriptionZh] = useState(initialDescription.zh);
  const [selectedCoverId, setSelectedCoverId] = useState(getCoverImage(portfolio)?.id ?? null);
  const [localFiles, setLocalFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const localFilesRef = useRef([]);
  const isCreateMode = !portfolio;
  const coverCandidates = [
    ...(portfolio?.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      source: "existing",
    })),
    ...localFiles.map((item) => ({
      id: item.id,
      url: item.previewUrl,
      source: "staged",
    })),
  ];

  function syncLocalFiles(updater) {
    setLocalFiles((current) => {
      const nextValue = typeof updater === "function" ? updater(current) : updater;
      localFilesRef.current = nextValue;
      return nextValue;
    });
  }

  function appendLocalFiles(acceptedFiles) {
    if (acceptedFiles.length === 0) {
      return;
    }

    const nextFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    syncLocalFiles((current) => {
      const merged = [...current, ...nextFiles];

      setSelectedCoverId((currentCoverId) => currentCoverId ?? merged[0]?.id ?? null);

      return merged;
    });
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    noClick: true,
    onDrop: appendLocalFiles,
  });

  useEffect(() => {
    return () => {
      localFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSave() {
    const nextTitleEn = titleEn.trim();
    const nextTitleZh = titleZh.trim();
    const nextDescriptionEn = descriptionEn.trim();
    const nextDescriptionZh = descriptionZh.trim();

    if (nextTitleEn.length > 90 || nextTitleZh.length > 90) {
      setErrorMessage(copy.admin.titleTooLong);
      return;
    }

    if (isCreateMode && localFiles.length === 0) {
      setErrorMessage(copy.admin.selectImageFirst);
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      const uploadedImages =
        localFiles.length > 0
          ? await Promise.all(
              localFiles.map(async (item) => ({
                id: item.id,
                url: await toDataUrl(item.file),
                isCover: false,
              })),
            )
          : undefined;

      await onSave({
        id: portfolio?.id,
        title: {
          en: nextTitleEn || nextTitleZh || copy.admin.untitled,
          zh: nextTitleZh || nextTitleEn || copy.admin.untitled,
        },
        description: {
          en: nextDescriptionEn || nextDescriptionZh || copy.admin.defaultDescription,
          zh: nextDescriptionZh || nextDescriptionEn || copy.admin.defaultDescription,
        },
        coverImageId: selectedCoverId,
        images: uploadedImages,
      });

      if (isCreateMode) {
        localFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        localFilesRef.current = [];
        setLocalFiles([]);
      }
    } catch {
      setErrorMessage(copy.admin.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  function handleRemoveLocalFile(fileId) {
    const target = localFilesRef.current.find((item) => item.id === fileId);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }

    syncLocalFiles((current) => {
      const nextFiles = current.filter((item) => item.id !== fileId);
      setSelectedCoverId((currentCoverId) => {
        if (currentCoverId !== fileId) {
          return currentCoverId;
        }
        return (
          getCoverImage(portfolio)?.id ??
          nextFiles[0]?.id ??
          null
        );
      });
      return nextFiles;
    });
  }

  function handleClearFiles() {
    localFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    localFilesRef.current = [];
    setLocalFiles([]);
    setSelectedCoverId(getCoverImage(portfolio)?.id ?? null);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0d0f14]/78 px-4 py-4 backdrop-blur-md sm:py-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2.1rem] border bg-[linear-gradient(180deg,#1f2129_0%,#171920_100%)] p-5 shadow-soft sm:p-8"
        style={{ borderColor: "var(--site-border)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-[color:var(--site-border-soft)] pb-5">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
              {copy.admin.mode}
            </p>
            <h3 className="font-display text-3xl text-[color:var(--site-text)]">
              {portfolio ? copy.admin.editModalTitle : copy.admin.createModalTitle}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
              {isCreateMode
                ? copy.admin.createModalText
                : copy.admin.editModalText}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.detail.closeLightbox}
            className="micro-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 text-[color:var(--site-muted-strong)]"
          >
            <IconClose />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.admin.portfolioDetails}
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                {copy.admin.titleEnLabel}
              </span>
              <input
                type="text"
                maxLength={90}
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
                placeholder={copy.admin.titlePlaceholderEn}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                {copy.admin.titleZhLabel}
              </span>
              <input
                type="text"
                maxLength={90}
                value={titleZh}
                onChange={(event) => setTitleZh(event.target.value)}
                placeholder={copy.admin.titlePlaceholderZh}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                {copy.admin.descriptionEnLabel}
              </span>
              <textarea
                rows={4}
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                placeholder={copy.admin.descriptionPlaceholderEn}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
                {copy.admin.descriptionZhLabel}
              </span>
              <textarea
                rows={5}
                value={descriptionZh}
                onChange={(event) => setDescriptionZh(event.target.value)}
                placeholder={copy.admin.descriptionPlaceholderZh}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
              />
            </label>

            <div className="mt-5 rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/62 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                    {copy.admin.statusLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--site-muted-strong)]">
                    {isCreateMode
                      ? localFiles.length > 0
                        ? `${localFiles.length} ${copy.admin.localFilesSelected}`
                        : copy.admin.waitingForImages
                      : `${(portfolio?.images?.length || 0) + localFiles.length} ${copy.admin.imagesReadyAfterSave}`}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                  {isCreateMode ? copy.admin.createStatus : copy.admin.editStatus}
                </span>
              </div>
            </div>
          </div>

          {isCreateMode ? (
            <div className="rounded-[1.8rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5" style={{ borderColor: "var(--site-border)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                    {copy.admin.stagingTitle}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">
                    {copy.admin.stagingText}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                  {localFiles.length} files
                </span>
              </div>

              <div
                {...getRootProps()}
                className={`mt-4 rounded-[1.4rem] border-2 border-dashed px-6 py-10 text-center transition ${
                  isDragActive
                    ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
                    : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/60 hover:border-[color:var(--site-border-strong)]"
                }`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[color:var(--site-accent)]">
                  <IconUpload />
                </div>
                <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">
                  {copy.admin.uploadHint}
                </p>
                <button
                  type="button"
                  onClick={open}
                  className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-text)]"
                >
                  {copy.admin.browseFiles}
                </button>
              </div>

              {localFiles.length > 0 ? (
                <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {localFiles.map((item, index) => (
                      <div
                        key={item.id}
                        className="relative overflow-hidden rounded-[1.2rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/72"
                      >
                        <img src={item.previewUrl} alt={item.file.name} className="aspect-square w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveLocalFile(item.id)}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                          aria-label={`${copy.admin.removeImagePrefix} ${item.file.name}`}
                        >
                          <IconClose />
                        </button>
                        {selectedCoverId === item.id || (selectedCoverId === null && index === 0) ? (
                          <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                            {copy.admin.cover}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-[1.25rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/58 px-4 py-3">
                    <p className="text-sm leading-6 text-[color:var(--site-muted)]">
                      {copy.admin.createConfirmText}
                    </p>
                    <button
                      type="button"
                      onClick={handleClearFiles}
                      className="micro-button rounded-full border border-[color:var(--site-border)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-muted)]"
                    >
                      {copy.admin.clearFiles}
                    </button>
                  </div>
                </>
              ) : null}

              <div className="mt-4 rounded-[1.35rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/62 p-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[color:var(--site-muted)]">
                  {copy.admin.coverSelection}
                </p>
                {coverCandidates.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {coverCandidates.map((image) => (
                      <div
                        key={image.id}
                        className={`relative overflow-hidden rounded-[18px] border transition ${
                          selectedCoverId === image.id
                            ? "border-[color:var(--site-accent)] ring-2 ring-[color:var(--site-accent)]/15"
                            : "border-[color:var(--site-border)]"
                        }`}
                      >
                        <button type="button" onClick={() => setSelectedCoverId(image.id)} className="block w-full">
                          <img src={image.url} alt="" className="aspect-square h-full w-full object-cover" />
                        </button>
                        {image.source === "staged" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveLocalFile(image.id);
                            }}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                            aria-label={copy.admin.removeStagedImage}
                          >
                            <IconClose />
                          </button>
                        ) : null}
                        <span className="absolute left-2 top-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-muted-strong)]">
                          {image.source === "staged" ? copy.admin.new : copy.admin.saved}
                        </span>
                        {selectedCoverId === image.id ? (
                          <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                            {copy.admin.cover}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                    {copy.admin.emptyCoverCreate}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.8rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] px-5 py-5" style={{ borderColor: "var(--site-border)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
                    {copy.admin.coverSelection}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">
                    {copy.admin.coverSelectionText}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--site-border)] bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[color:var(--site-muted-strong)]">
                  {coverCandidates.length} images
                </span>
              </div>

              <div
                {...getRootProps()}
                className={`mt-4 rounded-[1.4rem] border-2 border-dashed px-6 py-8 text-center transition ${
                  isDragActive
                    ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
                    : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/60 hover:border-[color:var(--site-border-strong)]"
                }`}
              >
                <input {...getInputProps()} />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[color:var(--site-accent)]">
                  <IconUpload />
                </div>
                <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">
                  {copy.admin.uploadHintSecondary}
                </p>
                <button
                  type="button"
                  onClick={open}
                  className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-text)]"
                >
                  {copy.admin.browseFiles}
                </button>
              </div>

              {coverCandidates.length ? (
                <>
                  <div className="mt-4 grid max-h-[260px] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                    {coverCandidates.map((image) => (
                      <div
                        key={image.id}
                        className={`relative overflow-hidden rounded-[18px] border transition ${
                          selectedCoverId === image.id
                            ? "border-[color:var(--site-accent)] ring-2 ring-[color:var(--site-accent)]/15"
                            : "border-[color:var(--site-border)]"
                        }`}
                      >
                        <button type="button" onClick={() => setSelectedCoverId(image.id)} className="block w-full">
                          <img src={image.url} alt="" className="aspect-square h-full w-full object-cover" />
                        </button>
                        {image.source === "staged" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveLocalFile(image.id);
                            }}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[color:var(--site-bg-deep)]/82 text-[color:var(--site-text)]"
                            aria-label={copy.admin.removeStagedImage}
                          >
                            <IconClose />
                          </button>
                        ) : null}
                        <span className="absolute left-2 top-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--site-muted-strong)]">
                          {image.source === "staged" ? copy.admin.new : copy.admin.saved}
                        </span>
                        {selectedCoverId === image.id ? (
                          <span className="absolute inset-x-2 bottom-2 rounded-full bg-[color:var(--site-bg-deep)]/88 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[color:var(--site-accent)]">
                            {copy.admin.cover}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                  {copy.admin.emptyCoverEdit}
                </p>
              )}
            </div>
          )}
        </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-[1.25rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 -mx-5 border-t border-[color:var(--site-border-soft)] bg-[linear-gradient(180deg,rgba(23,25,32,0.84)_0%,rgba(23,25,32,0.96)_100%)] px-5 pb-1 pt-5 backdrop-blur-md sm:-mx-8 sm:mt-8 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.3em] text-[color:var(--site-muted)]"
          >
            {copy.admin.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (isCreateMode && localFiles.length === 0)}
            className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#10131c] disabled:opacity-50"
          >
            {isSaving
              ? copy.admin.processing
              : isCreateMode
                ? copy.admin.createPortfolio
                : copy.admin.saveChanges}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileEditorModal({ profile, onClose, onSave, copy, locale }) {
  const initialName = toLocalizedField(profile.name, initialProfile.name);
  const initialRole = toLocalizedField(profile.role, initialProfile.role);
  const initialIntro = toLocalizedField(profile.intro, initialProfile.intro);
  const [nameEn, setNameEn] = useState(initialName.en);
  const [nameZh, setNameZh] = useState(initialName.zh);
  const [roleEn, setRoleEn] = useState(initialRole.en);
  const [roleZh, setRoleZh] = useState(initialRole.zh);
  const [email, setEmail] = useState(profile.email);
  const [introEn, setIntroEn] = useState(initialIntro.en);
  const [introZh, setIntroZh] = useState(initialIntro.zh);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    noClick: true,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setAvatarFile((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }
        return { file, previewUrl };
      });
      setAvatarPreview(previewUrl);
    },
  });

  useEffect(() => {
    return () => {
      if (avatarFile?.previewUrl) {
        URL.revokeObjectURL(avatarFile.previewUrl);
      }
    };
  }, [avatarFile]);

  async function handleSave() {
    const nextNameEn = nameEn.trim();
    const nextNameZh = nameZh.trim();
    const nextRoleEn = roleEn.trim();
    const nextRoleZh = roleZh.trim();
    const nextEmail = email.trim();
    const nextIntroEn = introEn.trim();
    const nextIntroZh = introZh.trim();

    if (!(nextNameEn || nextNameZh) || !(nextRoleEn || nextRoleZh) || !nextEmail) {
      return;
    }

    setIsSaving(true);

    await onSave({
      name: {
        en: nextNameEn || nextNameZh || getLocalizedText(initialProfile.name, "en"),
        zh: nextNameZh || nextNameEn || getLocalizedText(initialProfile.name, "zh"),
      },
      role: {
        en: nextRoleEn || nextRoleZh || getLocalizedText(initialProfile.role, "en"),
        zh: nextRoleZh || nextRoleEn || getLocalizedText(initialProfile.role, "zh"),
      },
      email: nextEmail,
      intro: {
        en: nextIntroEn || nextIntroZh || getLocalizedText(initialProfile.intro, "en"),
        zh: nextIntroZh || nextIntroEn || getLocalizedText(initialProfile.intro, "zh"),
      },
      avatarUrl: avatarFile ? await toDataUrl(avatarFile.file) : profile.avatarUrl,
    });

    setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[81] flex items-center justify-center bg-[#0d0f14]/78 px-4 py-8 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-[2.1rem] border bg-[linear-gradient(180deg,#1f2129_0%,#171920_100%)] p-6 shadow-soft sm:p-8"
        style={{ borderColor: "var(--site-border)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-[color:var(--site-border-soft)] pb-5">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
              {copy.admin.mode}
            </p>
            <h3 className="font-display text-3xl text-[color:var(--site-text)]">{copy.admin.profileTitle}</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.admin.profileText}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.admin.cancel}
            className="micro-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 text-[color:var(--site-muted-strong)]"
          >
            <IconClose />
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.admin.avatar}
            </p>

            <div
              {...getRootProps()}
              className={`mt-5 rounded-[1.5rem] border-2 border-dashed px-5 py-6 text-center transition ${
                isDragActive
                  ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
                  : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/60 hover:border-[color:var(--site-border-strong)]"
              }`}
            >
              <input {...getInputProps()} />
              <img
                src={avatarPreview}
                alt={getLocalizedText(profile.name, locale)}
                className="mx-auto h-40 w-40 rounded-[1.5rem] object-cover ring-1 ring-white/10"
              />
              <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">
                {copy.admin.uploadHint}
              </p>
              <button
                type="button"
                onClick={open}
                className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-text)]"
              >
                {copy.admin.browseFiles}
              </button>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.02)_100%)] p-5">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.admin.photographerDetails}
            </p>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.nameEnLabel}</span>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(event) => setNameEn(event.target.value)}
                  placeholder={copy.admin.namePlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.nameZhLabel}</span>
                <input
                  type="text"
                  value={nameZh}
                  onChange={(event) => setNameZh(event.target.value)}
                  placeholder={copy.admin.namePlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.roleEnLabel}</span>
                <input
                  type="text"
                  value={roleEn}
                  onChange={(event) => setRoleEn(event.target.value)}
                  placeholder={copy.admin.rolePlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.roleZhLabel}</span>
                <input
                  type="text"
                  value={roleZh}
                  onChange={(event) => setRoleZh(event.target.value)}
                  placeholder={copy.admin.rolePlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.emailLabel}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.introEnLabel}</span>
                <textarea
                  rows={4}
                  value={introEn}
                  onChange={(event) => setIntroEn(event.target.value)}
                  placeholder={copy.admin.introPlaceholderEn}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">{copy.admin.introZhLabel}</span>
                <textarea
                  rows={4}
                  value={introZh}
                  onChange={(event) => setIntroZh(event.target.value)}
                  placeholder={copy.admin.introPlaceholderZh}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black placeholder:text-slate-500 outline-none transition focus:border-[color:var(--site-accent)]"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[color:var(--site-border-soft)] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.3em] text-[color:var(--site-muted)]"
          >
            {copy.admin.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#10131c] disabled:opacity-50"
          >
            {isSaving ? copy.admin.saving : copy.admin.saveProfile}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, description, onCancel, onConfirm, copy }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0d0f14]/78 px-4 backdrop-blur-md">
      <div
        className="w-full max-w-md rounded-[2rem] border bg-[linear-gradient(180deg,#1f2129_0%,#171920_100%)] p-6 shadow-soft"
        style={{ borderColor: "var(--site-border)" }}
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">{copy.confirm.deleteLabel}</p>
        <h3 className="mt-3 font-display text-3xl text-[color:var(--site-text)]">{title}</h3>
        <p className="mt-4 text-sm leading-7 text-[color:var(--site-muted)]">{description}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.3em] text-[color:var(--site-muted)]"
          >
            {copy.confirm.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="micro-button rounded-full border border-red-500/40 px-5 py-3 text-sm uppercase tracking-[0.3em] text-red-300"
          >
            {copy.confirm.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

function StagingUploadArea({ onConfirmUpload, copy }) {
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const stagedFilesRef = useRef([]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    noClick: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      const nextFiles = acceptedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setStagedFiles((current) => {
        const merged = [...current, ...nextFiles];
        stagedFilesRef.current = merged;
        return merged;
      });
    },
  });

  useEffect(() => {
    return () => {
      stagedFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  async function handleConfirmUpload() {
    if (stagedFiles.length === 0) {
      return;
    }

    setIsUploading(true);

    const uploadedImages = await Promise.all(
      stagedFiles.map(async (item, index) => ({
        id: Date.now() + index + Math.floor(Math.random() * 1000),
        url: await toDataUrl(item.file),
        isCover: false,
      })),
    );

    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    stagedFilesRef.current = [];
    await onConfirmUpload(uploadedImages);
    setStagedFiles([]);
    setIsUploading(false);
  }

  function handleClear() {
    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    stagedFilesRef.current = [];
    setStagedFiles([]);
  }

  return (
    <section className="rounded-[2rem] border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] p-5 shadow-soft sm:p-6">
      <div
        {...getRootProps()}
        className={`rounded-[1.75rem] border-2 border-dashed px-6 py-10 text-center transition ${
          isDragActive
            ? "border-[color:var(--site-accent)] bg-[color:var(--site-glow)]"
            : "border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/68 hover:border-[color:var(--site-border-strong)]"
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[color:var(--site-accent)]">
          <IconUpload />
        </div>
        <p className="mt-4 text-sm font-medium text-[color:var(--site-text)]">
          {copy.upload.hint}
        </p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--site-muted)]">
          {copy.upload.subtext}
        </p>
        <button
          type="button"
          onClick={open}
          className="micro-button mt-5 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--site-text)]"
        >
          {copy.upload.browse}
        </button>
      </div>

      {stagedFiles.length > 0 ? (
        <div className="mt-5">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stagedFiles.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-[1.2rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/72"
              >
                <img src={item.previewUrl} alt={item.file.name} className="aspect-square w-full object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[color:var(--site-border-soft)] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClear}
              disabled={isUploading}
              className="micro-button rounded-full border border-[color:var(--site-border)] px-5 py-3 text-sm uppercase tracking-[0.28em] text-[color:var(--site-muted)] disabled:opacity-50"
            >
              {copy.upload.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="micro-button rounded-full bg-[color:var(--site-accent)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-[#10131c] disabled:opacity-60"
            >
              {isUploading ? copy.upload.uploading : copy.upload.confirm}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PortfolioLightbox({ portfolio, imageIndex, onClose, onNavigate, copy, locale }) {
  const currentImage = portfolio.images[imageIndex];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        onNavigate("prev");
      }
      if (event.key === "ArrowRight") {
        onNavigate("next");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 px-4 py-8 backdrop-blur-md" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label={copy.detail.closeLightbox}
        className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[color:var(--site-text)] transition hover:text-[color:var(--site-accent)]"
      >
        <IconClose />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNavigate("prev");
        }}
        aria-label={copy.detail.previousImage}
        className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[color:var(--site-text)] transition hover:text-[color:var(--site-accent)] sm:left-6"
      >
        <IconArrow />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNavigate("next");
        }}
        aria-label={copy.detail.nextImage}
        className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-[color:var(--site-text)] transition hover:text-[color:var(--site-accent)] sm:right-6"
      >
        <IconArrow direction="right" />
      </button>

      <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
        <div className="overflow-hidden rounded-[1.8rem]">
          <img
            src={currentImage.url}
            alt={`${getLocalizedText(portfolio.title, locale)} ${imageIndex + 1}`}
            className="max-h-[82vh] w-full object-contain"
          />
        </div>

        <div className="mt-5 flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
          <span>{getLocalizedText(portfolio.title, locale)}</span>
          <span className="text-[color:var(--site-accent)]">
            {imageIndex + 1} / {portfolio.images.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function PortfolioPhotoCard({ image, isAdmin, onOpen, onSetCover, onDelete, copy }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)]">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <img src={image.url} alt="" className="aspect-[0.92/1] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      </button>

      {image.isCover ? (
        <span className="absolute left-4 top-4 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/82 px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-[color:var(--site-accent)]">
          {copy.admin.cover}
        </span>
      ) : null}

      {isAdmin ? (
        <div className="absolute inset-0 flex items-end bg-black/0 p-4 opacity-0 transition duration-300 group-hover:bg-black/42 group-hover:opacity-100">
          <div className="grid w-full gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSetCover();
              }}
              className="micro-button rounded-full bg-[color:var(--site-bg-deep)]/82 px-4 py-3 text-xs uppercase tracking-[0.28em] text-[color:var(--site-text)]"
            >
              {copy.detail.setCover}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="micro-button rounded-full bg-[color:var(--site-bg-deep)]/82 px-4 py-3 text-xs uppercase tracking-[0.28em] text-red-300"
            >
              {copy.detail.delete}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function DetailView({
  portfolio,
  isAdmin,
  onBack,
  onEditPortfolio,
  onRequestDeletePortfolio,
  onUploadImages,
  onSetCover,
  onDeleteImage,
  copy,
  locale,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <section className="rounded-[2.2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 border-b border-[color:var(--site-border-soft)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <button
              type="button"
              onClick={onBack}
              className="micro-button mb-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[color:var(--site-muted-strong)]"
            >
              <IconArrow />
              {copy.detail.back}
            </button>
            <p className="text-[11px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]">
              {copy.detail.label}
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em] text-[color:var(--site-text)] sm:text-5xl">
              {getLocalizedText(portfolio.title, locale)}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--site-muted)]">
              {getLocalizedText(portfolio.description, locale)}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onEditPortfolio}
                className="micro-button rounded-full border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/72 px-5 py-3 text-sm uppercase tracking-[0.28em] text-[color:var(--site-text)]"
              >
                {copy.detail.editPortfolio}
              </button>
              <button
                type="button"
                onClick={onRequestDeletePortfolio}
                className="micro-button rounded-full border border-red-500/40 px-5 py-3 text-sm uppercase tracking-[0.28em] text-red-300"
              >
                {copy.detail.deletePortfolio}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {isAdmin ? (
            <StagingUploadArea onConfirmUpload={onUploadImages} copy={copy} />
          ) : (
            <div className="rounded-[1.8rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/58 px-6 py-6 text-sm leading-7 text-[color:var(--site-muted)]">
              {copy.detail.uploadLocked}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {portfolio.images.map((image, index) => (
            <PortfolioPhotoCard
              key={image.id}
              image={image}
              isAdmin={isAdmin}
              copy={copy}
              onOpen={() => setLightboxIndex(index)}
              onSetCover={() => onSetCover(image.id)}
              onDelete={() => onDeleteImage(image.id)}
            />
          ))}
        </div>
      </section>

      {lightboxIndex !== null ? (
        <PortfolioLightbox
          portfolio={portfolio}
          imageIndex={lightboxIndex}
          copy={copy}
          locale={locale}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(direction) => {
            setLightboxIndex((current) => {
              if (current === null) {
                return current;
              }
              if (direction === "next") {
                return (current + 1) % portfolio.images.length;
              }
              return (current - 1 + portfolio.images.length) % portfolio.images.length;
            });
          }}
        />
      ) : null}
    </div>
  );
}

function BookingProjectsSection({ copy, locale }) {
  const [bookingForm, setBookingForm] = useState({
    name: "",
    project: "",
    preferredDate: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  return (
    <section id="booking" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-10 lg:py-24">
      <RevealBlock className="mb-8 border-b border-[color:var(--site-border)] pb-6">
        <p className="mb-3 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
          {copy.booking.label}
        </p>
        <h2 className={`font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl ${locale === "zh" ? "tracking-[-0.03em]" : "tracking-[-0.05em]"}`}>
          {copy.booking.heading}
        </h2>
      </RevealBlock>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <RevealBlock className="min-w-0 overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft sm:p-8" style={{ borderColor: "var(--site-border)" }}>
          <p className="mb-3 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
            {copy.booking.bookingLabel}
          </p>
          <h3 className={`font-display text-4xl font-semibold text-[color:var(--site-text)] sm:text-5xl ${locale === "zh" ? "tracking-[-0.03em]" : "tracking-[-0.05em]"}`}>
            {copy.booking.bookingHeading}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--site-muted)]">
            {copy.booking.bookingText}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              placeholder={copy.booking.namePlaceholder}
              value={bookingForm.name}
              onChange={(event) => setBookingForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-4 py-3 text-[color:var(--site-text)] outline-none transition focus:border-[color:var(--site-accent)]"
            />
            <textarea
              rows={4}
              placeholder={copy.booking.briefPlaceholder}
              value={bookingForm.project}
              onChange={(event) => setBookingForm((current) => ({ ...current, project: event.target.value }))}
              className="w-full rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-4 py-3 text-[color:var(--site-text)] outline-none transition focus:border-[color:var(--site-accent)]"
            />
            <input
              type="date"
              value={bookingForm.preferredDate}
              onChange={(event) => setBookingForm((current) => ({ ...current, preferredDate: event.target.value }))}
              className="w-full rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)]/76 px-4 py-3 text-[color:var(--site-text)] outline-none transition focus:border-[color:var(--site-accent)]"
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="rounded-full bg-[color:var(--site-accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.34em] text-[#10131c] transition hover:bg-[color:var(--site-accent-strong)]"
              >
                {copy.booking.bookNow}
              </button>
              <a
                href={LUMINA_URL}
                target="_blank"
                rel="noreferrer"
                className="text-xs uppercase tracking-[0.34em] text-[color:var(--site-muted)] transition hover:text-[color:var(--site-accent)]"
              >
                {copy.booking.connectLumina}
              </a>
            </div>

            {isSubmitted ? (
              <p className="rounded-[1.4rem] border border-[color:var(--site-border-soft)] bg-[color:var(--site-bg-deep)]/68 px-4 py-4 text-sm text-[color:var(--site-muted)]">
                {copy.booking.savedDraft}
              </p>
            ) : null}
          </form>
        </RevealBlock>

        <RevealBlock delay={120} className="min-w-0 overflow-hidden rounded-[2rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft sm:p-8" style={{ borderColor: "var(--site-border)" }}>
          <p className="mb-3 text-[11px] uppercase tracking-[0.45em] text-[color:var(--site-accent)]">
            {copy.booking.sideProjectsLabel}
          </p>
          <h3 className="font-display text-4xl font-semibold tracking-[-0.05em] text-[color:var(--site-text)]">
            {copy.booking.sideProjectsHeading}
          </h3>
          <div className="mt-8 grid gap-4">
            {sideProjects.map((project) => (
              <article
                key={project.name}
                className="rounded-[1.5rem] border bg-[color:var(--site-bg-deep)]/72 p-5"
                style={{
                  borderColor: "var(--site-border)",
                }}
              >
                <h4 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[color:var(--site-text)]">{project.name}</h4>
                <p className="mt-3 text-sm leading-7 text-[color:var(--site-muted)]">
                  {getLocalizedText(project.description, locale)}
                </p>
                <a
                  href={project.href}
                  target={project.href.startsWith("http") ? "_blank" : undefined}
                  rel={project.href.startsWith("http") ? "noreferrer" : undefined}
                  className="mt-5 inline-block text-xs uppercase tracking-[0.34em] text-[color:var(--site-accent)] transition hover:text-[color:var(--site-text)]"
                >
                  {copy.booking.learnMore}
                </a>
              </article>
            ))}
          </div>
        </RevealBlock>
      </div>
    </section>
  );
}

function Footer({ profile, copy, locale }) {
  return (
    <footer id="footer" className="mx-auto max-w-7xl border-t border-[color:var(--site-border-soft)] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="rounded-[1.9rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--site-muted)]">
              © 2026 {getLocalizedText(profile.name, locale)}
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-[color:var(--site-muted)]">
              {copy.footer.text}
            </p>
            <a
              href={LUMINA_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[11px] uppercase tracking-[0.34em] text-[color:var(--site-accent)]"
            >
              {copy.footer.poweredBy}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {["IG", "BE", "LI"].map((item) => (
              <a
                key={item}
                href="#"
                aria-label={item}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--site-border)] bg-[color:var(--site-panel-soft)] text-[11px] uppercase tracking-[0.25em] text-[color:var(--site-muted)] transition hover:text-[color:var(--site-accent)]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [portfolios, setPortfolios] = useState(initialPortfolios.map(toPortfolioShape));
  const [profile, setProfile] = useState(toProfileShape(initialProfile));
  const [locale, setLocale] = useState(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === "zh" ? "zh" : "en";
  });
  const [loaded, setLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [editorState, setEditorState] = useState({ open: false, portfolio: null });
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [backupFile, setBackupFile] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const copy = siteCopy[locale];

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const [storedPortfolios, storedProfile] = await Promise.all([
        loadPortfoliosFromStorage(),
        loadProfileFromStorage(),
      ]);
      if (mounted && storedPortfolios) {
        setPortfolios(storedPortfolios.map(toPortfolioShape));
      }
      if (mounted && storedProfile) {
        setProfile(toProfileShape(storedProfile));
      }
      if (mounted) {
        setLoaded(true);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    savePortfoliosToStorage(portfolios);
  }, [portfolios, loaded]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    saveProfileToStorage(profile);
  }, [profile, loaded]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = locale === "zh" ? "Eldon Studio 摄影官网" : "Eldon Studio";
  }, [locale]);

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

  const selectedPortfolio = useMemo(
    () => portfolios.find((item) => item.id === selectedPortfolioId) || null,
    [portfolios, selectedPortfolioId],
  );

  async function handleSavePortfolio({ id, title, description, coverImageId, images }) {
    let createdPortfolioId = null;

    setPortfolios((current) => {
      if (id) {
        return current.map((portfolio) => {
          if (portfolio.id !== id) {
            return portfolio;
          }

          const mergedImages = [
            ...portfolio.images,
            ...(Array.isArray(images) ? images : []),
          ];

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
        id: nextId,
        title: toLocalizedField(title, fallbackPortfolioContent.title),
        description: toLocalizedField(description, fallbackPortfolioContent.description),
        images: nextImages,
      });

      return [nextPortfolio, ...current];
    });

    setEditorState({ open: false, portfolio: null });

    if (createdPortfolioId !== null) {
      setSelectedPortfolioId(createdPortfolioId);
    }
  }

  function handleDeletePortfolio(id) {
    setPortfolios((current) => current.filter((portfolio) => portfolio.id !== id));
    setConfirmState(null);
    if (selectedPortfolioId === id) {
      setSelectedPortfolioId(null);
    }
  }

  function handleUploadImages(images) {
    if (!selectedPortfolio) {
      return;
    }

    setPortfolios((current) =>
      current.map((portfolio) => {
        if (portfolio.id !== selectedPortfolio.id) {
          return portfolio;
        }

        const shouldSetCover = portfolio.images.length === 0;
        const nextImages = images.map((image, index) => ({
          ...image,
          isCover: shouldSetCover && index === 0,
        }));

        return {
          ...portfolio,
          images: [...portfolio.images, ...nextImages],
        };
      }),
    );
  }

  function handleSetCover(imageId) {
    if (!selectedPortfolio) {
      return;
    }

    setPortfolios((current) =>
      current.map((portfolio) =>
        portfolio.id === selectedPortfolio.id
          ? {
              ...portfolio,
              images: portfolio.images.map((image) => ({
                ...image,
                isCover: image.id === imageId,
              })),
            }
          : portfolio,
      ),
    );
  }

  function handleDeleteImage(imageId) {
    if (!selectedPortfolio) {
      return;
    }

    setPortfolios((current) =>
      current.map((portfolio) => {
        if (portfolio.id !== selectedPortfolio.id) {
          return portfolio;
        }

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
    setConfirmState(null);
    setSelectedPortfolioId(null);
    setEditorState({ open: true, portfolio: null });
  }

  function handleBackupFileSelect(file) {
    setBackupFile(file);
    setBackupStatus(
      file
        ? { tone: "default", message: copy.admin.backupFileReady }
        : null,
    );
  }

  function handleExportBackup() {
    if (typeof window === "undefined") {
      return;
    }

    const payload = createBackupPayload({ portfolios, profile, locale });
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    downloadLink.href = downloadUrl;
    downloadLink.download = `eldon-studio-backup-${timestamp}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
    setBackupStatus({ tone: "success", message: copy.admin.backupExported });
  }

  async function handleRestoreBackup() {
    if (!backupFile) {
      setBackupStatus({ tone: "error", message: copy.admin.backupSelectFirst });
      return;
    }

    try {
      const raw = await backupFile.text();
      const parsed = JSON.parse(raw);
      const nextState = normalizeBackupPayload(parsed);

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
        message:
          error instanceof SyntaxError || error?.message === "invalid-backup"
            ? copy.admin.backupInvalid
            : copy.admin.backupImportFailed,
      });
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--site-bg)] text-[color:var(--site-text)]" lang={locale === "zh" ? "zh-CN" : "en"}>
      <LanguageToggle locale={locale} onToggle={setLocale} />

      {selectedPortfolio ? (
        <DetailView
          portfolio={selectedPortfolio}
          isAdmin={isAdmin}
          copy={copy}
          locale={locale}
          onBack={() => setSelectedPortfolioId(null)}
          onEditPortfolio={() => setEditorState({ open: true, portfolio: selectedPortfolio })}
          onRequestDeletePortfolio={() =>
            setConfirmState({
              title: copy.confirm.deletePortfolioTitle,
              description: copy.confirm.deleteDetailPortfolioText,
              onConfirm: () => handleDeletePortfolio(selectedPortfolio.id),
            })
          }
          onUploadImages={handleUploadImages}
          onSetCover={handleSetCover}
          onDeleteImage={(imageId) =>
            setConfirmState({
              title: copy.confirm.deleteImageTitle,
              description: copy.confirm.deleteImageText,
              onConfirm: () => handleDeleteImage(imageId),
            })
          }
        />
      ) : (
        <>
          <HeroSection
            portfolios={portfolios}
            profile={profile}
            isAdmin={isAdmin}
            onEditProfile={() => setProfileEditorOpen(true)}
            copy={copy}
            locale={locale}
          />
          <PracticeSection copy={copy} locale={locale} />
          <StorySection portfolios={portfolios} copy={copy} locale={locale} />
          {isAdmin ? (
            <AdminDataPanel
              copy={copy}
              locale={locale}
              backupFileName={backupFile?.name || ""}
              backupStatus={backupStatus}
              onExport={handleExportBackup}
              onSelectFile={handleBackupFileSelect}
              onRestore={handleRestoreBackup}
            />
          ) : null}
          <PortfolioMasonry
            portfolios={portfolios}
            isAdmin={isAdmin}
            copy={copy}
            locale={locale}
            onAdd={openCreatePortfolio}
            onOpen={setSelectedPortfolioId}
            onEdit={(portfolio) => setEditorState({ open: true, portfolio })}
            onDelete={(id) =>
              setConfirmState({
                title: copy.confirm.deletePortfolioTitle,
                description: copy.confirm.deletePortfolioText,
                onConfirm: () => handleDeletePortfolio(id),
              })
            }
          />
          <BookingProjectsSection copy={copy} locale={locale} />
          <Footer profile={profile} copy={copy} locale={locale} />
        </>
      )}

      <AdminToggle isAdmin={isAdmin} onToggle={() => setIsAdmin((value) => !value)} />

      {editorState.open ? (
        <PortfolioEditorModal
          portfolio={editorState.portfolio}
          copy={copy}
          onClose={() => setEditorState({ open: false, portfolio: null })}
          onSave={handleSavePortfolio}
        />
      ) : null}

      {profileEditorOpen ? (
        <ProfileEditorModal
          profile={profile}
          copy={copy}
          locale={locale}
          onClose={() => setProfileEditorOpen(false)}
          onSave={async (nextProfile) => {
            setProfile(toProfileShape(nextProfile));
            setProfileEditorOpen(false);
          }}
        />
      ) : null}

      {confirmState ? (
        <ConfirmDialog
          title={confirmState.title}
          description={confirmState.description}
          copy={copy}
          onCancel={() => setConfirmState(null)}
          onConfirm={confirmState.onConfirm}
        />
      ) : null}
    </div>
  );
}
