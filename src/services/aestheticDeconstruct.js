/**
 * aestheticDeconstruct.js
 * Calls POST /api/ai/analyze-aesthetics on Railway.
 * Falls back to rich mock data so the frontend is always interactive.
 */

const API_BASE = import.meta.env.VITE_LUMINA_API || 'https://lumina-server-production.up.railway.app';

/** @returns {DeconstructResult} */
function buildMockResult(imageDataUrl) {
  return {
    colors: [
      { hex: '#1a1a2e', coverage: 38, mood: '深邃' },
      { hex: '#c9a84c', coverage: 24, mood: '奢华' },
      { hex: '#4a3728', coverage: 19, mood: '沉稳' },
      { hex: '#e8dcc8', coverage: 12, mood: '柔光' },
      { hex: '#2d4a3e', coverage: 7,  mood: '静谧' },
    ],
    lighting: {
      type: 'Rembrandt',
      contrast_ratio: 0.72,
      highlight_center: { x: 0.35, y: 0.28 },
      shadow_center:    { x: 0.68, y: 0.62 },
      description: '单侧硬光，高光落于左侧面颊，暗部占据画面右下三分之二，制造强烈戏剧张力。',
    },
    composition: {
      type: 'rule_of_thirds',
      guidelines: [
        { x1: 0.333, y1: 0, x2: 0.333, y2: 1 },
        { x1: 0.667, y1: 0, x2: 0.667, y2: 1 },
        { x1: 0, y1: 0.333, x2: 1, y2: 0.333 },
        { x1: 0, y1: 0.667, x2: 1, y2: 0.667 },
      ],
      power_points: [
        { x: 0.333, y: 0.333 },
        { x: 0.667, y: 0.333 },
        { x: 0.333, y: 0.667 },
        { x: 0.667, y: 0.667 },
      ],
      description: '主体眼神落于左上黄金交叉点，视线引导向右侧留白，形成张力与呼吸感的平衡。',
    },
    typography: {
      headline_font: 'Playfair Display',
      body_font: 'Inter',
      layout_suggestion: '极简留白',
      dummy_headline: 'THE SILENT ECHO',
      dummy_subline: 'A Portrait in Solitude',
      color_on_image: 'rgba(232, 220, 200, 0.92)',
    },
  };
}

/**
 * @param {File} imageFile
 * @returns {Promise<DeconstructResult>}
 */
export async function analyzeAestheticsDeconstruct(imageFile) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${API_BASE}/api/ai/analyze-aesthetics`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('lumina_token') || ''}` },
      body: formData,
    });

    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.message || '今日试镜次数已达上限');
      err.code = 'QUOTA_EXCEEDED';
      throw err;
    }

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.colors || !data.lighting || !data.composition || !data.typography) {
      throw new Error('incomplete response');
    }
    return data;
  } catch (err) {
    if (err.code === 'QUOTA_EXCEEDED') throw err; // 向上传递，不 fallback
    // 其他错误（网络、后端未实现）降级到 mock
    return buildMockResult(null);
  }
}
