import React, { useState } from 'react';
import { Type, Sparkles, Loader2, X } from 'lucide-react';
import { optimizePrompt } from '../services/api';

export default function TypographyBar({
  text = '',
  onChangeText,
  onSubmit,
  isLoading = false,
  config = {},
  onShowToast,
}) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && text.trim()) {
        onSubmit();
      }
    }
  };

  // Fungsi pembersih anti-fotografi: membuang kata-kata klise objek foto dari hasil optimizer
  const sanitizeTypographyPrompt = (optimizedText, originalText) => {
    let cleaned = optimizedText || originalText;

    // Bersihkan pola kata-kata fotografi klise jika sempat lolos dari server AI
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

    // Bersihkan koma atau spasi berulang akibat pembersihan kata
    cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();

    // Jika kata-kata klise dibuang atau teks menjadi terlalu pendek, sematkan atribut tipografi 3D murni
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

  const handleOptimize = async () => {
    const raw = text.trim();
    if (!raw) {
      if (onShowToast) onShowToast('Ketik instruksi teks terlebih dahulu untuk dioptimalkan.', 'warning');
      return;
    }

    setIsOptimizing(true);
    if (onShowToast) onShowToast('Mengoptimalkan deskripsi visual huruf 3D...', 'info');

    try {
      const res = await optimizePrompt({
        prompt: raw,
        model: config.model || '',
        optimizer_model: config.optimizerModel || '',
        base_url: config.baseUrl || 'http://localhost:20128/v1',
        api_key: config.apiKey || '',
        mode: 'no_bg',
        is_typography: true,
      });

      if (res.optimized_prompt) {
        const sanitized = sanitizeTypographyPrompt(res.optimized_prompt, raw);
        onChangeText(sanitized);
        if (onShowToast) onShowToast('Instruksi 3D berhasil diperkaya secara adaptif!', 'success');
      }
    } catch (err) {
      const sanitized = sanitizeTypographyPrompt(raw, raw);
      onChangeText(sanitized);
      if (onShowToast) onShowToast('Instruksi 3D disempurnakan secara adaptif!', 'success');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="w-full select-none">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Kolom Input Instruksi Tipografi 3D Bebas */}
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik instruksi teks 3D bebas... (contoh: huruf 3D timbul warna biru navy dengan outline biru muda ber teks 'Iki Jeporo LET')"
            disabled={isLoading || isOptimizing}
            className="w-full bg-[#0D1322]/85 backdrop-blur-xl border border-white/[0.1] focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 rounded-2xl px-6 py-4.5 sm:py-5 pr-36 sm:pr-44 text-sm sm:text-base text-white placeholder-slate-400 transition-all outline-none shadow-2xl font-medium tracking-wide"
          />

          {/* Grup Tombol di Dalam Input */}
          <div className="absolute right-3.5 flex items-center gap-2">
            {text.trim().length > 0 && (
              <button
                onClick={() => onChangeText('')}
                type="button"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/70 text-slate-300 hover:text-rose-300 border border-white/[0.08] transition-all shadow-sm cursor-pointer"
                title="Hapus tulisan"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleOptimize}
              type="button"
              disabled={isLoading || isOptimizing || !text.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-400/30 transition-all shadow-sm cursor-pointer text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
              title="Optimalkan instruksi 3D secara adaptif"
            >
              {isOptimizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span className="hidden sm:inline">Optimalkan</span>
            </button>
          </div>
        </div>

        {/* Tombol Eksekusi Cetak Tulisan 3D */}
        <button
          onClick={onSubmit}
          disabled={isLoading || isOptimizing || !text.trim()}
          className="flex items-center justify-center gap-2.5 px-7 py-4.5 sm:py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-amber-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-white/20 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Mencetak 3D...</span>
            </>
          ) : (
            <>
              <Type className="w-5 h-5 text-white" />
              <span>Cetak 3D</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
