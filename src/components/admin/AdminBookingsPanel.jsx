import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_LUMINA_API || "https://lumina-server-production.up.railway.app";
const getToken = () => localStorage.getItem("lumina_token") || "";

const STATUS_META = {
  pending:  { label: "待审核", color: "rgba(251,146,60,0.8)",  bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.2)"  },
  approved: { label: "已通过", color: "rgba(201,168,76,0.85)", bg: "rgba(201,168,76,0.08)",  border: "rgba(201,168,76,0.2)"  },
  rejected: { label: "已婉拒", color: "rgba(255,255,255,0.25)",bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
};

function StatusPill({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}`, borderRadius: "9999px", padding: "2px 10px", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase" }}>
      {m.label}
    </span>
  );
}

export function AdminBookingsPanel() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toasts, setToasts] = useState([]);

  function toast(msg, type = "success") {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings?status=${filter}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setBookings(data.success ? data.bookings : []);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchBookings(); }, [filter]);

  async function handleAction(id, action) {
    setActionId(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings/${id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        toast(action === "approve" ? "已通过，通知邮件已发送" : "已婉拒");
        fetchBookings();
      } else {
        toast("操作失败", "error");
      }
    } catch { toast("网络错误", "error"); }
    finally { setActionId(null); }
  }

  const FILTERS = [
    { key: "pending",  label: "待审核" },
    { key: "approved", label: "已通过" },
    { key: "rejected", label: "已婉拒" },
  ];

  return (
    <div className="relative">
      {/* Toast */}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-xs text-white/70 shadow-xl">
            {t.msg}
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-8 flex gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1 w-fit">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="rounded-xl px-5 py-2 text-[10px] uppercase tracking-[0.25em] transition-all"
            style={{
              background: filter === f.key ? "rgba(255,255,255,0.07)" : "transparent",
              color: filter === f.key ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-16 text-center text-[11px] uppercase tracking-widest text-white/20">加载中…</div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="py-16 text-center text-[11px] uppercase tracking-widest text-white/20">暂无记录</div>
      )}

      <div className="flex flex-col gap-3">
        {bookings.map(b => {
          const dateStr = b.desired_date
            ? new Date(b.desired_date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
            : "未填写";
          const createdStr = new Date(b.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

          return (
            <div
              key={b.id}
              className="rounded-[1.5rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium text-white/85">{b.client_name}</span>
                    <StatusPill status={b.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                    <span className="text-[11px] text-white/35">联系：{b.contact || "未填写"}</span>
                    <span className="text-[11px] text-white/35">意向日期：{dateStr}</span>
                    <span className="text-[11px] text-white/20">提交于 {createdStr}</span>
                  </div>
                  {b.mood_notes && (
                    <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-white/40">
                      "{b.mood_notes}"
                    </p>
                  )}
                </div>

                {b.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleAction(b.id, "decline")}
                      disabled={actionId === b.id}
                      className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-white/35 transition hover:border-white/20 hover:text-white/60 disabled:opacity-30"
                    >
                      婉拒
                    </button>
                    <button
                      onClick={() => handleAction(b.id, "approve")}
                      disabled={actionId === b.id}
                      className="rounded-full border border-[rgba(201,168,76,0.3)] px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[rgba(201,168,76,0.75)] transition hover:border-[rgba(201,168,76,0.5)] hover:text-[rgba(201,168,76,1)] disabled:opacity-30"
                    >
                      {actionId === b.id ? "处理中…" : "通过"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
