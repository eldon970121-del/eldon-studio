import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONTENT = {
  en: {
    title: "LUMINA 美学实验室",
    subtitle: "上传作品，深度解析其电影感基因。多维测算视觉构图、光影深度与情绪叙事张力。",
    dropCta: "拖拽影像至此 — 或点击上传",
    entering: "正在进入暗房...",
  },
  zh: {
    title: "LUMINA 美学实验室",
    subtitle: "上传作品，深度解析其电影感基因。多维测算视觉构图、光影深度与情绪叙事张力。",
    dropCta: "拖拽影像至此 — 或点击上传",
    entering: "正在进入暗房...",
  },
};

export function LuminaLab({ onEnterLab, locale = "zh" }) {
  const t = CONTENT[locale] ?? CONTENT.zh;
  const [dragging, setDragging] = useState(false);
  const [entering, setEntering] = useState(false);
  const fileInputRef = useRef(null);

  function handleFiles(files) {
    if (!files?.length || entering) return;
    setEntering(true);
    setTimeout(() => onEnterLab(Array.from(files)), 600);
  }

  return (
    <div className="relative bg-black py-28 px-6 overflow-hidden">
      <AnimatePresence>
        {entering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6] }}
              transition={{ duration: 1.2, times: [0, 0.4, 1], repeat: Infinity }}
              className="text-[10px] uppercase tracking-[0.45em] text-white/30"
            >
              {t.entering}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif text-white font-light mb-5 text-4xl md:text-5xl tracking-[0.08em] leading-tight">
          {t.title}
        </h2>
        <p className="text-white/30 text-sm mb-14 tracking-[0.06em] leading-relaxed max-w-lg mx-auto">
          {t.subtitle}
        </p>

        <motion.div
          animate={dragging ? { borderColor: "rgba(212,175,55,0.5)", boxShadow: "0 0 40px rgba(212,175,55,0.08)" } : { borderColor: "rgba(255,255,255,0.12)", boxShadow: "none" }}
          transition={{ duration: 0.2 }}
          className="border border-dashed rounded-sm p-16 text-center cursor-pointer"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-white/25 text-xs tracking-[0.2em]">{t.dropCta}</p>
          <p className="text-white/15 mt-3 text-base">↑</p>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
