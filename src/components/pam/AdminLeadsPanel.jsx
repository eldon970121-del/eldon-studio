import { useState, useEffect } from "react";

// ==========================================
// 🌟 核心植入：Lumina 顶级询单管理 (CRM 中枢)
// ==========================================

const MOCK_LEADS = [
  {
    id: "INQ_8839201",
    date: "2026-04-07 10:15",
    name: "林微 (Vivian)",
    contact: "WeChat: vivian_lin99",
    budget: "¥5,000 - ¥8,000",
    intent: "上海 / 街头夜景",
    timeframe: "下个月中旬",
    emotion: "希望拍出王家卫电影那种疏离感，光影要硬，不要过度磨皮，保留真实的情绪张力。",
    status: "NEW"
  },
  {
    id: "INQ_8839155",
    date: "2026-04-05 09:59",
    name: "David & Sarah",
    contact: "david.chen@gmail.com",
    budget: "¥10,000+",
    intent: "加德满都 / 纪实跟拍",
    timeframe: "今年 10 月",
    emotion: "我们准备去尼泊尔徒步，看中了 Eldon Studio 的胶片质感。想要一组充满生命力的情侣纪实，不摆拍。",
    status: "CONTACTED"
  },
  {
    id: "INQ_8839012",
    date: "2026-04-02 14:20",
    name: "陈先生 (品牌公关)",
    contact: "Phone: 138-xxxx-xxxx",
    budget: "待确认 (企业报销)",
    intent: "工作室棚拍 / 商业高管肖像",
    timeframe: "越快越好",
    emotion: "需要用于福布斯杂志内页采访。要求沉稳、极简、有压迫感的高级黑白灰基调。",
    status: "CONVERTED"
  }
];

export function AdminLeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [convertingId, setConvertingId] = useState(null);

  useEffect(() => {
    const fetchLeads = () => {
      setTimeout(() => {
        setLeads(MOCK_LEADS);
        setIsLoading(false);
      }, 600);
    };
    fetchLeads();
  }, []);

  const handleStatusChange = (id, newStatus) => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
  };

  // 🚀 核心修复：更健壮的一键转单链路
  const handleConvertToOrder = async (lead) => {
    if (!window.confirm(`确定将 ${lead.name} 转化为正式订单吗？\n该操作将同步至 Lumina 业务大盘。`)) return;
    
    setConvertingId(lead.id);
    
    try {
      const apiUrl = import.meta.env.VITE_LUMINA_API_URL;
      
      // 🐛 修复 1：精准提取起始金额。
      // 对于 "¥5,000 - ¥8,000" 先去掉逗号，再提取第一组数字 -> 得到 5000。防止撑爆数据库。
      const budgetCleaned = lead.budget.replace(/,/g, '');
      const match = budgetCleaned.match(/\d+/);
      const baseAmount = match ? parseInt(match[0]) : 0; 

      // 🐛 修复 2：写入用户画像。
      // 在建单前，先调用 profile 接口，把客户名字写进 lumina_users 表。
      // 这样大盘里就不会出现 "匿名"，而是完美的客户名。
      await fetch(`${apiUrl}/users/${lead.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: lead.name, avatarUrl: '' })
      });

      // 3. 正式创建订单
      const orderPayload = {
        userId: lead.id, 
        productId: 1, // 使用默认的安全产品 ID
        bookingDate: new Date().toISOString().split('T')[0],
        baseAmount: baseAmount
      };

      const res = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        alert(`✨ 转单成功！\n\n${lead.name} 的委托已成功汇入 Lumina 大盘（预估金额: ¥${baseAmount}）。`);
        handleStatusChange(lead.id, 'CONVERTED');
      } else {
        const errorData = await res.json();
        alert(`转单失败，后端拒绝写入: ${errorData.error || '未知错误'}`);
      }
    } catch (err) {
      alert("无法连接到 Lumina 引擎，请确保 node server.js 正在运行！");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8 mt-8 animate-fade-in w-full">
      <header className="border-b border-white/10 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-widest">询单与线索管理</h2>
          <p className="text-[10px] text-white/50 mt-2 tracking-[0.2em] uppercase">Client Inquiries & CRM</p>
        </div>
        <div className="text-[10px] text-white/50 tracking-widest uppercase">
          共 {leads.length} 组高意向客户
        </div>
      </header>

      {isLoading ? (
        <div className="py-20 text-center text-white/30 animate-pulse text-sm">正在检索全球线索网络...</div>
      ) : (
        <div className="space-y-6">
          {leads.map((lead) => (
            <div key={lead.id} className="group bg-[#0a0a0a] border border-white/10 hover:border-[#d4af37]/50 rounded-[1.5rem] p-6 transition-all duration-300">
              
              <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-white/40 font-mono tracking-widest">{lead.date}</span>
                  <span className="text-[10px] text-white/20">|</span>
                  <span className="text-[10px] text-white/40 font-mono tracking-widest">{lead.id}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] tracking-[0.2em] px-3 py-1.5 border rounded-full uppercase ${
                    lead.status === 'NEW' ? 'border-[#d4af37]/40 text-[#d4af37] bg-[#332b00]/30' : 
                    lead.status === 'CONTACTED' ? 'border-blue-500/40 text-blue-400 bg-blue-900/30' : 
                    'border-[#00cc44]/40 text-[#00cc44] bg-[#003311]/30'
                  }`}>
                    {lead.status === 'NEW' ? '新线索' : lead.status === 'CONTACTED' ? '沟通中' : '已转化'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="col-span-1 md:col-span-3 space-y-4">
                  <div>
                    <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">Client</div>
                    <div className="text-lg text-white font-medium">{lead.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">Contact</div>
                    <div className="text-sm text-white/80 font-mono">{lead.contact}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">Budget</div>
                    <div className="text-sm text-[#d4af37] font-mono">{lead.budget}</div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-6 space-y-4 border-l border-white/5 pl-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">Intent</div>
                      <div className="text-sm text-white/90">{lead.intent}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-1">Timeframe</div>
                      <div className="text-sm text-white/90">{lead.timeframe}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 mt-2">
                    <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-2">Vibe & Emotion</div>
                    <div className="text-sm font-serif text-white/70 leading-relaxed italic border-l-2 border-[#d4af37]/50 pl-3">
                      “{lead.emotion}”
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-3 flex flex-col justify-between border-l border-white/5 pl-8">
                  <div className="space-y-2">
                    <div className="text-[10px] text-white/40 tracking-[0.2em] uppercase mb-2">Actions</div>
                    <select 
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-xs text-white/70 focus:outline-none focus:border-[#d4af37] transition-colors"
                      disabled={lead.status === 'CONVERTED'}
                    >
                      <option value="NEW">标记为：未读新线索</option>
                      <option value="CONTACTED">标记为：正在沟通中</option>
                      <option value="CONVERTED" disabled>已转化为正式订单</option>
                    </select>
                  </div>

                  {lead.status !== 'CONVERTED' ? (
                    <button 
                      onClick={() => handleConvertToOrder(lead)}
                      disabled={convertingId === lead.id}
                      className="mt-4 w-full rounded-full border border-[#d4af37] bg-transparent px-4 py-2 text-[10px] font-semibold tracking-[0.2em] text-[#d4af37] transition hover:bg-[#d4af37] hover:text-black uppercase"
                    >
                      {convertingId === lead.id ? '传输中...' : '一键转为正式订单'}
                    </button>
                  ) : (
                    <div className="mt-4 w-full text-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold tracking-[0.2em] text-white/30 uppercase cursor-not-allowed">
                      已进入 Lumina 引擎
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}