import { useEffect } from "react";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function CommissionDrawer({ isOpen, onClose, copy }) {
  // 锁定 body 滚动
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // ESC 关闭
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* 蒙层 */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.4s ease",
        }}
      />

      {/* 抽屉面板 */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
          width: "min(480px, 100vw)",
          background: "#0c0c0e",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "-40px 0 120px rgba(0,0,0,0.6)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 顶部栏 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.5rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
          }}>
            {copy?.booking?.eyebrow || "Commission"}
          </span>
          <button
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2.25rem", height: "2.25rem",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              background: "transparent",
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
              transition: "color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* 主体：纵向居中 */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 2rem",
          gap: "2.5rem",
        }}>
          {/* 标题 */}
          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginBottom: "1rem",
            }}>
              Eldon Studio
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.2,
            }}>
              Initiate the Vision
            </h2>
          </div>

          {/* 二维码图片 */}
          <div style={{ width: "240px", height: "240px" }}>
            <img
              src="/assets/wechat-qr.jpg"
              alt="WeChat QR Code"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
          </div>

          {/* 引导文案 */}
          <p style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            lineHeight: 2,
          }}>
            扫描进入私属工作台，开启影像委托
          </p>
        </div>
      </div>
    </>
  );
}
