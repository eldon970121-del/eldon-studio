import { AestheticsLab } from "./AestheticsLab";

const GAUGE_CIRCUMFERENCE = 251.2;

function getLabContent(locale, copy) {
  const analysisError =
    copy?.aestheticLab?.analysisError ||
    (locale === "zh"
      ? "图片分析失败，请尝试重新上传或更换文件。"
      : "The image could not be analyzed. Try another file or re-upload the frame.");

  return locale === "zh"
    ? {
        uploadHeading: "影像审美精炼",
        uploadIntro:
          "上传一张画面，让 Lumina 从色彩、光影和情绪张力中提炼出更成熟的审美读数与发布策略。",
        dropTitle: "拖放一张影像，开始读取视觉气候",
        dropHint: "支持 JPG、PNG、WEBP。建议使用肖像、编辑摄影或电影感画面。",
        analyzingTitle: "正在扫描色彩压力与光影结构",
        analyzingHint: "Lumina 正在建立情绪共振、成熟度与平台分发建议。",
        selectFile: "选择影像",
        replaceFile: "更换影像",
        dropCta: "拖放画面或点击选择",
        dropRelease: "松手导入画面",
        seriesDropRelease: "松手以添加",
        protocolLabel: "分析协议",
        protocolSteps: [
          {
            id: "01",
            title: "画面导入",
            text: "接收单张画面，保留其原始色温、对比与空间压强。",
          },
          {
            id: "02",
            title: "信号解析",
            text: "拆解情绪重力、光比结构与主体聚焦方式。",
          },
          {
            id: "03",
            title: "策略输出",
            text: "输出专业分析与适配社交平台的文案建议。",
          },
        ],
        featureCards: [
          {
            title: "情绪共振",
            text: "把忧郁、神秘、力量与温度拆成可读的分值与趋势。",
          },
          {
            title: "光影解构",
            text: "识别影像是如何依靠对比、落光与空间收束建立张力。",
          },
          {
            title: "发布策略",
            text: "把审美判断转成更适合小红书与抖音的表达方式。",
          },
        ],
        dashboardHeading: "审美实验室 / Lumina 分析报告",
        newAnalysis: "新建分析",
        imagePanelLabel: "当前画面",
        imageAlt: "已上传的审美分析图片",
        scoreLabel: "审美成熟度",
        scoreText: "综合色彩压强、神秘感、粗粝力量与亲密温度后的成熟度读数。",
        resonanceLabel: "情绪共振",
        professionalTab: "专业分析",
        socialTab: "社媒策略",
        resultViewLabel: "分析结果",
        professionalPanels: {
          color: "色彩分析",
          lighting: "光影解构",
          advice: "优化建议",
        },
        socialPanels: {
          copy: "社媒文案",
          titles: "推荐标题",
          caption: "发布说明",
        },
        fieldLabels: {
          dominantTone: "主色调",
          visualWeight: "视觉重量分布",
          colorPsychology: "色彩心理",
          lightingType: "布光类型",
          lightRatio: "光比评估",
          spatialDepth: "空间纵深",
          fileName: "文件",
        },
        copyAction: "复制",
        copied: "已复制",
        modeToggleSingle: "单张分析",
        modeToggleSeries: "组图分析",
        modeToggleDeconstructor: "视觉拆解",
        seriesUploadTitle: "组图系列分析",
        seriesUploadIntro: "一次上传 2–12 张图片，Lumina 将逐帧分析，输出整体风格一致性评分与系列平均情绪共振。",
        seriesDropHint: "拖放图片或点击添加，最多 12 张",
        seriesAddMore: "继续添加",
        seriesAnalyzeBtn: "开始组图分析",
        seriesMinWarning: "至少需要 2 张图片才能开始分析",
        seriesMaxWarning: "最多支持 12 张图片",
        seriesAnalyzingTitle: "正在逐帧分析组图",
        seriesAnalyzingHint: (done, total) => `已完成 ${done} / ${total} 帧`,
        seriesDashboardHeading: "组图分析报告",
        seriesCoherenceLabel: "风格一致性",
        seriesCoherenceDesc: "基于系列所有画面成熟度分数的分布计算，分值越高代表系列整体风格越统一。",
        seriesAvgLabel: "系列平均情绪共振",
        seriesFilmstripLabel: "系列帧览",
        seriesFrameLabel: "画面",
        seriesSelectedLabel: "当前分析画面",
        seriesNewAnalysis: "重新上传",
        seriesFrameCount: (n) => `${n} 张`,
        analysisError,
      }
    : {
        uploadHeading: "Refining Aesthetics",
        uploadIntro:
          "Upload one frame and let Lumina read color tension, light structure, and emotional pressure into a more usable aesthetic analysis.",
        dropTitle: "Drop a frame to begin the aesthetic read",
        dropHint: "JPG, PNG, and WEBP are supported. Portraits, editorial frames, and cinematic stills work best.",
        analyzingTitle: "Scanning color pressure and lighting structure",
        analyzingHint: "Lumina is building resonance scores, maturity, and platform-ready guidance.",
        selectFile: "Select Image",
        replaceFile: "Replace Image",
        dropCta: "Drop a frame or click to select",
        dropRelease: "Release to upload",
        seriesDropRelease: "Release to add",
        protocolLabel: "Lab Protocol",
        protocolSteps: [
          {
            id: "01",
            title: "Frame Intake",
            text: "Receive one image while preserving its native temperature, contrast, and spatial pressure.",
          },
          {
            id: "02",
            title: "Signal Reading",
            text: "Parse emotional gravity, light ratio, and how the subject is being held in frame.",
          },
          {
            id: "03",
            title: "Strategy Output",
            text: "Return professional analysis plus social-platform-ready positioning and copy.",
          },
        ],
        featureCards: [
          {
            title: "Emotional Resonance",
            text: "Translate melancholy, mystery, grit, and warmth into readable signals.",
          },
          {
            title: "Light Deconstruction",
            text: "Show how contrast, falloff, and directionality create the frame's pressure.",
          },
          {
            title: "Publishing Strategy",
            text: "Convert the visual read into sharper titles and captions for social use.",
          },
        ],
        dashboardHeading: "Aesthetic Lab / Lumina Analysis",
        newAnalysis: "New Analysis",
        imagePanelLabel: "Current Frame",
        imageAlt: "Uploaded image preview for aesthetic analysis",
        scoreLabel: "Aesthetic Maturity",
        scoreText: "A weighted read of melancholy, mystery, grit, and warmth across the frame.",
        resonanceLabel: "Emotional Resonance",
        professionalTab: "Professional Analysis",
        socialTab: "Social Strategy",
        resultViewLabel: "Result View",
        professionalPanels: {
          color: "Color Analysis",
          lighting: "Lighting Deconstruction",
          advice: "Actionable Advice",
        },
        socialPanels: {
          copy: "Social Narrative",
          titles: "Recommended Titles",
          caption: "Recommended Caption",
        },
        fieldLabels: {
          dominantTone: "Dominant Tone",
          visualWeight: "Visual Weight",
          colorPsychology: "Color Psychology",
          lightingType: "Lighting Type",
          lightRatio: "Light Ratio",
          spatialDepth: "Spatial Depth",
          fileName: "File",
        },
        copyAction: "Copy",
        copied: "Copied",
        modeToggleSingle: "Single",
        modeToggleSeries: "Series",
        modeToggleDeconstructor: "Deconstructor",
        seriesUploadTitle: "Series Analysis",
        seriesUploadIntro: "Upload 2–12 frames. Lumina analyzes each and outputs per-frame scores plus an overall style coherence rating.",
        seriesDropHint: "Drag and drop or click to add frames — up to 12",
        seriesAddMore: "Add More",
        seriesAnalyzeBtn: "Analyze Series",
        seriesMinWarning: "Upload at least 2 images to begin",
        seriesMaxWarning: "Maximum 12 frames supported",
        seriesAnalyzingTitle: "Analyzing series frame by frame",
        seriesAnalyzingHint: (done, total) => `Analyzed ${done} of ${total}`,
        seriesDashboardHeading: "Series Analysis",
        seriesCoherenceLabel: "Style Coherence",
        seriesCoherenceDesc: "Derived from the spread of maturity scores across the series. A higher score indicates a more unified aesthetic.",
        seriesAvgLabel: "Series Average Resonance",
        seriesFilmstripLabel: "Series Filmstrip",
        seriesFrameLabel: "Frame",
        seriesSelectedLabel: "Selected Frame",
        seriesNewAnalysis: "New Series",
        seriesFrameCount: (n) => `${n} frame${n !== 1 ? "s" : ""}`,
        analysisError,
      };
}

function calcMaturityScore(analysis) {
  if (!analysis) return 0;
  const r = analysis.aesthetic_dashboard.emotional_resonance;
  return Math.round(
    (r.melancholy_isolation || 0) * 0.32 +
      (r.mystery_unknown || 0) * 0.38 +
      (r.power_grit || 0) * 0.18 +
      (r.intimacy_warmth || 0) * 0.12,
  );
}


export function LuminaLabPage({ copy, locale }) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] px-4 py-12 sm:px-8">
      <AestheticsLab />
    </div>
  );
}
