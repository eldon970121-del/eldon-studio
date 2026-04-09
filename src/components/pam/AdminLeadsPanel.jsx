import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_LUMINA_API || "https://lumina-server-production.up.railway.app";
const getToken = () => localStorage.getItem('lumina_token') || '';

const STATUS_META = {
  NEW: {
    label: "新线索",
    className:
      "bg-yellow-600/10 text-yellow-600 border border-yellow-600/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]"
  },
  CONTACTED: {
    label: "沟通中",
    className:
      "bg-blue-600/10 text-blue-400 border border-blue-600/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]"
  },
  ARCHIVED: {
    label: "已归档",
    className:
      "bg-white/5 text-white/30 border border-white/10 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]"
  },
  CONVERTED: {
    label: "已转化",
    className:
      "bg-green-600/10 text-green-400 border border-green-600/20 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em]"
  }
};

export function AdminLeadsPanel({ onNavigateToOrder }) {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [convertingId, setConvertingId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/inquiries`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setLeads(Array.isArray(data.inquiries) ? data.inquiries : Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setLeads(leads.map(lead => (lead.id === id ? { ...lead, status: newStatus } : lead)));
    try {
      await fetch(`${API_BASE}/api/inquiries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch { /* 乐观更新，静默失败 */ }
  };

  const handleConvertToOrder = async (lead) => {
    setConvertingId(lead.id);
    try {
      const res = await fetch(`${API_BASE}/api/inquiries/${lead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`✨ ${lead.client_name} 的委托已汇入 Lumina 引擎`, 'success');
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'CONVERTED' } : l));
    } catch {
      showToast('连接失败，请确认 Lumina 引擎运行中', 'error');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] transition-all duration-500 hover:border-yellow-600/30 mt-8 w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />

      <div className="relative">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-700 tracking-tight text-2xl">
              询单与线索管理
            </h2>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
              Client Inquiries & CRM
            </p>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            共 {leads.length} 组高意向客户
          </div>
        </header>

        {error && (
          <div className="py-12 text-center">
            <p className="text-red-400/70 text-sm tracking-wide">⚠ 无法加载询单：{error}</p>
            <p className="text-white/20 text-[10px] mt-2">请检查 API 连接或 Token 是否有效</p>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-sm text-white/30 animate-pulse">
            正在检索全球线索网络...
          </div>
        ) : !error && leads.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-white/30 text-sm tracking-[0.2em] uppercase">暂无询单记录</p>
            <p className="text-white/15 text-[10px] mt-2 tracking-wider">等待官网首个客户提交</p>
          </div>
        ) : (
          <div className="space-y-6">
            {leads.map(lead => {
              const statusMeta = STATUS_META[lead.status] ?? STATUS_META.NEW;

              return (
                <article
                  key={lead.id}
                  className="group relative bg-gradient-to-br from-white/5 to-transparent border border-white/5 hover:border-yellow-600/30 rounded-2xl p-6 transition-all duration-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]"
                >
                  <div className="mb-5 flex flex-col gap-3 border-b border-white/5 pb-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-white/35">
                      <span className="font-mono">{lead.date}</span>
                      <span className="text-white/15">/</span>
                      <span className="font-mono">{lead.id}</span>
                    </div>
                    <span className={statusMeta.className}>{statusMeta.label}</span>
                  </div>

                  <div className="grid gap-8 md:grid-cols-[1.1fr_1.2fr_0.9fr]">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Client
                        </div>
                        <div className="text-lg font-medium text-white">{lead.client_name}</div>
                        <span className="mt-2 inline-flex rounded-full border border-yellow-600/20 bg-yellow-600/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-yellow-300/80">
                          {lead.emotional_theme}
                        </span>
                      </div>

                      <div>
                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Contact
                        </div>
                        <div className="text-sm text-white/75">{lead.contact}</div>
                      </div>

                      <div>
                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Budget
                        </div>
                        <div className="text-sm text-yellow-500">{lead.budget_range}</div>
                      </div>
                    </div>

                    <div className="space-y-4 border-white/5 md:border-l md:pl-8">
                      <div>
                        <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Destination
                        </div>
                        <div className="text-sm text-white/85">{lead.destination}</div>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Emotion
                        </div>
                        <p className="border-l border-yellow-600/30 pl-4 font-serif text-sm italic leading-relaxed text-white/70">
                          “{lead.emotion}”
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between border-white/5 md:border-l md:pl-8">
                      <div>
                        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Status
                        </div>
                        <select
                          value={lead.status}
                          onChange={event => handleStatusChange(lead.id, event.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-xs text-white/70 focus:outline-none focus:border-yellow-600/40 transition-colors"
                          disabled={lead.status === "CONVERTED"}
                        >
                          <option value="NEW">标记为：未读新线索</option>
                          <option value="CONTACTED">标记为：正在沟通中</option>
                          <option value="ARCHIVED">标记为：已归档</option>
                          <option value="CONVERTED" disabled>
                            标记为：已转化
                          </option>
                        </select>
                      </div>

                      {lead.status !== "CONVERTED" ? (
                        <button
                          type="button"
                          onClick={() => handleConvertToOrder(lead)}
                          disabled={convertingId === lead.id}
                          className="mt-4 w-full rounded-full border border-yellow-600/40 bg-yellow-600/10 px-4 py-2 text-[10px] font-semibold tracking-[0.2em] text-yellow-500 transition-all duration-300 hover:bg-yellow-600 hover:text-black uppercase"
                        >
                          {convertingId === lead.id ? "传输中..." : "一键转为正式订单"}
                        </button>
                      ) : (
                        <div className="mt-4 w-full cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                          已进入 Lumina 引擎
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={
              toast.type === "error"
                ? "bg-[#0a0a0a] border border-red-500/30 text-red-300 text-xs px-5 py-3 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] tracking-wide animate-fade-in"
                : "bg-[#0a0a0a] border border-yellow-600/30 text-yellow-200 text-xs px-5 py-3 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] tracking-wide animate-fade-in"
            }
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
