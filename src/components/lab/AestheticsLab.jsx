/**
 * AestheticsLab.jsx — Interactive Vision Deconstructor
 * Layout: left canvas (image + overlay) + right control console (4 tabs)
 * Aesthetic: Black-Gold glass, 60fps CSS transitions
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeAestheticsDeconstruct } from '../../services/aestheticDeconstruct';

// ─── constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'color',       label: '色彩剥离', en: 'Color'       },
  { id: 'lighting',    label: '光影拓扑', en: 'Lighting'    },
  { id: 'composition', label: '构图骨架', en: 'Composition' },
  { id: 'typography',  label: '高定排版', en: 'Typography'  },
];

const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: 'easeInOut' } },
  exit:    { opacity: 0, transition: { duration: 0.3,  ease: 'easeInOut' } },
};

// ─── sub-components ───────────────────────────────────────────────────────────

/** Color overlay: blurred image + floating swatches */
function ColorOverlay({ colors }) {
  return (
    <motion.div {...FADE} className="absolute inset-0 flex flex-col">
      {/* blurred tint */}
      <div className="absolute inset-0" style={{ backdropFilter: 'blur(18px)', background: 'rgba(10,10,10,0.55)' }} />
      {/* swatches */}
      <div className="relative z-10 flex h-full items-end pb-8 px-6 gap-0">
        {colors.map((c, i) => (
          <motion.div
            key={c.hex}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
            style={{
              width: `${c.coverage}%`,
              backgroundColor: c.hex,
              transformOrigin: 'bottom',
            }}
            className="relative group flex-shrink-0 h-24 cursor-default"
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-3 py-2 text-center whitespace-nowrap">
                <div className="text-[10px] font-mono text-white/60">{c.hex}</div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-yellow-400/80 mt-0.5">{c.mood}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{c.coverage}%</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/** Lighting overlay: parameter bar only (filter applied directly to img) */
function LightingOverlay({ lighting }) {
  return (
    <motion.div {...FADE} className="absolute inset-0 pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pointer-events-auto">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Contrast Ratio</span>
            <span className="text-[10px] font-mono text-yellow-400">{(lighting.contrast_ratio * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${lighting.contrast_ratio * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #d4af37, #f5e17a)' }}
            />
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">{lighting.type} · {lighting.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/** Composition overlay: golden guide lines drawn via canvas */
function CompositionOverlay({ composition, imgW, imgH }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgW || !imgH) return;
    canvas.width  = imgW;
    canvas.height = imgH;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, imgW, imgH);

    // animate lines sequentially
    const lines = composition.guidelines;
    let drawn = 0;
    const STEP_MS = 180;

    function drawLine(line, progress) {
      const x1 = line.x1 * imgW, y1 = line.y1 * imgH;
      const x2 = line.x2 * imgW, y2 = line.y2 * imgH;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
      ctx.strokeStyle = 'rgba(212,175,55,0.55)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    function animateLine(idx) {
      if (idx >= lines.length) {
        // draw power points
        composition.power_points?.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x * imgW, pt.y * imgH, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(212,175,55,0.7)';
          ctx.fill();
        });
        return;
      }
      let start = null;
      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 400, 1);
        ctx.clearRect(0, 0, imgW, imgH);
        // redraw all completed lines
        for (let i = 0; i < idx; i++) drawLine(lines[i], 1);
        drawLine(lines[idx], p);
        if (p < 1) requestAnimationFrame(step);
        else { drawn++; setTimeout(() => animateLine(idx + 1), STEP_MS); }
      }
      requestAnimationFrame(step);
    }

    const timer = setTimeout(() => animateLine(0), 100);
    return () => clearTimeout(timer);
  }, [composition, imgW, imgH]);

  return (
    <motion.div {...FADE} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ objectFit: 'cover' }} />
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/70 mb-1">{composition.type.replace(/_/g, ' ')}</p>
          <p className="text-[10px] text-white/40 leading-relaxed">{composition.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/** Typography overlay: dark gradient + headline rendered in recommended font */
function TypographyOverlay({ typography }) {
  return (
    <motion.div {...FADE} className="absolute inset-0 flex flex-col justify-end pointer-events-none">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}
      />
      <div className="relative z-10 px-8 pb-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          className="text-[10px] uppercase tracking-[0.4em] mb-3"
          style={{ color: 'rgba(212,175,55,0.7)', fontFamily: typography.body_font }}
        >
          {typography.layout_suggestion}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: 'easeOut' }}
          className="text-4xl sm:text-5xl font-bold tracking-[0.12em] leading-tight"
          style={{ fontFamily: `'${typography.headline_font}', serif`, color: typography.color_on_image }}
        >
          {typography.dummy_headline}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-3 text-sm tracking-[0.25em] uppercase"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: typography.body_font }}
        >
          {typography.dummy_subline}
        </motion.p>
      </div>
    </motion.div>
  );
}

// ─── right panel tab content ──────────────────────────────────────────────────

function ColorPanel({ colors }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">提取主色 · Dominant Palette</p>
      {colors.map((c, i) => (
        <motion.div
          key={c.hex}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/10" style={{ backgroundColor: c.hex }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-white/50">{c.hex}</span>
              <span className="text-[10px] text-yellow-400/70">{c.coverage}%</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.coverage}%` }}
                transition={{ delay: i * 0.07 + 0.2, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: c.hex }}
              />
            </div>
          </div>
          <span className="text-[10px] text-white/40 w-10 text-right flex-shrink-0">{c.mood}</span>
        </motion.div>
      ))}
    </div>
  );
}

function LightingPanel({ lighting }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">光影类型 · Lighting Type</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <p className="text-lg font-serif text-white tracking-wide">{lighting.type}</p>
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">对比强度</span>
          <span className="text-[10px] font-mono text-yellow-400">{(lighting.contrast_ratio * 100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${lighting.contrast_ratio * 100}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #d4af37, #f5e17a)' }}
          />
        </div>
      </div>
      <p className="text-xs text-white/40 leading-relaxed border-l border-yellow-600/30 pl-3">
        {lighting.description}
      </p>
    </div>
  );
}

function CompositionPanel({ composition }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">构图类型 · Composition</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <p className="text-sm font-mono text-yellow-400 tracking-widest uppercase">
          {composition.type.replace(/_/g, ' ')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {composition.power_points?.map((pt, i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1">Power Point {i + 1}</p>
            <p className="text-[10px] font-mono text-white/60">{(pt.x * 100).toFixed(0)}% · {(pt.y * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/40 leading-relaxed border-l border-yellow-600/30 pl-3">
        {composition.description}
      </p>
    </div>
  );
}

function TypographyPanel({ typography }) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">排版方案 · Typography</p>
      <div className="space-y-2">
        {[
          { label: 'Headline', value: typography.headline_font },
          { label: 'Body',     value: typography.body_font },
          { label: 'Layout',   value: typography.layout_suggestion },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">{row.label}</span>
            <span className="text-xs text-white/70">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="bg-[#0a0a0a] border border-yellow-600/20 rounded-2xl p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-yellow-600/60 mb-2">海报预览</p>
        <p
          className="text-2xl tracking-[0.15em] leading-tight"
          style={{ fontFamily: `'${typography.headline_font}', serif`, color: typography.color_on_image }}
        >
          {typography.dummy_headline}
        </p>
        <p className="text-[10px] tracking-[0.3em] uppercase mt-2 text-white/30"
           style={{ fontFamily: typography.body_font }}>
          {typography.dummy_subline}
        </p>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function AestheticsLab() {
  const [, setImageFile]   = useState(null);
  const [imageUrl, setImageUrl]     = useState(null);
  const [result, setResult]         = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [activeTab, setActiveTab]   = useState('color');
  const [imgSize, setImgSize]       = useState({ w: 0, h: 0 });
  const imgRef   = useRef(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImageUrl(url);
    setResult(null);
    setAnalyzing(true);
    setActiveTab('color');
    try {
      const data = await analyzeAestheticsDeconstruct(file);
      setResult(data);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImgLoad = () => {
    if (imgRef.current) {
      setImgSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
    }
  };

  // cleanup object URL
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  return (
    <div className="w-full">
      {/* header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-yellow-500/60 mb-2">Interactive Vision Deconstructor</p>
        <h2 className="font-serif text-2xl text-white tracking-wide">美学拆解仪</h2>
      </div>

      {!imageUrl ? (
        /* ── upload zone ── */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] cursor-pointer transition-all duration-300 hover:border-yellow-600/40 hover:bg-white/[0.04]"
          style={{ minHeight: 320 }}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-2xl group-hover:border-yellow-600/30 transition-colors">
              ◈
            </div>
            <div>
              <p className="text-sm text-white/60 tracking-wide">拖放影像或点击上传</p>
              <p className="text-[10px] text-white/25 mt-1 uppercase tracking-[0.2em]">JPG · PNG · WEBP</p>
            </div>
          </div>
        </div>
      ) : (
        /* ── main layout: canvas + console ── */
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* LEFT: image canvas */}
          <div
            className="relative rounded-3xl overflow-hidden bg-black"
            style={{ minHeight: 400 }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              onLoad={handleImgLoad}
              className="w-full h-full object-cover"
              style={{
                filter: analyzing
                  ? 'brightness(0.4)'
                  : (result && activeTab === 'color')
                    ? 'blur(18px) brightness(0.6)'
                    : (result && activeTab === 'lighting')
                      ? `contrast(${1 + (result.lighting?.contrast_ratio ?? 0.5) * 0.8}) brightness(${1 - (result.lighting?.contrast_ratio ?? 0.5) * 0.15}) saturate(0.7)`
                      : 'none',
                transition: 'filter 0.6s ease-in-out',
              }}
            />

            {/* analyzing spinner */}
            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 rounded-full border border-yellow-600/40 border-t-yellow-500 animate-spin" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-yellow-500/60 animate-pulse">
                  Deconstructing...
                </p>
              </div>
            )}

            {/* tab overlays */}
            {result && !analyzing && (
              <AnimatePresence mode="wait">
                {activeTab === 'color' && (
                  <ColorOverlay key="color" colors={result.colors} />
                )}
                {activeTab === 'lighting' && (
                  <LightingOverlay key="lighting" lighting={result.lighting} />
                )}
                {activeTab === 'composition' && (
                  <CompositionOverlay key="composition" composition={result.composition} imgW={imgSize.w} imgH={imgSize.h} />
                )}
                {activeTab === 'typography' && (
                  <TypographyOverlay key="typography" typography={result.typography} />
                )}
              </AnimatePresence>
            )}

            {/* replace button */}
            <button
              onClick={() => inputRef.current?.click()}
              className="absolute top-4 right-4 bg-[#0a0a0a]/70 backdrop-blur border border-white/10 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white hover:border-white/30 transition-all"
            >
              更换影像
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </div>

          {/* RIGHT: control console */}
          <div className="flex flex-col gap-4">
            {/* tab switcher */}
            <div className="grid grid-cols-2 gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => result && setActiveTab(tab.id)}
                  disabled={!result || analyzing}
                  className={[
                    'rounded-2xl border px-3 py-3 text-left transition-all duration-300',
                    activeTab === tab.id && result
                      ? 'border-yellow-600/50 bg-yellow-600/10'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/15',
                    (!result || analyzing) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <p className={`text-[10px] uppercase tracking-[0.2em] ${activeTab === tab.id && result ? 'text-yellow-400' : 'text-white/40'}`}>
                    {tab.en}
                  </p>
                  <p className="text-xs text-white/60 mt-0.5">{tab.label}</p>
                </button>
              ))}
            </div>

            {/* panel content */}
            <div className="flex-1 bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 min-h-[280px]">
              {analyzing && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 animate-pulse">分析中...</p>
                </div>
              )}
              {result && !analyzing && (
                <AnimatePresence mode="wait">
                  {activeTab === 'color'       && <motion.div key="cp" {...FADE}><ColorPanel       colors={result.colors}           /></motion.div>}
                  {activeTab === 'lighting'    && <motion.div key="lp" {...FADE}><LightingPanel    lighting={result.lighting}       /></motion.div>}
                  {activeTab === 'composition' && <motion.div key="op" {...FADE}><CompositionPanel composition={result.composition} /></motion.div>}
                  {activeTab === 'typography'  && <motion.div key="tp" {...FADE}><TypographyPanel  typography={result.typography}   /></motion.div>}
                </AnimatePresence>
              )}
              {!result && !analyzing && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/15">上传影像后激活</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
