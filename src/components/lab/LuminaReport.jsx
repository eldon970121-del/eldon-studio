import { motion, useMotionValue, useSpring, animate } from 'framer-motion';
import { LuminaBookingModal } from './LuminaBookingModal';
import { useState, useEffect, useRef, useMemo } from 'react';

// ─── SVG Radar Helpers (module scope) ────────────────────────────────────────

function polarToXY(angleDeg, radius, cx = 150, cy = 150) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

function scoreToRadius(score) { return (score / 100) * 120; }

const AXES = ['composition', 'lighting', 'colorNarrative', 'emotionalDepth', 'technicalPrecision'];
const AXIS_LABELS = ['Composition', 'Lighting', 'Color', 'Emotion', 'Precision'];

function gridPoints(r) { return AXES.map((_, i) => polarToXY(i * 72, r)); }
function toPolyPoints(pts) { return pts.map(([x, y]) => `${x},${y}`).join(' '); }

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
  const lighting = Math.min(100, Math.round((stdLuminance / 80) * 100));
  const exposure = Math.round(100 - Math.abs(avgLuminance - 127) / 1.27);
  const technicalPrecision = Math.max(20, detailScore);
  const colorNarrative = Math.min(100, Math.round(50 + (stdLuminance / 127) * 30 + (detailScore / 100) * 20));
  const composition = Math.round((lighting * 0.4 + exposure * 0.4 + technicalPrecision * 0.2));
  const emotionalDepth = Math.round((100 - exposure) * 0.5 + lighting * 0.5);
  return { composition, lighting, colorNarrative, emotionalDepth, technicalPrecision };
}

function generateVerdict({ avgLuminance, stdLuminance }) {
  const isHighKey  = avgLuminance > 160;
  const isLowKey   = avgLuminance < 80;
  const isFlat     = stdLuminance < 30;
  const isContrasty = stdLuminance > 60;

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

export function LuminaReport({ imageData, onBook, onGoHome }) {
  const [analysis, setAnalysis] = useState(null);
  const [scores, setScores]     = useState(null);
  const [cinemaGrade, setCinemaGrade] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!imageData) return;
    analyzeImage(imageData).then((result) => {
      setAnalysis(result);
      setScores(deriveScores(result));
    });
  }, [imageData]);

  const verdict  = analysis ? generateVerdict(analysis) : '';
  const typedVerdict = useTypingEffect(verdict, 20);

  const dataPoints = scores
    ? AXES.map((key, i) => polarToXY(i * 72, scoreToRadius(scores[key])))
    : AXES.map((_, i) => polarToXY(i * 72, 0));

  const scoreRows = scores ? [
    { label: 'Composition',         value: scores.composition },
    { label: 'Lighting',            value: scores.lighting },
    { label: 'Color Narrative',     value: scores.colorNarrative },
    { label: 'Emotional Depth',     value: scores.emotionalDepth },
    { label: 'Technical Precision', value: scores.technicalPrecision },
  ] : [];

  // Find weakest dimension label for modal pitch
  const weakestLabel = scores
    ? scoreRows.reduce((min, row) => (row.value < min.value ? row : min), scoreRows[0]).label
    : 'Lighting';

  const palette = analysis?.palette ?? [];

  if (!scores) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#00e5ff] text-xs tracking-[0.3em] uppercase font-mono animate-pulse">
          Processing pixel data...
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
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-900">
        <button
          onClick={onGoHome}
          className="text-gray-600 text-xs tracking-[0.2em] uppercase hover:text-white transition-colors"
        >
          ← Return
        </button>
        <p className="text-[#00e5ff] text-[10px] tracking-[0.3em] uppercase font-mono">
          Lumina Lab / Diagnostic Report
        </p>
        <div className="w-16" />
      </div>

      <div className="relative w-full overflow-hidden" style={{ maxHeight: '55vh' }}>
        {imageData && (
          <img src={imageData} alt="Analyzed" className="w-full object-cover" style={{ maxHeight: '55vh' }} />
        )}
        <div className="absolute inset-x-0 top-0 bg-black" style={{ height: '6%' }} />
        <div className="absolute inset-x-0 bottom-0 bg-black" style={{ height: '6%' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        <div className="absolute bottom-4 right-6 text-gray-600 text-[9px] tracking-[0.25em] uppercase font-mono">
          2.35 : 1 / Cinematic
        </div>
      </div>

      {palette.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-4">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-4">Visual DNA — Extracted Palette</p>
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

      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12">
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-6">Cinematic DNA</p>
          <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto block">
            {[40, 80, 120].map((r) => (
              <polygon key={r} points={toPolyPoints(gridPoints(r))} fill="none" stroke="#1a1a1a" strokeWidth="1" />
            ))}
            {AXES.map((_, i) => {
              const [x, y] = polarToXY(i * 72, 120);
              return <line key={i} x1="150" y1="150" x2={x} y2={y} stroke="#333" strokeWidth="1" />;
            })}
            <polygon points={toPolyPoints(dataPoints)} fill="rgba(0,229,255,0.12)" stroke="#00e5ff" strokeWidth="1.5" />
            {AXIS_LABELS.map((label, i) => {
              const [x, y] = polarToXY(i * 72, 140);
              return (
                <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#555" fontSize="9" fontFamily="monospace">
                  {label}
                </text>
              );
            })}
          </svg>
          <div className="mt-6 flex gap-6 justify-center">
            <div className="text-center">
              <p className="text-[8px] tracking-[0.2em] uppercase text-gray-700 font-mono">Avg Luminance</p>
              <p className="text-[#00e5ff] text-sm font-mono mt-1">{Math.round(analysis.avgLuminance)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] tracking-[0.2em] uppercase text-gray-700 font-mono">Contrast σ</p>
              <p className="text-[#00e5ff] text-sm font-mono mt-1">{Math.round(analysis.stdLuminance)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] tracking-[0.2em] uppercase text-gray-700 font-mono">Detail Score</p>
              <p className="text-[#00e5ff] text-sm font-mono mt-1">{analysis.detailScore}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600">Technical Breakdown</p>
          {scoreRows.map(({ label, value }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-500 font-mono">{label}</span>
                <span className="text-[10px] tracking-[0.2em] text-[#00e5ff] font-mono">{value}</span>
              </div>
              <div className="h-px bg-gray-900 w-full relative">
                <div className="absolute inset-y-0 left-0 bg-[#00e5ff]/40" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-16 border-t border-gray-900 pt-12">
        <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-4">Diagnostic Verdict</p>
        <p className="text-gray-300 text-base leading-relaxed font-light min-h-[4em]">
          {typedVerdict}
          <span className="inline-block w-[2px] h-[1em] bg-[#00e5ff] ml-1 animate-pulse align-middle" />
        </p>
      </div>

      {/* BEFORE / AFTER — Cinema Grade Toggle */}
      <div className="max-w-5xl mx-auto px-6 pb-16 border-t border-gray-900 pt-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600">Before / After — Cinema Grade</p>
          <button
            onClick={() => setCinemaGrade((v) => !v)}
            className={`text-[10px] tracking-[0.2em] uppercase font-mono px-5 py-2 border transition-all duration-300 ${
              cinemaGrade
                ? 'border-[#00e5ff]/60 text-[#00e5ff] bg-[#00e5ff]/5'
                : 'border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400'
            }`}
          >
            {cinemaGrade ? '◼ Eldon Grade — Active' : '◻ Apply Eldon Cinema Grade'}
          </button>
        </div>
        {imageData && (
          <div className="relative overflow-hidden">
            <img
              src={imageData}
              alt="Preview"
              className="w-full object-cover transition-all duration-700"
              style={{
                aspectRatio: '2.35/1',
                filter: cinemaGrade
                  ? 'contrast(1.15) saturate(0.8) sepia(0.15) brightness(0.9)'
                  : 'none',
              }}
            />
            <div className="absolute bottom-4 left-4 text-[9px] tracking-[0.2em] uppercase font-mono">
              {cinemaGrade ? (
                <span className="text-[#00e5ff]">Eldon Cinema Grade — Active</span>
              ) : (
                <span className="text-gray-700">Original</span>
              )}
            </div>
          </div>
        )}
        <p className="text-gray-700 text-[10px] tracking-[0.2em] uppercase mt-4 font-mono text-center">
          {cinemaGrade
            ? 'Simulated grade. The real version requires deliberate light and lens control.'
            : 'Toggle above to preview Eldon\'s cinematic grade applied to your image.'}
        </p>
      </div>

      <div className="border-t border-gray-900 py-20 px-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-gray-600 font-mono mb-6">
          Stop guessing. Start creating.
        </p>
        <h2 className="font-serif text-white text-4xl md:text-5xl tracking-[0.2em] uppercase font-light mb-6">
          Your Cinematic Potential, Realised.
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-10 leading-relaxed">
          The filter is a simulation. Eldon's work is not. One session delivers the light,
          the shadow, and the narrative your image is already reaching for.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="border border-white/20 text-white text-xs tracking-[0.3em] uppercase px-10 py-4 hover:border-white/60 hover:bg-white/5 transition-all duration-300"
        >
          Book Eldon Studio
        </button>
      </div>
      {modalOpen && (
        <LuminaBookingModal
          weaknessProp={weakestLabel}
          onClose={() => setModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
