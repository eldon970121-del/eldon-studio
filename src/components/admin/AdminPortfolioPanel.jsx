import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

// ── 环境常量 ──────────────────────────────────────────
const API_BASE  = import.meta.env.VITE_LUMINA_URL || import.meta.env.VITE_LUMINA_API_URL || '';
const BUCKET    = import.meta.env.VITE_SUPABASE_BUCKET || 'lumina-assets';
const SUPA_URL  = import.meta.env.VITE_SUPABASE_URL || '';
const SUPA_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const getToken  = () => localStorage.getItem('lumina_token') || '';

const NARRATIVES = ['STUDIO', 'EXPLORATION', 'ARCHIVE'];

// ── Toast ─────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={[
          "px-5 py-3 rounded-xl text-xs tracking-wide shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] animate-fade-in",
          "bg-[#0a0a0a] border",
          t.type === 'error'
            ? "border-red-500/30 text-red-300"
            : "border-yellow-600/30 text-yellow-200",
        ].join(' ')}>{t.message}</div>
      ))}
    </div>
  );
}

// ── 上传单张图片到 Supabase Storage ──────────────────
async function uploadImageToSupabase(file, portfolioId) {
  const ext  = file.name.split('.').pop();
  const path = `portfolio-images/${portfolioId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // 优先用 supabase client，其次用裸 XHR
  if (supabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  // fallback: 直接 PUT Supabase Storage REST
  const res = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'false',
    },
    body: file,
  });
  if (!res.ok) throw new Error('上传失败');
  return `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

// ── 状态徽标 ─────────────────────────────────────────
function NarrativeBadge({ label }) {
  const colors = {
    STUDIO:      'bg-yellow-600/10 text-yellow-500 border-yellow-600/20',
    EXPLORATION: 'bg-blue-600/10 text-blue-400 border-blue-600/20',
    ARCHIVE:     'bg-white/5 text-white/40 border-white/10',
  };
  return (
    <span className={`border px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-[0.2em] ${colors[label] || colors.ARCHIVE}`}>
      {label}
    </span>
  );
}

// ── 封面预览格子 ─────────────────────────────────────
function CoverThumb({ url }) {
  return url
    ? <img src={url} alt="cover" className="h-full w-full object-cover" />
    : <div className="flex h-full w-full items-center justify-center text-white/10 text-xs tracking-widest uppercase">No Cover</div>;
}

// ══════════════════════════════════════════════════════
// 主组件：列表视图
// ══════════════════════════════════════════════════════
export function AdminPortfolioPanel() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null); // null | 'new' | portfolio object
  const { toasts, show }            = useToasts();

  // ── 拉取列表 ──────────────────────────────────────
  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/portfolios`);
      const data = await res.json();
      setPortfolios(data.portfolios || []);
    } catch { show('获取作品集失败', 'error'); }
    finally  { setLoading(false); }
  }, [show]);

  useEffect(() => { fetchPortfolios(); }, [fetchPortfolios]);

  // ── 删除 ──────────────────────────────────────────
  async function handleDelete(id, title) {
    if (!window.confirm(`确认删除《${title}》及其所有图片？`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/portfolios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      show('✓ 作品集已删除');
      fetchPortfolios();
    } catch { show('删除失败', 'error'); }
  }

  // ── 编辑子组件回调 ────────────────────────────────
  function handleSaved() {
    setEditing(null);
    fetchPortfolios();
  }

  // ── 编辑视图 ─────────────────────────────────────
  if (editing !== null) {
    return (
      <>
        <PortfolioDetailPanel
          portfolio={editing === 'new' ? null : editing}
          onBack={() => setEditing(null)}
          onSaved={handleSaved}
          showToast={show}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  // ── 列表视图 ─────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in">
      <ToastContainer toasts={toasts} />

      {/* 顶栏 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30 uppercase tracking-widest">共 {portfolios.length} 个作品集</p>
        <button
          onClick={() => setEditing('new')}
          className="rounded-full border border-yellow-600/40 bg-yellow-600/10 px-5 py-2 text-[10px] font-semibold tracking-[0.2em] text-yellow-500 uppercase transition-all hover:bg-yellow-600 hover:text-black"
        >
          + 新建作品集
        </button>
      </div>

      {/* 骨架 / 列表 */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-32 text-white/20">
          <span className="text-4xl">✦</span>
          <p className="text-xs uppercase tracking-widest">暂无作品集，点击「新建」开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {portfolios.map(p => {
            const title = typeof p.title === 'object' ? (p.title.zh || p.title.en) : p.title;
            const titleEn = typeof p.title === 'object' ? p.title.en : p.title;
            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-500 hover:border-yellow-600/30"
              >
                {/* 封面 */}
                <div className="aspect-[3/4] overflow-hidden bg-[#111]">
                  <CoverThumb url={p.cover_url} />
                </div>

                {/* 信息层 */}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4">
                  <NarrativeBadge label={p.narrative} />
                  <p className="mt-2 text-sm font-light text-white leading-tight">{title}</p>
                  <p className="text-[10px] text-white/40 tracking-widest">{titleEn}</p>

                  {/* 操作按钮（hover 显现）*/}
                  <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setEditing(p)}
                      className="flex-1 rounded-lg border border-yellow-600/40 bg-yellow-600/10 py-1.5 text-[10px] uppercase tracking-widest text-yellow-500 transition hover:bg-yellow-600 hover:text-black"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, title)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/40 transition hover:border-red-500/40 hover:text-red-400"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 详情/编辑面板
// ══════════════════════════════════════════════════════
function PortfolioDetailPanel({ portfolio, onBack, onSaved, showToast }) {
  const isNew = !portfolio;

  const [form, setForm] = useState({
    title_en:   portfolio?.title?.en   || '',
    title_zh:   portfolio?.title?.zh   || '',
    desc_en:    portfolio?.description?.en || '',
    desc_zh:    portfolio?.description?.zh || '',
    narrative:  portfolio?.narrative   || 'STUDIO',
  });
  const [images, setImages]       = useState(portfolio?.images || []);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const fileInputRef              = useRef(null);

  // ── 拉取该 portfolio 最新图片列表 ─────────────────
  const refreshImages = useCallback(async (id) => {
    try {
      const res  = await fetch(`${API_BASE}/api/portfolios/${id}`);
      const data = await res.json();
      if (data.success) setImages(data.portfolio.images || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (portfolio?.id) refreshImages(portfolio.id);
  }, [portfolio?.id, refreshImages]);

  // ── 保存元数据 ────────────────────────────────────
  async function handleSaveMeta() {
    if (!form.title_en.trim() && !form.title_zh.trim()) {
      return showToast('请至少填写一个标题', 'error');
    }
    setSaving(true);
    const body = {
      title:       { en: form.title_en.trim(), zh: form.title_zh.trim() },
      description: { en: form.desc_en.trim(),  zh: form.desc_zh.trim()  },
      narrative:   form.narrative,
    };
    try {
      let res;
      if (isNew) {
        res = await fetch(`${API_BASE}/api/admin/portfolios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_BASE}/api/admin/portfolios/${portfolio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(body),
        });
      }
      if (!res.ok) throw new Error();
      showToast(isNew ? '✨ 作品集已创建' : '✓ 元数据已更新');
      if (isNew) {
        // 新建后直接返回列表（无图片可上传，用户可再进入编辑）
        onSaved();
      }
    } catch { showToast('保存失败，请确认 Lumina 引擎运行中', 'error'); }
    finally { setSaving(false); }
  }

  // ── 上传图片 ─────────────────────────────────────
  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !portfolio?.id) return;
    setUploading(true);
    setUploadPct(0);

    let done = 0;
    for (const file of files) {
      try {
        const publicUrl = await uploadImageToSupabase(file, portfolio.id);
        // 写入 Railway 数据库
        await fetch(`${API_BASE}/api/admin/portfolios/${portfolio.id}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ url: publicUrl, is_cover: images.length === 0 && done === 0, sort_order: images.length + done }),
        });
      } catch { showToast(`${file.name} 上传失败`, 'error'); }
      done++;
      setUploadPct(Math.round((done / files.length) * 100));
    }

    await refreshImages(portfolio.id);
    setUploading(false);
    showToast(`✨ ${done} 张图片已上传入库`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── 设为封面 ──────────────────────────────────────
  async function handleSetCover(imageId, imageUrl) {
    try {
      await fetch(`${API_BASE}/api/admin/portfolios/${portfolio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ cover_url: imageUrl }),
      });
      // 同步更新 is_cover 到图片表（通过一个便利接口，或前端乐观更新）
      setImages(prev => prev.map(img => ({ ...img, isCover: img.id === imageId })));
      showToast('✓ 封面已更新');
    } catch { showToast('设置封面失败', 'error'); }
  }

  // ── 删除单张图片 ──────────────────────────────────
  async function handleDeleteImage(imageId) {
    try {
      await fetch(`${API_BASE}/api/admin/portfolio-images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setImages(prev => prev.filter(img => img.id !== imageId));
      showToast('✓ 图片已移除');
    } catch { showToast('删除失败', 'error'); }
  }

  // ── 表单字段 ──────────────────────────────────────
  const inputCls = "w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white/80 placeholder-white/20 outline-none transition focus:border-yellow-600/40";
  const labelCls = "mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-white/40";

  return (
    <div className="space-y-10 animate-fade-in">
      {/* 返回 */}
      <button onClick={onBack} className="flex items-center gap-2 text-xs text-white/40 transition hover:text-white">
        ← 返回作品集列表
      </button>

      {/* 标题 */}
      <h2 className="font-serif text-2xl tracking-widest text-white">
        {isNew ? '新建作品集' : `编辑：${portfolio.title?.zh || portfolio.title?.en}`}
      </h2>

      {/* ── 元数据表单 ── */}
      <div className="rounded-2xl border border-white/5 bg-[#0a0a0a]/60 p-8 backdrop-blur-xl">
        <h3 className="mb-6 text-xs uppercase tracking-[0.3em] text-white/40">基本信息</h3>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelCls}>标题（中文）</label>
            <input className={inputCls} value={form.title_zh} onChange={e => setForm(f => ({ ...f, title_zh: e.target.value }))} placeholder="男性肖像" />
          </div>
          <div>
            <label className={labelCls}>Title (English)</label>
            <input className={inputCls} value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} placeholder="Male Portraiture" />
          </div>
          <div>
            <label className={labelCls}>简介（中文）</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.desc_zh} onChange={e => setForm(f => ({ ...f, desc_zh: e.target.value }))} placeholder="作品集描述..." />
          </div>
          <div>
            <label className={labelCls}>Description (English)</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={form.desc_en} onChange={e => setForm(f => ({ ...f, desc_en: e.target.value }))} placeholder="Portfolio description..." />
          </div>
          <div>
            <label className={labelCls}>分类 / Narrative</label>
            <select className={inputCls} value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))}>
              {NARRATIVES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveMeta}
            disabled={saving}
            className="rounded-full border border-yellow-600/40 bg-yellow-600/10 px-8 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-500 transition hover:bg-yellow-600 hover:text-black disabled:opacity-40"
          >
            {saving ? '保存中...' : isNew ? '创建作品集' : '保存元数据'}
          </button>
        </div>
      </div>

      {/* ── 图片区（仅编辑模式） ── */}
      {!isNew && (
        <div className="rounded-2xl border border-white/5 bg-[#0a0a0a]/60 p-8 backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.3em] text-white/40">图片资产 · {images.length} 张</h3>
            <label className="cursor-pointer rounded-full border border-yellow-600/40 bg-yellow-600/10 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-500 transition hover:bg-yellow-600 hover:text-black">
              {uploading ? `上传中 ${uploadPct}%...` : '+ 添加图片'}
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>

          {/* 拖拽提示 */}
          {images.length === 0 && !uploading && (
            <div
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/10 py-16 text-white/20 transition hover:border-yellow-600/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-3xl">↑</span>
              <p className="text-xs uppercase tracking-widest">点击或拖拽图片至此处</p>
            </div>
          )}

          {/* 进度条 */}
          {uploading && (
            <div className="mb-4 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-yellow-600/60 transition-all" style={{ width: `${uploadPct}%` }} />
            </div>
          )}

          {/* 图片格子 */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map(img => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/5 bg-[#111]">
                  <img src={img.url} alt="" className="h-full w-full object-cover transition group-hover:brightness-50" />

                  {/* 封面标记 */}
                  {img.isCover && (
                    <div className="absolute left-2 top-2 rounded-full border border-yellow-600/50 bg-yellow-600/20 px-2 py-0.5 text-[9px] uppercase tracking-widest text-yellow-400">
                      封面
                    </div>
                  )}

                  {/* Hover 操作 */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!img.isCover && (
                      <button
                        onClick={() => handleSetCover(img.id, img.url)}
                        className="rounded-full border border-yellow-600/60 bg-yellow-600/20 px-3 py-1 text-[9px] uppercase tracking-widest text-yellow-400 transition hover:bg-yellow-600 hover:text-black"
                      >
                        设为封面
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="rounded-full border border-red-500/30 bg-black/60 px-3 py-1 text-[9px] uppercase tracking-widest text-red-400 transition hover:bg-red-500 hover:text-white"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
