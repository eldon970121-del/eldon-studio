import { toLocalizedField } from "../utils/siteHelpers";

export const BOOKING_PROJECTS_STORAGE_KEY = "eldon-booking-projects";
export const BOOKING_ADMIN_MODE_STORAGE_KEY = "eldon-booking-admin-mode";

export const DEFAULT_BOOKING_PROJECTS = [
  {
    id: "editorial",
    formValue: "editorial",
    tier: {
      en: "Editorial Portrait",
      zh: "编辑肖像",
    },
    title: {
      en: "The Editorial Frame",
      zh: "编辑肖像委托",
    },
    description: {
      en: "A controlled portrait commission for fashion labels, creative founders, and campaign portraits that need atmosphere without excess styling noise.",
      zh: "面向品牌、创意主理人与 campaign 需求的高控制度肖像委托，以情绪、光线与质感为核心，而非堆叠式造型噪音。",
    },
    features: [
      {
        en: "Creative direction and shot list shaping",
        zh: "创意方向与镜头清单梳理",
      },
      {
        en: "Half-day studio or location production",
        zh: "半日棚拍或外景执行",
      },
      {
        en: "18 retouched hero frames",
        zh: "18 张精修主视觉",
      },
    ],
    session: {
      en: "Half day production",
      zh: "半日拍摄统筹",
    },
    deliverables: {
      en: "18 retouched frames",
      zh: "18 张精修成片",
    },
    turnaround: {
      en: "7-day delivery",
      zh: "7 天交付",
    },
    investment: {
      en: "From ¥8,800",
      zh: "¥8,800 起",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "commercial",
    formValue: "commercial",
    tier: {
      en: "Campaign Direction",
      zh: "品牌视觉",
    },
    title: {
      en: "Campaign Portrait System",
      zh: "品牌形象项目",
    },
    description: {
      en: "Built for teams that need a sharper visual system across launch assets, founder portraits, and campaign stills without losing tonal consistency.",
      zh: "面向需要统一主视觉系统的品牌与团队，覆盖创始人肖像、品牌传播与 campaign 静帧，在多素材中保持调性一致。",
    },
    features: [
      {
        en: "Pre-production moodboard and visual references",
        zh: "前期 moodboard 与视觉参考",
      },
      {
        en: "Full-day set or on-site execution",
        zh: "全天棚内或现场执行",
      },
      {
        en: "36 retouched selects and usage guidance",
        zh: "36 张精修精选与使用建议",
      },
    ],
    session: {
      en: "Full day production",
      zh: "全天拍摄执行",
    },
    deliverables: {
      en: "36 retouched frames",
      zh: "36 张精修成片",
    },
    turnaround: {
      en: "10-day delivery",
      zh: "10 天交付",
    },
    investment: {
      en: "From ¥16,800",
      zh: "¥16,800 起",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "campaign",
    formValue: "campaign",
    tier: {
      en: "Long-Form Commission",
      zh: "长期委托",
    },
    title: {
      en: "Narrative Commission Series",
      zh: "叙事委托系列",
    },
    description: {
      en: "A slower commission structure for artists, publications, and hospitality spaces that need a multi-scene body of work with narrative continuity.",
      zh: "适合艺术家、出版机构与空间品牌的长期委托结构，以更慢节奏完成多场景叙事，建立连续性的视觉语境。",
    },
    features: [
      {
        en: "Multi-session narrative planning",
        zh: "多阶段叙事策划",
      },
      {
        en: "Casting, location, and styling consultation",
        zh: "人物、场地与造型咨询",
      },
      {
        en: "Custom delivery structure and sequencing",
        zh: "定制交付结构与编排",
      },
    ],
    session: {
      en: "Multi-session schedule",
      zh: "多阶段拍摄安排",
    },
    deliverables: {
      en: "Custom delivery deck",
      zh: "定制化交付组合",
    },
    turnaround: {
      en: "Project-based timeline",
      zh: "按项目周期交付",
    },
    investment: {
      en: "Custom quotation",
      zh: "定制报价",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1400&q=80",
  },
];

const DEFAULT_PROJECT_MAP = new Map(DEFAULT_BOOKING_PROJECTS.map((project) => [project.id, project]));

function toBookingProjectShape(project) {
  const seed = DEFAULT_PROJECT_MAP.get(project?.id) || DEFAULT_BOOKING_PROJECTS[0];

  return {
    ...seed,
    title: toLocalizedField(project?.title, seed.title),
    description: toLocalizedField(project?.description, seed.description),
    coverImageUrl:
      typeof project?.coverImageUrl === "string" && project.coverImageUrl.trim()
        ? project.coverImageUrl.trim()
        : seed.coverImageUrl,
  };
}

export function normalizeBookingProjects(value) {
  const input = Array.isArray(value) ? value : [];

  return DEFAULT_BOOKING_PROJECTS.map((seed) => {
    const existing = input.find((project) => project?.id === seed.id);
    return toBookingProjectShape(existing || seed);
  });
}
