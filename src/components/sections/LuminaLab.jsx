import { useState, useEffect, useRef } from 'react';

const CONTENT = {
  en: {
    title: "Lumina Lab",
    subtitle: "Upload a photo to analyze its cinematic DNA. Composition, Light, and Narrative Score.",
    dropCta: "Drag & Drop — or Click to Upload",
    scanLabels: [
      "Analyzing Golden Ratio...",
      "Detecting Rembrandt Lighting...",
      "Measuring Emotional Contrast...",
      "Mapping Tonal Architecture...",
      "Computing Narrative Depth...",
    ],
  },
  zh: {
    title: "LUMINA 美学实验室",
    subtitle: "上传作品，深度解析其电影感基因。多维测算视觉构图、光影深度与情绪叙事张力。",
    dropCta: "拖拽影像至此 — 或点击上传",
    scanLabels: [
      "正在分析黄金比例构图...",
      "正在识别伦勃朗光法...",
      "正在测算情绪对比度...",
      "正在绘制色调结构图...",
      "正在计算叙事纵深...",
    ],
  },
};

export function LuminaLab({ onSetView, locale = "en" }) {
  const t = CONTENT[locale] ?? CONTENT.en;
  const [phase, setPhase] = useState('idle');
  const [imageData, setImageData] = useState(null);
  const [scanIndex, setScanIndex] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target.result);
      setPhase('analyzing');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const id = setInterval(() => setScanIndex(i => (i + 1) % t.scanLabels.length), 600);
    return () => clearInterval(id);
  }, [phase, t.scanLabels.length]);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const id = setTimeout(() => onSetView('lumina-report', { imageData }), 3000);
    return () => clearTimeout(id);
  }, [phase]);

  const isZh = locale === "zh";

  return (
    <div className="bg-black py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className={`font-serif uppercase text-white font-light mb-4 ${
            isZh
              ? "text-4xl md:text-5xl tracking-[0.08em] leading-tight"
              : "text-5xl md:text-6xl tracking-[0.25em]"
          }`}
          style={{ fontFamily: isZh ? "'Noto Serif SC', 'Noto Serif', serif" : undefined }}
        >
          {t.title}
        </h2>
        <p
          className={`text-gray-500 text-sm mb-12 ${
            isZh
              ? "tracking-[0.06em] leading-relaxed"
              : "tracking-widest uppercase"
          }`}
          style={{ fontFamily: isZh ? "'Noto Serif SC', 'Noto Serif', 'PingFang SC', system-ui, sans-serif" : undefined }}
        >
          {t.subtitle}
        </p>

        {phase === 'idle' && (
          <>
            <div
              className="border border-dashed border-gray-700 rounded-sm p-16 text-center cursor-pointer transition-all duration-300 hover:border-[#00e5ff]/40 hover:shadow-[0_0_30px_rgba(0,229,255,0.08)]"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <p
                className={`text-gray-600 text-xs ${
                  isZh ? "tracking-[0.08em]" : "tracking-[0.2em] uppercase"
                }`}
                style={{ fontFamily: isZh ? "'Noto Serif SC', 'PingFang SC', system-ui, sans-serif" : undefined }}
              >
                {t.dropCta}
              </p>
              <p className="text-gray-700 mt-3 text-lg">↑</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </>
        )}

        {phase === 'analyzing' && (
          <>
            <style>{`
              @keyframes laserScan {
                0% { top: 0%; }
                100% { top: 100%; }
              }
            `}</style>
            <div className="relative max-h-[50vh] overflow-hidden">
              <img
                src={imageData}
                alt={isZh ? "正在分析中" : "Analyzing"}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent"
                style={{ animation: 'laserScan 1.5s linear infinite' }}
              />
            </div>
            <p
              className={`text-[#00e5ff] text-xs mt-6 font-mono ${
                isZh ? "tracking-[0.1em]" : "tracking-[0.2em] uppercase"
              }`}
            >
              {t.scanLabels[scanIndex]}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
