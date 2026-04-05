import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const WEAKNESS_MAP = {
  'Lighting':            '光影深度',
  'Composition':         '视觉构图',
  'Color Narrative':     '色彩叙事',
  'Emotional Depth':     '情绪张力',
  'Technical Precision': '画质细节',
};

const STATUS_OPTIONS = ['new', 'contacted', 'booked'];

const STATUS_STYLES = {
  new:       'text-[#00e5ff] border-[#00e5ff]/30 bg-[#00e5ff]/5',
  contacted: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5',
  booked:    'text-green-500 border-green-500/30 bg-green-500/5',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function AdminLeadsPanel() {
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error: sbError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (sbError) { setError(sbError.message); }
    else { setLeads(data || []); }
    setLoading(false);
  }

  async function updateStatus(id, status) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    await supabase.from('leads').update({ status }).eq('id', id);
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-white/30 text-xs tracking-[0.2em] uppercase font-mono">
        Loading inquiries...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center text-red-800 text-xs tracking-[0.2em] uppercase font-mono">
        Error: {error}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="py-24 text-center text-white/20 text-xs tracking-[0.2em] uppercase font-mono">
        No inquiries yet.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {leads.map((lead) => {
        const weaknessLabel = WEAKNESS_MAP[lead.lumina_weakness] || lead.lumina_weakness || '—';
        const status = lead.status || 'new';

        return (
          <div
            key={lead.id}
            className="border border-white/10 px-6 py-5 grid grid-cols-[1fr_auto] gap-4"
          >
            {/* Left: data */}
            <div className="space-y-3 min-w-0">
              {/* Row 1: Date + Name + Contact */}
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <span className="text-[9px] font-mono text-gray-700 shrink-0">
                  {formatDate(lead.created_at)}
                </span>
                <span className="text-white text-sm font-light">
                  {lead.client_name || '—'}
                </span>
                <span className="text-gray-500 text-xs font-mono">
                  {lead.client_email || '—'}
                </span>
              </div>

              {/* Row 2: Weakness hook */}
              <div className="flex items-center gap-3">
                {status === 'new' && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_#00e5ff] animate-pulse" />
                )}
                <span className="text-[9px] tracking-[0.2em] uppercase font-mono text-gray-600">
                  弱项 /
                </span>
                <span className="text-[#00e5ff] text-xs font-mono">{weaknessLabel}</span>
              </div>

              {/* Row 3: Vision / message */}
              {lead.message && (
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                  {lead.message}
                </p>
              )}
            </div>

            {/* Right: Status selector */}
            <div className="flex flex-col items-end justify-center gap-2 shrink-0">
              <select
                value={status}
                onChange={(e) => updateStatus(lead.id, e.target.value)}
                className={`text-[9px] tracking-[0.15em] uppercase font-mono border px-3 py-1.5 bg-transparent outline-none cursor-pointer transition-colors ${STATUS_STYLES[status] || STATUS_STYLES.new}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-black text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
