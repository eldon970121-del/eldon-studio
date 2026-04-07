import { useState, useEffect } from "react";

// ==========================================
// 🌟 核心植入：Lumina 交付中心 (查看客户选片 & 上传精修)
// ==========================================
export function AdminUploadPanel() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [assets, setAssets] = useState([]);
  const [isDelivering, setIsDelivering] = useState(false);

  // 1. 获取需要“精修交付”的订单 (状态为 选片中 或 精修中)
  useEffect(() => {
    const fetchTargetOrders = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_LUMINA_API_URL}/admin/orders`);
        const data = await res.json();
        // 筛选出等待主理人处理的订单
        const targetOrders = data.filter(o => o.status === 'SELECTING' || o.status === 'RETOUCHING');
        setOrders(targetOrders);
        if (targetOrders.length > 0) setSelectedOrderId(targetOrders[0].order_id);
      } catch (err) {
        console.error("获取订单失败", err);
      }
    };
    fetchTargetOrders();
  }, []);

  // 2. 当选中订单时，拉取该订单的所有照片，看看客户选了哪些
  useEffect(() => {
    if (!selectedOrderId) {
      setAssets([]);
      return;
    }
    const fetchAssets = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_LUMINA_API_URL}/assets/${selectedOrderId}`);
        if (res.ok) {
          setAssets(await res.json());
        }
      } catch (err) {
        console.error("获取资产失败", err);
      }
    };
    fetchAssets();
  }, [selectedOrderId]);

  // 客户标红心的照片
  const selectedAssets = assets.filter(a => a.is_selected);

  // 3. 模拟一键交付精修图
  const handleFinalDelivery = async () => {
    if (!selectedOrderId) return;
    setIsDelivering(true);
    
    try {
      // 在真实场景中，这里是你批量上传精修图的逻辑
      // 现在我们直接将订单状态翻转为“已交付”
      const res = await fetch(`${import.meta.env.VITE_LUMINA_API_URL}/admin/orders/${selectedOrderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' })
      });

      if (res.ok) {
        alert("✨ 精修资产已成功交付！小程序端将解锁成片下载。");
        // 从列表中移除已交付的订单
        setOrders(orders.filter(o => o.order_id !== selectedOrderId));
        setSelectedOrderId('');
      }
    } catch (err) {
      alert("交付失败，请检查网络。");
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.025)_100%)] p-6 shadow-soft sm:p-8 mt-8 animate-fade-in">
      <header className="border-b border-white/10 pb-4 mb-6">
        <h2 className="text-2xl font-serif text-white tracking-widest">最终交付中心</h2>
        <p className="text-[10px] text-white/50 mt-2 tracking-[0.2em] uppercase">Final Delivery & Assets</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* 左侧控制列 */}
        <div className="md:col-span-1 space-y-6">
          <div className="space-y-3">
            <label className="block text-[10px] text-white/50 uppercase">选择待交付订单</label>
            <select 
              value={selectedOrderId} 
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#d4af37]"
            >
              {orders.length === 0 && <option value="">目前没有待处理订单</option>}
              {orders.map(o => (
                <option key={o.order_id} value={o.order_id}>
                  {o.customer_name || '匿名'} ({o.status === 'SELECTING' ? '选片中' : '精修中'})
                </option>
              ))}
            </select>
          </div>

          {selectedOrderId && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">客户选片进度</div>
              <div className="text-2xl font-light text-[#d4af37]">
                {selectedAssets.length} <span className="text-sm text-white/40">/ {assets.length}</span>
              </div>
            </div>
          )}

          <button 
            onClick={handleFinalDelivery}
            disabled={isDelivering || !selectedOrderId}
            className="w-full rounded-full bg-white px-4 py-3 text-xs font-semibold text-black transition hover:bg-white/80 disabled:opacity-50"
          >
            {isDelivering ? '打包交付中...' : '上传精修图并交付'}
          </button>
        </div>

        {/* 右侧客户选片结果展示区 */}
        <div className="md:col-span-3">
          <h3 className="text-sm font-serif text-white tracking-wide mb-4">客户已选定底片 (需精修)</h3>
          
          {assets.length === 0 ? (
            <div className="border border-white/10 border-dashed rounded-2xl p-12 text-center text-white/30 text-sm">
              请先在左侧选择一个订单
            </div>
          ) : selectedAssets.length === 0 ? (
            <div className="border border-white/10 border-dashed rounded-2xl p-12 text-center text-[#d4af37]/60 text-sm">
              客户尚未选出心仪的照片，催一下吧～
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 custom-scrollbar max-h-[500px] overflow-y-auto pr-2">
              {selectedAssets.map((asset, idx) => (
                <div key={asset.asset_id} className="relative aspect-[3/4] bg-[#111] rounded-xl overflow-hidden group border border-white/10">
                  <img src={asset.watermark_url} alt="selected" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[#d4af37] text-xs px-2 py-1 rounded border border-[#d4af37]/30">
                    需精修 #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}