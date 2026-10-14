import React, { useState, useRef, useEffect } from 'react';
import {
  Brush,
  Send,
  Loader2,
  Sparkles,
  Spline,
  ChevronDown,
  Wand2,
  Layers,
} from 'lucide-react';

export default function CanvasToolbar({
  bgTestMode = 'checker',
  onChangeBgTestMode,
  isInpainting = false,
  onToggleInpaint,
  brushSize = 32,
  onChangeBrushSize,
  revisionPrompt = '',
  onChangeRevisionPrompt,
  onSubmitRevision,
  isRevising = false,
  isHdActive = false,
  onToggleHd,
  isUpscaling = false,
  hasElement = true,
  isVectorizing = false,
  onVectorize,
}) {
  const [isVectorMenuOpen, setIsVectorMenuOpen] = useState(false);
  const vectorMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (vectorMenuRef.current && !vectorMenuRef.current.contains(e.target)) {
        setIsVectorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleRevisionKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onSubmitRevision) onSubmitRevision();
    }
  };

  return (
    <div className="w-full select-none">
      {/* Bilah Toolbar Glassmorphism Lebar Penuh (W-FULL) */}
      <div className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl glass-soft text-xs text-slate-300">
        
        {/* 1. BAGIAN KIRI: UJI WARNA LATAR (PUTIH, BIRU MUDA, HITAM PERSIS REFERENSI) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-semibold text-slate-300 text-[11px] sm:text-xs whitespace-nowrap">
            Uji Latar:
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Lingkaran 1: Putih Bersih */}
            <button
              type="button"
              onClick={() => onChangeBgTestMode(bgTestMode === 'white' ? 'checker' : 'white')}
              title="Uji Latar Putih Bersih (Klik lagi untuk kembali ke catur transparan)"
              className={`w-6 h-6 rounded-full border-2 bg-white flex-shrink-0 transition-all cursor-pointer ${
                bgTestMode === 'white'
                  ? 'ring-2 ring-offset-2 ring-offset-[#0D1322] ring-blue-400 scale-110 border-white shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                  : 'border-slate-300 hover:scale-105 shadow-sm'
              }`}
            />
            {/* Lingkaran 2: Biru Muda / Cyan Cerah */}
            <button
              type="button"
              onClick={() => onChangeBgTestMode(bgTestMode === 'blue' ? 'checker' : 'blue')}
              title="Uji Latar Biru Muda / Cyan (Klik lagi untuk kembali ke catur transparan)"
              className={`w-6 h-6 rounded-full border-2 bg-[#7DD3FC] flex-shrink-0 transition-all cursor-pointer ${
                bgTestMode === 'blue'
                  ? 'ring-2 ring-offset-2 ring-offset-[#0D1322] ring-cyan-300 scale-110 border-white shadow-[0_0_12px_rgba(125,211,252,0.7)]'
                  : 'border-cyan-200 hover:scale-105 shadow-sm'
              }`}
            />
            {/* Lingkaran 3: Hitam Pekat */}
            <button
              type="button"
              onClick={() => onChangeBgTestMode(bgTestMode === 'black' ? 'checker' : 'black')}
              title="Uji Latar Hitam Pekat (Klik lagi untuk kembali ke catur transparan)"
              className={`w-6 h-6 rounded-full border-2 bg-[#0A0E18] flex-shrink-0 transition-all cursor-pointer ${
                bgTestMode === 'black'
                  ? 'ring-2 ring-offset-2 ring-offset-[#0D1322] ring-blue-500 scale-110 border-slate-300 shadow-[0_0_12px_rgba(0,0,0,0.9)]'
                  : 'border-slate-500 hover:scale-105 shadow-sm'
              }`}
            />
          </div>
        </div>

        {/* Garis Pembatas Halus */}
        <div className="w-px h-5 bg-white/[0.08] flex-shrink-0" />

        {/* 2. BAGIAN TENGAH: KUAS SULAM + BAR PROMPT INSTRUKSI + TOMBOL KIRIM GRADASI */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* Tombol Kuas Sulam Objek */}
          <button
            type="button"
            onClick={onToggleInpaint}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex-shrink-0 cursor-pointer ${
              isInpainting
                ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/30'
                : 'bg-[#111827]/70 text-slate-300 border-white/[0.08] hover:text-white hover:border-slate-500'
            }`}
            title="Aktifkan Kuas Arsir untuk Perbaikan atau Penambahan Objek"
          >
            <Brush className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline text-[11px]">Kuas</span>
          </button>

          {/* Pengatur Ukuran Kuas */}
          <div className="flex items-center gap-1.5 bg-[#111827]/70 px-2 py-1 rounded-xl border border-white/[0.08] flex-shrink-0">
            <input
              type="range"
              min="10"
              max="60"
              value={brushSize}
              onChange={(e) => onChangeBrushSize(Number(e.target.value))}
              className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-blue-400 font-mono text-[10px] w-6 text-right">{brushSize}px</span>
          </div>

          {/* Kolom Teks Masukan Tambah/Hapus Objek */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={revisionPrompt}
              onChange={(e) => onChangeRevisionPrompt(e.target.value)}
              onKeyDown={handleRevisionKeyDown}
              placeholder="Ketik instruksi tambah / hapus objek (contoh: tambahkan piring saji, hapus selada)..."
              className="w-full bg-[#0A101C]/80 border border-white/[0.08] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-400 outline-none transition-all shadow-inner font-normal"
            />
            {/* Tombol Kirim Bergradasi Biru-Ungu Sesuai Referensi Mas Bima */}
            <button
              type="button"
              onClick={onSubmitRevision}
              disabled={isRevising || !hasElement}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
              title="Kirim instruksi tambah / hapus objek ke AI Vision"
            >
              {isRevising ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[11px]">Memproses...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Kirim</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Garis Pembatas Halus */}
        <div className="w-px h-5 bg-white/[0.08] flex-shrink-0" />

        {/* 3. BAGIAN KANAN: TOMBOL VEKTOR SVG & TINGKATKAN HD */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Tombol Konversi Vektor SVG dengan Pilihan Cerdas (AI Vision Murni vs Jiplak Cepat) */}
          <div className="relative" ref={vectorMenuRef}>
            <button
              type="button"
              onClick={() => setIsVectorMenuOpen((prev) => !prev)}
              disabled={isVectorizing || !hasElement}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                isVectorMenuOpen
                  ? 'bg-emerald-900/70 text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/20'
                  : 'bg-[#11202B]/60 hover:bg-emerald-950/60 text-emerald-400 hover:text-white border-emerald-500/30'
              }`}
              title="Pilihan pembuatan kurva vektor SVG: Gambar Ulang AI atau Jiplak Cepat"
            >
              {isVectorizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
              ) : (
                <Spline className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="whitespace-nowrap text-[11px]">
                {isVectorizing ? 'Membuat SVG...' : 'Vektor (SVG)'}
              </span>
              <ChevronDown className={`w-3 h-3 text-emerald-400/80 transition-transform ${isVectorMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Popover Pilihan Vektor (Glassmorphism Gelap Sesuai Tema Studio) */}
            {isVectorMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#0D1522]/95 border border-emerald-500/30 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1.5 animate-fadeIn">
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                  PILIHAN KURVA VEKTOR
                </div>

                {/* Opsi 1: Gambar Ulang AI (Rekomendasi Utama) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsVectorMenuOpen(false);
                    if (onVectorize) onVectorize('ai_vision');
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-emerald-500/15 text-left transition-all border border-transparent hover:border-emerald-500/30 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                    <Wand2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-300">Gambar Ulang AI</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                        Rekomendasi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      AI memahami bentuk gambar & mendesain ulang kurva SVG mulus dari nol (tanpa gerigi).
                    </p>
                  </div>
                </button>

                {/* Opsi 2: Jiplak Cepat (Trace) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsVectorMenuOpen(false);
                    if (onVectorize) onVectorize('trace');
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/60 text-left transition-all border border-transparent hover:border-slate-700 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200">Jiplak Cepat (Trace)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                      Konversi matematika warna instan (&lt; 1 detik) menggunakan garis kurva kontur.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Tombol Tingkatkan HD */}
          <button
            type="button"
            onClick={onToggleHd}
            disabled={isUpscaling || !hasElement}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              isHdActive
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/50 shadow-amber-500/25 ring-2 ring-amber-500/30'
                : 'bg-[#151D2A]/70 hover:bg-[#1C2638] text-slate-300 hover:text-amber-300 border-white/[0.08] hover:border-amber-400/30'
            }`}
            title="Tingkatkan resolusi gambar menjadi 2x lebih tajam untuk cetak poster"
          >
            {isUpscaling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
            )}
            <span className="whitespace-nowrap text-[11px]">Tingkatkan HD</span>
          </button>
        </div>

      </div>
    </div>
  );
}
