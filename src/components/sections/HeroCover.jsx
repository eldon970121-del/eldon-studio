import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  const [orientationBySrc, setOrientationBySrc] = useState({});

  useEffect(() => {
    if (featuredItems.length === 0) {
      setActiveIndex(0);
      return undefined;
    }

    if (featuredItems.length <= 1) {
      setActiveIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredItems.length);
    }, 6200);

    return () => window.clearInterval(timer);
  }, [featuredItems.length]);

  const activeItem = featuredItems[activeIndex] || null;
  const activeOrientation = activeItem ? orientationBySrc[activeItem.src] || "landscape" : "landscape";
  const isPortraitActive = activeOrientation === "portrait";

  function handleImageMetaLoad(event, src) {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    const nextOrientation = naturalHeight > naturalWidth * 1.08 ? "portrait" : "landscape";

    setOrientationBySrc((current) =>
      current[src] === nextOrientation ? current : { ...current, [src]: nextOrientation },
    );
  }

  const prevItem =
    featuredItems.length > 0
      ? featuredItems[(activeIndex - 1 + featuredItems.length) % featuredItems.length]
      : null;
  const nextItem =
    featuredItems.length > 0 ? featuredItems[(activeIndex + 1) % featuredItems.length] : null;

  return (
    <section id="top" className="relative min-h-screen bg-[#131313] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#121319_0%,#0f1014_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,156,255,0.18),transparent_24%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center pb-36 pt-20">
        {featuredItems.length > 2 && prevItem ? (
          <motion.div
            key={prevItem.id}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="absolute left-0 top-1/2 z-0 w-[30vw] max-w-[420px] -translate-x-[88%] -translate-y-1/2 overflow-hidden rounded-3xl opacity-20 blur-[2px] scale-90 transition-all duration-1000 ease-in-out"
          >
            <img src={prevItem.src} className="object-contain h-full w-full" alt="" />
          </motion.div>
        ) : null}

        {featuredItems.length > 2 && nextItem ? (
          <motion.div
            key={nextItem.id}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="absolute right-0 top-1/2 z-0 w-[30vw] max-w-[420px] translate-x-[88%] -translate-y-1/2 overflow-hidden rounded-3xl opacity-20 blur-[2px] scale-90 transition-all duration-1000 ease-in-out"
          >
            <img src={nextItem.src} className="object-contain h-full w-full" alt="" />
          </motion.div>
        ) : null}

        <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-10">
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {activeItem ? (
                <motion.div
                  key={activeItem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.0, ease: "easeOut" }}
                  className={`relative mx-auto overflow-hidden rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.04)] transition-all duration-1000 ease-out
            ${isPortraitActive
              ? "max-h-[75vh] w-auto max-w-[min(90vw,500px)]"
              : "max-h-[75vh] w-[min(90vw,1100px)]"
            }`}
                >
                  <div className="absolute -inset-4 rounded-[2rem] bg-white/[0.04] blur-2xl -z-10" />

                  <img
                    src={activeItem.src}
                    alt={getLocalizedText(activeItem.title, locale)}
                    fetchPriority="high"
                    decoding="async"
                    onLoad={(event) => handleImageMetaLoad(event, activeItem.src)}
                    className="h-full w-full object-contain transition-all duration-1000 ease-out"
                  />

                  <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.06]" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 inset-x-0 z-20 px-6 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-end justify-between">
          <div className="flex flex-col gap-3">
            {featuredItems.length > 1 ? (
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
                    transition={{ duration: 6.2, ease: "linear" }}
                  />
                </div>
              </>
            ) : null}
          </div>

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
