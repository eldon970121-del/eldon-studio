import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLocalizedText } from "../../utils/siteHelpers";

function getFeaturedCarouselItems(portfolios) {
  return portfolios.flatMap((portfolio) =>
    (portfolio.images || [])
      .filter((image) => image?.url)
      .map((image, index) => ({
        id: `${portfolio.id}-${image.id ?? index}`,
        portfolioId: portfolio.id,
        src: image.url,
        title: portfolio.title,
        narrative: portfolio.narrative || null,
        imageIndex: index + 1,
        imageCount: portfolio.images.length,
      })),
  );
}

export const HeroCover = memo(function HeroCover({ portfolios, copy, locale, onOpenDetail }) {
  const featuredItems = useMemo(() => getFeaturedCarouselItems(portfolios), [portfolios]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const lockRef = useRef(false);
  const sectionRef = useRef(null);

  const total = featuredItems.length;
  const activeItem = featuredItems[activeIndex] || null;

  // ── 胶片切帧：短暂隐藏再显示，模拟硬切 ──────────────
  const goTo = useCallback((nextIndex) => {
    if (lockRef.current || total === 0) return;
    lockRef.current = true;
    setVisible(false);
    setTimeout(() => {
      setActiveIndex(nextIndex);
      setVisible(true);
      // 锁定 400ms，防止连续滑动跳帧
      setTimeout(() => { lockRef.current = false; }, 400);
    }, 120);
  }, [total]);

  const goNext = useCallback(() => goTo((activeIndex + 1) % total), [goTo, activeIndex, total]);
  const goPrev = useCallback(() => goTo((activeIndex - 1 + total) % total), [goTo, activeIndex, total]);

  // ── 滚轮拦截 + 节流 ──────────────────────────────────
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    function onWheel(e) {
      e.preventDefault();
      if (lockRef.current) return;
      if (e.deltaY > 0) goNext();
      else goPrev();
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev]);

  // ── 键盘方向键 ───────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // ── 触控滑动 ─────────────────────────────────────────
  const touchStartY = useRef(0);
  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY; }
  function onTouchEnd(e) {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 40) delta > 0 ? goNext() : goPrev();
  }

  if (total === 0) return null;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <section
      id="top"
      ref={sectionRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "relative",
        height: "100vh",
        background: "#000",
        display: "flex",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* ══════════════════════════════════════
          左侧：图片区（62%）
      ══════════════════════════════════════ */}
      <div style={{
        flex: "0 0 62%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* 图片 — object-fit: contain，绝对保护画幅 */}
        {activeItem && (
          <img
            key={activeItem.id}
            src={activeItem.src}
            alt={getLocalizedText(activeItem.title, locale)}
            draggable={false}
            style={{
              maxWidth: "90%",
              maxHeight: "88vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.28s ease",
              willChange: "opacity",
            }}
          />
        )}

        {/* 左下：帧计数 */}
        <div style={{
          position: "absolute",
          bottom: "2.5rem",
          left: "2.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase",
          }}>
            {pad(activeIndex + 1)} / {pad(total)}
          </span>
          {/* 进度条 */}
          <div style={{ width: "80px", height: "1px", background: "rgba(255,255,255,0.1)", position: "relative" }}>
            <div style={{
              position: "absolute",
              left: 0, top: 0, bottom: 0,
              width: `${((activeIndex + 1) / total) * 100}%`,
              background: "rgba(255,255,255,0.5)",
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>

        {/* 左右点击区域（隐形） */}
        <button
          onClick={goPrev}
          aria-label="Previous"
          style={{ position: "absolute", left: 0, top: 0, width: "30%", height: "100%", background: "transparent", border: "none", cursor: "w-resize" }}
        />
        <button
          onClick={goNext}
          aria-label="Next"
          style={{ position: "absolute", right: 0, top: 0, width: "30%", height: "100%", background: "transparent", border: "none", cursor: "e-resize" }}
        />
      </div>

      {/* ══════════════════════════════════════
          右侧：叙事区（38%）
      ══════════════════════════════════════ */}
      <div style={{
        flex: "0 0 38%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem 3rem 2.5rem",
        background: "#000",
        position: "relative",
      }}>

        {/* 顶部：品牌标识 */}
        <div>
          <p style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.55rem",
            letterSpacing: "0.45em",
            color: "rgba(255,255,255,0.18)",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}>
            Eldon Studio
          </p>
          <p style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.5rem",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.1)",
            textTransform: "uppercase",
          }}>
            {copy.hero.cinematicDirection}
          </p>
        </div>

        {/* 中部：作品信息（随图切换，同步淡入） */}
        <div style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.28s ease",
        }}>
          {/* 大序号 */}
          <p style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "clamp(4rem, 8vw, 7rem)",
            fontWeight: 100,
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.06)",
            lineHeight: 1,
            marginBottom: "1.5rem",
            userSelect: "none",
          }}>
            {pad(activeIndex + 1)}
          </p>

          {/* 作品标题 */}
          {activeItem && (
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.3,
              marginBottom: "1rem",
            }}>
              {getLocalizedText(activeItem.title, locale)}
            </h2>
          )}

          {/* 帧信息 */}
          {activeItem && (
            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.2)",
              textTransform: "uppercase",
              marginBottom: "2rem",
            }}>
              {activeItem.narrative
                ? `${activeItem.narrative} · ${copy.hero.selectedFrame} ${activeItem.imageIndex} / ${activeItem.imageCount}`
                : `${copy.hero.selectedFrame} ${activeItem.imageIndex} / ${activeItem.imageCount}`}
            </p>
          )}

          {/* DISCOVER SERIES CTA */}
          {activeItem && onOpenDetail && (
            <button
              onClick={() => onOpenDetail(activeItem.portfolioId)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.35em",
                color: "rgba(255,255,255,0.45)",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => {
                e.currentTarget.querySelector('.cta-arrow').style.transform = 'translateX(4px)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
              }}
              onMouseLeave={e => {
                e.currentTarget.querySelector('.cta-arrow').style.transform = 'translateX(0)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              }}
            >
              <span>{locale === 'zh' ? '探索该系列' : 'Discover Series'}</span>
              <span
                className="cta-arrow"
                style={{ transition: "transform 0.3s ease", display: "inline-block" }}
              >→</span>
            </button>
          )}
        </div>

        {/* 底部：导航提示 + 向下箭头 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* 缩略图导航点 */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {featuredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => goTo(idx)}
                aria-label={`Frame ${idx + 1}`}
                style={{
                  width: idx === activeIndex ? "20px" : "6px",
                  height: "2px",
                  background: idx === activeIndex ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "width 0.3s ease, background 0.3s ease",
                  borderRadius: "1px",
                }}
              />
            ))}
          </div>

          {/* 滚动提示 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "24px", height: "1px", background: "rgba(255,255,255,0.15)" }} />
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.5rem",
              letterSpacing: "0.35em",
              color: "rgba(255,255,255,0.2)",
              textTransform: "uppercase",
            }}>
              {copy.hero.scrollExplore}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});
