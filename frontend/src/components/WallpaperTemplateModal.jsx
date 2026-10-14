import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Check,
  Sparkles,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import {
  WALLPAPER_CATEGORIES,
  WALLPAPER_TEMPLATES,
  searchTemplates,
} from '../data/wallpaperTemplates';

export default function WallpaperTemplateModal({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
  customDimensions,
  onApplyCustomDimensions,
}) {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // State untuk form ukuran kustom
  const [customWidth, setCustomWidth] = useState(
    selectedTemplate?.width || customDimensions?.width || 1920
  );
  const [customHeight, setCustomHeight] = useState(
    selectedTemplate?.height || customDimensions?.height || 1080
  );

  // Sinkronkan customWidth dan customHeight saat modal dibuka (isOpen menjadi true)
  useEffect(() => {
    if (isOpen) {
      setCustomWidth(selectedTemplate?.width || customDimensions?.width || 1920);
      setCustomHeight(selectedTemplate?.height || customDimensions?.height || 1080);
    }
  }, [isOpen, customDimensions, selectedTemplate]);

  // Filter template berdasarkan pencarian dan kategori
  const filteredTemplates = useMemo(() => {
    return searchTemplates(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  // Ikon helper berdasarkan kategori
  const getCategoryIcon = (cat) => {
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

  // Tangani simpan ukuran kustom
  const handleSaveCustom = (e) => {
    e.preventDefault();
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (!w || !h || w <= 0 || h <= 0) return;

    // Hitung perkiraan rasio aspek
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(w, h);
    const ratioStr = `${Math.round(w / divisor)}:${Math.round(h / divisor)}`;

    const customTemplate = {
      id: `custom-${w}x${h}`,
      category: w > h ? 'desktop' : 'phone',
      brand: 'Kustom',
      model: `Ukuran Bebas (${w} × ${h})`,
      width: w,
      height: h,
      aspectRatio: ratioStr.length < 8 ? ratioStr : 'Kustom',
      isDefault: false,
      isCustom: true,
      tags: ['custom', 'kustom', 'bebas'],
    };

    if (onApplyCustomDimensions) {
      onApplyCustomDimensions({ width: w, height: h });
    }
    if (onSelectTemplate) {
      onSelectTemplate(customTemplate);
    }
    onClose();
  };

  // Preset rasio cepat untuk mempermudah Mas Bima
  const handleQuickRatio = (ratio, defaultW, defaultH) => {
    setCustomWidth(defaultW);
    setCustomHeight(defaultH);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0E18]/95 border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-100"
      >
        {/* 1. HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0E1320]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Template Ukuran Layar Device
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Semua Merek
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih ukuran layar bawaan perangkat atau atur ukuran bebas (custom) sendiri.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-600/80 text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/5"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. TAB NAVIGASI UTAMA (KATALOG TEMPLATE VS UKURAN BEBAS) */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-white/[0.06] bg-[#0C101B]">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Katalog Template ({WALLPAPER_TEMPLATES.length} Device)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 border border-purple-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Ukuran Bebas / Kustom (Custom Size)</span>
          </button>
        </div>

        {/* 3. KONTEN TAB: KATALOG TEMPLATE */}
        {activeTab === 'templates' && (
          <div className="flex flex-col flex-1 overflow-hidden p-6 gap-4 min-h-0">
            {/* BILAH PENCARIAN & FILTER KATEGORI */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Kotak Pencarian Pintar (Search Engine) */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari merek, tipe, resolusi (contoh: iPhone 16, S24, MacBook, Ultrawide, 4K)..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#141A29]/90 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Kategori Cepat */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {WALLPAPER_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const Icon = getCategoryIcon(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                          : 'bg-[#131927]/60 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DAFTAR GRID KARTU TEMPLATE */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-2 min-h-0 custom-scrollbar">
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredTemplates.map((t) => {
                    const isSelected = selectedTemplate?.id === t.id;
                    const Icon = getCategoryIcon(t.category);
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTemplate(t);
                          onClose();
                        }}
                        className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                            : 'bg-[#111726]/75 hover:bg-[#161F33]/90 border-white/[0.07] hover:border-white/20'
                        }`}
                      >
                        <div>
                          {/* Baris Atas: Merek & Badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 group-hover:text-slate-300">
                              <Icon className="w-3.5 h-3.5 text-cyan-400" />
                              {t.brand}
                            </span>
                            <div className="flex items-center gap-1">
                              {t.isDefault && (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider">
                                  Standar
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-300 text-[10px] font-mono">
                                {t.aspectRatio}
                              </span>
                            </div>
                          </div>

                          {/* Nama Model */}
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                            {t.model}
                          </h4>
                        </div>

                        {/* Baris Bawah: Dimensi Piksel & Tombol Pilih */}
                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.05]">
                          <span className="text-xs font-mono font-bold text-cyan-300">
                            {t.width} × {t.height} px
                          </span>

                          <button
                            type="button"
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 flex items-center gap-1 shadow-md'
                                : 'bg-white/[0.06] group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-200'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              'Pilih'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                  <Search className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">
                    Tidak ditemukan template untuk "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Coba kata kunci lain atau gunakan tab "Ukuran Bebas" untuk mengetik piksel sendiri.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. KONTEN TAB: UKURAN BEBAS (CUSTOM SIZE) */}
        {activeTab === 'custom' && (
          <div className="flex flex-col flex-1 overflow-y-auto p-6 gap-6 min-h-0">
            <div className="max-w-2xl mx-auto w-full space-y-6">
              {/* Penjelasan Ringkas */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0F1424] border border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Kustomisasi Dimensi Bebas Sesuai Kebutuhan Mas Bima</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Ketik ukuran lebar dan tinggi layar dalam satuan piksel (px). Sistem akan menyesuaikan kanvas dan komposisi wallpaper dengan rasio persis tersebut.
                </p>
              </div>

              {/* Form Input Lebar x Tinggi */}
              <form onSubmit={handleSaveCustom} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kolom Lebar */}
                  <div className="p-4 rounded-2xl bg-[#121828] border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Lebar Layar (Width)</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Piksel (px)</span>
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="10000"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#090D18] border border-white/15 text-lg font-mono font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </div>

                  {/* Kolom Tinggi */}
                  <div className="p-4 rounded-2xl bg-[#121828] border border-white/10 space-y-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Tinggi Layar (Height)</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Piksel (px)</span>
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="10000"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[#090D18] border border-white/15 text-lg font-mono font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
                    />
                  </div>
                </div>

                {/* Pintasan Rasio Aspek Cepat */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400">
                    Pintasan Rasio Aspek Populer:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '16:9 PC / Laptop (1920 × 1080)', w: 1920, h: 1080 },
                      { label: '16:10 Modern (2560 × 1600)', w: 2560, h: 1600 },
                      { label: '4K UHD (3840 × 2160)', w: 3840, h: 2160 },
                      { label: '9:16 HP Modern (1080 × 2400)', w: 1080, h: 2400 },
                      { label: '19.5:9 Flagship (1440 × 3120)', w: 1440, h: 3120 },
                      { label: '21:9 Ultrawide (3440 × 1440)', w: 3440, h: 1440 },
                      { label: '32:9 Super Ultrawide (5120 × 1440)', w: 5120, h: 1440 },
                      { label: '3:4 Tablet (2048 × 2732)', w: 2048, h: 2732 },
                      { label: '1:1 Persegi (2048 × 2048)', w: 2048, h: 2048 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleQuickRatio(preset.label, preset.w, preset.h)}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tombol Simpan & Terapkan */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 cursor-pointer border border-white/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Ukuran Kustom ({customWidth} × {customHeight} px)</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. FOOTER INFO */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-[#090D17] flex items-center justify-between text-xs text-slate-400">
          <span>
            Template Aktif Saat Ini:{' '}
            <strong className="text-cyan-300 font-mono">
              {selectedTemplate ? `${selectedTemplate.model} (${selectedTemplate.width} × ${selectedTemplate.height} px)` : 'Belum dipilih'}
            </strong>
          </span>
          <span className="text-[11px] text-slate-500">
            Element Maker Studio Wallpaper
          </span>
        </div>
      </div>
    </div>
  );
}
