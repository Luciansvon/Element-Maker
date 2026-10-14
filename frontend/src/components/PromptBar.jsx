import React, { useState, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Loader2, X, Wand2, ImagePlus } from 'lucide-react';
import { optimizePrompt } from '../services/api';

export default function PromptBar({
  prompt = '',
  onChangePrompt,
  mode = 'no_bg',
  onChangeMode,
  customBg = '',
  onChangeCustomBg,
  color = '#FFFFFF',
  onChangeColor,
  onSubmit,
  isLoading = false,
  config = {},
  onShowToast,
  glassMode = false,
  onToggleGlassMode,
  referenceImage = null,
  referenceSimilarity = 80,
  onSelectReferenceImage,
  onClearReferenceImage,
}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && prompt.trim()) {
        onSubmit();
      }
    }
  };

  // Tangani Tempel (Paste Ctrl+V) Gambar Referensi Langsung di Kolom Input
  const handlePaste = (e) => {
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
              if (onShowToast) onShowToast('Gambar inspirasi berhasil dipasang dari clipboard!', 'success');
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Tangani Pemilihan Berkas Gambar dari Komputer
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (onSelectReferenceImage) {
        onSelectReferenceImage(ev.target.result);
        if (onShowToast) onShowToast('Gambar inspirasi berhasil diunggah!', 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Hapus Cepat Prompt
  const handleClear = () => {
    onChangePrompt('');
  };

  // Optimalkan Prompt Otomatis dengan AI (sadar konteks mode latar + AI Vision jika ada gambar referensi)
  const handleOptimize = async () => {
    if (!prompt.trim()) {
      if (onShowToast) onShowToast('Ketik ide elemen terlebih dahulu untuk dioptimalkan.', 'warning');
      return;
    }

    setIsOptimizing(true);
    if (onShowToast) {
      if (referenceImage) {
        onShowToast('Menganalisis gambar referensi via AI Vision & mengoptimalkan prompt...', 'info');
      } else {
        onShowToast('Mengoptimalkan deskripsi visual poster...', 'info');
      }
    }

    try {
      const res = await optimizePrompt({
        prompt: prompt.trim(),
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

      if (res.optimized_prompt) {
        onChangePrompt(res.optimized_prompt);
        if (onShowToast) {
          const via = res.model_used ? ` (via ${res.model_used})` : '';
          const refMsg = res.reference_analysis ? ' selaras gambar referensi' : ' secara adaptif';
          onShowToast(`Perintah berhasil dioptimalkan${refMsg}${via}!`, 'success');
        }
      }
    } catch (err) {
      // Fallback lokal sadar konteks: tidak menabur kata yang bertentangan dengan mode
      const raw = prompt.trim();
      const p = raw.toLowerCase();
      const isFlat = /flat|minimalis|minimalist|vektor|vector|kartun|cartoon|anime|stiker|siluet/.test(p);
      let bgTail = 'terisolasi rapi siap tempel';
      if (mode === 'plain_bg') bgTail = `dengan latar polos warna ${color} yang bersih`;
      else if (mode === 'custom_bg' && customBg.trim()) bgTail = `dengan latar ${customBg.trim()} yang menyatu alami`;
      else if (mode === 'custom_bg') bgTail = 'dengan latar kustom yang menyatu alami';
      else if (glassMode) bgTail = 'terisolasi dengan transparansi kaca alami';

      let details = 'tekstur dan detail bahan yang disebut terlihat tajam, pencahayaan studio terarah';
      if (isFlat) {
        details = 'gaya datar bersih dengan bentuk tegas dan warna solid';
      } else if (/kursi|sofa|meja|lemari|rak|bangku|lounge|stool|bed|furniture|interior|lampu|kayu/.test(p)) {
        details = 'serat dan tekstur bahan yang disebut terlihat nyata, proporsi ergonomis, pencahayaan studio lembut';
      } else if (/burger|pizza|kopi|teh|kue|roti|ayam|mie|nasi|es|minuman|jus|daging|steak|keju|buah|makanan|sushi|bakso|sate/.test(p)) {
        details = 'kesegaran dan tekstur bahan yang disebut terlihat menggugah, pencahayaan hangat studio kuliner';
      } else if (/orang|laki|pria|wanita|anak|gadis|karakter|astronot|wajah|kucing|anjing|hewan|burung/.test(p)) {
        details = 'pose alami proporsional dan detail bahan yang disebut tetap konsisten, pencahayaan studio lembut';
      } else if (/tipografi|tulisan|teks|huruf|font|typography|kata|kalimat|judul|3d|pop-up|popup/.test(p)) {
        details = 'huruf timbul 3D tebal proporsional mengikuti warna dan efek yang diminta, kontur tepi tegas, bayangan stiker tipis';
        bgTail = '';
      } else if (/mobil|motor|sepeda|kapal|pesawat|robot|mesin|helm|kendaraan|truk|bus/.test(p)) {
        details = 'detail lekukan dan material yang disebut terlihat presisi, pencahayaan studio dramatis lembut';
      } else if (/daun|bunga|pohon|mawar|tanaman|kaktus|rumput|jamur/.test(p)) {
        details = 'detail urat dan tekstur alami yang disebut terlihat segar, pencahayaan pagi lembut';
      }
      const fallbackText = /tanpa latar|transparan/.test(p)
        ? `${raw}, ${details}`
        : `${raw}, ${details}${bgTail ? `, ${bgTail}` : ''}`;
      onChangePrompt(fallbackText);
      if (onShowToast) onShowToast('Perintah disempurnakan secara adaptif sesuai jenis objek!', 'success');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="w-full space-y-3.5 select-none">
      {/* Kolom Input Prompt Besar & Nyaman Dibaca dengan Tombol Aksi Lengkap */}
      <div className="relative flex items-center">
        {/* Tombol Kamera / Gambar Reference di Sisi Kiri Input */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`absolute left-3.5 p-2 rounded-xl border transition-all cursor-pointer z-10 ${
            referenceImage
              ? 'bg-purple-600/30 text-purple-300 border-purple-400/40 shadow-sm ring-1 ring-purple-400/30'
              : 'bg-[#121927]/90 hover:bg-purple-950/60 text-slate-300 hover:text-purple-300 border-white/[0.08] hover:border-purple-400/30'
          }`}
          title="Pasang contoh gambar Reference atau tekan Ctrl+V di kolom ini"
        >
          <ImagePlus className="w-4.5 h-4.5 text-purple-400" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <input
          type="text"
          value={prompt}
          onChange={(e) => onChangePrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            referenceImage
              ? 'Ketik arahan elemen dengan panduan Reference di kanvas... (contoh: buat kursi warna abu-abu)'
              : 'Ketik elemen poster yang ingin kamu buat... (contoh: foto burger lezat terpotong keju lumer, pita emas mewah)'
          }
          disabled={isLoading || isOptimizing}
          className="w-full glass-soft focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 rounded-2xl pl-16 sm:pl-17 pr-48 sm:pr-56 py-4.5 sm:py-5 text-base text-white placeholder-slate-400 transition-all outline-none shadow-2xl font-medium tracking-wide"
        />

        {/* Grup Tombol di Dalam Input (Hapus Cepat + Prompt Optimizer) */}
        <div className="absolute right-3.5 flex items-center gap-2">
          {/* Tombol Hapus Cepat (Muncul jika ada teks) */}
          {prompt.trim().length > 0 && (
            <button
              onClick={handleClear}
              type="button"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 border border-white/[0.08] transition-all shadow-sm cursor-pointer"
              title="Hapus cepat isi perintah"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Tombol Prompt Optimizer Ungu-Magenta Neon ✨ */}
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || isLoading || !prompt.trim()}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-white/20"
            title="Optimalkan perintah menjadi deskripsi visual poster profesional 8K"
          >
            {isOptimizing ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Wand2 className="w-4 h-4 text-white" />
            )}
            <span className="hidden sm:inline">Optimalkan</span>
          </button>
        </div>
      </div>

      {/* Baris 3 Kartu Mode Latar & Tombol Buat Elemen Sejajar Horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.9fr_1fr_auto] gap-3 items-stretch">
        {/* Kartu 1: Tanpa Latar (No BG) */}
        <div
          onClick={() => !isLoading && onChangeMode('no_bg')}
          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
            mode === 'no_bg'
              ? 'active-mode-card shadow-xl shadow-blue-500/20 scale-[1.01]'
              : 'glass-soft hover:bg-[#141C30]/60 hover:border-slate-500'
          }`}
        >
          {/* Ikon Pola Catur Transparan */}
          <div className="w-10 h-10 rounded-xl border border-white/[0.1] flex-shrink-0 bg-transparency-light overflow-hidden shadow-inner" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight whitespace-nowrap">Tanpa Latar (No BG)</h4>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleGlassMode) onToggleGlassMode();
                }}
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all flex-shrink-0 ${
                  glassMode
                    ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 ring-1 ring-cyan-400/40 shadow-sm'
                    : 'bg-[#0B101D] text-slate-400 border-white/[0.08] hover:text-cyan-300 hover:border-cyan-500/30'
                }`}
                title="Aktifkan pemotongan latar khusus benda bening (gelas kaca, air, kristal) dengan alpha matting"
              >
                💧 {glassMode ? 'Kaca/Air' : 'PNG & W...'}
              </button>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {glassMode ? 'Preservasi transparansi kaca & air' : 'Hasil langsung terpotong bersih'}
            </p>
          </div>
        </div>

        {/* Kartu 2: Latar Polos */}
        <div
          onClick={() => !isLoading && onChangeMode('plain_bg')}
          className={`relative flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
            mode === 'plain_bg'
              ? 'active-mode-card shadow-xl shadow-blue-500/20 scale-[1.01]'
              : 'glass-soft hover:bg-[#141C30]/60 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Kotak Warna Solid */}
            <div
              className="w-10 h-10 rounded-xl border border-white/[0.15] flex-shrink-0 shadow-inner"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight whitespace-nowrap">Latar Polos</h4>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">Pilih warna latar</p>
            </div>
          </div>

          {/* Roda Pemilih Warna Pelangi (Color Wheel) */}
          <div className="relative flex-shrink-0 ml-1.5">
            <div
              className="w-7 h-7 rounded-full border-2 border-white/60 shadow-md transition-transform hover:scale-115 cursor-pointer relative overflow-hidden"
              style={{
                background:
                  'conic-gradient(from 90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff0080, #ff0000)',
              }}
              title="Klik untuk memilih warna latar"
            >
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  onChangeColor(e.target.value);
                  if (mode !== 'plain_bg') onChangeMode('plain_bg');
                }}
                title="Pilih warna latar"
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Kartu 3: Latar Kustom */}
        <div
          onClick={() => !isLoading && onChangeMode('custom_bg')}
          className={`flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer transition-all ${
            mode === 'custom_bg'
              ? 'active-mode-card shadow-xl shadow-blue-500/20 scale-[1.01]'
              : 'glass-soft hover:bg-[#141C30]/60 hover:border-slate-500'
          }`}
        >
          {/* Ikon Lanskap */}
          <div className="w-10 h-10 rounded-xl border border-white/[0.08] bg-[#141C2E] flex items-center justify-center flex-shrink-0 text-slate-300">
            <ImageIcon className="w-4.5 h-4.5 text-slate-200" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight whitespace-nowrap">Latar Kustom</h4>
            <input
              type="text"
              value={customBg}
              onChange={(e) => {
                onChangeCustomBg(e.target.value);
                if (mode !== 'custom_bg') onChangeMode('custom_bg');
              }}
              placeholder="Contoh: di atas piring kayu, stud..."
              onClick={(e) => e.stopPropagation()}
              disabled={isLoading}
              className="w-full bg-[#0A0F1A]/80 border border-white/[0.08] rounded-xl px-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-400 outline-none focus:border-blue-400 mt-0.5"
            />
          </div>
        </div>

        {/* Tombol Buat Elemen Utama (Besar & Mantap Diklik) */}
        <button
          onClick={onSubmit}
          disabled={isLoading || !prompt.trim()}
          className="flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 hover:from-blue-500 hover:via-indigo-500 hover:to-fuchsia-500 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-white/20 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Membuat...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-white fill-white/20" />
              <span>Buat Elemen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
