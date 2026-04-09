import { useState, useEffect, useRef } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/dashboard";
import XHRUpload from "@uppy/xhr-upload";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

// ── 环境常量 ─────────────────────────────────────────
const API_BASE = import.meta.env.VITE_LUMINA_API || 'https://lumina-server-production.up.railway.app';
const getToken = () => localStorage.getItem('lumina_token') || '';

// ── 同步状态条 ────────────────────────────────────────
function SyncBar({ status }) {
  if (!status) return null;
  const map = {
    syncing: { color: 'text-yellow-500/80', dot: 'bg-yellow-500', msg: '正在同步资产至 Lumina 引擎...' },
    done:    { color: 'text-green-400/80',  dot: 'bg-green-400',  msg: '✓ 资产已写入 Lumina 引擎' },
    error:   { color: 'text-red-400/70',    dot: 'bg-red-500',    msg: '⚠ 同步失败，请检查 Railway 服务与 Token' },
  };
  const s = map[status];
  return (
    <div className={`mt-3 flex items-center gap-2 text-xs tracking-wide ${s.color} ${status === 'syncing' ? 'animate-pulse' : ''}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 可复用单轨上传模块
// ══════════════════════════════════════════════════════
function UploadTrack({ order, assetType, label, sublabel, borderClass, onSyncDone }) {
  const [syncStatus, setSyncStatus] = useState(null);
  const uppyRef      = useRef(null);
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!order || !dashboardRef.current) return;
    if (uppyRef.current) { uppyRef.current.destroy(); uppyRef.current = null; }

    const orderNo = order.order_no || String(order.id);

    const uppy = new Uppy({
      id:           `lumina-${assetType}`,
      autoProceed:  false,
      allowMultipleUploadBatches: true,
      meta:         { order_no: orderNo, asset_type: assetType },
      restrictions: { allowedFileTypes: ['image/*'] },
    });

    uppy.use(XHRUpload, {
      endpoint: `${API_BASE}/api/orders/${orderNo}/assets/upload`,
      method:   'POST',
      formData: true,
      fieldName: 'file',
      headers:  () => ({
        Authorization: `Bearer ${getToken()}`,
        'x-asset-type': assetType,
      }),
      getResponseData: (text) => { try { return JSON.parse(text); } catch { return {}; } },
    });

    uppy.use(Dashboard, {
      target:  dashboardRef.current,
      inline:  true,
      theme:   'dark',
      showProgressDetails: true,
      proudlyDisplayPoweredByUppy: false,
      note:    `${label} — ${order.order_no || `#${order.id}`}`,
      width:   '100%',
      height:  340,
    });

    uppy.on('complete', async (result) => {
      if (!result.successful?.length) return;
      setSyncStatus('syncing');
      try {
        // Railway 上传接口直接返回资产记录，无需二次 batch-assets 调用
        const failed = result.failed?.length ?? 0;
        if (failed > 0) throw new Error(`${failed} 个文件上传失败`);
        setSyncStatus('done');
        onSyncDone?.();
      } catch (err) {
        console.error('Upload failed:', err);
        setSyncStatus('error');
      }
    });

    uppyRef.current = uppy;
    setSyncStatus(null);
    return () => { uppy.destroy(); uppyRef.current = null; };
  }, [order, assetType, label, onSyncDone]);

  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-6 ${borderClass}`}>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-medium text-white tracking-wide">{label}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{sublabel}</p>
        </div>
      </div>

      {order ? (
        <>
          <div ref={dashboardRef} className="overflow-hidden rounded-xl" />
          <SyncBar status={syncStatus} />
        </>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10">
          <p className="text-xs uppercase tracking-widest text-white/20">请先选择订单</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 主组件：双轨交付中心
// ══════════════════════════════════════════════════════
export function AdminUploadPanel() {
  const [orders, setOrders]         = useState([]);
  const [selectedOrder, setSelected] = useState(null);
  const [assets, setAssets]         = useState([]);
  const [finalSynced, setFinalSynced] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [delivered, setDelivered]   = useState(false);

  // 拉取订单列表
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        const list = (data.orders || []).filter(o =>
          ['DEPOSIT_PAID', 'SELECTING', 'FINAL_RETOUCH', 'pending'].includes(o.status)
        );
        setOrders(list);
        if (list.length > 0) setSelected(list[0]);
      } catch {}
    })();
  }, []);

  // 拉取客户已选底片
  useEffect(() => {
    if (!selectedOrder) { setAssets([]); return; }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/assets/${selectedOrder.id}?type=raw`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) setAssets((await res.json()).assets || []);
      } catch { setAssets([]); }
    })();
    setFinalSynced(false);
    setDelivered(false);
  }, [selectedOrder]);

  // 一键交付
  async function handleDeliver() {
    if (!selectedOrder || delivering) return;
    setDelivering(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${selectedOrder.id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
      if (!res.ok) throw new Error();
      setDelivered(true);
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      setSelected(null);
    } catch { alert('交付失败，请重试'); }
    finally { setDelivering(false); }
  }

  const selectedAssets = assets.filter(a => a.is_selected);

  return (
    <div className="relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] hover:border-yellow-600/30 transition-all duration-500 mt-8 w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />

      <div className="relative space-y-8">
        {/* 头部 */}
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-700 tracking-tight text-2xl">
              双轨交付中心
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
              Raw Selection · Final Delivery
            </p>
          </div>

          <div className="md:w-72">
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40">选择订单</label>
            <select
              value={selectedOrder?.id || ''}
              onChange={e => {
                setSelected(orders.find(o => String(o.id) === e.target.value) || null);
              }}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-xs text-white/70 outline-none focus:border-yellow-600/40 transition-colors"
            >
              {orders.length === 0 && <option value="">暂无待处理订单</option>}
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.client_name || '匿名'} · {o.order_no || `#${o.id}`}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* 交付成功提示 */}
        {delivered && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-6 py-4 text-sm text-green-400 tracking-wide">
            ✓ 订单已标记为 DELIVERED，客户可在小程序查看精修成片。
          </div>
        )}

        {/* 双轨上传区 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 左：粗修区 */}
          <UploadTrack
            order={selectedOrder}
            assetType="raw"
            label="上传粗修图"
            sublabel="Upload RAWs · 客户选片阶段"
            borderClass="border-white/10"
          />

          {/* 右：精修区（金色高亮） */}
          <UploadTrack
            order={selectedOrder}
            assetType="final"
            label="上传精修成片"
            sublabel="Upload Final Retouches · 专属交付区"
            borderClass="border-yellow-600/30 shadow-[0_0_40px_0_rgba(212,175,55,0.06)]"
            onSyncDone={() => setFinalSynced(true)}
          />
        </div>

        {/* 一键交付按钮 */}
        {finalSynced && !delivered && (
          <div className="flex items-center justify-between rounded-xl border border-yellow-600/20 bg-yellow-600/5 px-6 py-4">
            <div>
              <p className="text-sm text-yellow-200 font-medium tracking-wide">精修成片已就绪</p>
              <p className="text-[10px] text-yellow-600/60 uppercase tracking-widest mt-0.5">点击交付，通知客户查看成片</p>
            </div>
            <button
              onClick={handleDeliver}
              disabled={delivering}
              className="rounded-full border border-yellow-600/60 bg-yellow-600 px-8 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              {delivering ? '交付中...' : '一键交付 →'}
            </button>
          </div>
        )}

        {/* 客户选片结果 */}
        <div>
          <h3 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-white/40">
            客户已选底片
            <span className="ml-2 rounded-full border border-yellow-600/20 bg-yellow-600/10 px-2 py-0.5 text-yellow-600">
              {selectedAssets.length} / {assets.length}
            </span>
          </h3>

          {assets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-white/20">
              该订单暂无粗修资产记录
            </div>
          ) : selectedAssets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-yellow-600/10 p-8 text-center text-xs text-yellow-600/40">
              客户尚未完成选片
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1 sm:grid-cols-6">
              {selectedAssets.map((asset, i) => (
                <div key={asset.id || i} className="group relative aspect-square overflow-hidden rounded-lg border border-white/5 bg-white/5">
                  <img src={asset.url_thumb || asset.url} alt="" className="h-full w-full object-cover opacity-70 transition group-hover:opacity-100" />
                  <div className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] text-yellow-500 backdrop-blur">#{i + 1}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
