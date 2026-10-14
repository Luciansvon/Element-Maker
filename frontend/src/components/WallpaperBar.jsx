import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  X,
  Wand2,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { optimizePrompt } from '../services/api';
import WallpaperTemplateModal from './WallpaperTemplateModal';

export default function WallpaperBar({
  prompt = '',
  onChangePrompt,
  selectedTemplate,
  onSelectTemplate,
  customDimensions,
  onApplyCustomDimensions,
  onSubmit,
  isLoading = false,
  config = {},
  onShowToast,
  referenceImage = null,
  referenceSimilarity = 80,
}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && prompt.trim()) {
        onSubmit();
      }
    }
  };

  // Ikon helper
  const getDeviceIcon = (cat) => {
    switch (cat) {
      case 'phone':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'desktop':
        return Monitor;
      case 'ultrawide':
        return Maximize2;
      default:
        return Layers;
    }
  };

  const DeviceIcon = getDeviceIcon(selectedTemplate?.category);

  // Optimalkan Prompt Khusus Wallpaper (didukung AI Vision jika ada gambar referensi)
  const handleOptimize = async () => {
    const raw = prompt.trim();
    if (!raw) {
      if (onShowToast) onShowToast('Ketik ide wallpaper terlebih dahulu sebelum dioptimalkan.', 'info');
      return;
    }

    setIsOptimizing(true);
    if (onShowToast) {
      if (referenceImage) {
        onShowToast('Menganalisis gambar referensi via AI Vision & mengoptimalkan wallpaper...', 'info');
      } else {
        onShowToast('Mengoptimalkan deskripsi visual wallpaper...', 'info');
      }
    }

    try {
      const res = await optimizePrompt({
        prompt: raw,
        mode: 'wallpaper',
        model: config.model,
        optimizer_model: config.optimizerModel,
        base_url: config.baseUrl,
        api_key: config.apiKey,
        reference_image: referenceImage || '',
        reference_similarity: referenceSimilarity || 80,
      });

      if (res && res.optimized_prompt) {
        onChangePrompt(res.optimized_prompt);
        if (onShowToast) {
          const via = res.model_used ? ` (via ${res.model_used})` : '';
          const refMsg = res.reference_analysis ? ' selaras gambar referensi' : '';
          onShowToast(`Perintah wallpaper berhasil dioptimalkan${refMsg}${via}!`, 'success');
        }
      }
    } catch (err) {
      console.error('Gagal optimasi prompt wallpaper:', err);
      if (onShowToast) onShowToast(err.message || 'Gagal mengoptimalkan prompt', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-2 select-none">
        {/* BARIS 1: PEMILIH TEMPLATE & UKURAN LAYAR AKTIF */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl glass-panel border border-cyan-500/25 shadow-lg bg-[#0A0F1D]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <DeviceIcon className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-300 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
                Target Layar
              </span>
              <span className="text-xs font-bold text-white truncate">
                {selectedTemplate?.brand ? `${selectedTemplate.brand} - ` : ''}
                {selectedTemplate?.model || 'Full HD 1080p'}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 flex-shrink-0">
                {selectedTemplate?.width || 1920} × {selectedTemplate?.height || 1080} px
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
                ({selectedTemplate?.aspectRatio || '16:9'})
              </span>
            </div>
          </div>

          {/* Tombol Ganti Template & Kustom */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              title="Buka katalog template layar semua device atau atur ukuran bebas (custom size)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ganti Ukuran / Device</span>
            </button>
          </div>
        </div>

        {/* BARIS 2: KOLOM INPUT PROMPT WALLPAPER & TOMBOL BUAT */}
        <div className="flex items-center gap-2.5 p-2 rounded-2xl glass-panel border border-white/10 shadow-2xl bg-[#090D1A]/90">
          {/* Kolom Teks Prompt */}
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={prompt}
              onChange={(e) => onChangePrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ketik ide wallpaper (contoh: pemandangan hutan pinus berkabut dengan danau cermin tenang, pegunungan cyberpunk neon malam hari)..."
              className="w-full px-4 py-3 rounded-xl bg-[#121828]/70 border border-white/5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
            />
            {prompt && !isLoading && (
              <button
                type="button"
                onClick={() => onChangePrompt('')}
                className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Hapus teks"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tombol Optimalkan Prompt */}
          <button
            type="button"
            onClick={handleOptimize}
            disabled={isLoading || isOptimizing || !prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/40 text-purple-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer shadow-md flex-shrink-0"
            title="Perkaya deskripsi wallpaper dengan komposisi sinematik, kedalaman ruang, dan resolusi 8K"
          >
            {isOptimizing ? (
              <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
            ) : (
              <Wand2 className="w-4 h-4 text-purple-300" />
            )}
            <span className="hidden sm:inline">Optimalkan</span>
          </button>

          {/* Tombol Buat Wallpaper Utama */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer border border-white/20 flex-shrink-0"
            title="Hasilkan wallpaper berkualitas tinggi sesuai ukuran device yang dipilih (Ctrl + Enter)"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menghasilkan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Buat Wallpaper</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Dialog Pemilih Template Layar Device */}
      <WallpaperTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={onSelectTemplate}
        customDimensions={customDimensions}
        onApplyCustomDimensions={onApplyCustomDimensions}
      />
    </>
  );
}
