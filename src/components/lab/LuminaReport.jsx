import { motion } from 'framer-motion';
import { LuminaBookingModal } from './LuminaBookingModal';
import { useState, useEffect } from 'react';

// ─── SVG Radar Helpers ────────────────────────────────────────────────────────

function polarToXY(angleDeg, radius, cx = 150, cy = 150) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

function scoreToRadius(score) { return (score / 100) * 120; }

const AXES = ['composition', 'lighting', 'colorNarrative', 'emotionalDepth', 'technicalPrecision'];

// Short labels for SVG radar — 4 chars max each so Chinese fits cleanly
const RADAR_LABELS = {
  en: ['Composition', 'Lighting', 'Color', 'Emotion', 'Precision'],
  zh: ['构图', '光影', '色彩', '情绪', '精度'],
};

function gridPoints(r) { return AXES.map((_, i) => polarToXY(i * 72, r)); }
function toPolyPoints(pts) { return pts.map(([x, y]) => `${x},${y}`).join(' '); }

// ─── Score Definitions ────────────────────────────────────────────────────────
// `id` is always the English key — keeps LuminaBookingModal WEAKNESS_MAP working

const SCORE_DEFS = [
  { id: 'Composition',         scoreKey: 'composition' },
  { id: 'Lighting',            scoreKey: 'lighting' },
  { id: 'Color Narrative',     scoreKey: 'colorNarrative' },
  { id: 'Emotional Depth',     scoreKey: 'emotionalDepth' },
  { id: 'Technical Precision', scoreKey: 'technicalPrecision' },
];

// ─── Translation Dictionary ───────────────────────────────────────────────────

const T = {
  en: {
    navLabel:            "Lumina Lab / Diagnostic Report",
    returnBtn:           "← Return",
    paletteSectionLabel: "Visual DNA — Extracted Palette",
    radarSectionLabel:   "Cinematic DNA",
    metricLuminance:     "AVG LUMINANCE",
    metricContrast:      "CONTRAST Σ",
    metricDetail:        "DETAIL SCORE",
    breakdownLabel:      "Technical Breakdown",
    scoreLabels:         ['Composition', 'Lighting', 'Color Narrative', 'Emotional Depth', 'Technical Precision'],
    verdictLabel:        "Diagnostic Verdict",
    beforeAfterLabel:    "Before / After — Cinema Grade",
    cinemaGradeActive:   "◼ Eldon Grade — Active",
    cinemaGradeInactive: "◻ Apply Eldon Cinema Grade",
    cinemaActiveNote:    "Simulated grade. The real version requires deliberate light and lens control.",
    cinemaInactiveNote:  "Toggle above to preview Eldon's cinematic grade applied to your image.",
    ctaEyebrow:          "Stop guessing. Start creating.",
    ctaHeadline:         "Your Cinematic Potential, Realised.",
    ctaBody:             "The filter is a simulation. Eldon's work is not. One session delivers the light, the shadow, and the narrative your image is already reaching for.",
    ctaBtn:              "Book Eldon Studio",
    processingLabel:     "Processing pixel data...",
    analyzingAlt:        "Analyzed",
    originalLabel:       "Original",
    cinemaActiveTag:     "Eldon Cinema Grade — Active",
  },
  zh: {
    navLabel:            "Lumina 实验室 / 美学诊断报告",
    returnBtn:           "← 返回",
    paletteSectionLabel: "视觉基因 — 主题色罩提取",
    radarSectionLabel:   "电影感基因图谱",
    metricLuminance:     "平均明度 (LUMA)",
    metricContrast:      "光比系数 (CONTRAST)",
    metricDetail:        "解析力指数 (DETAIL)",
    breakdownLabel:      "量化技术解构",
    scoreLabels:         ['视觉构图', '光影深度', '色彩叙事', '情绪张力', '画质细节'],
    verdictLabel:        "美学诊断结论",
    beforeAfterLabel:    "前后对比 — 电影色彩分级",
    cinemaGradeActive:   "◼ Eldon 色彩分级 — 已启用",
    cinemaGradeInactive: "◻ 应用 Eldon 电影级色彩重构",
    cinemaActiveNote:    "模拟色彩分级效果。真实成片依赖专业布光与镜头控制。",
    cinemaInactiveNote:  "点击上方按钮，预览 Eldon 电影级色彩分级效果。",
    ctaEyebrow:          "停止猜测。开始创作。",
    ctaHeadline:         "释放您的电影级影像潜能。",
    ctaBody:             "滤镜是模拟，Eldon 的作品不是。一次拍摄，带来光线、阴影与您的影像一直在寻找的叙事张力。",
    ctaBtn:              "预约 Eldon Studio 专属定制",
    processingLabel:     "像素数据分析中...",
    analyzingAlt:        "分析中",
    originalLabel:       "原片",
    cinemaActiveTag:     "Eldon 电影色彩分级 — 已启用",
  },
};

// ─── Canvas Image Analysis ────────────────────────────────────────────────────

async function analyzeImage(dataURL) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const W = 128, H = 128;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);

      let sumL = 0, sumL2 = 0;
      const lumaArr = [];
      for (let i = 0; i < data.length; i += 4) {
        const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        lumaArr.push(l);
        sumL += l; sumL2 += l * l;
      }
      const n = lumaArr.length;
      const avgLuminance = sumL / n;
      const stdLuminance = Math.sqrt(sumL2 / n - (avgLuminance * avgLuminance));

      const buckets = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = (data[i] >> 4) << 4;
        const g = (data[i + 1] >> 4) << 4;
        const b = (data[i + 2] >> 4) << 4;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const palette = Object.entries(buckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key]) => {
          const [r, g, b] = key.split(',').map(Number);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        });

      let blockVar = 0, blockCount = 0;
      const bSize = 16;
      for (let by = 0; by < H; by += bSize) {
        for (let bx = 0; bx < W; bx += bSize) {
          let bSum = 0, bSum2 = 0, bN = 0;
          for (let y = by; y < Math.min(by + bSize, H); y++) {
            for (let x = bx; x < Math.min(bx + bSize, W); x++) {
              const l = lumaArr[y * W + x];
              bSum += l; bSum2 += l * l; bN++;
            }
          }
          const bMean = bSum / bN;
          blockVar += bSum2 / bN - bMean * bMean;
          blockCount++;
        }
      }
      const avgBlockVar = blockVar / blockCount;
      const detailScore = Math.min(100, Math.round((avgBlockVar / 1000) * 100));

      resolve({ avgLuminance, stdLuminance, palette, detailScore });
    };
    img.src = dataURL;
  });
}

function deriveScores({ avgLuminance, stdLuminance, detailScore }) {
  const lighting          = Math.min(100, Math.round((stdLuminance / 80) * 100));
  const exposure          = Math.round(100 - Math.abs(avgLuminance - 127) / 1.27);
  const technicalPrecision = Math.max(20, detailScore);
  const colorNarrative    = Math.min(100, Math.round(50 + (stdLuminance / 127) * 30 + (detailScore / 100) * 20));
  const composition       = Math.round((lighting * 0.4 + exposure * 0.4 + technicalPrecision * 0.2));
  const emotionalDepth    = Math.round((100 - exposure) * 0.5 + lighting * 0.5);
  return { composition, lighting, colorNarrative, emotionalDepth, technicalPrecision };
}

function generateVerdict({ avgLuminance, stdLuminance }, locale = 'en') {
  const isHighKey   = avgLuminance > 160;
  const isLowKey    = avgLuminance < 80;
  const isFlat      = stdLuminance < 30;
  const isContrasty = stdLuminance > 60;

  if (locale === 'zh') {
    if (isHighKey && isFlat)
      return "检测到高明度平调曝光。画面通透，但缺乏电影质感中典型的阴影压缩与立体轮廓。建议降低整体曝光约 1.5 档，通过暗部收束重建空间叙事层次。";
    if (isHighKey)
      return "检测到高明度曝光。画面通透，但缺乏电影质感中典型的阴影压缩与立体轮廓。降低 1.5 档曝光可有效锚定阴影区域，还原画面纵深。";
    if (isLowKey && isContrasty)
      return "具备极佳的低调 (Low-key) 电影感基础。暗部情绪浓郁，但当前阴影细节低于第 II 区域。需通过专业辅光重塑面部微反差，恢复中低调区域的影像细节。";
    if (isLowKey)
      return "具备极佳的低调 (Low-key) 电影感基础。暗部情绪浓郁，需通过专业辅光重塑面部微反差。提亮黑位约 15 点并引入轮廓光，可解锁画面潜藏的电影纵深。";
    if (isContrasty)
      return "高对比度渲染，中间调分离强烈，具备扎实的电影骨骼。仅缺专业灯光控制所带来的精准阴影落位，以完成最终叙事收束。";
    return "曝光均衡，色阶过渡平滑。技术基底扎实，但在电影叙事色彩的剥离感上仍有极大升华空间。刻意的光线方向性设计将有效解决这一叙事模糊性。";
  }

  if (isHighKey && isFlat)
    return "High-key lifestyle vibe. Lacks the cinematic compression of Eldon's signature style. Shadow detail is absent — the image reads as promotional, not cinematic.";
  if (isHighKey)
    return "Bright exposure with moderate tonal range. Closer to editorial than cinema. A deliberate underexposure of 1.5 stops would anchor the shadows and restore depth.";
  if (isLowKey && isContrasty)
    return "Strong noir potential. Shadows require more professional 'fill-light' to retain texture — currently crushing below Zone II. Eldon's Rembrandt approach would recover the mid-shadow detail.";
  if (isLowKey)
    return "Dark, brooding exposure. Tonal range is compressed in the low register. Lifting the blacks by 15 points and introducing a rim light would unlock the cinematic depth already latent here.";
  if (isContrasty)
    return "High-contrast rendering with strong mid-tone separation. The image has cinematic bones — it lacks only the precise shadow placement that professional lighting control enables.";
  return "Balanced exposure with soft tonal gradation. Technically correct, cinematically neutral. The narrative is present but not yet declared — deliberate light direction would resolve that ambiguity.";
}

function useTypingEffect(text, speed = 22) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LuminaReport({ imageData, onBook, onGoHome, locale = 'en' }) {
  const t = T[locale] ?? T.en;
  const radarLabels = RADAR_LABELS[locale] ?? RADAR_LABELS.en;

  const [analysis,    setAnalysis]    = useState(null);
  const [scores,      setScores]      = useState(null);
  const [cinemaGrade, setCinemaGrade] = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);

  useEffect(() => {
    if (!imageData) return;
    analyzeImage(imageData).then((result) => {
      setAnalysis(result);
      setScores(deriveScores(result));
    });
  }, [imageData]);

  const verdictText  = analysis ? generateVerdict(analysis, locale) : '';
  const typedVerdict = useTypingEffect(verdictText, 20);

  const dataPoints = scores
    ? AXES.map((key, i) => polarToXY(i * 72, scoreToRadius(scores[key])))
    : AXES.map((_, i) => polarToXY(i * 72, 0));

  // scoreRows: `id` stays English for modal WEAKNESS_MAP compat; `label` is localised
  const scoreRows = scores
    ? SCORE_DEFS.map(({ id, scoreKey }, idx) => ({
        id,
        label: t.scoreLabels[idx],
        value: scores[scoreKey],
      }))
    : [];

  // Weakest dimension — pass English id to modal so WEAKNESS_MAP keeps working
  const weakestId = scores
    ? scoreRows.reduce((min, row) => (row.value < min.value ? row : min), scoreRows[0]).id
    : 'Lighting';

  const palette = analysis?.palette ?? [];

  if (!scores) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#00e5ff] text-xs tracking-[0.3em] uppercase font-mono animate-pulse">
          {t.processingLabel}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-black text-white"
    >
      {/* ── Top nav bar ── */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-900">
        <button
          onClick={onGoHome}
          className="text-gray-600 text-xs tracking-[0.2em] uppercase hover:text-white transition-colors"
        >
          {t.returnBtn}
        </button>
        <p className="text-[#00e5ff] text-[10px] tracking-[0.3em] uppercase font-mono">
          {t.navLabel}
        </p>
        <div className="w-16" />
      </div>

      {/* ── Hero image ── */}
      <div className="relative w-full overflow-hidden" style={{ maxHeight: '55vh' }}>
        {imageData && (
          <img src={imageData} alt={t.analyzingAlt} className="w-full object-cover" style={{ maxHeight: '55vh' }} />
        )}
        <div className="absolute inset-x-0 top-0 bg-black" style={{ height: '6%' }} />
        <div className="absolute inset-x-0 bottom-0 bg-black" style={{ height: '6%' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        <div className="absolute bottom-4 right-6 text-gray-600 text-[9px] tracking-[0.25em] uppercase font-mono">
          2.35 : 1 / Cinematic
        </div>
      </div>

      {/* ── Extracted Palette ── */}
      {palette.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-4">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-4">
            {t.paletteSectionLabel}
          </p>
          <div className="flex gap-3">
            {palette.map((hex, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full border border-white/10"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-[8px] font-mono text-gray-700 uppercase">{hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Radar + Breakdown ── */}
      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
        {/* Radar chart */}
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-6">
            {t.radarSectionLabel}
          </p>
          <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto block">
            {[40, 80, 120].map((r) => (
              <polygon key={r} points={toPolyPoints(gridPoints(r))} fill="none" stroke="#1a1a1a" strokeWidth="1" />
            ))}
            {AXES.map((_, i) => {
              const [x, y] = polarToXY(i * 72, 120);
              return <line key={i} x1="150" y1="150" x2={x} y2={y} stroke="#333" strokeWidth="1" />;
            })}
            <polygon points={toPolyPoints(dataPoints)} fill="rgba(0,229,255,0.12)" stroke="#00e5ff" strokeWidth="1.5" />
            {radarLabels.map((label, i) => {
              const [x, y] = polarToXY(i * 72, 140);
              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#555"
                  fontSize={locale === 'zh' ? 10 : 9}
                  fontFamily={locale === 'zh' ? "'PingFang SC', 'Noto Sans SC', monospace" : "monospace"}
                >
                  {label}
                </text>
              );
            })}
          </svg>

          {/* Raw metrics — numbers always monospace */}
          <div className="mt-6 flex gap-6 justify-center">
            <div className="text-center">
              <p className="text-[8px] tracking-[0.15em] uppercase text-gray-700 font-mono whitespace-nowrap">
                {t.metricLuminance}
              </p>
              <p className="text-[#00e5ff] text-sm font-mono mt-1">
                {Math.round(analysis.avgLuminance)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] tracking-[0.15em] uppercase text-gray-700 font-mono whitespace-nowrap">
                {t.metricContrast}
              </p>
              <p className="text-[#00e5ff] text-sm font-mono mt-1">
                {Math.round(analysis.stdLuminance)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] tracking-[0.15em] uppercase text-gray-700 font-mono whitespace-nowrap">
                {t.metricDetail}
              </p>
              <p className="text-[#00e5ff] text-sm font-mono mt-1">
                {analysis.detailScore}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex flex-col justify-center space-y-6">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600">
            {t.breakdownLabel}
          </p>
          {scoreRows.map(({ id, label, value }) => (
            <div key={id}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] tracking-[0.15em] uppercase text-gray-500 font-mono">
                  {label}
                </span>
                <span className="text-[10px] tracking-[0.2em] text-[#00e5ff] font-mono">{value}</span>
              </div>
              <div className="h-px bg-gray-900 w-full relative">
                <div className="absolute inset-y-0 left-0 bg-[#00e5ff]/40" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Diagnostic Verdict ── */}
      <div className="max-w-3xl mx-auto px-6 pb-16 border-t border-gray-900 pt-12">
        <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-4">
          {t.verdictLabel}
        </p>
        <p className="text-gray-300 text-base leading-relaxed font-light min-h-[4em]">
          {typedVerdict}
          <span className="inline-block w-[2px] h-[1em] bg-[#00e5ff] ml-1 animate-pulse align-middle" />
        </p>
      </div>

      {/* ── Cinema Grade Toggle ── */}
      <div className="max-w-5xl mx-auto px-6 pb-16 border-t border-gray-900 pt-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600">
            {t.beforeAfterLabel}
          </p>
          <button
            onClick={() => setCinemaGrade((v) => !v)}
            className={`text-[10px] tracking-[0.2em] uppercase font-mono px-5 py-2 border transition-all duration-300 ${
              cinemaGrade
                ? 'border-[#00e5ff]/60 text-[#00e5ff] bg-[#00e5ff]/5'
                : 'border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400'
            }`}
          >
            {cinemaGrade ? t.cinemaGradeActive : t.cinemaGradeInactive}
          </button>
        </div>
        {imageData && (
          <div className="relative overflow-hidden">
            <img
              src={imageData}
              alt={t.analyzingAlt}
              className="w-full object-cover transition-all duration-700"
              style={{
                aspectRatio: '2.35/1',
                filter: cinemaGrade
                  ? 'contrast(1.15) saturate(0.8) sepia(0.15) brightness(0.9)'
                  : 'none',
              }}
            />
            <div className="absolute bottom-4 left-4 text-[9px] tracking-[0.2em] uppercase font-mono">
              {cinemaGrade
                ? <span className="text-[#00e5ff]">{t.cinemaActiveTag}</span>
                : <span className="text-gray-700">{t.originalLabel}</span>
              }
            </div>
          </div>
        )}
        <p className="text-gray-700 text-[10px] tracking-[0.2em] uppercase mt-4 font-mono text-center">
          {cinemaGrade ? t.cinemaActiveNote : t.cinemaInactiveNote}
        </p>
      </div>

      {/* ── CTA / Book ── */}
      <div className="border-t border-gray-900 py-20 px-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 font-mono mb-6">
          {t.ctaEyebrow}
        </p>
        <h2
          className={`font-serif text-white font-light mb-6 ${
            locale === 'zh'
              ? 'text-3xl md:text-4xl tracking-[0.08em]'
              : 'text-4xl md:text-5xl tracking-[0.2em] uppercase'
          }`}
          style={locale === 'zh' ? { fontFamily: "'Noto Serif SC', 'Noto Serif', serif" } : undefined}
        >
          {t.ctaHeadline}
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-10 leading-relaxed">
          {t.ctaBody}
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="border border-white/20 text-white text-xs tracking-[0.3em] uppercase px-10 py-4 hover:border-white/60 hover:bg-white/5 transition-all duration-300"
        >
          {t.ctaBtn}
        </button>
      </div>

      {modalOpen && (
        <LuminaBookingModal
          weaknessProp={weakestId}
          locale={locale}
          onClose={() => setModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
