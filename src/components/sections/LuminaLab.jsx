import { useState, useEffect, useRef } from 'react';

const SCAN_LABELS = [
  "Analyzing Golden Ratio...",
  "Detecting Rembrandt Lighting...",
  "Measuring Emotional Contrast...",
  "Mapping Tonal Architecture...",
  "Computing Narrative Depth...",
];

export function LuminaLab({ onSetView }) {
  const [phase, setPhase] = useState('idle');
  const [imageData, setImageData] = useState(null);
  const [scanIndex, setScanIndex] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageData(e.target.result);
      setPhase('analyzing');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const id = setInterval(() => setScanIndex(i => (i + 1) % SCAN_LABELS.length), 600);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const id = setTimeout(() => onSetView('lumina-report', { imageData }), 3000);
    return () => clearTimeout(id);
  }, [phase]);

  return (
    <div className="bg-black py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif tracking-[0.25em] uppercase text-white text-5xl md:text-6xl font-light mb-4">
          Lumina Lab
        </h2>
        <p className="text-gray-500 text-sm tracking-widest uppercase mb-12">
          Upload a photo to analyze its cinematic DNA. Composition, Light, and Narrative Score.
        </p>

        {phase === 'idle' && (
          <>
            <div
              className="border border-dashed border-gray-700 rounded-sm p-16 text-center cursor-pointer transition-all duration-300 hover:border-[#00e5ff]/40 hover:shadow-[0_0_30px_rgba(0,229,255,0.08)]"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-gray-600 text-xs tracking-[0.2em] uppercase">
                Drag &amp; Drop — or Click to Upload
              </p>
              <p className="text-gray-700 mt-3 text-lg">↑</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </>
        )}

        {phase === 'analyzing' && (
          <>
            <style>{`
              @keyframes laserScan {
                0% { top: 0%; }
                100% { top: 100%; }
              }
            `}</style>
            <div className="relative max-h-[50vh] overflow-hidden">
              <img
                src={imageData}
                alt="Analyzing"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent"
                style={{ animation: 'laserScan 1.5s linear infinite' }}
              />
            </div>
            <p className="text-[#00e5ff] text-xs tracking-[0.2em] uppercase mt-6 font-mono">
              {SCAN_LABELS[scanIndex]}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
