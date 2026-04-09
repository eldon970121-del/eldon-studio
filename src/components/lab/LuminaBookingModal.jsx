import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_LUMINA_URL || import.meta.env.VITE_LUMINA_API_URL || '';

// English id → localised display label
const WEAKNESS_LABELS = {
  en: {
    'Lighting':            'Lighting',
    'Composition':         'Composition',
    'Color Narrative':     'Color Narrative',
    'Emotional Depth':     'Emotional Depth',
    'Technical Precision': 'Technical Precision',
  },
  zh: {
    'Lighting':            '光影深度',
    'Composition':         '视觉构图',
    'Color Narrative':     '色彩叙事',
    'Emotional Depth':     '情绪张力',
    'Technical Precision': '画质细节',
  },
};

const T = {
  en: {
    navLabel:       "Lumina Lab / Session Request",
    headline:       "Unlock Your Cinematic Potential",
    pitch:          (label) =>
      `One professional touch to your ${label} is all that stands between you and a perfect cinematic portrait. Eldon Studio has prepared an exclusive visual upgrade for you.`,
    labelName:      "Your Name",
    labelContact:   "Contact (WeChat or Email)",
    labelVision:    "Your Vision",
    optionalHint:   "(optional)",
    placeholderName:    "Your name",
    placeholderContact: "WeChat ID or email",
    placeholderVision:  "Describe your vision or shoot concept...",
    submitIdle:     "Request Concept Call",
    submitLoading:  "Sending...",
    cancelBtn:      "Cancel",
    successMsg:     "Your vision has been received.",
    successSub:     "Eldon Studio will reach out within 24 hours.",
    returnBtn:      "← Return",
    errorMsg:       "Submission failed. Please try again later.",
  },
  zh: {
    navLabel:       "Lumina 实验室 / 创作咨询申请",
    headline:       "释放您的电影级影像潜能",
    pitch:          (label) =>
      `距离一张完美的电影级大片，或许只差在【${label}】上的专业雕琢。Eldon Studio 已为您准备好专属的视觉升级方案。`,
    labelName:      "您的称呼",
    labelContact:   "联系方式（微信或邮箱）",
    labelVision:    "拍摄构想",
    optionalHint:   "（选填）",
    placeholderName:    "请输入您的姓名",
    placeholderContact: "微信号或邮箱地址",
    placeholderVision:  "请描述您的拍摄构想或创作方向...",
    submitIdle:     "申请创作咨询",
    submitLoading:  "提交中...",
    cancelBtn:      "取消",
    successMsg:     "感谢您的委托，Eldon Studio 已收到您的影像诉求。",
    successSub:     "我们将尽快与您取得联系，请保持微信或邮箱畅通。",
    returnBtn:      "← 返回",
    errorMsg:       "提交失败，请稍后重试。",
  },
};

export function LuminaBookingModal({ weaknessProp, locale = 'en', onClose }) {
  const t = T[locale] ?? T.en;
  const weaknessLabels = WEAKNESS_LABELS[locale] ?? WEAKNESS_LABELS.en;
  const weaknessLabel  = weaknessLabels[weaknessProp] || (locale === 'zh' ? '视觉表达' : 'Visual Expression');
  const pitch = t.pitch(weaknessLabel);

  const [name,    setName]    = useState('');
  const [contact, setContact] = useState('');
  const [vision,  setVision]  = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name:     name,
          contact:         contact,
          emotion:         vision || null,
          emotional_theme: weaknessProp || null,
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuccess(true);
      setName('');
      setContact('');
      setVision('');
    } catch {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[200] flex items-center justify-center px-4 backdrop-blur-xl bg-black/60"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg border border-white/10 bg-[#050505] px-10 py-12"
        >
          <p className="text-[#00e5ff] text-[10px] tracking-[0.3em] uppercase font-mono mb-6">
            {t.navLabel}
          </p>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-white text-base font-light leading-relaxed mb-2">
                  {t.successMsg}
                </p>
                <p className="text-gray-400 text-sm mb-8">{t.successSub}</p>
                <button
                  onClick={onClose}
                  className="text-gray-600 text-xs tracking-[0.2em] uppercase hover:text-white transition-colors"
                >
                  {t.returnBtn}
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2
                  className={`font-serif text-white font-light mb-4 ${
                    locale === 'zh'
                      ? 'text-2xl tracking-[0.06em]'
                      : 'text-3xl tracking-[0.15em] uppercase'
                  }`}
                  style={locale === 'zh' ? { fontFamily: "'Noto Serif SC', 'Noto Serif', serif" } : undefined}
                >
                  {t.headline}
                </h2>

                <p className="text-gray-500 text-sm leading-relaxed mb-10">{pitch}</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[9px] tracking-[0.25em] uppercase text-gray-700 font-mono mb-2">
                      {t.labelName}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 outline-none focus:border-white/50 transition-colors placeholder-gray-800"
                      placeholder={t.placeholderName}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] tracking-[0.25em] uppercase text-gray-700 font-mono mb-2">
                      {t.labelContact}
                    </label>
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 outline-none focus:border-white/50 transition-colors placeholder-gray-800"
                      placeholder={t.placeholderContact}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] tracking-[0.25em] uppercase text-gray-700 font-mono mb-2">
                      {t.labelVision}{' '}
                      <span className="text-gray-800">{t.optionalHint}</span>
                    </label>
                    <textarea
                      rows={3}
                      value={vision}
                      onChange={(e) => setVision(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 outline-none focus:border-white/50 transition-colors resize-none placeholder-gray-800"
                      placeholder={t.placeholderVision}
                    />
                  </div>

                  {error && (
                    <p className="text-red-700 text-[10px] tracking-[0.2em] uppercase font-mono">{error}</p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-gray-700 text-[10px] tracking-[0.2em] uppercase hover:text-gray-400 transition-colors"
                    >
                      {t.cancelBtn}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="border border-white/20 text-white text-xs tracking-[0.3em] uppercase px-8 py-3 hover:border-white/60 hover:bg-white/5 transition-all duration-300 disabled:opacity-40"
                    >
                      {loading ? t.submitLoading : t.submitIdle}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
