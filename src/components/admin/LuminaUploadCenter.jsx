import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';

const LuminaUploadCenter = ({ orderNo, onComplete, onCancel }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const processAndUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    const uploadResults = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 1. 客户端双轨压缩 (原图+缩略图)
        const [origFile, thumbFile] = await Promise.all([
          imageCompression(file, { maxSizeMB: 8, maxWidthOrHeight: 4096, useWebWorker: true }),
          imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1080, useWebWorker: true })
        ]);

        const timestamp = Date.now();
        const pathPrefix = `orders/${orderNo}/${timestamp}_${file.name}`;
        
        // 2. 直传 Supabase Storage
        const [origRes, thumbRes] = await Promise.all([
          supabase.storage.from('lumina').upload(`${pathPrefix}_orig.jpg`, origFile),
          supabase.storage.from('lumina').upload(`${pathPrefix}_thumb.jpg`, thumbFile)
        ]);

        if (origRes.error || thumbRes.error) throw new Error('Storage upload failed');

        uploadResults.push({
          file_name: file.name,
          original_url: supabase.storage.from('lumina').getPublicUrl(origRes.data.path).data.publicUrl,
          thumb_url: supabase.storage.from('lumina').getPublicUrl(thumbRes.data.path).data.publicUrl
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // 3. 同步至后端 MySQL (注意：需在 .env 中配置 VITE_LUMINA_API)
      const response = await fetch(`${import.meta.env.VITE_LUMINA_API}/api/orders/batch-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_no: orderNo, assets: uploadResults })
      });

      if (response.ok) {
        onComplete?.();
      }
    } catch (err) {
      console.error(err);
      alert('上传过程出错，请检查网络或控制台');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#222] p-8 rounded-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white font-label tracking-[0.3em] uppercase text-sm">Upload Center // {orderNo}</h2>
          {!uploading && (
            <button onClick={onCancel} className="text-[#666] hover:text-white transition-colors">✕</button>
          )}
        </div>
        
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if(!uploading) setFiles(Array.from(e.dataTransfer.files));
          }}
          className="border border-dashed border-[#333] hover:border-white/30 transition-all py-16 text-center group"
          onClick={() => !uploading && document.getElementById('file-input').click()}
        >
          <input id="file-input" type="file" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files))} />
          <p className="text-[#555] group-hover:text-[#888] font-lab-body text-sm uppercase tracking-widest">
            {files.length > 0 ? `Selected ${files.length} Files` : 'Drop Raw Files Here'}
          </p>
        </div>

        {uploading && (
          <div className="mt-8">
            <div className="h-[2px] w-full bg-[#111]">
              <motion.div className="h-full bg-white" animate={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase tracking-[0.2em]">Syncing to cloud & database: {progress}%</p>
          </div>
        )}

        <div className="flex gap-4 mt-10">
          <button
            disabled={!files.length || uploading}
            onClick={processAndUpload}
            className="flex-1 py-4 bg-white text-black font-label text-[10px] tracking-[0.2em] uppercase hover:bg-[#ddd] disabled:opacity-20 transition-all"
          >
            {uploading ? 'Processing...' : 'Start Production'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LuminaUploadCenter;