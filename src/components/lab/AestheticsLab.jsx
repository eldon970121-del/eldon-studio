/**
 * AestheticsLab.jsx — Lumina 美学实验室 · 核心交互模块重构
 * Cinematic dark / black-gold aesthetic
 * State: upload → developing → ready (macro ↔ micro)
 */
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeAestheticsDeconstruct } from '../../services/aestheticDeconstruct';

// ─── constants ────────────────────────────────────────────────────────────────
const GOLD     = '#d4af37';
const GOLD_DIM = 'rgba(212,175,55,0.55)';

const PLACEHOLDER_IMAGES = [
  { id: 'p1', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80' },
  { id: 'p2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80' },
  { id: 'p3', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80' },
];

const MICRO_TABS = [
  { id: 'lighting',    zh: '光影拓扑', en: 'LIGHTING'    },
  { id: 'color',       zh: '色彩剥离', en: 'COLOR'       },
  { id: 'composition', zh: '构图骨架', en: 'COMPOSITION' },
  { id: 'typography',  zh: '高定排版', en: 'TYPOGRAPHY'  },
];

const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: 'easeInOut' } },
  exit:    { opacity: 0, transition: { duration: 0.3,  ease: 'easeInOut' } },
};

// ─── UploadZone ───────────────────────────────────────────────────────────────
function UploadZone({ onFiles, onDemo, inputRef }) {
  const [dragging, setDragging] = useState(false);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[520px] p-8">
      <motion.div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        animate={{ borderColor: dragging ? GOLD_DIM : 'rgba(255,255,255,0.08)' }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-2xl flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed bg-white/[0.015] cursor-pointer"
        style={{ minHeight: 360, borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <AnimatePresence>
          {dragging && (
            <motion.div key="glow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ boxShadow: `inset 0 0 40px rgba(212,175,55,0.12)` }} />
          )}
        </AnimatePresence>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border"
          style={{ borderColor: 'rgba(212,175,55,0.2)', color: GOLD_DIM, background: 'rgba(212,175,55,0.04)' }}>
          ▣
        </div>
        <div className="text-center">
          <p className="text-sm text-white/50 tracking-wide">拖放影像或点击上传</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 mt-1.5">支持多图 · JPG · PNG · WEBP</p>
        </div>
      </motion.div>
      <button onClick={onDemo}
        className="mt-5 text-[10px] uppercase tracking-[0.25em] transition-colors duration-200"
        style={{ color: 'rgba(212,175,55,0.45)' }}
        onMouseEnter={e => e.currentTarget.style.color = GOLD}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(212,175,55,0.45)'}>
        或使用演示影像
      </button>
    </div>
  );
}

// ─── DarkroomTransition ───────────────────────────────────────────────────────
function DarkroomTransition() {
  return (
    <motion.div {...FADE} className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'rgba(10,10,10,0.97)' }}>
      <div className="absolute inset-x-0 overflow-hidden" style={{ top: 0, bottom: 0 }}>
        <motion.div animate={{ y: ['0%', '100%'] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, transparent)` }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <p className="text-[10px] uppercase tracking-[0.6em] animate-pulse" style={{ color: 'rgba(212,175,55,0.6)' }}>Developing</p>
        <p className="text-[10px] text-white/25 tracking-[0.2em]">正在解析光影结构...</p>
      </div>
    </motion.div>
  );
}

// ─── ColorOverlay ─────────────────────────────────────────────────────────────
function ColorOverlay({ colors, imgRef }) {
  const canvasRef = useRef(null);
  const spectrum = useMemo(() => {
    if (!colors?.length) return '';
    let pos = 0;
    return colors.map(c => { const s = `${c.hex} ${pos}%, ${c.hex} ${pos + c.coverage}%`; pos += c.coverage; return s; }).join(', ');
  }, [colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef?.current;
    if (!canvas || !img || !colors?.length) return;
    const w = img.offsetWidth, h = img.offsetHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const seed = (hex, i) => ((parseInt(hex.replace('#','').slice(0,4), 16) + i * 1234) % 10000) / 10000;
    let frame;
    const startTime = performance.now();
    function draw(now) {
      const t = Math.min((now - startTime) / 1800, 1);
      ctx.clearRect(0, 0, w, h);
      colors.forEach((c, i) => {
        const delay = i * 0.15;
        const p = Math.max(0, Math.min(1, (t - delay) / 0.7));
        if (p <= 0) return;
        const sx = seed(c.hex, i) * w, sy = seed(c.hex, i + 1) * h;
        const r = Math.max(w, h) * (0.3 + c.coverage / 100 * 0.4);
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        grad.addColorStop(0, c.hex + 'cc'); grad.addColorStop(1, c.hex + '00');
        ctx.globalCompositeOperation = 'color';
        ctx.globalAlpha = 0.6 * p;
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      });
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      if (t < 1) frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [colors, imgRef]);

  return (
    <motion.div {...FADE} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ mixBlendMode: 'color' }} />
      <div className="absolute bottom-0 left-0 right-0 h-10"
        style={{ background: `linear-gradient(90deg, ${spectrum})`, opacity: 0.8 }} />
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-3 pb-1">
        {colors.map(c => <span key={c.hex} className="text-[8px] font-mono text-white/60">{c.hex}</span>)}
      </div>
    </motion.div>
  );
}

// ─── LightingOverlay ──────────────────────────────────────────────────────────
function LightingOverlay({ lighting, imgRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef?.current;
    if (!canvas || !img || !lighting) return;
    const w = img.offsetWidth, h = img.offsetHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const hc = lighting.highlight_center || { x: 0.35, y: 0.28 };
    const sc = lighting.shadow_center    || { x: 0.68, y: 0.62 };
    let frame;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 900);
      const sg = ctx.createRadialGradient(sc.x*w, sc.y*h, 0, sc.x*w, sc.y*h, w*0.5);
      sg.addColorStop(0, `rgba(0,0,30,${(0.55*pulse).toFixed(2)})`);
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = sg; ctx.fillRect(0,0,w,h);
      const hg = ctx.createRadialGradient(hc.x*w, hc.y*h, 0, hc.x*w, hc.y*h, w*0.35);
      hg.addColorStop(0, `rgba(212,175,55,${(0.28*pulse).toFixed(2)})`);
      hg.addColorStop(0.5, `rgba(255,220,120,${(0.12*pulse).toFixed(2)})`);
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = hg; ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.4 * pulse;
      ctx.setLineDash([4,6]); ctx.strokeStyle = GOLD; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(sc.x*w, sc.y*h); ctx.lineTo(hc.x*w, hc.y*h); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [lighting, imgRef]);
  return (
    <motion.div {...FADE} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/35">Light Type</span>
            <span className="text-[10px] font-mono" style={{ color: GOLD }}>{lighting.type}</span>
          </div>
          <div className="h-px bg-white/10 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${lighting.contrast_ratio * 100}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }} className="h-full"
              style={{ background: `linear-gradient(90deg, ${GOLD}, #f5e17a)` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── CompositionOverlay ───────────────────────────────────────────────────────
function CompositionOverlay({ composition, imgRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef?.current;
    if (!canvas || !img || !composition) return;
    const w = img.offsetWidth, h = img.offsetHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const lines = composition.guidelines || [];
    const pp = composition.power_points?.[0] || { x: 0.333, y: 0.333 };
    let frame, linesDoneAt = null;
    function drawLine(l, p) {
      ctx.beginPath(); ctx.moveTo(l.x1*w, l.y1*h);
      ctx.lineTo(l.x1*w+(l.x2*w-l.x1*w)*p, l.y1*h+(l.y2*h-l.y1*h)*p);
      ctx.strokeStyle = GOLD_DIM; ctx.lineWidth = 0.7; ctx.stroke();
    }
    function crosshair(ts) {
      ctx.clearRect(0,0,w,h);
      lines.forEach(l => drawLine(l,1));
      const pulse = 0.6 + 0.4 * Math.sin((ts-(linesDoneAt||ts))/600);
      const cx=pp.x*w, cy=pp.y*h, arm=18;
      ctx.globalAlpha=pulse; ctx.strokeStyle=GOLD; ctx.lineWidth=1;
      ctx.shadowBlur=10; ctx.shadowColor=GOLD;
      ctx.beginPath(); ctx.moveTo(cx-arm,cy); ctx.lineTo(cx+arm,cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx,cy-arm); ctx.lineTo(cx,cy+arm); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fillStyle=GOLD; ctx.fill();
      ctx.shadowBlur=0; ctx.globalAlpha=1;
      frame = requestAnimationFrame(crosshair);
    }
    function animateLine(idx, startTs) {
      return function step(ts) {
        if (!startTs) startTs=ts;
        const p = Math.min((ts-startTs)/450,1);
        ctx.clearRect(0,0,w,h);
        for(let i=0;i<idx;i++) drawLine(lines[i],1);
        drawLine(lines[idx],p);
        if(p<1) frame=requestAnimationFrame(step);
        else if(idx+1<lines.length) frame=requestAnimationFrame(animateLine(idx+1,null));
        else { linesDoneAt=ts; frame=requestAnimationFrame(crosshair); }
      };
    }
    frame = lines.length ? requestAnimationFrame(animateLine(0,null)) : requestAnimationFrame(crosshair);
    return () => cancelAnimationFrame(frame);
  }, [composition, imgRef]);
  return (
    <motion.div {...FADE} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5">
          <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: GOLD_DIM }}>
            {composition.type?.replace(/_/g,' ')}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TypographyOverlay ────────────────────────────────────────────────────────
function TypographyOverlay({ typography }) {
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [showSub, setShowSub] = useState(false);
  const headline = typography?.dummy_headline || 'THE SILENT ECHO';
  const subline  = typography?.dummy_subline  || 'A Portrait in Solitude';
  const font     = typography?.headline_font  || 'Playfair Display';
  useEffect(() => {
    setLine1(''); setLine2(''); setShowSub(false);
    let i=0;
    const t1 = setInterval(() => {
      i++; setLine1(headline.slice(0,i));
      if(i>=headline.length) {
        clearInterval(t1);
        setTimeout(() => {
          setShowSub(true); let j=0;
          const t2 = setInterval(() => { j++; setLine2(subline.slice(0,j)); if(j>=subline.length) clearInterval(t2); }, 35);
        }, 300);
      }
    }, 48);
    return () => clearInterval(t1);
  }, [headline, subline]);
  return (
    <motion.div {...FADE} className="absolute inset-0 pointer-events-none flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
      <div className="relative z-10 px-8 pb-10">
        <div className="border border-dashed rounded-lg px-4 py-3 inline-block" style={{ borderColor: 'rgba(212,175,55,0.2)' }}>
          <p className="text-[9px] uppercase tracking-[0.35em] mb-2" style={{ color: 'rgba(212,175,55,0.5)' }}>
            {typography?.layout_suggestion || '极简留白'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[0.1em] leading-tight"
            style={{ fontFamily: `'${font}', serif`, color: typography?.color_on_image || 'rgba(232,220,200,0.92)' }}>
            {line1}<span className="animate-pulse">|</span>
          </h2>
          <AnimatePresence>
            {showSub && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                className="mt-2 text-xs tracking-[0.3em] uppercase text-white/40"
                style={{ fontFamily: typography?.body_font || 'Inter' }}>
                {line2}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────
function ColorPanel({ colors }) {
  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 mb-4">色彩指纹 · Color Fingerprint</p>
      {colors.map((c,i) => (
        <motion.div key={c.hex} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07 }}
          className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex-shrink-0 border border-white/10" style={{ backgroundColor: c.hex }} />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] font-mono text-white/50">{c.hex}</span>
              <span className="text-[9px]" style={{ color: GOLD_DIM }}>{c.coverage}%</span>
            </div>
            <div className="h-px bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width:0 }} animate={{ width:`${c.coverage}%` }}
                transition={{ delay:i*0.07+0.2, duration:0.6, ease:'easeOut' }}
                className="h-full rounded-full" style={{ backgroundColor: c.hex }} />
            </div>
          </div>
          <span className="text-[9px] text-white/35 w-8 text-right flex-shrink-0">{c.mood}</span>
        </motion.div>
      ))}
    </div>
  );
}

function LightingPanel({ lighting }) {
  return (
    <div className="space-y-4">
      <p className="text-[9px] uppercase tracking-[0.25em] text-white/30">光影参数 · Lighting Data</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <p className="text-base font-serif text-white tracking-wide">{lighting.type}</p>
        <p className="text-[9px] text-white/35 mt-1">光线质感</p>
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">对比强度</span>
          <span className="text-[9px] font-mono" style={{ color: GOLD }}>{(lighting.contrast_ratio*100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div initial={{ width:0 }} animate={{ width:`${lighting.contrast_ratio*100}%` }}
            transition={{ duration:0.9, ease:'easeOut' }} className="h-full rounded-full"
            style={{ background:`linear-gradient(90deg, ${GOLD}, #f5e17a)` }} />
        </div>
      </div>
      <p className="text-[10px] text-white/35 leading-relaxed border-l pl-3" style={{ borderColor:'rgba(212,175,55,0.3)' }}>
        {lighting.description}
      </p>
    </div>
  );
}

function CompositionPanel({ composition }) {
  const pp = composition.power_points?.[0];
  return (
    <div className="space-y-4">
      <p className="text-[9px] uppercase tracking-[0.25em] text-white/30">构图骨架 · Composition</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: GOLD }}>
          {composition.type?.replace(/_/g,' ')}
        </p>
      </div>
      {pp && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/25 mb-1">Visual Center X</p>
            <p className="text-[10px] font-mono text-white/55">{(pp.x*100).toFixed(0)}%</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-center">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/25 mb-1">Visual Center Y</p>
            <p className="text-[10px] font-mono text-white/55">{(pp.y*100).toFixed(0)}%</p>
          </div>
        </div>
      )}
      <p className="text-[10px] text-white/35 leading-relaxed border-l pl-3" style={{ borderColor:'rgba(212,175,55,0.3)' }}>
        {composition.description}
      </p>
    </div>
  );
}

function TypographyPanel({ typography }) {
  return (
    <div className="space-y-4">
      <p className="text-[9px] uppercase tracking-[0.25em] text-white/30">排版方案 · Typography</p>
      {[
        { label:'Headline', value: typography.headline_font },
        { label:'Body',     value: typography.body_font },
        { label:'Layout',   value: typography.layout_suggestion },
      ].map(row => (
        <div key={row.label} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/30">{row.label}</span>
          <span className="text-xs text-white/60">{row.value}</span>
        </div>
      ))}
      <div className="bg-[#0a0a0a] border rounded-2xl p-4" style={{ borderColor:'rgba(212,175,55,0.2)' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] mb-2" style={{ color:'rgba(212,175,55,0.5)' }}>海报预览</p>
        <p className="text-xl tracking-[0.12em] leading-tight"
          style={{ fontFamily:`'${typography.headline_font}', serif`, color: typography.color_on_image }}>
          {typography.dummy_headline}
        </p>
        <p className="text-[9px] tracking-[0.3em] uppercase mt-2 text-white/25"
          style={{ fontFamily: typography.body_font }}>{typography.dummy_subline}</p>
      </div>
    </div>
  );
}

function MacroPanel({ images }) {
  const score = (8.2 + images.length * 0.1).toFixed(1);
  const moods = ['压抑', '力量感', '克制'];
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[9px] uppercase tracking-[0.35em] text-white/25 mb-1">Vision Sequence</p>
        <p className="text-lg font-serif tracking-[0.15em]" style={{ color: GOLD }}>SEQUENCE: 01</p>
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-[0.25em] text-white/25 mb-2">情绪基调</p>
        <div className="flex flex-wrap gap-2">
          {moods.map(m => (
            <span key={m} className="text-[9px] px-2.5 py-1 rounded-full border" style={{ borderColor:'rgba(212,175,55,0.3)', color: GOLD_DIM }}>
              {m}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-[9px] uppercase tracking-[0.25em] text-white/25">视觉一致性</p>
          <p className="text-[10px] font-mono" style={{ color: GOLD }}>{score} / 10</p>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div initial={{ width:0 }} animate={{ width:`${parseFloat(score)*10}%` }}
            transition={{ duration:1.2, ease:'easeOut' }} className="h-full rounded-full"
            style={{ background:`linear-gradient(90deg, ${GOLD}, #f5e17a)` }} />
        </div>
      </div>
      <div className="border-l pl-3" style={{ borderColor:'rgba(212,175,55,0.3)' }}>
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-1">社交发布策略</p>
        <p className="text-[10px] text-white/45 leading-relaxed">
          建议采用高反差封面作为首图，文案强化空间留白的叙事张力，序列发布间隔 24h 以维持视觉悬念。
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Filmstrip
// ══════════════════════════════════════════════════════
function Filmstrip({ images, activeIndex, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {images.map((img, i) => (
        <motion.button
          key={img.id}
          onClick={() => onSelect(i)}
          whileHover={{ scale: 1.05 }}
          className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border transition-all duration-300"
          style={{ borderColor: i === activeIndex ? GOLD : 'rgba(255,255,255,0.08)' }}
        >
          <img src={img.url} alt="" className="w-full h-full object-cover" style={{ opacity: i === activeIndex ? 1 : 0.4 }} />
          {i === activeIndex && (
            <div className="absolute inset-0 rounded-lg" style={{ boxShadow:`inset 0 0 0 1.5px ${GOLD}` }} />
          )}
        </motion.button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MacroView — series collage
// ══════════════════════════════════════════════════════
function MacroView({ images, onEnterMicro }) {
  const hero = images[0];
  const rest = images.slice(1);
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left: collage */}
      <div className="flex-1 relative min-h-[320px]">
        {/* Hero */}
        <motion.div
          layoutId={`img-${hero.id}`}
          className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer"
          onClick={() => onEnterMicro(0)}
          whileHover={{ scale: 1.01 }}
        >
          <img src={hero.url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4">
            <p className="text-[9px] uppercase tracking-[0.35em] text-white/40">Hero Frame</p>
            <p className="text-sm font-serif tracking-[0.15em]" style={{ color: GOLD }}>01 / {images.length.toString().padStart(2,'0')}</p>
          </div>
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.25em]"
            style={{ background:'rgba(0,0,0,0.5)', color: GOLD, border:`1px solid rgba(212,175,55,0.3)` }}>
            点击拆解
          </div>
        </motion.div>

        {/* Overlay thumbnails */}
        {rest.slice(0,2).map((img, i) => (
          <motion.div
            key={img.id}
            layoutId={`img-${img.id}`}
            className="absolute rounded-xl overflow-hidden cursor-pointer border border-white/10"
            style={{
              width: '28%', aspectRatio:'3/4',
              bottom: i === 0 ? '12%' : '4%',
              right: i === 0 ? '2%' : '30%',
              opacity: 0.65,
            }}
            onClick={() => onEnterMicro(i + 1)}
            whileHover={{ opacity: 1, scale: 1.03 }}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>

      {/* Right: MacroPanel */}
      <div className="lg:w-64 xl:w-72 flex-shrink-0 flex flex-col justify-center">
        <MacroPanel images={images} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MicroView — single image + 4-tab console
// ══════════════════════════════════════════════════════
function MicroView({ images, activeIndex, activeMicroTab, setActiveMicroTab, imgSize, setImgSize, onBack, onSelectImage }) {
  const img = images[activeIndex];
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current) {
      const { offsetWidth: w, offsetHeight: h } = imgRef.current;
      setImgSize({ w, h });
    }
  }, [activeIndex, setImgSize]);

  const overlayMap = {
    lighting:    <LightingOverlay    imgSize={imgSize} />,
    color:       <ColorOverlay       imgSize={imgSize} />,
    composition: <CompositionOverlay imgSize={imgSize} />,
    typography:  <TypographyOverlay  imgSize={imgSize} />,
  };

  const panelMap = {
    lighting:    <LightingPanel    />,
    color:       <ColorPanel       />,
    composition: <CompositionPanel />,
    typography:  <TypographyPanel  />,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left 2/3: image + overlay */}
      <div className="flex-1 relative min-h-[320px] flex flex-col gap-3">
        {/* Back button */}
        <button
          onClick={onBack}
          className="self-start flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-white/30 hover:text-white/70 transition-colors"
        >
          <span>←</span> 返回序列
        </button>

        {/* Image + overlay */}
        <div className="relative flex-1 rounded-2xl overflow-hidden">
          <motion.img
            layoutId={`img-${img.id}`}
            ref={imgRef}
            src={img.url}
            alt=""
            className="w-full h-full object-cover"
            onLoad={() => {
              if (imgRef.current) {
                setImgSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
              }
            }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMicroTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              {overlayMap[activeMicroTab]}
            </motion.div>
          </AnimatePresence>

          {/* Tab label badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.3em]"
            style={{ background:'rgba(0,0,0,0.6)', color: GOLD, border:`1px solid rgba(212,175,55,0.25)` }}>
            {MICRO_TABS.find(t => t.id === activeMicroTab)?.zh}
          </div>

          {/* Frame counter */}
          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-white/30">
            {String(activeIndex + 1).padStart(2,'0')} / {String(images.length).padStart(2,'0')}
          </div>
        </div>

        {/* Filmstrip */}
        <Filmstrip images={images} activeIndex={activeIndex} onSelect={onSelectImage} />
      </div>

      {/* Right 1/3: console */}
      <div className="lg:w-64 xl:w-72 flex-shrink-0 flex flex-col gap-4">
        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1.5">
          {MICRO_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMicroTab(tab.id)}
              className="flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all duration-200"
              style={{
                borderColor: activeMicroTab === tab.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)',
                background: activeMicroTab === tab.id ? 'rgba(212,175,55,0.08)' : 'transparent',
              }}
            >
              <span className="text-[8px] uppercase tracking-[0.3em]" style={{ color: activeMicroTab === tab.id ? GOLD : 'rgba(255,255,255,0.25)' }}>
                {tab.en}
              </span>
              <span className="text-[10px] mt-0.5" style={{ color: activeMicroTab === tab.id ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)' }}>
                {tab.zh}
              </span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMicroTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {panelMap[activeMicroTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// Main export
// ══════════════════════════════════════════════════════
export function AestheticsLab() {
  const [images, setImages]               = useState([]);
  const [phase, setPhase]                 = useState('upload');   // 'upload'|'developing'|'ready'
  const [currentView, setCurrentView]     = useState('macro');    // 'macro'|'micro'
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeMicroTab, setActiveMicroTab]     = useState('lighting');
  const [imgSize, setImgSize]             = useState({ w: 0, h: 0 });

  function handleFiles(files) {
    const newImages = Array.from(files).map(file => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      file,
      url: URL.createObjectURL(file),
      result: null,
    }));
    setImages(newImages);
    setPhase('developing');
    setTimeout(() => setPhase('ready'), 2200);
  }

  function handleDemoLoad() {
    const demoImages = PLACEHOLDER_IMAGES.map(p => ({ ...p, file: null, result: null }));
    setImages(demoImages);
    setPhase('developing');
    setTimeout(() => setPhase('ready'), 2200);
  }

  function handleEnterMicro(index) {
    setActiveImageIndex(index);
    setCurrentView('micro');
  }

  function handleBackToMacro() {
    setCurrentView('macro');
  }

  return (
    <div className="relative min-h-[600px] rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #111111 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }} />

      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.45em] mb-1" style={{ color: GOLD_DIM }}>Lumina · Visual Deconstructor</p>
            <h2 className="font-serif text-xl tracking-[0.12em] text-white/90">美学拆解仪</h2>
          </div>
          {phase === 'ready' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCurrentView('macro'); setPhase('upload'); setImages([]); }}
                className="text-[9px] uppercase tracking-[0.3em] text-white/20 hover:text-white/50 transition-colors"
              >
                重置
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
                <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: GOLD_DIM }}>
                  {currentView === 'macro' ? 'Macro View' : 'Micro View'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative p-6">
        <AnimatePresence mode="wait">
          {phase === 'upload' && (
            <motion.div key="upload" {...FADE}>
              <UploadZone onFiles={handleFiles} onDemo={handleDemoLoad} />
            </motion.div>
          )}

          {phase === 'developing' && (
            <motion.div key="developing" {...FADE}>
              <DarkroomTransition />
            </motion.div>
          )}

          {phase === 'ready' && (
            <motion.div key="ready" {...FADE} className="min-h-[480px]">
              <AnimatePresence mode="wait">
                {currentView === 'macro' ? (
                  <motion.div key="macro" {...FADE} className="h-full">
                    <MacroView images={images} onEnterMicro={handleEnterMicro} />
                  </motion.div>
                ) : (
                  <motion.div key="micro" {...FADE} className="h-full">
                    <MicroView
                      images={images}
                      activeIndex={activeImageIndex}
                      activeMicroTab={activeMicroTab}
                      setActiveMicroTab={setActiveMicroTab}
                      imgSize={imgSize}
                      setImgSize={setImgSize}
                      onBack={handleBackToMacro}
                      onSelectImage={(i) => setActiveImageIndex(i)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
