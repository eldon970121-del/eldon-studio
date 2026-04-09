import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_LUMINA_API || "https://lumina-server-production.up.railway.app";

// ─── 档期日历 ─────────────────────────────────────────────────────────────────
function AvailabilityCalendar() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/availability?year=${year}&month=${month}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success) {
          const map = {};
          data.availability.forEach(({ date, status }) => { map[date.slice(0, 10)] = status; });
          setAvailability(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1);
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = new Date(year, month - 1).toLocaleDateString("zh-CN", { year: "numeric", month: "long" });

  return (
    <div className="rounded-[2rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/20 hover:text-white/70">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">{monthLabel}</p>
        <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/20 hover:text-white/70">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {["日","一","二","三","四","五","六"].map(d => (
          <div key={d} className="text-center text-[9px] tracking-[0.2em] text-white/20">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const status = availability[dateStr];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          let bg = "bg-white/[0.04]";
          let text = "text-white/20";
          if (!isPast) {
            if (status === "available") { bg = "bg-[rgba(201,168,76,0.1)]"; text = "text-[rgba(201,168,76,0.75)]"; }
            else if (status === "booked") { bg = "bg-white/[0.03]"; text = "text-white/15 line-through"; }
            else { bg = "bg-white/[0.04]"; text = "text-white/30"; }
          }

          return (
            <div key={dateStr} className={`flex aspect-square items-center justify-center rounded-xl text-[11px] transition ${bg} ${isToday ? "ring-1 ring-white/20" : ""}`}>
              <span className={text}>{day}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[rgba(201,168,76,0.65)]" />
          <span className="text-[9px] tracking-[0.25em] text-white/25">可预约</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-white/15" />
          <span className="text-[9px] tracking-[0.25em] text-white/25">满档</span>
        </div>
      </div>

      {loading && <div className="mt-3 text-center text-[10px] tracking-widest text-white/15">加载中…</div>}
    </div>
  );
}

// ─── 意向表单 ─────────────────────────────────────────────────────────────────
const UNDERLINE_BASE = {
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.78)",
  padding: "0.65rem 0",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
  letterSpacing: "0.02em",
  transition: "border-color 0.25s",
};

const FIELDS = [
  { key: "client_name",  label: "姓名",              placeholder: "您的名字",          type: "text",     required: true  },
  { key: "contact_info", label: "微信号 / 邮箱",      placeholder: "方便联系的方式",    type: "text",     required: true  },
  { key: "desired_date", label: "意向日期",            placeholder: "",                  type: "date",     required: true  },
  { key: "mood_notes",   label: "拍摄构想 · 情绪需求", placeholder: "简短描述您想要的感觉", type: "textarea", required: false },
];

function InquiryForm({ onSuccess }) {
  const [form, setForm] = useState({ client_name: "", contact_info: "", desired_date: "", mood_notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);
  const lockRef = useRef(false); // 防重复提交

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (lockRef.current) return;

    // 前端校验
    if (!form.client_name.trim()) { setError("请填写姓名"); return; }
    if (!form.contact_info.trim()) { setError("请填写联系方式"); return; }
    if (!form.desired_date) { setError("请选择意向日期"); return; }

    lockRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name.trim(),
          contact_info: form.contact_info.trim(),
          desired_date: form.desired_date,
          mood_notes: form.mood_notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setError(data.message || "提交失败，请稍后重试");
        lockRef.current = false;
      }
    } catch {
      setError("网络异常，请稍后重试");
      lockRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      key="form"
      onSubmit={handleSubmit}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-7"
    >
      {FIELDS.map(({ key, label, placeholder, type, required }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <label className="text-[9px] uppercase tracking-[0.38em] text-white/22">{label}</label>
          {type === "textarea" ? (
            <textarea
              value={form[key]}
              onChange={e => upd(key, e.target.value)}
              onFocus={() => setFocused(key)}
              onBlur={() => setFocused(null)}
              placeholder={placeholder}
              rows={3}
              style={{
                ...UNDERLINE_BASE,
                resize: "none",
                borderBottomColor: focused === key ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.1)",
              }}
            />
          ) : (
            <input
              type={type}
              value={form[key]}
              onChange={e => upd(key, e.target.value)}
              onFocus={() => setFocused(key)}
              onBlur={() => setFocused(null)}
              placeholder={placeholder}
              required={required}
              style={{
                ...UNDERLINE_BASE,
                borderBottomColor: focused === key ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.1)",
                colorScheme: "dark",
              }}
            />
          )}
        </div>
      ))}

      {error && (
        <p className="text-[11px] leading-relaxed text-red-400/60">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 self-start rounded-full border border-white/12 px-7 py-3 text-[10px] uppercase tracking-[0.38em] text-white/50 transition-all duration-300 hover:border-[rgba(201,168,76,0.35)] hover:text-[rgba(201,168,76,0.75)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-current opacity-60" />
            意向投递中…
          </span>
        ) : "提交委托"}
      </button>
    </motion.form>
  );
}

function SuccessView({ onBack }) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-8 py-10"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.05)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <div>
        <p
          className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-white/90"
          style={{ fontFamily: "var(--font-serif, Georgia, serif)" }}
        >
          委托已送达。
        </p>
        <p className="mt-4 max-w-xs text-[13px] leading-[1.85] text-white/30">
          主理人将在 24 小时内审阅您的情绪构想与档期请求，并进行人工跟进。
        </p>
      </div>

      <button
        onClick={onBack}
        className="self-start text-[10px] uppercase tracking-[0.35em] text-white/25 transition-colors duration-200 hover:text-white/55"
      >
        ← 返回画廊
      </button>
    </motion.div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export function BookingSection({ locale, onBackToGallery }) {
  const [submitted, setSubmitted] = useState(false);

  function handleBack() {
    if (onBackToGallery) {
      onBackToGallery();
    } else {
      const el = document.getElementById("portfolio") || document.getElementById("story");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <section id="booking" className="section-space mx-auto max-w-7xl border-t border-[color:var(--site-border-soft)] px-4 sm:px-6 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* 左：档期日历 */}
        <div>
          <div className="mb-8">
            <p className="section-kicker mb-4">档期</p>
            <h2 className="editorial-title text-4xl font-semibold sm:text-5xl">Availability</h2>
            <p className="editorial-copy mt-5 max-w-sm text-sm leading-relaxed">
              {locale === "zh"
                ? "仅展示档期状态，不公开具体时间段。意向日期确认后由主理人亲自沟通。"
                : "Only availability status is shown. Specific time slots are confirmed privately."}
            </p>
          </div>
          <AvailabilityCalendar />
        </div>

        {/* 右：表单 */}
        <div>
          <div className="mb-8">
            <p className="section-kicker mb-4">预约意向</p>
            <h2 className="editorial-title text-4xl font-semibold sm:text-5xl">Inquiry</h2>
            <p className="editorial-copy mt-5 max-w-sm text-sm leading-relaxed">
              {locale === "zh"
                ? "填写基本信息，主理人将在 24 小时内亲自审核并回复。"
                : "Submit your intent. The photographer reviews every inquiry personally within 24 hours."}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {submitted ? (
                <SuccessView key="success" onBack={handleBack} />
              ) : (
                <InquiryForm key="form" onSuccess={() => setSubmitted(true)} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
