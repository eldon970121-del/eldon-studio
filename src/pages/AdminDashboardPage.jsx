import { useEffect, useState } from "react";
import { AdminDataPanel } from "../components/admin/AdminDataPanel";
import { AdminUploadPanel } from "../components/pam/AdminUploadPanel";
import { CreateProjectModal } from "../components/pam/CreateProjectModal";
import { StatusBadge } from "../components/pam/StatusBadge";
import { ProofManagerPage } from "./ProofManagerPage";
import { deleteProject, listProjects, togglePaid, updateProjectStatus } from "../services/pamService";
import { AdminLeadsPanel } from "../components/pam/AdminLeadsPanel";

import { AdminBookingsPanel } from "../components/admin/AdminBookingsPanel";
import { AdminCalendarPanel } from "../components/admin/AdminCalendarPanel";

const STATUS_OPTIONS = ["draft", "published", "selection_completed", "retouching", "pending_payment", "delivered"];
const TABS = [
  { key: "projects",   label: "业务与项目" },
  { key: "uploader",   label: "云端传片" },
  { key: "deliver",    label: "交付中心" },
  { key: "bookings",   label: "审批看板" },
  { key: "calendar",   label: "档期管理" },
  { key: "inquiries",  label: "询单管理" },
  { key: "settings",   label: "系统设置" },
];

export function AdminDashboardPage({ isAdmin, onGoHome, copy, locale, backupFileName, backupStatus, onExport, onSelectFile, onRestore, onStartUpload }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [managingProject, setManagingProject] = useState(null);

  async function refreshProjects() {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch { setProjects([]); } finally { setLoading(false); }
  }

  useEffect(() => { refreshProjects(); }, []);

  if (managingProject) return <ProofManagerPage project={managingProject} onBack={() => { setManagingProject(null); refreshProjects(); }} />;
  if (!isAdmin) return <div className="fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center gap-4 bg-[#131313] px-6 text-center"><p className="text-white/30">权限不足</p><button onClick={onGoHome} className="text-sm text-white/50 transition hover:text-white">← 返回官网</button></div>;

  return (
    <div className="fixed inset-0 z-[200] min-h-screen overflow-y-auto bg-[#131313] font-body text-white">
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#131313]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-12">
          <div className="text-sm tracking-widest text-white/40 font-serif uppercase">Lumina / Admin</div>
          <div className="flex items-center gap-6 text-sm">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={["border-b pb-1 transition", activeTab === tab.key ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"].join(" ")}>{tab.label}</button>
            ))}
          </div>
          <button onClick={onGoHome} className="text-sm text-white/50 transition hover:text-white">← 退出管理</button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 pt-16 md:px-12">
        <div className="flex items-center justify-between gap-4 mb-12"><h1 className="font-serif text-3xl tracking-widest">{TABS.find((t) => t.key === activeTab)?.label}</h1></div>

        {activeTab === "projects" && <LuminaDashboard onStartUpload={onStartUpload} />}
        {activeTab === "uploader" && <LuminaUploader onStartUpload={onStartUpload} />}
        {activeTab === "deliver" && <AdminUploadPanel projects={projects} />}
        {activeTab === "bookings"   && <AdminBookingsPanel />}
        {activeTab === "calendar"   && <AdminCalendarPanel />}
        {activeTab === "inquiries"  && <AdminLeadsPanel />}
        {activeTab === "settings" && (
          <div className="mt-12">
            <div className="rounded-[2rem] border border-white/10 bg-transparent">
              <AdminDataPanel copy={copy} locale={locale} backupFileName={backupFileName} backupStatus={backupStatus} onExport={onExport} onSelectFile={onSelectFile} onRestore={onRestore} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LuminaDashboard({ onStartUpload }) {
  const [stats, setStats] = useState({ revenue: 0, pending: 0 });
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLuminaData = async () => {
    try {
      // 🌟 统一使用 VITE_LUMINA_API 并补全 /api 路径
      const apiUrl = import.meta.env.VITE_LUMINA_API;
      const [statsRes, ordersRes] = await Promise.all([ 
        fetch(`${apiUrl}/api/admin/stats`), 
        fetch(`${apiUrl}/api/admin/orders`) 
      ]);
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d.stats); }
      if (ordersRes.ok) { const d = await ordersRes.json(); setOrders(d.orders); }
    } catch (err) { console.error("Lumina 连接失败:", err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLuminaData(); }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] p-8 border border-white/10 rounded-[1.5rem] shadow-soft">
          <div className="text-[10px] text-white/40 tracking-[0.3em] uppercase mb-4">本月实收</div>
          <div className="text-4xl text-white font-light tracking-tighter">¥ {stats.revenue?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-[#0a0a0a] p-8 border border-[#d4af37]/20 rounded-[1.5rem] shadow-soft">
          <div className="text-[10px] text-[#d4af37] tracking-[0.3em] uppercase mb-4">待收尾款</div>
          <div className="text-4xl text-[#d4af37] font-light tracking-tighter">¥ {stats.pending?.toLocaleString() || 0}</div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-8">
        <header className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
          <h3 className="text-lg font-serif tracking-widest uppercase text-white/80">进行中的委托</h3>
          <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{orders.length} 笔</span>
        </header>
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="flex justify-between items-center p-6 bg-[#0c0c0c] border border-white/5 rounded-xl hover:border-white/20 transition-all">
              <div className="space-y-1">
                <div className="text-[10px] text-white/30 font-mono tracking-tighter uppercase">{order.order_no}</div>
                <div className="text-sm font-medium text-white tracking-wide">
                  {order.client_name || '匿名'} <span className="mx-2 text-white/20">|</span> ¥{order.amount}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-[9px] uppercase tracking-[0.2em] px-3 py-1 border rounded-full ${order.status === 'DEPOSIT_PAID' ? 'border-[#d4af37]/40 text-[#d4af37] bg-[#d4af37]/5' : order.status === 'SELECTING' ? 'border-purple-500/40 text-purple-400 bg-purple-500/5' : 'border-white/20 text-white/40'}`}>{order.status}</span>
                {(order.status === 'DEPOSIT_PAID' || order.status === 'paid') && (
                  <button onClick={() => onStartUpload(order.order_no)} className="bg-white text-black text-[10px] px-6 py-2 uppercase tracking-[0.2em] hover:bg-[#ccc] transition-all">开始传片</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LuminaUploader({ onStartUpload }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderNo, setSelectedOrderNo] = useState('');

  useEffect(() => {
    const f = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_LUMINA_API}/api/admin/orders`);
        const d = await res.json();
        const valid = d.orders.filter(o => o.status === 'DEPOSIT_PAID' || o.status === 'paid' || o.status === 'pending');
        setOrders(valid);
        if (valid.length > 0) setSelectedOrderNo(valid[0].order_no);
      } catch (e) {}
    };
    f();
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-10 animate-fade-in text-center max-w-3xl mx-auto space-y-10">
      <header className="space-y-4"><h2 className="text-3xl font-serif tracking-[0.2em] text-white uppercase">Production Center</h2><p className="text-xs text-white/40 uppercase tracking-widest">请选择待交付订单，开启云端影像生产流</p></header>
      <div className="space-y-6">
        <select value={selectedOrderNo} onChange={(e) => setSelectedOrderNo(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-4 text-sm text-white focus:border-white/40 outline-none">
          {orders.length === 0 && <option value="">暂无待传片订单</option>}
          {orders.map(o => <option key={o.id} value={o.order_no}>{o.order_no} - {o.client_name}</option>)}
        </select>
        <div onClick={() => selectedOrderNo && onStartUpload(selectedOrderNo)} className="group border-2 border-dashed border-white/10 rounded-[2rem] p-20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.03] hover:border-white/30 transition-all">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">📸</div>
          <h3 className="text-white font-serif tracking-widest mb-2">点击唤起上传面板</h3>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">支持 DEPOSIT_PAID / PENDING 状态</p>
        </div>
      </div>
    </div>
  );
}