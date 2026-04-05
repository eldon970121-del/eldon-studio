import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  analyzeAestheticImage,
  buildSeriesNarrative,
} from "../../services/aestheticAnalysis";

const GAUGE_CIRCUMFERENCE = 251.2;

function getLabContent(locale, copy) {
  const analysisError =
    copy?.aestheticLab?.analysisError ||
    (locale === "zh"
      ? "图片分析失败，请尝试重新上传或更换文件。"
      : "The image could not be analyzed. Try another file or re-upload the frame.");

  return locale === "zh"
    ? {
        uploadHeading: "Refining Aesthetics",
        uploadIntro:
          "上传一张画面，让 Lumina 从色彩、光影和情绪张力中提炼出更成熟的审美读数与发布策略。",
        dropTitle: "拖放一张影像，开始读取视觉气候",
        dropHint: "支持 JPG、PNG、WEBP。建议使用肖像、编辑摄影或电影感画面。",
        analyzingTitle: "正在扫描色彩压力与光影结构",
        analyzingHint: "Lumina 正在建立情绪共振、成熟度与平台分发建议。",
        selectFile: "选择图片",
        replaceFile: "更换图片",
        protocolLabel: "Lab Protocol",
        protocolSteps: [
          {
            id: "01",
            title: "Frame Intake",
            text: "接收单张画面，保留其原始色温、对比与空间压强。",
          },
          {
            id: "02",
            title: "Signal Reading",
            text: "拆解情绪重力、光比结构与主体聚焦方式。",
          },
          {
            id: "03",
            title: "Strategy Output",
            text: "输出专业分析与适配社交平台的文案建议。",
          },
        ],
        featureCards: [
          {
            title: "Emotional Resonance",
            text: "把忧郁、神秘、力量与温度拆成可读的分值与趋势。",
          },
          {
            title: "Light Deconstruction",
            text: "识别影像是如何依靠对比、落光与空间收束建立张力。",
          },
          {
            title: "Publishing Strategy",
            text: "把审美判断转成更适合小红书与抖音的表达方式。",
          },
        ],
        dashboardHeading: "Aesthetic Lab / Lumina Analysis",
        newAnalysis: "新建分析",
        imagePanelLabel: "Current Frame",
        imageAlt: "已上传的审美分析图片",
        scoreLabel: "Aesthetic Maturity",
        scoreText: "综合色彩压强、神秘感、粗粝力量与亲密温度后的成熟度读数。",
        resonanceLabel: "Emotional Resonance",
        professionalTab: "Professional Analysis",
        socialTab: "Social Strategy",
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
        copyAction: "复制",
        copied: "已复制",
        modeToggleSingle: "单张分析",
        modeToggleSeries: "组图分析",
        seriesUploadTitle: "Series Analysis",
        seriesUploadIntro: "一次上传 2–12 张图片，Lumina 将逐帧分析，输出整体风格一致性评分与系列平均情绪共振。",
        seriesDropHint: "拖放图片或点击添加，最多 12 张",
        seriesAddMore: "继续添加",
        seriesAnalyzeBtn: "开始组图分析",
        seriesMinWarning: "至少需要 2 张图片才能开始分析",
        seriesMaxWarning: "最多支持 12 张图片",
        seriesAnalyzingTitle: "正在逐帧分析组图",
        seriesAnalyzingHint: (done, total) => `已完成 ${done} / ${total} 帧`,
        seriesDashboardHeading: "Series Analysis",
        seriesCoherenceLabel: "风格一致性",
        seriesCoherenceDesc: "基于系列所有画面成熟度分数的分布计算，分值越高代表系列整体风格越统一。",
        seriesAvgLabel: "系列平均情绪共振",
        seriesFilmstripLabel: "系列帧览",
        seriesFrameLabel: "Frame",
        seriesSelectedLabel: "当前分析帧",
        seriesNewAnalysis: "重新上传",
        seriesFrameCount: (n) => `${n} 张图片`,
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
  const inputRef = useRef(null);
  const [phase, setPhase] = useState("upload");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("pro");
  const [copiedKey, setCopiedKey] = useState("");
  const [mode, setMode] = useState("single");
  const [seriesItems, setSeriesItems] = useState([]);
  const [seriesPhase, setSeriesPhase] = useState("upload");
  const [seriesProgress, setSeriesProgress] = useState({ done: 0, total: 0 });
  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState(0);
  const seriesInputRef = useRef(null);
  const [seriesActiveTab, setSeriesActiveTab] = useState("pro");
  const [seriesNarrative, setSeriesNarrative] = useState(null);
  const content = useMemo(() => getLabContent(locale, copy), [locale, copy]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleSeriesAddFiles(files) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    const entries = fileArray.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setSeriesItems((prev) => {
      const remaining = 12 - prev.length;
      if (remaining <= 0) {
        entries.forEach((e) => URL.revokeObjectURL(e.previewUrl));
        return prev;
      }
      const taken = entries.slice(0, remaining);
      entries.slice(remaining).forEach((e) => URL.revokeObjectURL(e.previewUrl));
      return [
        ...prev,
        ...taken.map(({ file, previewUrl }) => ({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl,
          analysis: null,
        })),
      ];
    });
  }

  function handleSeriesRemoveItem(id) {
    setSeriesItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  async function handleSeriesAnalyze() {
    if (seriesItems.length < 2) return;
    setSeriesNarrative(null);
    setSeriesPhase("analyzing");
    setSeriesProgress({ done: 0, total: seriesItems.length });

    const results = [];
    for (let i = 0; i < seriesItems.length; i++) {
      try {
        const [result] = await Promise.all([
          analyzeAestheticImage(seriesItems[i].file, locale),
          new Promise((resolve) => setTimeout(resolve, 300)),
        ]);
        results.push(result);
      } catch (err) {
        console.error("Series frame analysis failed:", err);
        results.push(null);
      }
      setSeriesProgress({ done: i + 1, total: seriesItems.length });
    }

    setSeriesItems((prev) =>
      prev.map((item, index) => ({ ...item, analysis: results[index] || null })),
    );
    const validResults = results.filter(Boolean);
    if (validResults.length >= 2) {
      setSeriesNarrative(buildSeriesNarrative(validResults, locale));
    }
    setSelectedSeriesIndex(0);
    setSeriesPhase("result");
  }

  function handleSeriesReset() {
    setSeriesItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
    setSeriesPhase("upload");
    setSeriesProgress({ done: 0, total: 0 });
    setSelectedSeriesIndex(0);
    setSeriesActiveTab("pro");
    setSeriesNarrative(null);
    if (seriesInputRef.current) seriesInputRef.current.value = "";
  }

  function handleModeSwitch(nextMode) {
    if (nextMode === mode) return;
    if (nextMode === "single") handleSeriesReset();
    else handleReset();
    setMode(nextMode);
  }

  async function handleFile(nextFile) {
    if (!nextFile) {
      return;
    }

    setError("");
    setAnalysis(null);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setPhase("analyzing");

    try {
      const [nextAnalysis] = await Promise.all([
        analyzeAestheticImage(nextFile, locale),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      setAnalysis(nextAnalysis);
      setActiveTab("pro");
      setPhase("result");
    } catch (analysisError) {
      console.error("Lumina Lab analysis failed.", analysisError);
      setError(content.analysisError);
      setPhase("upload");
    }
  }

  async function handleCopy(text, key) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 2000);
    } catch (copyError) {
      console.error("Copy failed.", copyError);
    }
  }

  function handleReset() {
    setPhase("upload");
    setFile(null);
    setPreviewUrl("");
    setAnalysis(null);
    setError("");
    setActiveTab("pro");
    setCopiedKey("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const dashboard = analysis?.aesthetic_dashboard;
  const resonance = dashboard?.emotional_resonance || {};
  const metrics = useMemo(
    () => [
      {
        key: "melancholy_isolation",
        label:
          copy?.aestheticLab?.metricLabels?.melancholy_isolation || "Melancholy / Isolation",
        value: resonance.melancholy_isolation || 0,
      },
      {
        key: "mystery_unknown",
        label: copy?.aestheticLab?.metricLabels?.mystery_unknown || "Mystery / Unknown",
        value: resonance.mystery_unknown || 0,
      },
      {
        key: "power_grit",
        label: copy?.aestheticLab?.metricLabels?.power_grit || "Power / Grit",
        value: resonance.power_grit || 0,
      },
      {
        key: "intimacy_warmth",
        label: copy?.aestheticLab?.metricLabels?.intimacy_warmth || "Intimacy / Warmth",
        value: resonance.intimacy_warmth || 0,
      },
    ],
    [copy, resonance],
  );
  const maturityScore = useMemo(() => {
    if (!analysis) {
      return 0;
    }

    return Math.round(
      (resonance.melancholy_isolation || 0) * 0.32 +
        (resonance.mystery_unknown || 0) * 0.38 +
        (resonance.power_grit || 0) * 0.18 +
        (resonance.intimacy_warmth || 0) * 0.12,
    );
  }, [analysis, resonance]);
  const selectedSeriesItem = seriesItems[selectedSeriesIndex] ?? null;
  const selectedSeriesDashboard = selectedSeriesItem?.analysis?.aesthetic_dashboard ?? null;
  const selectedSeriesResonance = selectedSeriesDashboard?.emotional_resonance ?? {};

  const seriesAverages = useMemo(() => {
    const analyzed = seriesItems.filter((item) => item.analysis);
    if (!analyzed.length) return null;
    const keys = ["melancholy_isolation", "mystery_unknown", "power_grit", "intimacy_warmth"];
    const avg = {};
    keys.forEach((key) => {
      avg[key] = Math.round(
        analyzed.reduce(
          (sum, item) =>
            sum + (item.analysis.aesthetic_dashboard.emotional_resonance[key] || 0),
          0,
        ) / analyzed.length,
      );
    });
    return avg;
  }, [seriesItems]);

  const coherenceScore = useMemo(() => {
    const analyzed = seriesItems.filter((item) => item.analysis);
    if (analyzed.length < 2) return 100;
    const scores = analyzed.map((item) => calcMaturityScore(item.analysis));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const std = Math.sqrt(variance);
    return Math.round(Math.max(0, Math.min(100, 100 - (std / 30) * 100)));
  }, [seriesItems]);

  const seriesMetrics = useMemo(() => {
    if (!seriesAverages) return [];
    return [
      {
        key: "melancholy_isolation",
        label: copy?.aestheticLab?.metricLabels?.melancholy_isolation || "Melancholy / Isolation",
        value: seriesAverages.melancholy_isolation,
      },
      {
        key: "mystery_unknown",
        label: copy?.aestheticLab?.metricLabels?.mystery_unknown || "Mystery / Unknown",
        value: seriesAverages.mystery_unknown,
      },
      {
        key: "power_grit",
        label: copy?.aestheticLab?.metricLabels?.power_grit || "Power / Grit",
        value: seriesAverages.power_grit,
      },
      {
        key: "intimacy_warmth",
        label: copy?.aestheticLab?.metricLabels?.intimacy_warmth || "Intimacy / Warmth",
        value: seriesAverages.intimacy_warmth,
      },
    ];
  }, [seriesAverages, copy]);
  const seriesFrameScores = useMemo(
    () => seriesItems.map((item) => calcMaturityScore(item.analysis)),
    [seriesItems],
  );
  const seriesOverviewCopy = locale === "zh"
    ? {
        panelLabel: "系列总览",
        directionLabel: "Series Direction",
        distributionLabel: "成熟度分布",
        titlesLabel: "推荐标题",
        captionLabel: "系列发布文案",
      }
    : {
        panelLabel: "Series Overview",
        directionLabel: "Series Direction",
        distributionLabel: "Maturity Distribution",
        titlesLabel: "Recommended Titles",
        captionLabel: "Series Caption",
      };
  const isAnalyzing = phase === "analyzing";
  const { getRootProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    disabled: isAnalyzing,
    noClick: true,
    onDrop: (acceptedFiles) => {
      const [nextFile] = acceptedFiles;

      if (nextFile) {
        void handleFile(nextFile);
      }
    },
  });
  const { getRootProps: getSeriesRootProps, isDragActive: isSeriesDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    disabled: seriesItems.length >= 12,
    noClick: true,
    onDrop: (acceptedFiles) => {
      handleSeriesAddFiles(acceptedFiles);
    },
  });

  return (
    <div id="lumina-lab-app" className="min-h-screen pt-36 pb-24 px-6 sm:px-8 max-w-7xl mx-auto">
      <input
        ref={seriesInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const fileArray = Array.from(event.target.files || []);
          event.target.value = "";
          if (fileArray.length > 0) handleSeriesAddFiles(fileArray);
        }}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const nextFile = event.target.files?.[0];

          if (nextFile) {
            void handleFile(nextFile);
          }

          event.target.value = "";
        }}
      />

      {(phase === "upload" || phase === "analyzing" || seriesPhase === "upload" || seriesPhase === "analyzing") && (
        <div className="mb-8 flex gap-2">
          {[
            { key: "single", label: content.modeToggleSingle },
            { key: "series", label: content.modeToggleSeries },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => handleModeSwitch(m.key)}
              className={`micro-button rounded-full border px-5 py-2.5 font-lab-label text-[10px] uppercase tracking-[0.34em] transition ${
                mode === m.key
                  ? "border-[#48ddbc] bg-[#48ddbc] text-[#111111]"
                  : "border-white/10 text-[#acabab] hover:border-white/30 hover:text-[#e7e5e5]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {mode === "single" && (phase === "upload" || phase === "analyzing") && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-10"
        >
          <div className="max-w-3xl space-y-4">
            <p className="font-lab-label text-[11px] uppercase tracking-[0.42em] text-[#48ddbc]">
              {content.protocolLabel}
            </p>
            <h1 className="font-lab-headline text-5xl tracking-[-0.05em] text-[#e7e5e5] sm:text-6xl">
              {content.uploadHeading}
            </h1>
            <p className="max-w-2xl font-lab-body text-base leading-8 text-[#acabab] sm:text-[1.05rem]">
              {content.uploadIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="glass-panel glass-edge rounded-[2rem] p-6 xl:col-span-4 xl:p-8">
              <div className="mb-6 flex items-center justify-between">
                <p className="font-lab-label text-[11px] uppercase tracking-[0.38em] text-[#757575]">
                  {content.protocolLabel}
                </p>
                <span className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  03
                </span>
              </div>

              <div className="space-y-4">
                {content.protocolSteps.map((step) => (
                  <div key={step.id} className="glass-noir rounded-[1.6rem] px-5 py-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="font-lab-label text-[10px] uppercase tracking-[0.34em] text-[#48ddbc]">
                        {step.id}
                      </span>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <h2 className="font-lab-headline text-[1.45rem] tracking-[-0.03em] text-[#e7e5e5]">
                      {step.title}
                    </h2>
                    <p className="mt-3 font-lab-body text-sm leading-7 text-[#acabab]">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel glass-edge rounded-[2rem] p-4 sm:p-5 xl:col-span-8">
              <div
                {...getRootProps({
                  onClick: () => {
                    if (!isAnalyzing) {
                      inputRef.current?.click();
                    }
                  },
                })}
                className={`relative min-h-[28rem] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#111111] p-6 transition duration-300 sm:p-8 ${
                  isDragActive ? "border-[#48ddbc]" : "border-white/10"
                } ${isAnalyzing ? "cursor-default" : "cursor-pointer"}`}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={file?.name || content.imageAlt}
                    className={`absolute inset-0 h-full w-full object-contain transition duration-700 ${
                      isAnalyzing ? "scale-[1.02] blur-sm opacity-[0.35]" : "opacity-20"
                    }`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(72,221,188,0.16),transparent_28%),linear-gradient(180deg,#141414_0%,#0c0c0c_100%)]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.74)_100%)]" />

                {isAnalyzing ? (
                  <div
                    className="absolute left-[-30%] top-0 h-full w-[35%] bg-[linear-gradient(90deg,transparent,rgba(72,221,188,0.38),transparent)] mix-blend-screen"
                    style={{ animation: "scanline 1.8s linear infinite" }}
                  />
                ) : null}

                <div className="relative flex h-full min-h-[24rem] flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-lab-label text-[11px] uppercase tracking-[0.38em] text-[#757575]">
                        {content.protocolLabel}
                      </p>
                      <h2 className="mt-3 max-w-xl font-lab-headline text-[2rem] tracking-[-0.045em] text-[#e7e5e5] sm:text-[2.7rem]">
                        {isAnalyzing ? content.analyzingTitle : content.dropTitle}
                      </h2>
                    </div>

                    {file && !isAnalyzing ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          inputRef.current?.click();
                        }}
                        className="micro-button rounded-full border border-white/10 px-4 py-2 font-lab-label text-[10px] uppercase tracking-[0.32em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]"
                      >
                        {content.replaceFile}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-start gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#48ddbc]">
                      <span
                        className={`material-symbols-outlined text-[2.4rem] ${
                          isAnalyzing ? "animate-pulse" : ""
                        }`}
                      >
                        {isAnalyzing ? "blur_on" : "upload_file"}
                      </span>
                    </div>

                    <div className="max-w-2xl space-y-4">
                      <p className="font-lab-body text-base leading-8 text-[#acabab] sm:text-lg">
                        {isAnalyzing ? content.analyzingHint : content.dropHint}
                      </p>
                      <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                        {isDragActive && !isAnalyzing
                          ? locale === "zh"
                            ? "释放以上传"
                            : "Release to upload"
                          : locale === "zh"
                            ? "拖放图片或点击选择"
                            : "Drag and drop, or click to select"}
                      </p>
                    </div>

                    {!isAnalyzing ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          inputRef.current?.click();
                        }}
                        className="micro-button rounded-full bg-[#48ddbc] px-6 py-3 font-lab-label text-[10px] uppercase tracking-[0.34em] text-[#111111] transition hover:bg-[#61ebcb]"
                      >
                        {content.selectFile}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {error ? (
                <p className="mt-4 rounded-[1.2rem] border border-[rgba(255,108,108,0.3)] bg-[rgba(110,23,23,0.22)] px-4 py-4 font-lab-body text-sm leading-7 text-[#e7e5e5]">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {content.featureCards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
                className="glass-noir rounded-[1.7rem] px-5 py-6"
              >
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  0{index + 1}
                </p>
                <h3 className="mt-4 font-lab-headline text-[1.5rem] tracking-[-0.035em] text-[#e7e5e5]">
                  {card.title}
                </h3>
                <p className="mt-3 font-lab-body text-sm leading-7 text-[#acabab]">
                  {card.text}
                </p>
              </motion.article>
            ))}
          </div>
        </motion.section>
      )}

      {mode === "single" && phase === "result" && analysis && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="font-lab-label text-[11px] uppercase tracking-[0.42em] text-[#48ddbc]">
                {content.protocolLabel}
              </p>
              <h1 className="font-lab-headline text-4xl tracking-[-0.05em] text-[#e7e5e5] sm:text-5xl">
                {content.dashboardHeading}
              </h1>
              <p className="font-lab-body text-sm leading-7 text-[#acabab]">
                {content.fieldLabels.fileName}: {file?.name || "Untitled"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="micro-button self-start rounded-full border border-white/10 px-5 py-3 font-lab-label text-[10px] uppercase tracking-[0.34em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc] sm:self-auto"
            >
              {content.newAnalysis}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="glass-panel glass-edge flex flex-col overflow-hidden rounded-[2rem] xl:col-span-8">
              <div className="flex flex-none items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                  {content.imagePanelLabel}
                </p>
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  Result View
                </p>
              </div>
              <div className="min-h-0 flex-1 bg-[#0e0e0e] p-4 sm:p-6">
                <div className="h-full overflow-hidden rounded-[1.7rem] border border-white/[0.08] bg-black">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file?.name || content.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="glass-panel glass-edge rounded-[2rem] p-5 sm:p-6 xl:col-span-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                    {content.scoreLabel}
                  </p>
                  <h2 className="mt-3 font-lab-headline text-[1.7rem] tracking-[-0.04em] text-[#e7e5e5]">
                    {maturityScore}
                  </h2>
                </div>
                <div className="relative h-28 w-28">
                  <svg viewBox="0 0 100 100" className="-rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#48ddbc"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={
                        GAUGE_CIRCUMFERENCE - (GAUGE_CIRCUMFERENCE * maturityScore) / 100
                      }
                      style={{ transition: "stroke-dashoffset 2s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-lab-label text-[11px] uppercase tracking-[0.26em] text-[#e7e5e5]">
                      {maturityScore}%
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-5 font-lab-body text-sm leading-7 text-[#acabab]">
                {content.scoreText}
              </p>

              <div className="mt-8">
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  {content.resonanceLabel}
                </p>
                <div className="mt-5 space-y-4">
                  {metrics.map((metric) => (
                    <div key={metric.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-lab-body text-sm text-[#e7e5e5]">{metric.label}</span>
                        <span className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                          {metric.value}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/8">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.value}%` }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                          className="h-full rounded-full bg-[#48ddbc]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { key: "pro", label: content.professionalTab },
              { key: "social", label: content.socialTab },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`micro-button rounded-full border px-5 py-3 font-lab-label text-[10px] uppercase tracking-[0.34em] transition ${
                  activeTab === tab.key
                    ? "border-[#48ddbc] bg-[#48ddbc] text-[#111111]"
                    : "border-white/10 text-[#e7e5e5] hover:border-[#48ddbc] hover:text-[#48ddbc]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "pro" ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <article className="glass-noir rounded-[1.9rem] p-6">
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  {content.professionalPanels.color}
                </p>
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {content.fieldLabels.dominantTone}
                    </p>
                    <p className="mt-2 font-lab-headline text-[1.45rem] tracking-[-0.03em] text-[#e7e5e5]">
                      {dashboard?.color_analysis?.dominant_tone}
                    </p>
                  </div>
                  <div>
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {content.fieldLabels.visualWeight}
                    </p>
                    <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                      {dashboard?.color_analysis?.visual_weight_breakdown}
                    </p>
                  </div>
                  <div>
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {content.fieldLabels.colorPsychology}
                    </p>
                    <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                      {dashboard?.color_analysis?.color_psychology}
                    </p>
                  </div>
                </div>
              </article>

              <article className="glass-noir rounded-[1.9rem] p-6">
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  {content.professionalPanels.lighting}
                </p>
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {content.fieldLabels.lightingType}
                    </p>
                    <p className="mt-2 font-lab-headline text-[1.45rem] tracking-[-0.03em] text-[#e7e5e5]">
                      {dashboard?.lighting_deconstruction?.lighting_type}
                    </p>
                  </div>
                  <div>
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {content.fieldLabels.lightRatio}
                    </p>
                    <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                      {dashboard?.lighting_deconstruction?.light_ratio_evaluation}
                    </p>
                  </div>
                  <div>
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {content.fieldLabels.spatialDepth}
                    </p>
                    <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                      {dashboard?.lighting_deconstruction?.spatial_depth}
                    </p>
                  </div>
                </div>
              </article>

              <article className="glass-noir rounded-[1.9rem] p-6 lg:col-span-2">
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  {content.professionalPanels.advice}
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {(dashboard?.actionable_advice || []).map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] p-5"
                    >
                      <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                        0{index + 1}
                      </p>
                      <p className="mt-3 font-lab-body text-sm leading-7 text-[#e7e5e5]">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <article className="glass-noir rounded-[1.9rem] p-6 lg:col-span-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                    {content.socialPanels.copy}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(dashboard?.social_media_copy || "", "social-copy")}
                    className="micro-button rounded-full border border-white/10 px-4 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]"
                  >
                    {copiedKey === "social-copy" ? content.copied : content.copyAction}
                  </button>
                </div>
                <p className="mt-5 font-lab-body text-sm leading-8 text-[#e7e5e5]">
                  {dashboard?.social_media_copy}
                </p>
              </article>

              {Object.entries(dashboard?.platform_recommendations || {}).map(([platform, details]) => (
                <article key={platform} className="glass-noir rounded-[1.9rem] p-6">
                  <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                    {platform}
                  </p>
                  <p className="mt-4 font-lab-body text-sm leading-7 text-[#acabab]">
                    {details.strategy}
                  </p>

                  <div className="mt-6">
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {content.socialPanels.titles}
                    </p>
                    <div className="mt-3 space-y-3">
                      {(details.titles || []).map((title, index) => {
                        const key = `${platform}-title-${index}`;

                        return (
                          <div
                            key={key}
                            className="rounded-[1.3rem] border border-white/[0.08] bg-white/[0.04] p-4"
                          >
                            <p className="font-lab-body text-sm leading-7 text-[#e7e5e5]">{title}</p>
                            <button
                              type="button"
                              onClick={() => handleCopy(title, key)}
                              className="micro-button mt-4 rounded-full border border-white/10 px-3 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]"
                            >
                              {copiedKey === key ? content.copied : content.copyAction}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                        {content.socialPanels.caption}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(details.caption || "", `${platform}-caption`)}
                        className="micro-button rounded-full border border-white/10 px-3 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]"
                      >
                        {copiedKey === `${platform}-caption` ? content.copied : content.copyAction}
                      </button>
                    </div>
                    <p className="mt-3 font-lab-body text-sm leading-7 text-[#e7e5e5]">
                      {details.caption}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* ======= SERIES MODE: UPLOAD ======= */}
      {mode === "series" && seriesPhase === "upload" && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="max-w-3xl space-y-4">
            <p className="font-lab-label text-[11px] uppercase tracking-[0.42em] text-[#48ddbc]">
              {content.protocolLabel}
            </p>
            <h1 className="font-lab-headline text-5xl tracking-[-0.05em] text-[#e7e5e5] sm:text-6xl">
              {content.seriesUploadTitle}
            </h1>
            <p className="max-w-2xl font-lab-body text-base leading-8 text-[#acabab]">
              {content.seriesUploadIntro}
            </p>
          </div>

          <div
            {...getSeriesRootProps({
              onClick: () => {
                if (seriesItems.length < 12) seriesInputRef.current?.click();
              },
            })}
            className={`relative min-h-[14rem] cursor-pointer overflow-hidden rounded-[1.8rem] border-2 border-dashed p-6 transition duration-300 sm:p-8 ${
              isSeriesDragActive
                ? "border-[#48ddbc] bg-[rgba(72,221,188,0.06)]"
                : seriesItems.length >= 12
                  ? "cursor-not-allowed border-white/10 bg-[#111111]"
                  : "border-white/20 bg-[#0e0e0e] hover:border-[#48ddbc]/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#48ddbc]">
                <span className="material-symbols-outlined text-[2rem]">photo_library</span>
              </div>
              <div>
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  {isSeriesDragActive
                    ? locale === "zh"
                      ? "释放以添加"
                      : "Release to add"
                    : content.seriesDropHint}
                </p>
                {seriesItems.length > 0 && (
                  <p className="mt-2 font-lab-body text-sm text-[#757575]">
                    {content.seriesFrameCount(seriesItems.length)} / 12
                  </p>
                )}
              </div>
            </div>
          </div>

          {seriesItems.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {seriesItems.map((item, index) => (
                <div key={item.id} className="group relative aspect-square overflow-hidden rounded-[1rem]">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/50">
                    <button
                      type="button"
                      onClick={() => handleSeriesRemoveItem(item.id)}
                      className="hidden rounded-full border border-white/30 bg-black/60 p-2 text-white transition group-hover:flex"
                    >
                      <span className="material-symbols-outlined text-[1.1rem]">close</span>
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 font-lab-label text-[9px] uppercase tracking-[0.2em] text-[#acabab]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              ))}
              {seriesItems.length < 12 && (
                <button
                  type="button"
                  onClick={() => seriesInputRef.current?.click()}
                  className="aspect-square rounded-[1rem] border-2 border-dashed border-white/10 bg-white/[0.03] transition hover:border-[#48ddbc]/50 hover:bg-[rgba(72,221,188,0.04)] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[1.4rem] text-[#757575]">add</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSeriesAnalyze}
              disabled={seriesItems.length < 2}
              className={`micro-button rounded-full px-7 py-3.5 font-lab-label text-[10px] uppercase tracking-[0.34em] transition ${
                seriesItems.length >= 2
                  ? "bg-[#48ddbc] text-[#111111] hover:bg-[#61ebcb]"
                  : "cursor-not-allowed bg-white/10 text-[#757575]"
              }`}
            >
              {content.seriesAnalyzeBtn}
            </button>
            {seriesItems.length === 1 && (
              <p className="font-lab-body text-sm text-[#757575]">{content.seriesMinWarning}</p>
            )}
          </div>
        </motion.section>
      )}

      {/* ======= SERIES MODE: ANALYZING ======= */}
      {mode === "series" && seriesPhase === "analyzing" && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex min-h-[60vh] flex-col items-center justify-center gap-10 text-center"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(72,221,188,0.3)] bg-[rgba(72,221,188,0.06)]">
            <span className="material-symbols-outlined animate-pulse text-[3rem] text-[#48ddbc]">
              blur_on
            </span>
          </div>
          <div className="space-y-3">
            <h2 className="font-lab-headline text-4xl tracking-[-0.04em] text-[#e7e5e5]">
              {content.seriesAnalyzingTitle}
            </h2>
            <p className="font-lab-body text-base text-[#acabab]">
              {content.seriesAnalyzingHint(seriesProgress.done, seriesProgress.total)}
            </p>
          </div>
          <div className="w-full max-w-sm">
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#48ddbc]"
                animate={{
                  width:
                    seriesProgress.total > 0
                      ? `${(seriesProgress.done / seriesProgress.total) * 100}%`
                      : "0%",
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="mt-3 font-lab-label text-[10px] uppercase tracking-[0.34em] text-[#757575]">
              {seriesProgress.done} / {seriesProgress.total}
            </p>
          </div>
        </motion.section>
      )}

      {/* ======= SERIES MODE: RESULT ======= */}
      {mode === "series" && seriesPhase === "result" && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="font-lab-label text-[11px] uppercase tracking-[0.42em] text-[#48ddbc]">
                {content.protocolLabel}
              </p>
              <h1 className="font-lab-headline text-4xl tracking-[-0.05em] text-[#e7e5e5] sm:text-5xl">
                {content.seriesDashboardHeading}
              </h1>
              <p className="font-lab-body text-sm text-[#acabab]">
                {content.seriesFrameCount(seriesItems.length)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeriesReset}
              className="micro-button self-start rounded-full border border-white/10 px-5 py-3 font-lab-label text-[10px] uppercase tracking-[0.34em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc] sm:self-auto"
            >
              {content.seriesNewAnalysis}
            </button>
          </div>

          {/* Filmstrip */}
          <div>
            <p className="mb-4 font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
              {content.seriesFilmstripLabel}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {seriesItems.map((item, index) => {
                const score = calcMaturityScore(item.analysis);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSeriesIndex(index)}
                    className={`relative flex-none overflow-hidden rounded-[0.85rem] border-2 transition duration-200 ${
                      selectedSeriesIndex === index
                        ? "border-[#48ddbc] shadow-[0_0_16px_rgba(72,221,188,0.28)]"
                        : "border-white/10 hover:border-white/30"
                    }`}
                    style={{ width: "7rem", height: "5rem" }}
                  >
                    <img
                      src={item.previewUrl}
                      alt={`${content.seriesFrameLabel} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute bottom-1.5 left-2 font-lab-label text-[9px] uppercase tracking-[0.22em] text-white/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.analysis && (
                      <span className="absolute bottom-1.5 right-2 font-lab-label text-[9px] font-medium text-[#48ddbc]">
                        {score}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aggregate Panel: Coherence + Series Avg Resonance */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Coherence Score */}
            <div className="glass-panel glass-edge rounded-[2rem] p-6 xl:col-span-4">
              <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                {content.seriesCoherenceLabel}
              </p>
              <div className="mt-6 flex items-center gap-6">
                <div className="relative h-24 w-24 flex-none">
                  <svg viewBox="0 0 100 100" className="-rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="#c180ff" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={GAUGE_CIRCUMFERENCE - (GAUGE_CIRCUMFERENCE * coherenceScore) / 100}
                      style={{ transition: "stroke-dashoffset 2s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-lab-label text-[11px] uppercase tracking-[0.22em] text-[#e7e5e5]">
                      {coherenceScore}%
                    </span>
                  </div>
                </div>
                <p className="font-lab-body text-sm leading-7 text-[#acabab]">
                  {content.seriesCoherenceDesc}
                </p>
              </div>
            </div>

            {/* Series Average Resonance */}
            <div className="glass-panel glass-edge rounded-[2rem] p-6 xl:col-span-8">
              <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                {content.seriesAvgLabel}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {seriesMetrics.map((metric) => (
                  <div key={metric.key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-lab-body text-sm text-[#e7e5e5]">{metric.label}</span>
                      <span className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                        {metric.value}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full bg-[#48ddbc]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {seriesNarrative && (
            <div className="glass-panel glass-edge rounded-[2rem] p-6 sm:p-8 space-y-8">
              <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                {seriesOverviewCopy.panelLabel}
              </p>

              <div className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-5">
                  <div>
                    <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                      {seriesOverviewCopy.directionLabel}
                    </p>
                    <h2 className="mt-3 font-lab-headline text-[1.7rem] tracking-[-0.04em] text-[#e7e5e5]">
                      {seriesNarrative.dominant_direction}
                    </h2>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative h-28 w-28 flex-none">
                      <svg viewBox="0 0 100 100" className="-rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="6"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#c180ff"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={GAUGE_CIRCUMFERENCE}
                          strokeDashoffset={
                            GAUGE_CIRCUMFERENCE -
                            (GAUGE_CIRCUMFERENCE * seriesNarrative.avg_maturity_score) / 100
                          }
                          style={{ transition: "stroke-dashoffset 2s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-lab-label text-[11px] uppercase tracking-[0.26em] text-[#e7e5e5]">
                          {seriesNarrative.avg_maturity_score}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                        {content.scoreLabel}
                      </p>
                      <p className="mt-3 font-lab-headline text-[1.7rem] tracking-[-0.04em] text-[#e7e5e5]">
                        {seriesNarrative.avg_maturity_score}
                      </p>
                    </div>
                  </div>

                  <p className="font-lab-body text-sm leading-7 text-[#acabab]">
                    {seriesNarrative.series_narrative}
                  </p>
                </div>

                <div className="space-y-6 xl:col-span-7">
                  <div className="glass-noir rounded-[1.7rem] p-5">
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {seriesOverviewCopy.distributionLabel}
                    </p>
                    <div className="mt-6 flex items-end gap-2 overflow-x-auto pb-2">
                      {seriesItems.map((item, index) => {
                        const score = seriesFrameScores[index] || 0;
                        return (
                          <div
                            key={`${item.id}-overview`}
                            className="group relative flex w-8 flex-none flex-col items-center gap-3"
                            title={`${score}`}
                          >
                            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-[#111111] px-2 py-1 font-lab-label text-[9px] uppercase tracking-[0.22em] text-[#e7e5e5] opacity-0 transition group-hover:opacity-100">
                              {score}
                            </div>
                            <div className="flex h-36 items-end">
                              <div
                                className="w-4 rounded-t-full bg-[#48ddbc]"
                                style={{ height: `${score}%` }}
                              />
                            </div>
                            <span className="font-lab-label text-[9px] uppercase tracking-[0.22em] text-[#757575]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                      {seriesOverviewCopy.titlesLabel}
                    </p>
                    <div className="mt-3 space-y-3">
                      {seriesNarrative.series_titles.map((title, index) => {
                        const key = `series-overview-title-${index}`;
                        return (
                          <div
                            key={key}
                            className="rounded-[1.3rem] border border-white/[0.08] bg-white/[0.04] p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <p className="font-lab-body text-sm leading-7 text-[#e7e5e5]">
                                {title}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleCopy(title, key)}
                                className="micro-button rounded-full border border-white/10 px-3 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]"
                              >
                                {copiedKey === key ? content.copied : content.copyAction}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">
                        {seriesOverviewCopy.captionLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            seriesNarrative.series_caption || "",
                            "series-overview-caption",
                          )
                        }
                        className="micro-button rounded-full border border-white/10 px-3 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]"
                      >
                        {copiedKey === "series-overview-caption"
                          ? content.copied
                          : content.copyAction}
                      </button>
                    </div>
                    <p className="mt-3 font-lab-body text-sm leading-7 text-[#e7e5e5]">
                      {seriesNarrative.series_caption}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Frame Detail */}
          {selectedSeriesItem?.analysis && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-t border-white/[0.08] pt-6">
                <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                  {content.seriesSelectedLabel}
                </p>
                <span className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                  {String(selectedSeriesIndex + 1).padStart(2, "0")} / {String(seriesItems.length).padStart(2, "0")}
                </span>
              </div>

              {/* Selected frame image + metrics */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="glass-panel glass-edge flex flex-col overflow-hidden rounded-[2rem] xl:col-span-8">
                  <div className="flex flex-none items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
                    <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                      {content.imagePanelLabel}
                    </p>
                    <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                      {content.seriesFrameLabel} {String(selectedSeriesIndex + 1).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 bg-[#0e0e0e] p-4 sm:p-6">
                    <div className="h-full overflow-hidden rounded-[1.7rem] border border-white/[0.08] bg-black">
                      <img
                        src={selectedSeriesItem.previewUrl}
                        alt={selectedSeriesItem.file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-panel glass-edge rounded-[2rem] p-5 sm:p-6 xl:col-span-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#757575]">
                        {content.scoreLabel}
                      </p>
                      <h2 className="mt-3 font-lab-headline text-[1.7rem] tracking-[-0.04em] text-[#e7e5e5]">
                        {calcMaturityScore(selectedSeriesItem.analysis)}
                      </h2>
                    </div>
                    <div className="relative h-28 w-28">
                      <svg viewBox="0 0 100 100" className="-rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke="#48ddbc" strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={GAUGE_CIRCUMFERENCE}
                          strokeDashoffset={
                            GAUGE_CIRCUMFERENCE -
                            (GAUGE_CIRCUMFERENCE * calcMaturityScore(selectedSeriesItem.analysis)) / 100
                          }
                          style={{ transition: "stroke-dashoffset 2s ease" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-lab-label text-[11px] uppercase tracking-[0.26em] text-[#e7e5e5]">
                          {calcMaturityScore(selectedSeriesItem.analysis)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-5 font-lab-body text-sm leading-7 text-[#acabab]">
                    {content.scoreText}
                  </p>
                  <div className="mt-8">
                    <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                      {content.resonanceLabel}
                    </p>
                    <div className="mt-5 space-y-4">
                      {[
                        { key: "melancholy_isolation", label: copy?.aestheticLab?.metricLabels?.melancholy_isolation || "Melancholy / Isolation" },
                        { key: "mystery_unknown", label: copy?.aestheticLab?.metricLabels?.mystery_unknown || "Mystery / Unknown" },
                        { key: "power_grit", label: copy?.aestheticLab?.metricLabels?.power_grit || "Power / Grit" },
                        { key: "intimacy_warmth", label: copy?.aestheticLab?.metricLabels?.intimacy_warmth || "Intimacy / Warmth" },
                      ].map((m) => {
                        const val = selectedSeriesResonance[m.key] || 0;
                        return (
                          <div key={m.key} className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-lab-body text-sm text-[#e7e5e5]">{m.label}</span>
                              <span className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{val}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/8">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 0.9, ease: "easeOut" }}
                                className="h-full rounded-full bg-[#48ddbc]"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected frame tabs: Pro + Social */}
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "pro", label: content.professionalTab },
                  { key: "social", label: content.socialTab },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSeriesActiveTab(tab.key)}
                    className={`micro-button rounded-full border px-5 py-3 font-lab-label text-[10px] uppercase tracking-[0.34em] transition ${
                      seriesActiveTab === tab.key
                        ? "border-[#48ddbc] bg-[#48ddbc] text-[#111111]"
                        : "border-white/10 text-[#e7e5e5] hover:border-[#48ddbc] hover:text-[#48ddbc]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {seriesActiveTab === "pro" ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <article className="glass-noir rounded-[1.9rem] p-6">
                    <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                      {content.professionalPanels.color}
                    </p>
                    <div className="mt-6 space-y-5">
                      <div>
                        <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.fieldLabels.dominantTone}</p>
                        <p className="mt-2 font-lab-headline text-[1.45rem] tracking-[-0.03em] text-[#e7e5e5]">
                          {selectedSeriesDashboard?.color_analysis?.dominant_tone}
                        </p>
                      </div>
                      <div>
                        <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.fieldLabels.visualWeight}</p>
                        <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                          {selectedSeriesDashboard?.color_analysis?.visual_weight_breakdown}
                        </p>
                      </div>
                      <div>
                        <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.fieldLabels.colorPsychology}</p>
                        <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                          {selectedSeriesDashboard?.color_analysis?.color_psychology}
                        </p>
                      </div>
                    </div>
                  </article>
                  <article className="glass-noir rounded-[1.9rem] p-6">
                    <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                      {content.professionalPanels.lighting}
                    </p>
                    <div className="mt-6 space-y-5">
                      <div>
                        <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.fieldLabels.lightingType}</p>
                        <p className="mt-2 font-lab-headline text-[1.45rem] tracking-[-0.03em] text-[#e7e5e5]">
                          {selectedSeriesDashboard?.lighting_deconstruction?.lighting_type}
                        </p>
                      </div>
                      <div>
                        <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.fieldLabels.lightRatio}</p>
                        <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                          {selectedSeriesDashboard?.lighting_deconstruction?.light_ratio_evaluation}
                        </p>
                      </div>
                      <div>
                        <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.fieldLabels.spatialDepth}</p>
                        <p className="mt-2 font-lab-body text-sm leading-7 text-[#acabab]">
                          {selectedSeriesDashboard?.lighting_deconstruction?.spatial_depth}
                        </p>
                      </div>
                    </div>
                  </article>
                  <article className="glass-noir rounded-[1.9rem] p-6 lg:col-span-2">
                    <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                      {content.professionalPanels.advice}
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {(selectedSeriesDashboard?.actionable_advice || []).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.04] p-5">
                          <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">0{index + 1}</p>
                          <p className="mt-3 font-lab-body text-sm leading-7 text-[#e7e5e5]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <article className="glass-noir rounded-[1.9rem] p-6 lg:col-span-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">
                        {content.socialPanels.copy}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedSeriesDashboard?.social_media_copy || "", `series-social-copy-${selectedSeriesIndex}`)}
                        className="micro-button rounded-full border border-white/10 px-4 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]"
                      >
                        {copiedKey === `series-social-copy-${selectedSeriesIndex}` ? content.copied : content.copyAction}
                      </button>
                    </div>
                    <p className="mt-5 font-lab-body text-sm leading-8 text-[#e7e5e5]">
                      {selectedSeriesDashboard?.social_media_copy}
                    </p>
                  </article>
                  {Object.entries(selectedSeriesDashboard?.platform_recommendations || {}).map(([platform, details]) => (
                    <article key={platform} className="glass-noir rounded-[1.9rem] p-6">
                      <p className="font-lab-label text-[11px] uppercase tracking-[0.34em] text-[#48ddbc]">{platform}</p>
                      <p className="mt-4 font-lab-body text-sm leading-7 text-[#acabab]">{details.strategy}</p>
                      <div className="mt-6">
                        <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.socialPanels.titles}</p>
                        <div className="mt-3 space-y-3">
                          {(details.titles || []).map((title, index) => {
                            const key = `series-${selectedSeriesIndex}-${platform}-title-${index}`;
                            return (
                              <div key={key} className="rounded-[1.3rem] border border-white/[0.08] bg-white/[0.04] p-4">
                                <p className="font-lab-body text-sm leading-7 text-[#e7e5e5]">{title}</p>
                                <button type="button" onClick={() => handleCopy(title, key)}
                                  className="micro-button mt-4 rounded-full border border-white/10 px-3 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]">
                                  {copiedKey === key ? content.copied : content.copyAction}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-6">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#757575]">{content.socialPanels.caption}</p>
                          <button type="button" onClick={() => handleCopy(details.caption || "", `series-${selectedSeriesIndex}-${platform}-caption`)}
                            className="micro-button rounded-full border border-white/10 px-3 py-2 font-lab-label text-[10px] uppercase tracking-[0.3em] text-[#e7e5e5] transition hover:border-[#48ddbc] hover:text-[#48ddbc]">
                            {copiedKey === `series-${selectedSeriesIndex}-${platform}-caption` ? content.copied : content.copyAction}
                          </button>
                        </div>
                        <p className="mt-3 font-lab-body text-sm leading-7 text-[#e7e5e5]">{details.caption}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.section>
      )}
    </div>
  );
}
