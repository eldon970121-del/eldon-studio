import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getLocalizedText } from "../../utils/siteHelpers";

function getFeaturedCarouselItems(portfolios) {
  return portfolios
    .flatMap((portfolio) =>
      (portfolio.images || [])
        .filter((image) => image?.url)
        .map((image, index) => ({
          id: `${portfolio.id}-${image.id ?? index}`,
          src: image.url,
          title: portfolio.title,
          imageIndex: index + 1,
          imageCount: portfolio.images.length,
        })),
    );
}

export const HeroCover = memo(function HeroCover({ portfolios, copy, locale }) {
  const featuredItems = useMemo(() => getFeaturedCarouselItems(portfolios), [portfolios]);
  const [activeIndex, setActiveIndex] = useState(0);

  const INTERVAL = 7000;

  useEffect(() => {
    if (featuredItems.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredItems.length);
    }, INTERVAL);
    return () => window.clearInterval(timer);
  }, [featuredItems.length]);

  const activeItem = featuredItems[activeIndex] || null;

  return (
    <section id="top" className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">

      {/* ── Ken Burns 图层堆叠 ── */}
      <div className="absolute inset-0">
        {featuredItems.map((item, idx) => (
          <KenBurnsSlide
            key={item.id}
            src={item.src}
            isActive={idx === activeIndex}
          />
        ))}
      </div>

      {/* ── 渐变遮罩：底部文字可读性 ── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

      {/* ── 底部信息栏 ── */}
      <div className="absolute bottom-8 inset-x-0 z-20 px-6 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-end justify-between">

          {/* 左：帧计数 + 进度条 */}
          <div className="flex flex-col gap-3">
            {featuredItems.length > 1 && activeItem ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.32em] text-white/60 font-light">
                  {String(activeIndex + 1).padStart(2, "0")} / {String(featuredItems.length).padStart(2, "0")}
                </p>
                <div className="h-[2px] w-28 overflow-hidden rounded-full bg-white/16">
                  <motion.div
                    key={activeItem.id}
                    className="h-full bg-white"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                  />
                </div>
              </>
            ) : null}
          </div>

          {/* 中：滚动箭头 */}
          <motion.a
            href="#about"
            className="inline-flex flex-col items-center gap-3 text-white/78 transition hover:text-white"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[10px] uppercase tracking-[0.42em] text-gray-400">{copy.hero.scrollExplore}</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/[0.05] backdrop-blur-md">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]">
                <path d="M12 5v14" />
                <path d="m6 13 6 6 6-6" />
              </svg>
            </span>
          </motion.a>

          {/* 右：帧索引 */}
          <div className="text-right">
            {activeItem ? (
              <p className="text-[10px] uppercase tracking-[0.32em] text-white/54">
                {copy.hero.selectedFrame} {activeItem.imageIndex} / {activeItem.imageCount}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
});

/* ── 单张 Ken Burns 幻灯片 ── */
function KenBurnsSlide({ src, isActive }) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
      style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 1 : 0 }}
    >
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: `url(${src})`,
          animation: isActive ? "kenBurns 10s linear forwards" : "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}
