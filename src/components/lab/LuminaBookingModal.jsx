import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

const WEAKNESS_MAP = {
  'Lighting':            '光影深度',
  'Composition':         '视觉构图',
  'Color Narrative':     '色彩叙事',
  'Emotional Depth':     '情绪张力',
  'Technical Precision': '画质细节',
};

export function LuminaBookingModal({ weaknessProp, onClose }) {
  const [name,    setName]    = useState('');
  const [contact, setContact] = useState('');
  const [vision,  setVision]  = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState(null);

  const weaknessLabel = WEAKNESS_MAP[weaknessProp] || '视觉表达';
  const pitch = `距离一张完美的电影级大片，或许只差在【${weaknessLabel}】上的专业雕琢。Eldon Studio 已为您准备好专属的视觉升级方案。`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: sbError } = await supabase
        .from('leads')
        .insert({
          client_name:      name,
          client_email:     contact,
          lumina_weakness:  weaknessProp,
          message:          vision || null,
        });
      if (sbError) throw sbError;
      setSuccess(true);
    } catch (err) {
      setError('提交失败，请稍后重试。');
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
          {/* Header label */}
          <p className="text-[#00e5ff] text-[10px] tracking-[0.3em] uppercase font-mono mb-6">
            Lumina Lab / Session Request
          </p>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-white text-base font-light leading-relaxed mb-8">
                  Transmission received.<br />
                  <span className="text-gray-400">Eldon Studio 将在 24 小时内与您联系。</span>
                </p>
                <button
                  onClick={onClose}
                  className="text-gray-600 text-xs tracking-[0.2em] uppercase hover:text-white transition-colors"
                >
                  ← Return
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Headline */}
                <h2 className="font-serif text-white text-3xl tracking-[0.15em] uppercase font-light mb-4">
                  Unlock Your Cinematic Potential
                </h2>

                {/* Dynamic pitch */}
                <p className="text-gray-500 text-sm leading-relaxed mb-10">
                  {pitch}
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Name */}
                  <div>
                    <label className="block text-[9px] tracking-[0.25em] uppercase text-gray-700 font-mono mb-2">
                      您的称呼 / Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 outline-none focus:border-white/50 transition-colors placeholder-gray-800"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Contact */}
                  <div>
                    <label className="block text-[9px] tracking-[0.25em] uppercase text-gray-700 font-mono mb-2">
                      联系方式 (微信或邮箱) / Contact
                    </label>
                    <input
                      type="text"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 outline-none focus:border-white/50 transition-colors placeholder-gray-800"
                      placeholder="WeChat ID or email"
                    />
                  </div>

                  {/* Vision */}
                  <div>
                    <label className="block text-[9px] tracking-[0.25em] uppercase text-gray-700 font-mono mb-2">
                      拍摄构想 / Your Vision <span className="text-gray-800">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={vision}
                      onChange={(e) => setVision(e.target.value)}
                      className="w-full bg-transparent border-b border-white/20 text-white text-sm py-2 outline-none focus:border-white/50 transition-colors resize-none placeholder-gray-800"
                      placeholder="Describe your vision or shoot concept..."
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
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="border border-white/20 text-white text-xs tracking-[0.3em] uppercase px-8 py-3 hover:border-white/60 hover:bg-white/5 transition-all duration-300 disabled:opacity-40"
                    >
                      {loading ? 'Sending...' : 'Request Concept Call'}
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
