import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  BookmarkPlus,
  RefreshCw,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Download,
  ImagePlus,
  X,
  Image as ImageIcon,
  Scaling,
  Monitor,
} from 'lucide-react';
import InpaintBrush from './InpaintBrush';

export default function PreviewCanvas({
  currentElement,
  onRegenerate,
  onSaveToCollection,
  onDownload,
  isGenerating = false,
  isRevising = false,
  revisingStatus = '',
  isUpscaling = false,
  upscaleProgress = { percent: 0, message: '' },
  onSubmitInpaint,
  isInpainting = false,
  onToggleInpaint,
  brushSize = 32,
  onChangeBrushSize,
  revisionPrompt = '',
  onChangeRevisionPrompt,
  bgTestMode = 'checker',
  zoom = 1,
  onChangeZoom,
  pan = { x: 0, y: 0 },
  onChangePan,
  onResetZoom,
  referenceImage = null,
  onSelectReferenceImage,
  onClearReferenceImage,
  referenceSimilarity = 80,
  onChangeReferenceSimilarity,
  isWallpaperMode = false,
  wallpaperTemplate = null,
}) {
  const containerRef = useRef(null);
  const refFileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isRefDragging, setIsRefDragging] = useState(false);

  // Ukuran Kotak Reference (Dapat diskalakan bebas oleh pengguna, tersimpan di memori lokal)
  const [refBoxSize, setRefBoxSize] = useState(() => {
    try {
      const saved = localStorage.getItem('element_maker_ref_box_size');
      return saved ? Math.min(520, Math.max(110, Number(saved))) : 176;
    } catch {
      return 176;
    }
  });
  const [isResizingRef, setIsResizingRef] = useState(false);
  const resizeStartRef = useRef({ startX: 0, startY: 0, startSize: 176 });
  const rafId = useRef(null);

  // Mulai drag resize lewat mouse
  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingRef(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startSize: refBoxSize,
    };
  };

  // Mulai drag resize lewat sentuhan (touch)
  const handleResizeTouchStart = (e) => {
    if (!e.touches || !e.touches[0]) return;
    e.stopPropagation();
    setIsResizingRef(true);
    resizeStartRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startSize: refBoxSize,
    };
  };

  // Listener global resize saat dragging aktif (Optimal 60-120fps tanpa lag)
  useEffect(() => {
    if (!isResizingRef) return;

    const handleMouseMove = (e) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - resizeStartRef.current.startX;
        const deltaY = e.clientY - resizeStartRef.current.startY;
        const delta = Math.max(deltaX, deltaY);
        const newSize = Math.max(110, Math.min(520, Math.round(resizeStartRef.current.startSize + delta)));
        setRefBoxSize(newSize);
      });
    };

    const handleTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const deltaX = e.touches[0].clientX - resizeStartRef.current.startX;
        const deltaY = e.touches[0].clientY - resizeStartRef.current.startY;
        const delta = Math.max(deltaX, deltaY);
        const newSize = Math.max(110, Math.min(520, Math.round(resizeStartRef.current.startSize + delta)));
        setRefBoxSize(newSize);
      });
    };

    const handleEndResize = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      setIsResizingRef(false);
      setRefBoxSize((latestSize) => {
        try {
          localStorage.setItem('element_maker_ref_box_size', String(latestSize));
        } catch (err) {
          // Abaikan
        }
        return latestSize;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleEndResize);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEndResize);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEndResize);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEndResize);
    };
  }, [isResizingRef]);

  // Tangani Unggah Gambar Reference lewat File Browser
  const handleRefFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (onSelectReferenceImage) {
        onSelectReferenceImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Tangani Tarik & Lepas (Drag & Drop) File Gambar ke Kotak Reference
  const handleRefDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRefDragging(true);
  };

  const handleRefDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRefDragging(false);
  };

  const handleRefDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRefDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (onSelectReferenceImage) {
          onSelectReferenceImage(ev.target.result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  // Tentukan kelas CSS latar belakang kanvas uji
  const getCanvasBgClass = () => {
    switch (bgTestMode) {
      case 'white':
        return 'bg-white';
      case 'blue':
        return 'bg-[#bae6fd]';
      case 'black':
        return 'bg-[#0A0E18]';
      case 'checker':
      default:
        return 'bg-transparency-light';
    }
  };

  // Zoom In / Zoom Out lokal jika props tersedia
  const handleZoomIn = () => {
    if (onChangeZoom) {
      onChangeZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
    }
  };

  const handleZoomOut = () => {
    if (onChangeZoom) {
      onChangeZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.25));
    }
  };

  // Roda Mouse untuk Zoom Halus di atas Kanvas (Non-passive listener)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheelNative = (e) => {
      if (isInpainting) return; // Jangan interupsi saat mode kuas sulam
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      if (onChangeZoom) {
        onChangeZoom((prev) => {
          const nextZoom = Math.min(Math.max(0.25, Number((prev + delta).toFixed(2))), 4);
          return nextZoom;
        });
      }
    };
    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [isInpainting, onChangeZoom]);

  // Tangani Mulai Geser (Pan / Drag) saat Zoom > 1
  const handleMouseDown = (e) => {
    if (isInpainting) return;
    if (e.button === 0) { // Klik kiri
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isInpainting) return;
    if (onChangePan) {
      onChangePan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset drag saat pointer keluar
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      className={`relative w-full h-full min-h-0 flex-1 rounded-[28px] overflow-hidden glass-soft flex flex-col items-center justify-center select-none ${
        zoom > 1 && !isInpainting
          ? isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : 'cursor-default'
      }`}
    >
      {/* Lapisan Pantulan Kilau Kaca Diagonal Realistis Sesuai Gambar Referensi */}
      <div className="canvas-gloss-reflection" />

      {/* KOTAK REFERENCE MELAYANG DI SUDUT KANVAS (POJOK KIRI ATAS - SESUAI PERMINTAAN MAS BIMA) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleRefDragOver}
        onDragLeave={handleRefDragLeave}
        onDrop={handleRefDrop}
        style={{ width: `${refBoxSize}px` }}
        className={`absolute top-4 left-4 z-20 select-none flex flex-col gap-1.5 ${
          isResizingRef ? 'transition-none pointer-events-auto' : 'transition-all duration-150'
        }`}
      >
        <input
          type="file"
          ref={refFileInputRef}
          onChange={handleRefFileChange}
          accept="image/*"
          className="hidden"
        />

        {referenceImage ? (
          /* 1. KOTAK FOTO REFERENCE (100% Bersih & Utuh Tanpa Terhalang UI) */
          <div
            style={{ height: `${refBoxSize}px` }}
            className={`relative w-full rounded-2xl overflow-hidden border border-purple-500/40 shadow-2xl bg-[#0C101D]/90 backdrop-blur-xl group hover:border-purple-400 ${
              isResizingRef ? 'transition-none' : 'transition-all duration-200'
            }`}
          >
            {/* Header Badge & Tombol Hapus */}
            <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/40 border border-purple-400/50 text-[10px] font-bold text-purple-200 tracking-wider shadow-sm uppercase">
                <ImageIcon className="w-3 h-3 text-purple-300" />
                Reference
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClearReferenceImage) onClearReferenceImage();
                }}
                className="p-1 rounded-full bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors border border-white/10 cursor-pointer shadow-md"
                title="Hapus gambar Reference"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Foto Referensi Utama (Bebas Halangan) */}
            <img
              src={referenceImage}
              alt="Reference"
              className={`w-full h-full object-cover pointer-events-none select-none ${
                isResizingRef ? 'transition-none' : 'transition-transform duration-300 group-hover:scale-105'
              }`}
            />

            {/* Lapisan Ganti Foto saat Hover */}
            <div
              onClick={() => refFileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer backdrop-blur-[2px]"
              title="Klik untuk mengganti gambar Reference"
            >
              <ImagePlus className="w-5 h-5 text-purple-300" />
              <span className="text-xs font-semibold text-white">Ganti Foto</span>
              <span className="text-[10px] text-slate-300">atau seret file ke sini</span>
            </div>
          </div>
        ) : (
          /* 1. KOTAK REFERENCE KOSONG (Selalu Tampil) */
          <div
            onClick={() => refFileInputRef.current?.click()}
            style={{ height: `${refBoxSize}px` }}
            className={`w-full rounded-2xl border-2 border-dashed ${
              isRefDragging
                ? 'border-cyan-400 bg-cyan-950/50 scale-105 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
                : 'border-purple-500/40 hover:border-purple-400 bg-[#0C101D]/75 hover:bg-[#141228]/85 shadow-xl hover:shadow-purple-900/20'
            } backdrop-blur-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer group ${
              isResizingRef ? 'transition-none' : 'transition-all duration-200'
            }`}
            title="Klik untuk memilih foto Reference dari komputer, atau seret file gambar langsung ke sini"
          >
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-[9px] font-bold text-purple-300 tracking-wider mb-2 uppercase">
              <ImageIcon className="w-2.5 h-2.5 text-purple-300" />
              Reference
            </div>

            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-500/25 group-hover:text-purple-200 group-hover:scale-110 transition-all mb-1.5 shadow-inner">
              <ImagePlus className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </div>

            <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
              + Pasang Foto
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Klik / Seret Gambar
            </span>
          </div>
        )}

        {/* 2. BILAH PENGATUR KEMIRIPAN DI BAWAH FOTO (Satu Kesatuan UI Ikut Skala) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full rounded-2xl bg-[#090D18]/95 backdrop-blur-xl border border-purple-500/40 p-2 shadow-2xl flex flex-col gap-1 ${
            isResizingRef ? 'transition-none' : 'transition-all'
          }`}
        >
          <div className="flex items-center justify-between px-1 text-[10px] font-bold text-slate-300">
            <span className="text-purple-300 flex items-center gap-1">
              <span>Kemiripan</span>
            </span>
            <span className="text-amber-300 font-mono font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 border border-amber-400/30">
              {referenceSimilarity}%
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 pt-0.5">
            {[60, 70, 80, 90, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onChangeReferenceSimilarity) onChangeReferenceSimilarity(val);
                }}
                className={`py-1 rounded-lg text-[9.5px] font-bold font-mono transition-all text-center cursor-pointer ${
                  referenceSimilarity === val
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-300 scale-105'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
                title={`Pilih kemiripan ${val}%`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>

        {/* Gagang Skala Bebas (Resize Handle di Pojok Kanan Bawah UI Kesatuan) */}
        <div
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#18112E] hover:bg-purple-600 border border-purple-400/80 shadow-[0_2px_10px_rgba(168,85,247,0.4)] flex items-center justify-center cursor-nwse-resize z-30 hover:scale-125 active:scale-110 transition-all text-purple-300 hover:text-white"
          title="Tarik sudut ini untuk memperbesar / memperkecil ukuran kotak Reference sesuka hati"
        >
          <Scaling className="w-3.5 h-3.5" />
        </div>

        {/* Indikator Ukuran Piksel saat Menarik Sudut */}
        {isResizingRef && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-purple-950/95 border border-purple-400/60 text-[10px] font-mono font-bold text-purple-200 pointer-events-none shadow-xl z-40 whitespace-nowrap">
            {refBoxSize}px
          </div>
        )}
      </div>

      {/* 1. KONTROL ZOOM MELAYANG DI SUDUT KANVAS (POJOK KANAN ATAS) */}
      {currentElement && !isInpainting && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#0D1322]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl text-xs text-slate-200"
        >
          {/* Tombol Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Perkecil Tampilan (Ctrl + -)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Indikator Persentase Zoom */}
          <button
            type="button"
            onClick={onResetZoom}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 transition-colors"
            title="Klik untuk Reset Ukuran ke 100% (Ctrl + 0)"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Tombol Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Perbesar Tampilan (Ctrl + +)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Garis Pembatas */}
          <div className="w-px h-3.5 bg-slate-700/80 mx-0.5" />

          {/* Tombol Reset Fit */}
          <button
            type="button"
            onClick={onResetZoom}
            className="p-1 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
            title="Kembalikan Posisi & Ukuran Asli (Ctrl + 0)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. AREA KANVAS PRATINJAU TENGAH (PANGGUNG UTAMA) */}
      <div className={`w-full h-full flex items-center justify-center p-8 transition-colors duration-300 relative overflow-hidden ${getCanvasBgClass()}`}>
        {isUpscaling ? (
          <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#0B0F17]/90 backdrop-blur-md border border-amber-500/30 text-center z-20 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.15)] max-w-md w-full mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 flex items-center justify-center gap-2">
                Peningkatan Ketajaman HD
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">AI</span>
              </h3>
              <p className="text-xs text-slate-400">
                Memperkaya detail visual dengan AI Super Resolution (Real-ESRGAN)
              </p>
            </div>

            {/* Display Persentase Besar */}
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 font-mono tracking-tight">
              {Math.min(100, Math.max(0, upscaleProgress?.percent || 0))}%
            </div>

            {/* Bilah Progres (Progress Bar) */}
            <div className="w-full bg-slate-900/90 rounded-full h-3 p-0.5 border border-slate-700/60 shadow-inner overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                style={{ width: `${Math.min(100, Math.max(5, upscaleProgress?.percent || 5))}%` }}
              />
            </div>

            {/* Pesan Status Tahapan */}
            <p className="text-xs font-medium text-amber-200/90 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
              <span>{upscaleProgress?.message || "Sedang memproses..."}</span>
            </p>
          </div>
        ) : isGenerating || isRevising ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-[#0B0F17]/85 backdrop-blur-md border border-[#232F45] text-center z-10 shadow-2xl max-w-md mx-auto">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-sm font-bold text-slate-100">
              {isRevising ? (revisingStatus || "AI Vision sedang menganalisis & memperbarui elemen...") : "Menghasilkan elemen grafis..."}
            </p>
            <p className="text-xs text-slate-400">
              {isRevising ? "Menjaga konsistensi visual dan memotong latar belakang bersih" : "AI Vision memotong latar belakang secara otomatis"}
            </p>
          </div>
        ) : isInpainting && currentElement ? (
          /* Tampilkan Kanvas Inpainting Arsir */
          <div className="w-full h-full flex items-center justify-center pt-10">
            <InpaintBrush
              imageSrc={currentElement.image_base64}
              brushSize={brushSize}
              onChangeBrushSize={onChangeBrushSize}
              revisionPrompt={revisionPrompt}
              onChangeRevisionPrompt={onChangeRevisionPrompt}
              onSubmitInpaint={onSubmitInpaint}
              onCancel={onToggleInpaint}
              isLoading={isGenerating || isRevising}
            />
          </div>
        ) : currentElement ? (
          /* Tampilkan Gambar Elemen Aktif dengan Dukungan Zoom & Pan */
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="relative flex items-center justify-center max-w-full max-h-full"
          >
            {isWallpaperMode || currentElement.is_wallpaper ? (
              <div
                style={{
                  aspectRatio: currentElement.aspect_ratio
                    ? currentElement.aspect_ratio.replace(':', '/')
                    : `${wallpaperTemplate?.width || 1920} / ${wallpaperTemplate?.height || 1080}`,
                  maxHeight: '450px',
                  maxWidth: '96%',
                }}
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/60 flex items-center justify-center group"
              >
                <img
                  src={currentElement.image_base64}
                  alt={currentElement.prompt || 'Wallpaper Layar'}
                  draggable={false}
                  className="w-full h-full object-contain select-none pointer-events-none"
                />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-300 font-bold shadow-lg flex items-center gap-1.5">
                  <Monitor className="w-3 h-3 text-cyan-400" />
                  <span>
                    {currentElement.dimensions || `${wallpaperTemplate?.width || 1920} × ${wallpaperTemplate?.height || 1080} px`}
                  </span>
                </div>
              </div>
            ) : (
              <img
                src={currentElement.image_base64}
                alt={currentElement.prompt || 'Elemen Poster'}
                draggable={false}
                className="max-h-[440px] max-w-[560px] md:max-h-[500px] md:max-w-[640px] w-auto h-auto object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.45)] select-none pointer-events-none"
              />
            )}
          </div>
        ) : isWallpaperMode ? (
          /* Tampilan Kosong Khusus Wallpaper dengan Preview Bingkai Layar */
          <div
            style={{
              aspectRatio: `${wallpaperTemplate?.width || 1920} / ${wallpaperTemplate?.height || 1080}`,
              maxHeight: '420px',
              maxWidth: '90%',
            }}
            className="relative rounded-3xl border-2 border-dashed border-cyan-500/35 bg-[#0B101E]/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {wallpaperTemplate?.brand ? `${wallpaperTemplate.brand} - ` : ''}
              {wallpaperTemplate?.model || 'Kanvas Wallpaper Layar'}
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-300 mt-1">
              {wallpaperTemplate?.width || 1920} × {wallpaperTemplate?.height || 1080} px ({wallpaperTemplate?.aspectRatio || '16:9'})
            </span>
            <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
              Ketik ide wallpaper di bilah bawah lalu klik <strong>"Buat Wallpaper"</strong>.
            </p>
          </div>
        ) : (
          /* Tampilan Kosong Ramah (Empty State Biasa) */
          <div className="flex flex-col items-center justify-center text-center p-8 text-slate-600">
            <Sparkles className="w-12 h-12 text-slate-400/50 mb-3" />
            <h3 className="text-base font-bold text-slate-400">Belum Ada Elemen di Kanvas</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Ketik deskripsi pada kotak perintah di bawah atau pilih salah satu elemen dari koleksi.
            </p>
          </div>
        )}
      </div>

      {/* 2. TOMBOL TINDAKAN MELAYANG DI BAWAH KANVAS (PRESISI 1:1 DENGAN GAMBAR REFERENSI) */}
      {currentElement && !isInpainting && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 z-20 flex items-center gap-3 select-none"
        >
          {/* Tombol Buat Ulang */}
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111827]/85 hover:bg-[#1C2638] backdrop-blur-xl border border-white/[0.12] text-white text-xs sm:text-sm font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Buat variasi baru dengan perintah yang sama"
          >
            <RefreshCw className="w-4 h-4 text-slate-300" />
            <span>Buat Ulang</span>
          </button>

          {/* Tombol Simpan ke Koleksi */}
          <button
            onClick={onSaveToCollection}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer border border-white/25"
            title="Simpan elemen ini ke koleksi internal studio (Ctrl + S)"
          >
            <BookmarkPlus className="w-4 h-4 text-white" />
            <span>Simpan ke Koleksi</span>
          </button>

          {/* Tombol Unduh */}
          {onDownload && (
            <button
              onClick={() => onDownload(currentElement)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111827]/85 hover:bg-[#1C2638] backdrop-blur-xl border border-white/[0.12] text-white text-xs sm:text-sm font-semibold shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Unduh elemen ini ke komputer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Unduh</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
