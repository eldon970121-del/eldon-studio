import { useEffect, useState } from "react";
import { AdminDataPanel } from "../components/admin/AdminDataPanel";
import { AdminUploadPanel } from "../components/pam/AdminUploadPanel";
import { CreateProjectModal } from "../components/pam/CreateProjectModal";
import { StatusBadge } from "../components/pam/StatusBadge";
import { ProofManagerPage } from "./ProofManagerPage";
import { deleteProject, listProjects, togglePaid, updateProjectStatus } from "../services/pamService";
import { AdminLeadsPanel } from "../components/pam/AdminLeadsPanel";

const STATUS_OPTIONS = [
  "draft",
  "published",
  "selection_completed",
  "retouching",
  "pending_payment",
  "delivered",
];

// 🌟 导航栏汉化
const TABS = [
  { key: "projects",   label: "业务与项目" },
  { key: "uploader",   label: "云端传片" },
  { key: "deliver",    label: "交付中心" },
  { key: "inquiries",  label: "询单管理" },
  { key: "settings",   label: "系统设置" },
];

// ==========================================
// 🌟 主组件：后台页面导航与分发中枢
// ==========================================
export function AdminDashboardPage({ isAdmin, onGoHome, copy, locale, backupFileName, backupStatus, onExport, onSelectFile, onRestore }) {
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
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshProjects();
  }, []);

  if (managingProject) {
    return (
      <ProofManagerPage
        project={managingProject}
        onBack={() => {
          setManagingProject(null);
          refreshProjects();
        }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center gap-4 bg-[#131313] px-6 text-center">
        <p className="text-white/30">权限不足</p>
        <button type="button" onClick={onGoHome} className="text-sm text-white/50 transition hover:text-white">
          ← 返回官网
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] min-h-screen overflow-y-auto bg-[#131313] font-body text-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#131313]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 md:px-12">
          <div className="text-sm tracking-widest text-white/40 font-serif">ELDON / PAM</div>

          <div className="flex items-center gap-6 text-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "border-b pb-1 transition",
                  activeTab === tab.key ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button type="button" onClick={onGoHome} className="text-sm text-white/50 transition hover:text-white">
            ← 退出管理
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 pt-16 md:px-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="font-serif text-3xl">{TABS.find((t) => t.key === activeTab)?.label}</h1>
          {activeTab === "projects" ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white hover:text-black"
            >
              ＋ 新增精修作品集
            </button>
          ) : null}
        </div>

        {/* 路由与模块分发 */}
        {activeTab === "projects" && <LuminaDashboard />}
        
        {activeTab === "uploader" ? (
          <LuminaUploader />
        ) : activeTab === "deliver" ? (
          <AdminUploadPanel projects={projects} />
        ) : activeTab === "inquiries" ? (
          <AdminLeadsPanel />
        ) : activeTab === "settings" ? (
          <div className="mt-12">
            <div className="rounded-[2rem] border border-white/10 bg-transparent">
              {copy ? (
                <AdminDataPanel
                  copy={copy} locale={locale} backupFileName={backupFileName} backupStatus={backupStatus}
                  onExport={onExport} onSelectFile={onSelectFile} onRestore={onRestore}
                />
              ) : (
                <p className="text-center text-white/30 p-8">加载设置中...</p>
              )}
            </div>
          </div>
        ) : (
          /* 原本的精修作品集列表 (附属于 projects 标签) */
          <div className="mt-12">
            <header className="mb-6">
              <h2 className="text-xl font-serif text-white tracking-widest">官网精修画廊</h2>
              <p className="text-[10px] text-white/50 mt-2 tracking-[0.2em] uppercase">Website Curated Gallery</p>
            </header>
            
            {loading ? (
              <div className="py-12 text-center text-white/30 border border-white/10 rounded-2xl">加载作品集中...</div>
            ) : projects.length === 0 ? (
              <div className="py-16 text-center text-white/30 border border-white/10 rounded-2xl">暂无精修作品集记录</div>
            ) : (
              <div className="space-y-2 border border-white/10 rounded-2xl p-6 bg-white/5">
                {projects.map((row) => (
                  <div key={row.id} className="flex flex-wrap items-center gap-4 border-b border-white/10 py-4 last:border-0">
                    <div className="flex-1 min-w-[120px]">
                      <p className="font-body text-white">{row.name}</p>
                    </div>
                    <span className="text-sm font-mono text-white/40 hidden sm:block">{row.slug}</span>
                    <StatusBadge status={row.status} />
                    <select
                      value={row.status || "draft"}
                      onChange={async (event) => {
                        await updateProjectStatus(row.id, event.target.value);
                        await refreshProjects();
                      }}
                      className="rounded border border-white/20 bg-transparent px-2 py-1 text-sm text-white/70 outline-none focus:border-white/50"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status} className="bg-[#131313] text-white">{status}</option>
                      ))}
                    </select>
                    {row.paid ? (
                      <span className="cursor-default text-xs text-green-400 border border-green-400/30 bg-green-400/10 px-2 py-1 rounded">已付款 ✓</span>
                    ) : (
                      <button type="button" onClick={async () => { await togglePaid(row.id, !row.paid); await refreshProjects(); }} className="border border-white/20 px-2 py-1 rounded text-xs text-white/50 transition hover:text-white hover:border-white/50">
                        标记付款
                      </button>
                    )}
                    <button type="button" onClick={() => setManagingProject(row)} className="text-xs text-white/40 transition hover:text-white border border-transparent px-2 py-1">
                      管理 ➡️
                    </button>
                    <button type="button" onClick={async () => {
                      if (!window.confirm(`确定要删除 "${row.slug}" 吗？`)) return;
                      await deleteProject(row.id);
                      await refreshProjects();
                    }} className="text-xs text-red-400/50 transition hover:text-red-400 px-2 py-1">
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refreshProjects} />
    </div>
  );
}

// ==========================================
// 🌟 组件 A：Lumina 业务大盘与录单系统
// ==========================================
export function LuminaDashboard() {
  const [stats, setStats] = useState({ monthRevenue: 0, todayDeposit: 0, pendingBalance: 0 });
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ customerName: '', package: '标准肖像', amount: '', date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLuminaData = async () => {
    try {
      const apiUrl = import.meta.env.VITE_LUMINA_API_URL;
      const [statsRes, ordersRes] = await Promise.all([ fetch(`${apiUrl}/admin/stats`), fetch(`${apiUrl}/admin/orders`) ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (err) { console.error("连接失败:", err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLuminaData(); }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const orderPayload = { userId: 'INTERNAL_WEB_BOOKING', productId: formData.package === '标准肖像' ? 1 : 2, bookingDate: formData.date, baseAmount: Number(formData.amount) };
      const res = await fetch(`${import.meta.env.VITE_LUMINA_API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
      if (res.ok) {
        alert("预约委托创建成功！");
        setFormData({ customerName: '', package: '标准肖像', amount: '', date: '' });
        fetchLuminaData();
      } else { alert("创建失败"); }
    } catch (error) { alert("网络错误"); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-8 mb-4 animate-fade-in w-full">
      {/* 财务大盘 */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8">
        <header className="border-b border-white/10 pb-4 mb-6">
          <h2 className="text-2xl font-serif text-white tracking-widest">LUMINA 业务大盘</h2>
          <p className="text-[10px] text-white/50 mt-2 tracking-[0.2em] uppercase">Real-time Business</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-[1.25rem]"><div className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-3">本月总营收</div><div className="text-3xl text-white font-light">¥ {stats.monthRevenue}</div></div>
          <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-[1.25rem]"><div className="text-[10px] text-white/50 tracking-[0.2em] uppercase mb-3">今日新增定金</div><div className="text-2xl text-white font-light">¥ {stats.todayDeposit}</div></div>
          <div className="bg-[#0a0a0a] p-6 border border-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)] rounded-[1.25rem]"><div className="text-[10px] text-[#d4af37] tracking-[0.2em] uppercase mb-3">待收尾款</div><div className="text-2xl text-[#d4af37] font-light">¥ {stats.pendingBalance}</div></div>
        </div>

        <div className="flex justify-between items-end mb-4"><h3 className="text-sm font-serif text-white tracking-wide">进行中的委托</h3><span className="text-[10px] uppercase text-white/50">{orders.length} 笔</span></div>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {orders.map(order => (
            <div key={order.order_id} className="flex justify-between items-center p-5 bg-[#0a0a0a] border border-white/10 rounded-[1.25rem]">
              <div><div className="text-[10px] text-white/50 font-mono mb-1">ID: {order.order_id}</div><div className="text-sm text-white">客户: {order.customer_name || '匿名'} | 金额: ¥{order.base_amount}</div></div>
              <span className={`text-[10px] tracking-wider px-3 py-1.5 border rounded-full ${order.status === 'DELIVERED' ? 'border-[#00cc44]/30 text-[#00cc44] bg-[#003311]/20' : order.status === 'SELECTING' ? 'border-purple-500/30 text-purple-400 bg-purple-900/20' : order.status === 'DEPOSIT_PAID' ? 'border-[#d4af37]/30 text-[#d4af37] bg-[#332b00]/20' : 'border-blue-500/30 text-blue-400 bg-blue-900/20'}`}>{order.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 录单系统 */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8">
        <header className="border-b border-white/10 pb-4 mb-6"><h2 className="text-xl font-serif text-white tracking-widest">内部录单</h2></header>
        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div><label className="block text-[10px] text-white/50 mb-2">客户姓名</label><input type="text" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" /></div>
            <div><label className="block text-[10px] text-white/50 mb-2">套餐</label><select value={formData.package} onChange={e => setFormData({...formData, package: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37] appearance-none"><option className="bg-black" value="标准肖像">标准肖像</option><option className="bg-black" value="高定电影感">高定电影感</option></select></div>
          </div>
          <div className="space-y-6">
            <div><label className="block text-[10px] text-white/50 mb-2">基础金额</label><input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" /></div>
            <div><label className="block text-[10px] text-white/50 mb-2">档期</label><input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]" style={{colorScheme: 'dark'}}/></div>
          </div>
          <div className="md:col-span-2 pt-2"><button disabled={isSubmitting} type="submit" className="rounded-full bg-white px-8 py-3 text-xs font-semibold text-black transition hover:bg-white/80 disabled:opacity-50">生成预约委托</button></div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 🌟 组件 B：Lumina 云端批量传片工作台
// ==========================================
export function LuminaUploader() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchValidOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_LUMINA_API_URL}/admin/orders`);
        const data = await res.json();
        const validOrders = data.filter(o => o.status === 'DEPOSIT_PAID' || o.status === 'SELECTING' || o.status === 'BOOKED');
        setOrders(validOrders);
        if (validOrders.length > 0) setSelectedOrderId(validOrders[0].order_id);
      } catch (err) {}
    };
    fetchValidOrders();
  }, []);

  const handleBatchUpload = async () => {
    if (!selectedOrderId) return alert("请先选择一个订单");
    setIsUploading(true);
    try {
      for(let i=0; i<5; i++) {
        await fetch(`${import.meta.env.VITE_LUMINA_API_URL}/orders/${selectedOrderId}/assets`, { method: 'POST' });
      }
      await fetch(`${import.meta.env.VITE_LUMINA_API_URL}/admin/orders/${selectedOrderId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'SELECTING' })
      });
      alert("✨ 5张初修毛片已成功上传！订单已自动变更为「选片中」。");
    } catch (err) { alert("上传失败，请检查网络。"); } finally { setIsUploading(false); }
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8 mt-8 animate-fade-in">
      <header className="border-b border-white/10 pb-4 mb-6"><h2 className="text-2xl font-serif text-white tracking-widest">初修图上传中心</h2></header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <label className="block text-[10px] text-white/50 uppercase">目标客户订单</label>
          <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]">
            {orders.length === 0 && <option value="">暂无待传片订单</option>}
            {orders.map(o => <option key={o.order_id} value={o.order_id}>{o.customer_name} - {o.status}</option>)}
          </select>
          <p className="text-xs text-white/40">* 仅显示状态为「已预约」、「已付定金」或「选片中」的订单。</p>
        </div>
        <div className="md:col-span-2 border-2 border-dashed border-white/20 rounded-[1.5rem] bg-white/5 flex flex-col items-center justify-center p-12 text-center hover:bg-white/10 transition-all">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4"><span className="text-2xl">📸</span></div>
          <h3 className="text-lg text-white mb-2 font-serif">拖拽照片至此区域</h3>
          <button onClick={handleBatchUpload} disabled={isUploading || !selectedOrderId} className="mt-6 rounded-full bg-white px-8 py-3 text-xs font-semibold text-black transition hover:bg-white/80 disabled:opacity-50">
            {isUploading ? '光速传输中...' : '一键模拟上传 (5张)'}
          </button>
        </div>
      </div>
    </div>
  );
}