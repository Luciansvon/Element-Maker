import React, { useRef, useEffect, useState } from 'react';
import { Undo, RotateCcw, Check, X, Loader2, Sparkles } from 'lucide-react';

/**
 * Komponen Kanvas Inpainting Interaktif
 * Memungkinkan pengguna mengarsir bagian elemen yang ingin diperbaiki atau ditambah objek,
 * lalu menghasilkan masker base64 dan mengirim permintaan inpaint ke AI.
 */
export default function InpaintBrush({
  imageSrc,
  brushSize = 32,
  onChangeBrushSize,
  revisionPrompt = '',
  onChangeRevisionPrompt,
  onSubmitInpaint,
  onCancel,
  isLoading = false,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [imageDimensions, setImageDimensions] = useState({ width: 560, height: 560 });

  // Inisialisasi gambar dan ukuran kanvas yang optimal (tidak terlalu kecil)
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      // Skala gambar agar pas dan megah di kanvas studio
      const maxDim = 580;
      let w = img.width || maxDim;
      let h = img.height || maxDim;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      setImageDimensions({ width: w, height: h });

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        const initialData = ctx.getImageData(0, 0, w, h);
        setHistory([initialData]);
        setHistoryStep(0);
      }
    };
  }, [imageSrc]);

  // Simpan riwayat stroke untuk fitur Undo / Redo
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyStep + 1);
      return [...nextHistory, imageData];
    });
    setHistoryStep((prev) => prev + 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(history[prevStep], 0, 0);
      setHistoryStep(prevStep);
    }
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    // Arsir warna merah semi-transparan yang ramah di mata
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  // Membuat masker biner hitam-putih untuk AI inpaint
  const generateMaskBase64 = () => {
    const drawCanvas = canvasRef.current;
    if (!drawCanvas) return null;

    // Buat kanvas masker virtual ukuran 1024x1024
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 1024;
    maskCanvas.height = 1024;
    const mctx = maskCanvas.getContext('2d');

    // Latar hitam (area yang tetap dipertahankan)
    mctx.fillStyle = '#000000';
    mctx.fillRect(0, 0, 1024, 1024);

    // Ambil pixel dari drawing canvas
    const drawCtx = drawCanvas.getContext('2d');
    const drawData = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);

    // Salin goresan ke ukuran 1024x1024 sebagai putih murni (area yang diubah/ditambah)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = drawCanvas.width;
    tempCanvas.height = drawCanvas.height;
    const tctx = tempCanvas.getContext('2d');
    const tdata = tctx.createImageData(drawCanvas.width, drawCanvas.height);

    for (let i = 0; i < drawData.data.length; i += 4) {
      const alpha = drawData.data[i + 3];
      if (alpha > 20) {
        tdata.data[i] = 255;
        tdata.data[i + 1] = 255;
        tdata.data[i + 2] = 255;
        tdata.data[i + 3] = 255;
      }
    }
    tctx.putImageData(tdata, 0, 0);

    // Gambar tempCanvas ke maskCanvas
    mctx.drawImage(tempCanvas, 0, 0, 1024, 1024);
    return maskCanvas.toDataURL('image/png');
  };

  const handleApply = () => {
    const maskBase64 = generateMaskBase64();
    if (onSubmitInpaint) {
      onSubmitInpaint(maskBase64);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
      {/* Area Kanvas Gambar Tumpuk */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center"
        style={{ width: `${imageDimensions.width}px`, height: `${imageDimensions.height}px` }}
      >
        {/* Gambar Elemen Asal */}
        <img
          src={imageSrc}
          alt="Elemen Asli"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_25px_35px_rgba(0,0,0,0.4)]"
        />

        {/* Kanvas Arsir Coretan Interaktif */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair z-10"
        />
      </div>

      {/* Floating Control Bar Khusus Inpainting di Bawah Kanvas */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 bg-[#151D2A] border border-[#232F45] px-5 py-3 rounded-2xl shadow-2xl z-20">
        <button
          onClick={undo}
          disabled={historyStep <= 0 || isLoading}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
          title="Batal Coretan Terakhir (Undo)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          onClick={clearAll}
          disabled={isLoading}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Hapus Semua Coretan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-700" />

        {/* Tombol Tindakan Terapkan / Tambah Objek */}
        <button
          onClick={handleApply}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          title="Terapkan coretan dan tambahkan objek ke gambar"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Terapkan / Tambah Objek</span>
            </>
          )}
        </button>

        {/* Tombol Batal */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Batal</span>
        </button>
      </div>
    </div>
  );
}
