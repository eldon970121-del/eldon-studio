import { useEffect, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_LUMINA_API || "https://lumina-server-production.up.railway.app";
const getToken = () => localStorage.getItem("lumina_token") || "";

function buildDays(year, month, busySet) {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push({ empty: true, key: `e${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      day: d,
      dateStr,
      busy: busySet.has(dateStr),
      isToday: dateStr === todayStr,
      past: dateStr < todayStr,
      key: dateStr,
    });
  }
  return cells;
}

export function AdminCalendarPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [busyDates, setBusyDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }

  const fetchMonth = useCallback(async (y, m) => {
    setLoading(true);
    try {
      const mm = String(m).padStart(2, "0");
      const res = await fetch(`${API_BASE}/api/availability?month=${y}-${mm}`);
      const data = await res.json();
      setBusyDates(new Set(Array.isArray(data.busy_dates) ? data.busy_dates : []));
    } catch { setBusyDates(new Set()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMonth(year, month); }, [year, month, fetchMonth]);

  async function toggleDate(dateStr, isBusy) {
    if (toggling) return;
    const newStatus = isBusy ? "available" : "booked";
    // optimistic
    setBusyDates(prev => {
      const next = new Set(prev);
      isBusy ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
    setToggling(dateStr);
    try {
      const res = await fetch(`${API_BASE}/api/admin/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ dates: [{ date: dateStr, status: newStatus }] }),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      showToast(isBusy ? `${dateStr} 已恢复空闲` : `${dateStr} 已标记满档`);
    } catch {
      // rollback
      setBusyDates(prev => {
        const next = new Set(prev);
        isBusy ? next.add(dateStr) : next.delete(dateStr);
        return next;
      });
      showToast("操作失败，已回滚", false);
    } finally { setToggling(null); }
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const days = buildDays(year, month, busyDates);
  const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="relative max-w-2xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed right-6 top-6 z-50 rounded-xl border px-4 py-3 text-xs shadow-xl"
          style={{
            background: "#1a1a1a",
            borderColor: toast.ok ? "rgba(200,169,110,0.3)" : "rgba(255,80,80,0.3)",
            color: toast.ok ? "rgba(200,169,110,0.9)" : "rgba(255,100,100,0.9)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Month nav */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-full border border-white/10 px-4 py-2 text-white/40 transition hover:border-white/30 hover:text-white/70"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/30">{year}</div>
          <div className="text-2xl font-light tracking-widest text-white/80">
            {String(month).padStart(2, "0")} 月
          </div>
        </div>
        <button
          onClick={nextMonth}
          className="rounded-full border border-white/10 px-4 py-2 text-white/40 transition hover:border-white/30 hover:text-white/70"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 text-center">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-[10px] uppercase tracking-widest text-white/20 py-1">{w}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map(cell => {
            if (cell.empty) return <div key={cell.key} />;
            const isToggling = toggling === cell.dateStr;
            return (
              <button
                key={cell.key}
                disabled={cell.past || isToggling}
                onClick={() => !cell.past && toggleDate(cell.dateStr, cell.busy)}
                className="relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all"
                style={{
                  background: cell.busy
                    ? "repeating-linear-gradient(-45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 10px)"
                    : cell.isToday
                    ? "transparent"
                    : "transparent",
                  border: cell.isToday && !cell.busy
                    ? "1px solid rgba(200,169,110,0.35)"
                    : "1px solid transparent",
                  opacity: cell.past ? 0.15 : isToggling ? 0.5 : 1,
                  cursor: cell.past ? "default" : "pointer",
                }}
              >
                <span
                  className="text-sm leading-none"
                  style={{
                    color: cell.busy
                      ? "rgba(255,255,255,0.12)"
                      : cell.isToday
                      ? "#c8a96e"
                      : "rgba(255,255,255,0.65)",
                  }}
                >
                  {cell.day}
                </span>
                {cell.busy && (
                  <span className="absolute bottom-1 text-[8px] tracking-widest" style={{ color: "rgba(200,169,110,0.45)" }}>
                    满
                  </span>
                )}
                {cell.isToday && !cell.busy && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#c8a96e]" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6">
        {[
          { label: "空闲（可预约）", style: { border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", width: 14, height: 14 } },
          { label: "满档（已锁定）", style: { backgroundImage: "repeating-linear-gradient(-45deg,rgba(255,255,255,0.1) 0px,rgba(255,255,255,0.1) 2px,#1a1a1a 2px,#1a1a1a 6px)", borderRadius: "4px", width: 14, height: 14 } },
          { label: "今日", style: { border: "1px solid rgba(200,169,110,0.5)", borderRadius: "4px", width: 14, height: 14 } },
        ].map(({ label, style }) => (
          <div key={label} className="flex items-center gap-2">
            <div style={style} />
            <span className="text-[10px] text-white/25 tracking-wider">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] text-white/15 tracking-wider">
        点击任意空闲日期 → 标记满档 · 再次点击 → 恢复空闲
      </p>
    </div>
  );
}
