import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  X,
  Wand2,
  ImagePlus,
  Image as ImageIcon,
  SlidersHorizontal,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Layers,
  Type,
  Box,
  FolderArchive,
  Plus,
} from 'lucide-react';
import { optimizePrompt } from '../services/api';
import WallpaperTemplateModal from './WallpaperTemplateModal';

export default function Sidebar({
  activeTab = 'objects',
  onSelectTab,

  // Props Mode Objek Grafis
  prompt = '',
  onChangePrompt,
  mode = 'no_bg',
  onChangeMode,
  customBg = '',
  onChangeCustomBg,
  color = '#FFFFFF',
  onChangeColor,
  glassMode = false,
  onToggleGlassMode,
  onSubmitObject,

  // Props Mode Wallpaper
  wallpaperPrompt = '',
  onChangeWallpaperPrompt,
  selectedWallpaperTemplate,
  onSelectWallpaperTemplate,
  customWallpaperDimensions,
  onApplyCustomWallpaperDimensions,
  onSubmitWallpaper,

  // Props Mode Tipografi 3D
  typographyText = '',
  onChangeTypographyText,
  onSubmitTypography,

  // Props Bersama
  isLoading = false,
  config = {},
  onShowToast,
  referenceImage = null,
  referenceSimilarity = 80,
  onSelectReferenceImage,
  elementsCount = 0,
  onAddNewElement,
}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Helper ikon device untuk wallpaper
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

  const DeviceIcon = getDeviceIcon(selectedWallpaperTemplate?.category);

  // Tangani Shortcut Enter pada Textarea (Enter biasa = submit, Shift+Enter = baris baru)
  const handleKeyDown = (e, submitFn, textVal) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isOptimizing && textVal && textVal.trim()) {
        submitFn();
      }
    }
  };

  // Tangani Tempel Gambar Reference via Clipboard
  const handlePasteReference = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (onSelectReferenceImage) {
              onSelectReferenceImage(ev.target.result);
              if (onShowToast) onShowToast('Gambar inspirasi dipasang dari clipboard!', 'success');
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Tangani Unggah Gambar Reference lewat File Browser
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (onSelectReferenceImage) {
        onSelectReferenceImage(ev.target.result);
        if (onShowToast) onShowToast('Gambar inspirasi berhasil dipasang!', 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Pembersih anti-fotografi untuk Tipografi 3D
  const sanitizeTypographyPrompt = (optimizedText, originalText) => {
    let cleaned = optimizedText || originalText;
    const photoClichés = [
      /foto\s+profesional/gi,
      /terpotong\s+melayang\s+kualitas\s+studio/gi,
      /terpotong\s+melayang/gi,
      /kualitas\s+studio/gi,
      /tekstur\s+fotorealistis\s+sangat\s+tajam/gi,
      /tekstur\s+fotorealistis/gi,
      /fotorealistis/gi,
      /pencahayaan\s+studio\s+terarah/gi,
      /elemen\s+grafis\s+terisolasi\s+sempurna/gi,
      /terisolasi\s+sempurna/gi,
      /terisolasi\s+rapi\s+siap\s+tempel/gi,
    ];

    let hadClichés = false;
    for (const pattern of photoClichés) {
      if (pattern.test(cleaned)) {
        hadClichés = true;
        cleaned = cleaned.replace(pattern, '').trim();
      }
    }

    cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();

    if (hadClichés || !/3d|timbul|bevel/i.test(cleaned)) {
      const lower = cleaned.toLowerCase();
      const materialDetails = [];
      if (/chrome|krom|perak|silver/i.test(lower)) {
        materialDetails.push('finishing logam chrome dengan pantulan kilau mengkilap');
      } else if (/emas|gold/i.test(lower)) {
        materialDetails.push('lapisan emas berkilau mewah dengan bevel elegan');
      } else if (/kayu|wood|ukir/i.test(lower)) {
        materialDetails.push('tekstur serat kayu ukir timbul yang rapi');
      } else if (/kaca|akrilik|glass/i.test(lower)) {
        materialDetails.push('tekstur akrilik glossy dengan kilau jernih');
      } else if (/neon|glow|berpendar/i.test(lower)) {
        materialDetails.push('pendaran neon terang dengan outline cahaya');
      }

      const has3d = /3d|timbul/i.test(lower);
      const lead3d = has3d ? '' : 'huruf timbul 3D tebal proporsional';
      const additions = [
        lead3d,
        'bevel halus dengan pantulan kilau elegan',
        ...materialDetails,
        'garis luar stiker die-cut tegas',
        'bayangan pop-up tipis',
      ].filter(Boolean);

      cleaned = `${cleaned}, ${additions.join(', ')}`;
    }

    return cleaned;
  };

  // Optimasi Prompt Cerdas Sesuai Mode Aktif (Mendukung AI Vision jika ada gambar referensi)
  const handleOptimizeCurrent = async () => {
    if (activeTab === 'wallpaper') {
      const raw = wallpaperPrompt.trim();
      if (!raw) {
        if (onShowToast) onShowToast('Ketik ide wallpaper terlebih dahulu.', 'warning');
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
          onChangeWallpaperPrompt(res.optimized_prompt);
          if (onShowToast) {
            const via = res.model_used ? ` (via ${res.model_used})` : '';
            const refMsg = res.reference_analysis ? ' selaras gambar referensi' : '';
            onShowToast(`Perintah wallpaper berhasil dioptimalkan${refMsg}${via}!`, 'success');
          }
        }
      } catch (err) {
        if (onShowToast) onShowToast(err.message || 'Gagal optimasi prompt wallpaper', 'error');
      } finally {
        setIsOptimizing(false);
      }
    } else if (activeTab === 'typography') {
      const raw = typographyText.trim();
      if (!raw) {
        if (onShowToast) onShowToast('Ketik instruksi teks 3D terlebih dahulu.', 'warning');
        return;
      }
      setIsOptimizing(true);
      try {
        const res = await optimizePrompt({
          prompt: raw,
          model: config.model || '',
          optimizer_model: config.optimizerModel || '',
          base_url: config.baseUrl || 'http://localhost:20128/v1',
          api_key: config.apiKey || '',
          mode: 'no_bg',
          is_typography: true,
          reference_image: referenceImage || '',
          reference_similarity: referenceSimilarity || 80,
        });
        const sanitized = sanitizeTypographyPrompt(res?.optimized_prompt || raw, raw);
        onChangeTypographyText(sanitized);
        if (onShowToast) onShowToast('Instruksi 3D berhasil diperkaya secara adaptif!', 'success');
      } catch (err) {
        const sanitized = sanitizeTypographyPrompt(raw, raw);
        onChangeTypographyText(sanitized);
        if (onShowToast) onShowToast('Instruksi 3D disempurnakan!', 'success');
      } finally {
        setIsOptimizing(false);
      }
    } else {
      // Objek Grafis
      const raw = prompt.trim();
      if (!raw) {
        if (onShowToast) onShowToast('Ketik ide elemen terlebih dahulu untuk dioptimalkan.', 'warning');
        return;
      }
      setIsOptimizing(true);
      if (onShowToast) {
        if (referenceImage) {
          onShowToast('Menganalisis gambar referensi via AI Vision & mengoptimalkan prompt...', 'info');
        } else {
          onShowToast('Mengoptimalkan deskripsi visual elemen...', 'info');
        }
      }
      try {
        const res = await optimizePrompt({
          prompt: raw,
          model: config.model || '',
          optimizer_model: config.optimizerModel || '',
          base_url: config.baseUrl || 'http://localhost:20128/v1',
          api_key: config.apiKey || '',
          mode,
          color,
          custom_bg: customBg,
          glass_mode: glassMode,
          is_typography: false,
          reference_image: referenceImage || '',
          reference_similarity: referenceSimilarity || 80,
        });
        if (res && res.optimized_prompt) {
          onChangePrompt(res.optimized_prompt);
          if (onShowToast) {
            const via = res.model_used ? ` (via ${res.model_used})` : '';
            const refMsg = res.reference_analysis ? ' selaras gambar referensi' : ' secara adaptif';
            onShowToast(`Perintah elemen berhasil dioptimalkan${refMsg}${via}!`, 'success');
          }
        }
      } catch (err) {
        // Fallback adaptif lokal
        const p = raw.toLowerCase();
        let bgTail = 'terisolasi rapi siap tempel';
        if (mode === 'plain_bg') bgTail = `dengan latar polos warna ${color} yang bersih`;
        else if (mode === 'custom_bg' && customBg.trim()) bgTail = `dengan latar ${customBg.trim()} yang menyatu alami`;
        else if (glassMode) bgTail = 'terisolasi dengan transparansi kaca alami';

        let details = 'tekstur dan detail bahan tajam, pencahayaan studio terarah';
        if (/kursi|sofa|meja|lemari|rak|furniture|interior/.test(p)) {
          details = 'serat tekstur bahan nyata, proporsi ergonomis, studio lighting interior';
        } else if (/burger|pizza|kopi|teh|makanan|roti|mie|ayam|buah/.test(p)) {
          details = 'kesegaran bahan menggugah, pencahayaan hangat studio kuliner';
        }
        onChangePrompt(`${raw}, ${details}, ${bgTail}`);
        if (onShowToast) onShowToast('Perintah disempurnakan secara adaptif!', 'success');
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  return (
    <aside className="w-80 sm:w-84 md:w-88 lg:w-92 flex-shrink-0 glass-panel border-y-0 border-l-0 border-r border-white/[0.07] flex flex-col justify-between p-4 select-none z-30 overflow-y-auto custom-scrollbar transition-all bg-[#080C16]/95">
      {/* ============================================================== */}
      {/* 1. MODE OBJEK GRAFIS                                           */}
      {/* ============================================================== */}
      {activeTab === 'objects' && (
        <div className="flex flex-col gap-4">
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">Pusat Kendali Elemen</h3>
                <p className="text-[10px] text-slate-400">Kreasi objek poster terpotong bersih</p>
              </div>
            </div>
          </div>

          {/* Bagian A: Pilihan Mode Latar Belakang */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-1">
              Pilihan Mode Latar
            </span>

            {/* Kartu 1: Tanpa Latar (No BG) */}
            <div
              onClick={() => !isLoading && onChangeMode && onChangeMode('no_bg')}
              className={`p-2.5 rounded-2xl cursor-pointer transition-all border ${
                mode === 'no_bg'
                  ? 'active-mode-card shadow-lg shadow-blue-500/15 scale-[1.01]'
                  : 'glass-soft hover:bg-[#141C30]/60 hover:border-slate-500 border-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl border border-white/[0.1] bg-transparency-light flex-shrink-0 shadow-inner" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white tracking-tight">Tanpa Latar (No BG)</h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      {glassMode ? 'Transparansi kaca/air' : 'Potong bersih otomatis'}
                    </p>
                  </div>
                </div>

                {/* Tombol Kaca / Air */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleGlassMode) onToggleGlassMode();
                  }}
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border transition-all flex-shrink-0 cursor-pointer ${
                    glassMode
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 ring-1 ring-cyan-400/40 shadow-sm'
                      : 'bg-[#0B101D] text-slate-400 border-white/[0.08] hover:text-cyan-300'
                  }`}
                  title="Alpha matting khusus benda tembus pandang (gelas kaca, air, kristal)"
                >
                  💧 {glassMode ? 'Kaca Aktif' : 'Kaca/Air'}
                </button>
              </div>
            </div>

            {/* Kartu 2: Latar Polos */}
            <div
              onClick={() => !isLoading && onChangeMode && onChangeMode('plain_bg')}
              className={`p-2.5 rounded-2xl cursor-pointer transition-all border ${
                mode === 'plain_bg'
                  ? 'active-mode-card shadow-lg shadow-blue-500/15 scale-[1.01]'
                  : 'glass-soft hover:bg-[#141C30]/60 hover:border-slate-500 border-white/[0.05]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl border border-white/[0.2] flex-shrink-0 shadow-inner transition-colors"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white tracking-tight">Latar Polos</h4>
                    <p className="text-[10px] text-slate-400 truncate">Warna solid pilihan</p>
                  </div>
                </div>

                {/* Color Picker Swatch */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white/70 shadow-md cursor-pointer overflow-hidden transition-transform hover:scale-110"
                    style={{
                      background:
                        'conic-gradient(from 90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff0080, #ff0000)',
                    }}
                    title="Pilih warna latar"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        if (onChangeColor) onChangeColor(e.target.value);
                        if (mode !== 'plain_bg' && onChangeMode) onChangeMode('plain_bg');
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kartu 3: Latar Kustom */}
            <div
              onClick={() => !isLoading && onChangeMode && onChangeMode('custom_bg')}
              className={`p-2.5 rounded-2xl cursor-pointer transition-all border ${
                mode === 'custom_bg'
                  ? 'active-mode-card shadow-lg shadow-blue-500/15 scale-[1.01]'
                  : 'glass-soft hover:bg-[#141C30]/60 hover:border-slate-500 border-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 mb-1.5">
                <div className="w-8 h-8 rounded-xl border border-white/[0.08] bg-[#141C2E] flex items-center justify-center flex-shrink-0 text-slate-300">
                  <ImageIcon className="w-4 h-4 text-slate-200" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white tracking-tight">Latar Kustom</h4>
                  <p className="text-[10px] text-slate-400 truncate">Suasana latar khusus</p>
                </div>
              </div>
              <input
                type="text"
                value={customBg}
                onChange={(e) => {
                  if (onChangeCustomBg) onChangeCustomBg(e.target.value);
                  if (mode !== 'custom_bg' && onChangeMode) onChangeMode('custom_bg');
                }}
                placeholder="Contoh: di atas meja kayu studio..."
                onClick={(e) => e.stopPropagation()}
                disabled={isLoading}
                className="w-full bg-[#0A0F1A]/90 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-blue-400 transition-all font-medium"
              />
            </div>
          </div>

          {/* Bagian B: Kolom Pengetikan Prompt Elemen */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Instruksi Objek
              </span>
              {prompt && (
                <button
                  type="button"
                  onClick={() => onChangePrompt && onChangePrompt('')}
                  className="text-[10px] text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="relative rounded-2xl bg-[#090D1A]/90 border border-white/[0.08] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner p-3 flex flex-col">
              <textarea
                rows={7}
                value={prompt}
                onChange={(e) => onChangePrompt && onChangePrompt(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, onSubmitObject, prompt)}
                onPaste={handlePasteReference}
                disabled={isLoading || isOptimizing}
                placeholder={
                  referenceImage
                    ? 'Ketik arahan elemen dengan panduan foto Reference... (contoh: buat kursi warna abu-abu)'
                    : 'Ketik elemen poster yang ingin kamu buat... (contoh: foto burger lezat terpotong keju lumer, pita emas mewah)'
                }
                className="w-full min-h-[150px] sm:min-h-[180px] bg-transparent resize-none outline-none text-xs sm:text-sm text-white placeholder-slate-500 leading-relaxed font-medium"
              />

              {/* Bilah Baris Bawah Textarea */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                    referenceImage
                      ? 'bg-purple-600/30 text-purple-200 border-purple-400/40'
                      : 'bg-[#121927] hover:bg-purple-950/50 text-slate-400 hover:text-purple-300 border-white/[0.06]'
                  }`}
                  title="Pasang foto inspirasi (Reference)"
                >
                  <ImagePlus className="w-3 h-3 text-purple-400" />
                  <span>{referenceImage ? 'Foto Terpasang' : '+ Foto Ref'}</span>
                </button>

                <span className="text-[10px] text-slate-500 font-mono">
                  {prompt.length} karakter
                </span>
              </div>
            </div>
          </div>

          {/* Bagian C: Tombol Aksi (Optimalkan & Buat Elemen) */}
          <div className="space-y-2 pt-1">
            {/* Tombol Optimalkan */}
            <button
              type="button"
              onClick={handleOptimizeCurrent}
              disabled={isOptimizing || isLoading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/30 via-fuchsia-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-400/40 text-purple-200 font-bold text-xs shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                  <span>Mengoptimalkan...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                  <span>Optimalkan Perintah ✨</span>
                </>
              )}
            </button>

            {/* Tombol Buat Elemen Utama */}
            <button
              type="button"
              onClick={onSubmitObject}
              disabled={isLoading || isOptimizing || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-500 hover:via-indigo-500 hover:to-fuchsia-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-indigo-600/30 border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Membuat Elemen...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white fill-white/20" />
                  <span>Buat Elemen</span>
                </>
              )}
            </button>
            <div className="text-center text-[10px] text-slate-500 font-mono">
              Pintasan: Ctrl + Enter
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MODE WALLPAPER & BACKGROUND                                 */}
      {/* ============================================================== */}
      {activeTab === 'wallpaper' && (
        <div className="flex flex-col gap-4">
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">Pusat Kendali Wallpaper</h3>
                <p className="text-[10px] text-slate-400">Semua layar komputer, laptop & HP</p>
              </div>
            </div>
          </div>

          {/* Bagian A: Kartu Target Layar Aktif */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-300 px-1">
              Target Layar Perangkat
            </span>

            <div className="p-3 rounded-2xl glass-panel border border-cyan-500/30 bg-[#0A0F1D]/80 shadow-lg space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.25)]">
                  <DeviceIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {selectedWallpaperTemplate?.brand ? `${selectedWallpaperTemplate.brand} - ` : ''}
                    {selectedWallpaperTemplate?.model || 'Full HD 1080p'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono font-bold text-cyan-300">
                      {selectedWallpaperTemplate?.width || 1920} × {selectedWallpaperTemplate?.height || 1080} px
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({selectedWallpaperTemplate?.aspectRatio || '16:9'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol Ganti Ukuran / Device */}
              <button
                type="button"
                onClick={() => setIsWallpaperModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Ganti Ukuran / Device</span>
              </button>
            </div>
          </div>

          {/* Bagian B: Kolom Pengetikan Prompt Wallpaper */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Suasana Wallpaper
              </span>
              {wallpaperPrompt && (
                <button
                  type="button"
                  onClick={() => onChangeWallpaperPrompt && onChangeWallpaperPrompt('')}
                  className="text-[10px] text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl bg-[#090D1A]/90 border border-white/[0.08] focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all shadow-inner p-3 flex flex-col">
              <textarea
                rows={11}
                value={wallpaperPrompt}
                onChange={(e) => onChangeWallpaperPrompt && onChangeWallpaperPrompt(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, onSubmitWallpaper, wallpaperPrompt)}
                onPaste={handlePasteReference}
                disabled={isLoading || isOptimizing}
                placeholder="Ketik ide wallpaper (contoh: pemandangan hutan pinus berkabut dengan danau cermin tenang, pegunungan cyberpunk neon malam hari)..."
                className="w-full min-h-[230px] sm:min-h-[260px] bg-transparent resize-none outline-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 leading-relaxed font-medium"
              />

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-2 text-[10px] text-slate-500 font-mono">
                <span>Rasio: {selectedWallpaperTemplate?.aspectRatio || '16:9'}</span>
                <span>{wallpaperPrompt.length} karakter</span>
              </div>
            </div>
          </div>

          {/* Bagian C: Tombol Aksi */}
          <div className="space-y-2 pt-1">
            {/* Tombol Optimalkan Wallpaper */}
            <button
              type="button"
              onClick={handleOptimizeCurrent}
              disabled={isOptimizing || isLoading || !wallpaperPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/40 text-purple-200 font-bold text-xs shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                  <span>Mengoptimalkan...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                  <span>Optimalkan Wallpaper ✨</span>
                </>
              )}
            </button>

            {/* Tombol Buat Wallpaper Utama */}
            <button
              type="button"
              onClick={onSubmitWallpaper}
              disabled={isLoading || isOptimizing || !wallpaperPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-600/30 border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Membuat Wallpaper...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Buat Wallpaper</span>
                </>
              )}
            </button>
            <div className="text-center text-[10px] text-slate-500 font-mono">
              Pintasan: Ctrl + Enter
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MODE TIPOGRAFI 3D                                           */}
      {/* ============================================================== */}
      {activeTab === 'typography' && (
        <div className="flex flex-col gap-4">
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">Pusat Tipografi 3D</h3>
                <p className="text-[10px] text-slate-400">Teks timbul pop-up stiker bebas</p>
              </div>
            </div>
          </div>

          {/* Panduan Singkat */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-[11px] text-amber-200/90 leading-relaxed font-normal">
            💡 Ketik kata/kalimat bebas, tentukan warna, bahan (emas, kayu ukir, neon, akrilik), atau garis luar stiker tanpa batasan template.
          </div>

          {/* Kolom Pengetikan Instruksi Tipografi 3D */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Instruksi Tulisan 3D
              </span>
              {typographyText && (
                <button
                  type="button"
                  onClick={() => onChangeTypographyText && onChangeTypographyText('')}
                  className="text-[10px] text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl bg-[#090D1A]/90 border border-white/[0.08] focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all shadow-inner p-3 flex flex-col">
              <textarea
                rows={11}
                value={typographyText}
                onChange={(e) => onChangeTypographyText && onChangeTypographyText(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, onSubmitTypography, typographyText)}
                disabled={isLoading || isOptimizing}
                placeholder="Ketik instruksi teks 3D bebas... (contoh: huruf 3D timbul warna biru navy dengan outline biru muda ber teks 'Iki Jeporo LET')"
                className="w-full min-h-[230px] sm:min-h-[260px] bg-transparent resize-none outline-none text-xs sm:text-sm text-white placeholder-slate-500 leading-relaxed font-medium"
              />

              <div className="text-right pt-2 border-t border-white/[0.04] mt-2 text-[10px] text-slate-500 font-mono">
                {typographyText.length} karakter
              </div>
            </div>
          </div>

          {/* Tombol Aksi Tipografi 3D */}
          <div className="space-y-2 pt-1">
            {/* Tombol Optimalkan Tipografi */}
            <button
              type="button"
              onClick={handleOptimizeCurrent}
              disabled={isOptimizing || isLoading || !typographyText.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-400/30 text-amber-300 font-bold text-xs shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Mengoptimalkan 3D...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Optimalkan Estetika 3D ✨</span>
                </>
              )}
            </button>

            {/* Tombol Cetak 3D Utama */}
            <button
              type="button"
              onClick={onSubmitTypography}
              disabled={isLoading || isOptimizing || !typographyText.trim()}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-amber-600/30 border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Mencetak 3D...</span>
                </>
              ) : (
                <>
                  <Type className="w-4 h-4 text-white" />
                  <span>Cetak 3D</span>
                </>
              )}
            </button>
            <div className="text-center text-[10px] text-slate-500 font-mono">
              Pintasan: Ctrl + Enter
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODE LACI KOLEKSI                                           */}
      {/* ============================================================== */}
      {activeTab === 'collection' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide">Inventaris Koleksi</h3>
              <p className="text-[10px] text-slate-400">Total {elementsCount} aset tersimpan</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-soft space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh karya tersimpan di inventaris lokal. Klik salah satu aset di galeri tengah untuk membuka kembali di meja kanvas.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onAddNewElement) onAddNewElement();
                if (onSelectTab) onSelectTab('objects');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Elemen Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog Pemilih Template Layar Device (Jika Mode Wallpaper) */}
      <WallpaperTemplateModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        selectedTemplate={selectedWallpaperTemplate}
        onSelectTemplate={onSelectWallpaperTemplate}
        customDimensions={customWallpaperDimensions}
        onApplyCustomDimensions={onApplyCustomWallpaperDimensions}
      />
    </aside>
  );
}
