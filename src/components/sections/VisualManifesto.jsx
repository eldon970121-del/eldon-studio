import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getLocalizedText } from "../../utils/siteHelpers";

export const VisualManifesto = memo(function VisualManifesto({ currentLocale, manifestoItems }) {
  const [activeId, setActiveId] = useState(manifestoItems[0]?.id ?? null);
  const activeItem = manifestoItems.find((item) => item.id === activeId) ?? manifestoItems[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(320px,0.84fr)] xl:items-stretch">
      <div className="rounded-[2rem] border border-[color:var(--site-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_100%)] p-5 shadow-soft sm:p-7">
        <div className="space-y-2">
          {manifestoItems.map((item) => {
            const isActive = item.id === activeItem?.id;

            return (
              <motion.button
                key={item.id}
                type="button"
                onMouseEnter={() => setActiveId(item.id)}
                onFocus={() => setActiveId(item.id)}
                onClick={() => setActiveId(item.id)}
                className="w-full border-b border-[color:var(--site-border-soft)] py-5 text-left last:border-b-0 sm:py-6"
                whileHover={{ x: 8 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <span
                    className="pt-2 text-[10px] font-light uppercase tracking-[0.42em] text-[color:var(--site-muted)] sm:text-[11px]"
                    style={{ opacity: isActive ? 0.95 : 0.45 }}
                  >
                    {item.num}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-balance uppercase text-4xl transition-all duration-500 sm:text-5xl xl:text-6xl 2xl:text-7xl ${
                        currentLocale === "zh"
                          ? "font-semibold tracking-[-0.06em]"
                          : "font-display font-medium tracking-[-0.075em]"
                      }`}
                      style={{ opacity: isActive ? 1 : 0.28 }}
                    >
                      {getLocalizedText(item.title, currentLocale)}
                    </h3>

                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.div
                          key={`${item.id}-description`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="max-w-2xl pt-4 text-sm leading-7 text-[color:var(--site-muted-strong)] sm:text-[15px]">
                            {getLocalizedText(item.description, currentLocale)}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-[color:var(--site-border)] bg-[color:var(--site-bg-deep)] shadow-soft sm:min-h-[520px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <img
              src={activeItem.bgImage}
              alt={getLocalizedText(activeItem.title, currentLocale)}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,18,0.12)_0%,rgba(12,13,18,0.08)_28%,rgba(12,13,18,0.48)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_42%)]" />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-end justify-between">
          <div className="rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-white/72 backdrop-blur-md">
            Eldon Studio
          </div>
          <div className="h-20 w-20 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-md" />
        </div>
      </div>
    </div>
  );
});
