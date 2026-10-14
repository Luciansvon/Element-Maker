import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CanvasToolbar from './components/CanvasToolbar';
import PreviewCanvas from './components/PreviewCanvas';
import GalleryDrawer from './components/GalleryDrawer';
import FullGalleryView from './components/FullGalleryView';
import SettingsModal from './components/SettingsModal';
import { defaultElements } from './data/defaultElements';
import { getDefaultTemplate } from './data/wallpaperTemplates';
import {
  checkHealth,
  generateElement,
  inpaintElement,
  reviseElement,
  upscaleElement,
  upscaleElementStream,
  vectorizeElement,
} from './services/api';
import {
  saveElement,
  getAllElements,
  deleteElement as removeStoredElement,
} from './services/storage';
import { rasterizeSvgToPng, ensurePngDataUrl } from './utils/svgRasterizer';

export default function App() {
  // 1. STATE NAVIGASI & PENGATURAN
  const [activeTab, setActiveTab] = useState('objects');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('element_maker_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          baseUrl: parsed.baseUrl || 'http://localhost:20128/v1',
          apiKey: parsed.apiKey || '',
          model: parsed.model === 'dall-e-3' ? '' : (parsed.model ?? ''),
          inpaintModel: parsed.inpaintModel === 'dall-e-2' ? '' : (parsed.inpaintModel ?? ''),
          optimizerModel: parsed.optimizerModel ?? '',
          provider: parsed.provider || '9router',
        };
      } catch (e) {
        // abaikan
      }
    }
    return {
      baseUrl: 'http://localhost:20128/v1',
      apiKey: '',
      model: '',
      inpaintModel: '',
      optimizerModel: '',
      provider: '9router',
    };
  });

  // 2. STATE STATUS SISTEM & KESEHATAN 9ROUTER
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [toast, setToast] = useState(null);

  // 3. STATE MASUKAN PEMBUATAN ELEMEN (PROMPT & MODE)
  const [prompt, setPrompt] = useState(
    'foto burger lezat terpotong melayang dengan keju meleleh, selada segar, tomat, dan irisan bawang'
  );
  const [mode, setMode] = useState('no_bg');
  const [customBg, setCustomBg] = useState('');
  const [color, setColor] = useState('#FFFFFF');
  const [glassMode, setGlassMode] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceSimilarity, setReferenceSimilarity] = useState(80);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [revisingStatus, setRevisingStatus] = useState('');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState({ percent: 0, message: '' });
  const [isVectorizing, setIsVectorizing] = useState(false);

  // 3b. STATE TIPOGRAFI 3D POP-UP
  const [typographyText, setTypographyText] = useState('PROMO 50%');
  const [typographyStyle, setTypographyStyle] = useState('inflatable');
  const [typographyColor, setTypographyColor] = useState('#FFB800');

  // 3c. STATE PEMBUAT WALLPAPER & BACKGROUND DEVICE
  const [wallpaperPrompt, setWallpaperPrompt] = useState(
    'pemandangan danau cermin jernih di kaki pegunungan pinus dengan langit aurora borealis malam hari berkilau'
  );
  const [selectedWallpaperTemplate, setSelectedWallpaperTemplate] = useState(() => getDefaultTemplate('desktop'));
  const [customWallpaperDimensions, setCustomWallpaperDimensions] = useState({ width: 1920, height: 1080 });

  // 4. STATE KANVAS, TOOLBAR & INPAINTING
  const [currentElement, setCurrentElement] = useState(defaultElements[0]);
  const [isInpainting, setIsInpainting] = useState(false);
  const [brushSize, setBrushSize] = useState(32);
  const [revisionPrompt, setRevisionPrompt] = useState('');
  const [bgTestMode, setBgTestMode] = useState('checker');
  const [isHdActive, setIsHdActive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Reset Zoom ke 100% dan posisi tengah
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    showToast('Ukuran kanvas kembali pas (100%)', 'info');
  };

  // Tempel Gambar dari Clipboard (Ctrl + V)
  const handlePasteImage = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const newElem = {
        id: `elem_paste_${Date.now()}`,
        title: 'Gambar Tempel (Clipboard)',
        prompt: 'Elemen grafis dari papan klip',
        mode: 'no_bg',
        image_base64: base64,
        created_at: new Date().toISOString(),
      };
      setCurrentElement(newElem);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      showToast('Gambar berhasil ditempel ke kanvas!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Buka Kanvas Kosong Baru untuk Membuat Elemen Baru dari Nol
  const handleCreateNewElement = () => {
    setCurrentElement(null); // Kosongkan meja kanvas!
    setPrompt(''); // Kosongkan kolom perintah
    setRevisionPrompt('');
    setIsInpainting(false);
    setIsHdActive(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    showToast('Kanvas baru siap! Silakan ketik perintah elemen di bilah bawah.', 'info');

    // Beri fokus otomatis ke kolom input prompt di bagian bawah
    setTimeout(() => {
      const inputEl = document.querySelector('textarea, input[placeholder*="burger"], input[placeholder*="perintah"]');
      if (inputEl) inputEl.focus();
    }, 150);
  };

  // 5. STATE KOLEKSI ELEMEN (IndexedDB + Bawaan & Status Buka/Tutup Sidebar Kanan)
  const [elements, setElements] = useState(defaultElements);
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);

  // Tampilkan notifikasi toast sesaat
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Muat data dari IndexedDB saat aplikasi dibuka
  useEffect(() => {
    async function loadElements() {
      try {
        const stored = await getAllElements();
        if (stored && stored.length > 0) {
          // Gabungkan elemen tersimpan dengan elemen bawaan unik
          const existingIds = new Set(stored.map((e) => e.id));
          const uniqueDefaults = defaultElements.filter((d) => !existingIds.has(d.id));
          setElements([...stored, ...uniqueDefaults]);
        }
      } catch (err) {
        console.warn('Gagal memuat elemen dari IndexedDB:', err);
      }
    }
    loadElements();
    handleCheckHealth();
  }, []);

  // Simpan config ke localStorage saat berubah
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('element_maker_config', JSON.stringify(newConfig));
    showToast('Pengaturan 9Router & Model berhasil disimpan!', 'success');
  };

  // Periksa sambungan ke backend & 9Router
  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await checkHealth();
      setIsOnline(res.status === 'online');
    } catch (err) {
      setIsOnline(false);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Eksekusi Pembuatan Elemen Baru dengan AI
  const handleGenerate = async (overridePrompt) => {
    const activePrompt = (typeof overridePrompt === 'string' ? overridePrompt : prompt).trim();
    if (!activePrompt) {
      showToast('Harap masukkan deskripsi elemen terlebih dahulu.', 'warning');
      return;
    }

    setIsGenerating(true);
    if (referenceImage) {
      showToast('Membuat elemen baru berdasarkan inspirasi gambar referensi...', 'info');
    } else {
      showToast('Memulai pembuatan elemen dengan AI Vision...', 'info');
    }

    try {
      const result = await generateElement({
        prompt: activePrompt,
        mode,
        custom_bg: customBg,
        color,
        model: config.model,
        base_url: config.baseUrl,
        api_key: config.apiKey,
        glass_mode: glassMode,
        reference_image: referenceImage || '',
        reference_similarity: referenceSimilarity,
      });

      const newElem = {
        id: `elem_${Date.now()}`,
        title: activePrompt.slice(0, 24),
        prompt: activePrompt,
        mode,
        image_base64: result.image_base64,
        created_at: new Date().toISOString(),
        qc_report: result.qc_report,
      };

      setCurrentElement(newElem);
      setIsInpainting(false);
      setIsHdActive(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      showToast('Elemen grafis berhasil dibuat dengan latar bersih!', 'success');
    } catch (err) {
      showToast(`Gagal membuat elemen: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Eksekusi Pembuatan Tipografi 3D Pop-Up Bebas
  const handleGenerateTypography = async () => {
    const raw = typographyText.trim();
    if (!raw) {
      showToast('Harap masukkan instruksi tulisan 3D terlebih dahulu.', 'warning');
      return;
    }

    setIsGenerating(true);
    showToast(`Mencetak tipografi 3D...`, 'info');

    try {
      // Pastikan instruksi Mas Bima diproses murni tanpa dipaksa cetakan balon kaku
      let composedPrompt = raw;
      if (!/isolated|background|latar/i.test(raw)) {
        composedPrompt = `${raw}, 3D typography cutout graphic asset, sharp edges`;
      }

      const result = await generateElement({
        prompt: composedPrompt,
        mode: 'no_bg',
        model: config.model,
        base_url: config.baseUrl,
        api_key: config.apiKey,
        glass_mode: false,
        reference_image: referenceImage || '',
        reference_similarity: referenceSimilarity,
      });

      const newElem = {
        id: `elem_typo_${Date.now()}`,
        title: `3D: ${raw.slice(0, 24)}`,
        prompt: composedPrompt,
        mode: 'no_bg',
        image_base64: result.image_base64,
        created_at: new Date().toISOString(),
        qc_report: result.qc_report,
        is_typography: true,
      };

      setCurrentElement(newElem);
      setIsInpainting(false);
      setIsHdActive(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      showToast('Tipografi 3D pop-up berhasil dicetak dengan latar bersih!', 'success');
    } catch (err) {
      showToast(`Gagal mencetak tipografi 3D: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Eksekusi Pembuatan Wallpaper & Background Device
  const handleGenerateWallpaper = async () => {
    const raw = wallpaperPrompt.trim();
    if (!raw) {
      showToast('Harap masukkan ide wallpaper terlebih dahulu.', 'warning');
      return;
    }

    const t = selectedWallpaperTemplate || getDefaultTemplate('desktop');
    setIsGenerating(true);
    if (referenceImage) {
      showToast(`Membuat wallpaper ${t.model} berdasarkan inspirasi foto...`, 'info');
    } else {
      showToast(`Membuat wallpaper untuk ${t.model} (${t.width} × ${t.height} px)...`, 'info');
    }

    try {
      const result = await generateElement({
        prompt: raw,
        mode: 'wallpaper',
        model: config.model,
        base_url: config.baseUrl,
        api_key: config.apiKey,
        reference_image: referenceImage || '',
        reference_similarity: referenceSimilarity,
        aspect_ratio: t.aspectRatio || '16:9',
        target_width: t.width,
        target_height: t.height,
      });

      const newElem = {
        id: `elem_wall_${Date.now()}`,
        title: `Wallpaper: ${t.model}`,
        prompt: raw,
        mode: 'wallpaper',
        image_base64: result.image_base64,
        created_at: new Date().toISOString(),
        is_wallpaper: true,
        device_model: t.model,
        device_brand: t.brand,
        dimensions: `${t.width}x${t.height}`,
        aspect_ratio: t.aspectRatio,
      };

      setCurrentElement(newElem);
      setIsInpainting(false);
      setIsHdActive(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      showToast(`Wallpaper ${t.model} berhasil dibuat!`, 'success');
    } catch (err) {
      showToast(`Gagal membuat wallpaper: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Eksekusi Buat Ulang (Regenerate)
  const handleRegenerate = async () => {
    if (activeTab === 'wallpaper') {
      await handleGenerateWallpaper();
    } else if (activeTab === 'typography') {
      await handleGenerateTypography();
    } else {
      const fallbackPrompt = (currentElement && currentElement.prompt) || '';
      const targetPrompt = prompt.trim() || fallbackPrompt;
      if (!prompt.trim() && fallbackPrompt) {
        setPrompt(fallbackPrompt);
      }
      await handleGenerate(targetPrompt);
    }
  };

  // Simpan Elemen Aktif ke Penyimpanan Lokal IndexedDB
  const handleSaveToCollection = async () => {
    if (!currentElement) return;
    try {
      await saveElement(currentElement);
      // Perbarui daftar state koleksi (ganti jika sudah ada, atau tambahkan di awal jika baru)
      setElements((prev) => {
        const exists = prev.some((item) => item.id === currentElement.id);
        if (exists) {
          return prev.map((item) => (item.id === currentElement.id ? currentElement : item));
        }
        return [currentElement, ...prev];
      });
      showToast('Elemen berhasil disimpan ke dalam Koleksi!', 'success');
    } catch (err) {
      showToast(`Gagal menyimpan elemen: ${err.message}`, 'error');
    }
  };

  // Eksekusi Peningkatan Ketajaman HD (Upscale 2x Nyata dengan AI Super Resolution & Progres %)
  const handleUpscale = async (scale = 2) => {
    if (!currentElement) return;
    setIsUpscaling(true);
    setUpscaleProgress({ percent: 5, message: 'Menyiapkan gambar untuk mesin AI...' });
    showToast(`Meningkatkan ketajaman HD (${scale}x)...`, 'info');

    try {
      let inputBase64 = currentElement.image_base64;
      // Konversi SVG ke PNG resolusi tinggi terlebih dahulu jika berkas berupa SVG
      if (inputBase64.startsWith('data:image/svg+xml') || inputBase64.includes('<svg')) {
        setUpscaleProgress({ percent: 10, message: 'Merender kurva vektor ke resolusi tinggi...' });
        showToast('Merender kurva vektor ke resolusi tinggi...', 'info');
        inputBase64 = await rasterizeSvgToPng(inputBase64, 1024);
      }

      const res = await upscaleElementStream(
        {
          image_base64: inputBase64,
          scale,
        },
        (progress, message) => {
          setUpscaleProgress({ percent: progress, message });
        }
      );

      const updatedElem = {
        ...currentElement,
        image_base64: res.image_base64,
        dimensions: res.dimensions,
        is_hd: true,
        metrics: res.metrics,
        original_image_base64: currentElement.original_image_base64 || currentElement.image_base64,
      };
      setCurrentElement(updatedElem);
      setIsHdActive(true);

      // SINKRONISASI OTOMATIS KE KOLEKSI & INDEXEDDB
      try {
        await saveElement(updatedElem);
        setElements((prev) =>
          prev.map((item) => (item.id === updatedElem.id ? updatedElem : item))
        );
      } catch (saveErr) {
        console.warn('Gagal autosave elemen HD ke koleksi:', saveErr);
      }

      showToast(`Ketajaman gambar berhasil ditingkatkan menjadi ${res.dimensions} px (HD Nyata ✨)!`, 'success');
    } catch (err) {
      showToast(`Gagal meningkatkan resolusi: ${err.message}`, 'error');
      setIsHdActive(false);
    } finally {
      setIsUpscaling(false);
      setUpscaleProgress({ percent: 0, message: '' });
    }
  };

  // Sakelar Tingkatkan HD (Toggle Nyata)
  const handleToggleHd = async () => {
    if (isHdActive) {
      // Kembalikan ke gambar asli jika dinonaktifkan
      if (currentElement && currentElement.original_image_base64) {
        const restoredElem = {
          ...currentElement,
          image_base64: currentElement.original_image_base64,
          is_hd: false,
          dimensions: undefined,
        };
        setCurrentElement(restoredElem);
        try {
          await saveElement(restoredElem);
          setElements((prev) =>
            prev.map((item) => (item.id === restoredElem.id ? restoredElem : item))
          );
        } catch (e) {}
      }
      setIsHdActive(false);
      showToast('Mode HD dinonaktifkan (kembali ke ukuran standar).', 'info');
    } else {
      await handleUpscale(2);
    }
  };

  // Eksekusi Unduh Berkas Elemen (PNG Resolusi Asli / HD 2048px)
  const handleDownloadElement = (elem) => {
    const target = elem || currentElement;
    if (!target || !target.image_base64) {
      showToast('Tidak ada gambar yang dapat diunduh.', 'error');
      return;
    }

    try {
      const isSvg = target.image_base64.startsWith('data:image/svg+xml');
      const isHd = target.is_hd || false;
      const cleanTitle = (target.title || target.prompt || 'elemen')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 30);
      const filename = `${cleanTitle}_${isHd ? '2048px_HD' : 'clean'}.${isSvg ? 'svg' : 'png'}`;

      if (isSvg) {
        let svgContent = target.svg_code;
        if (!svgContent && target.image_base64 && target.image_base64.includes(',')) {
          const commaIndex = target.image_base64.indexOf(',');
          const rawPart = target.image_base64.slice(commaIndex + 1);
          if (target.image_base64.includes(';base64,')) {
            const binaryStr = window.atob(rawPart);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            svgContent = new TextDecoder('utf-8').decode(bytes);
          } else {
            svgContent = decodeURIComponent(rawPart);
          }
        }
        const blob = new Blob([svgContent || target.image_base64], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Konversi Data URL base64 ke Blob biner murni agar tidak terpotong oleh browser pada resolusi besar
        const parts = target.image_base64.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'image/png';
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      showToast(`Gambar "${filename}" berhasil diunduh ke laptop!`, 'success');
    } catch (err) {
      showToast(`Gagal mengunduh gambar: ${err.message}`, 'error');
    }
  };

  // Salin Gambar PNG Transparan Langsung ke Papan Klip (Ctrl + C)
  const handleCopyElement = async (elem) => {
    const target = elem || currentElement;
    if (!target || !target.image_base64) return;

    try {
      const pngDataUrl = await ensurePngDataUrl(target.image_base64);
      const parts = pngDataUrl.split(';base64,');
      const raw = window.atob(parts[1]);
      const uInt8Array = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: 'image/png' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Gambar PNG berhasil disalin ke papan klip! Siap ditempel.', 'success');
    } catch (err) {
      try {
        await navigator.clipboard.writeText(target.image_base64);
        showToast('Data gambar berhasil disalin ke papan klip!', 'success');
      } catch (fallbackErr) {
        showToast('Gagal menyalin gambar ke papan klip.', 'error');
      }
    }
  };

  // Hapus Elemen dari Koleksi & IndexedDB (Mendukung ID tunggal maupun Array ID)
  const handleDeleteElement = async (idOrIds) => {
    const idsToRemove = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    if (!idsToRemove.length) return;

    try {
      await Promise.all(idsToRemove.map((id) => removeStoredElement(id)));
      const idSet = new Set(idsToRemove);

      setElements((prevElements) => {
        const nextElements = prevElements.filter((item) => !idSet.has(item.id));

        setCurrentElement((prevCurrent) => {
          if (!prevCurrent || !idSet.has(prevCurrent.id)) {
            return prevCurrent;
          }
          return nextElements.length > 0 ? nextElements[0] : null;
        });

        return nextElements;
      });

      const message = idsToRemove.length > 1
        ? `${idsToRemove.length} elemen berhasil dihapus dari koleksi.`
        : 'Elemen berhasil dihapus dari koleksi.';
      showToast(message, 'info');
    } catch (err) {
      showToast(`Gagal menghapus elemen: ${err.message}`, 'error');
    }
  };

  // Perbarui Elemen di Koleksi (misal Ubah Nama)
  const handleUpdateElement = async (updatedElem) => {
    try {
      await saveElement(updatedElem);
      setElements((prev) =>
        prev.map((item) => (item.id === updatedElem.id ? updatedElem : item))
      );
      if (currentElement && currentElement.id === updatedElem.id) {
        setCurrentElement(updatedElem);
      }
      showToast('Nama elemen berhasil diperbarui!', 'success');
    } catch (err) {
      showToast(`Gagal memperbarui elemen: ${err.message}`, 'error');
    }
  };

  // Unggah Gambar Manual dari Komputer ke Koleksi
  const handleUploadElement = async (newElem) => {
    try {
      await saveElement(newElem);
      setElements((prev) => [newElem, ...prev]);
      setCurrentElement(newElem);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      showToast('Gambar berhasil diunggah ke koleksi!', 'success');
    } catch (err) {
      showToast(`Gagal menyimpan gambar unggahan: ${err.message}`, 'error');
    }
  };

  // Tangani pemasangan gambar referensi dengan konversi otomatis ke PNG Data URL
  const handleSetReferenceImage = async (rawDataUrl) => {
    if (!rawDataUrl) {
      setReferenceImage(null);
      return;
    }
    try {
      const pngUrl = await ensurePngDataUrl(rawDataUrl, 1024);
      setReferenceImage(pngUrl);
    } catch (err) {
      console.warn('Gagal memproses gambar referensi ke format PNG:', err);
      setReferenceImage(rawDataUrl);
    }
  };

  // Fungsi terpadu saat elemen dipilih dari koleksi (GalleryDrawer & FullGalleryView)
  const handleSelectCollectionElement = (elem) => {
    if (!elem) return;
    setCurrentElement(elem);
    if (elem.prompt) setPrompt(elem.prompt);
    if (elem.mode) setMode(elem.mode);
    setIsInpainting(false);
    setIsHdActive(!!elem.is_hd);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    if (elem.is_typography) {
      setActiveTab('typography');
      setTypographyText(elem.title?.replace(/^3D:\s*/, '') || elem.prompt || '');
    } else if (elem.is_wallpaper || elem.mode === 'wallpaper') {
      setActiveTab('wallpaper');
      setWallpaperPrompt(elem.prompt || '');
    } else {
      setActiveTab('objects');
    }
    showToast(`Elemen "${elem.title || 'elemen'}" dibuka di meja kanvas!`, 'success');
  };

  // Konversi Elemen Menjadi Format Kurva Vektor (SVG)
  const handleVectorize = async (method = 'ai_vision') => {
    if (!currentElement) return;
    setIsVectorizing(true);
    if (method === 'ai_vision') {
      showToast('AI Vision sedang memahami bentuk objek dan mendesain ulang kurva SVG...', 'info');
    } else {
      showToast('Menjiplak kurva vektor tajam (SVG)...', 'info');
    }

    try {
      const res = await vectorizeElement({
        image_base64: currentElement.image_base64,
        num_colors: 16,
        method,
        base_url: config.baseUrl,
        api_key: config.apiKey,
        model: config.model,
      });

      const updatedElem = {
        ...currentElement,
        image_base64: res.image_base64,
        is_vector: true,
        svg_code: res.svg_code,
      };
      setCurrentElement(updatedElem);
      await saveElement(updatedElem);
      setElements((prev) =>
        prev.map((item) => (item.id === updatedElem.id ? updatedElem : item))
      );
      const modeLabel = res.method === 'ai_vision' ? 'Desain Ulang AI' : 'Jiplak Cepat';
      showToast(`Gambar berhasil diubah menjadi format Vektor SVG (${modeLabel}) tanpa batas pembesaran!`, 'success');
    } catch (err) {
      showToast(`Gagal mengonversi ke vektor: ${err.message}`, 'error');
    } finally {
      setIsVectorizing(false);
    }
  };

  // Eksekusi Revisi / Penambahan Objek Konsisten Menggunakan Alur Vision AI Mas Bima
  const handleReviseElement = async (maskBase64 = '') => {
    if (!currentElement) {
      showToast('Belum ada elemen di meja kanvas untuk direvisi.', 'error');
      return;
    }
    if (!revisionPrompt.trim()) {
      showToast('Silakan ketik instruksi tambah atau hapus objek pada kolom teks di atas.', 'error');
      return;
    }

    setIsRevising(true);
    setRevisingStatus('AI Vision sedang menganalisis gambar asli...');
    showToast('AI Vision sedang membaca gambar & meracik objek konsisten...', 'info');

    try {
      let inputBase64 = currentElement.image_base64;
      if (inputBase64.startsWith('data:image/svg+xml') || inputBase64.includes('<svg')) {
        setRevisingStatus('Merender kurva vektor ke citra PNG...');
        inputBase64 = await rasterizeSvgToPng(inputBase64, 1024);
      }

      const effectiveMode = currentElement.mode || (activeTab === 'wallpaper' ? 'wallpaper' : mode);
      const shouldRemoveBg = effectiveMode === 'no_bg' && activeTab !== 'wallpaper' && !currentElement.is_wallpaper;

      const activeModel = config.inpaintModel || config.model || '';
      const res = await reviseElement({
        imageBase64: inputBase64,
        instruction: revisionPrompt.trim(),
        originalPrompt: currentElement ? (currentElement.prompt || currentElement.title || '') : '',
        maskBase64: maskBase64 || '',
        model: activeModel,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        noBg: shouldRemoveBg,
      });

      setRevisingStatus('Menyelesaikan pemotongan latar belakang...');

      const updatedElem = {
        ...currentElement,
        id: Date.now().toString(),
        image_base64: res.image_base64,
        prompt: res.prompt_used || `${currentElement.prompt || ''} + ${revisionPrompt}`,
        qc_report: res.qc_report || null,
        created_at: new Date().toISOString(),
        is_hd: false,
        dimensions: undefined,
        original_image_base64: undefined,
        is_vector: false,
        svg_code: undefined,
      };
      setCurrentElement(updatedElem);
      setIsInpainting(false);
      setIsHdActive(false);
      setRevisionPrompt('');
      showToast('Objek berhasil diperbarui secara konsisten!', 'success');
    } catch (err) {
      console.error('Revise element error:', err);
      showToast(`Gagal merevisi elemen: ${err.message}`, 'error');
    } finally {
      setIsRevising(false);
      setRevisingStatus('');
    }
  };

  // PINTASAN KEYBOARD GLOBAL (GENERAL KEY COMBO: Ctrl+C, Ctrl+V, Ctrl+S, Ctrl+Enter, Zoom)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputFocused = activeTag === 'input' || activeTag === 'textarea';

      // 1. Ctrl + Enter: Eksekusi Perintah Pembuatan Elemen
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'wallpaper') {
          if (wallpaperPrompt.trim() && !isGenerating) {
            handleGenerateWallpaper();
          }
        } else if (activeTab === 'typography') {
          if (typographyText.trim() && !isGenerating) {
            handleGenerateTypography();
          }
        } else {
          if (prompt.trim() && !isGenerating) {
            handleGenerate();
          }
        }
        return;
      }

      // Jika sedang fokus mengetik di kolom input, biarkan pengetikan normal
      if (isInputFocused) return;

      // 2. Ctrl + C: Salin PNG Elemen Aktif ke Clipboard Komputer
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (currentElement) {
          e.preventDefault();
          handleCopyElement(currentElement);
        }
      }

      // 3. Ctrl + S: Simpan Elemen Aktif ke Koleksi Internal Studio
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (currentElement) {
          handleSaveToCollection();
        }
      }

      // 4. Ctrl + + / = : Perbesar Gambar (Zoom In)
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
        showToast('Memperbesar tampilan (+25%)', 'info');
      }

      // 5. Ctrl + - / _ : Perkecil Gambar (Zoom Out)
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.25));
        showToast('Memperkecil tampilan (-25%)', 'info');
      }

      // 6. Ctrl + 0 : Reset Ukuran Kanvas ke 100% Pas
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    // 7. Ctrl + V: Tempel Gambar dari Clipboard Luar Langsung ke Kanvas Studio
    const handlePaste = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            handlePasteImage(file);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [currentElement, prompt, isGenerating, mode, customBg, color, config, activeTab, typographyText, typographyStyle, typographyColor, wallpaperPrompt, glassMode]);

  return (
    <div className="flex flex-col h-screen w-screen studio-background text-slate-100 overflow-hidden font-sans">
      {/* 1. BILAH ATAS (TOP HEADER) - DILENGKAPI DENGAN TAB MODE KERJA STUDIO */}
      <Header
        isOnline={isOnline}
        currentModel={config.model}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onCheckHealth={handleCheckHealth}
        isChecking={isCheckingHealth}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setActiveTab(tab);
            if (tab === 'collection') {
              setIsGalleryOpen(false); // Sembunyikan drawer kanan agar galeri tengah 100% lega
            }
          }
        }}
      />

      {/* 2. AREA UTAMA (SIDEBAR KIRI + WORKSPACE TENGAH + SIDEBAR KANAN KOLEKSI) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* BILAH SISI KIRI (PANEL KENDALI & PENGETIKAN PROMPT STUDIO) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'settings') {
              setIsSettingsOpen(true);
            } else {
              setActiveTab(tab);
              if (tab === 'collection') {
                setIsGalleryOpen(false);
              }
            }
          }}
          prompt={prompt}
          onChangePrompt={setPrompt}
          mode={mode}
          onChangeMode={setMode}
          customBg={customBg}
          onChangeCustomBg={setCustomBg}
          color={color}
          onChangeColor={setColor}
          glassMode={glassMode}
          onToggleGlassMode={() => setGlassMode((prev) => !prev)}
          onSubmitObject={handleGenerate}
          wallpaperPrompt={wallpaperPrompt}
          onChangeWallpaperPrompt={setWallpaperPrompt}
          selectedWallpaperTemplate={selectedWallpaperTemplate}
          onSelectWallpaperTemplate={setSelectedWallpaperTemplate}
          customWallpaperDimensions={customWallpaperDimensions}
          onApplyCustomWallpaperDimensions={setCustomWallpaperDimensions}
          onSubmitWallpaper={handleGenerateWallpaper}
          typographyText={typographyText}
          onChangeTypographyText={setTypographyText}
          onSubmitTypography={handleGenerateTypography}
          isLoading={isGenerating}
          config={config}
          onShowToast={showToast}
          referenceImage={referenceImage}
          onSelectReferenceImage={handleSetReferenceImage}
          referenceSimilarity={referenceSimilarity}
          elementsCount={elements.length}
          onAddNewElement={() => {
            handleCreateNewElement();
            setActiveTab('objects');
          }}
        />

        {/* WORKSPACE TENGAH: GALERI FULL INVENTORY ATAU KANVAS KERJA */}
        <main className="flex-1 flex flex-col overflow-hidden px-6 py-3 gap-3 min-w-0">
          {activeTab === 'collection' ? (
            <FullGalleryView
              elements={elements}
              onSelectElement={handleSelectCollectionElement}
              onDeleteElement={handleDeleteElement}
              onCopyElement={handleCopyElement}
              onDownloadElement={handleDownloadElement}
              onAddNewElement={() => {
                handleCreateNewElement();
                setActiveTab('objects');
              }}
              onUploadElement={handleUploadElement}
              onUpdateElement={handleUpdateElement}
            />
          ) : (
            <>
              {/* 1. BILAH ALAT KANVAS DI ATAS */}
              <div className="flex-shrink-0 w-full relative z-40">
                <CanvasToolbar
                  bgTestMode={bgTestMode}
                  onChangeBgTestMode={setBgTestMode}
                  isInpainting={isInpainting}
                  onToggleInpaint={() => setIsInpainting((prev) => !prev)}
                  brushSize={brushSize}
                  onChangeBrushSize={setBrushSize}
                  revisionPrompt={revisionPrompt}
                  onChangeRevisionPrompt={setRevisionPrompt}
                  onSubmitRevision={() => handleReviseElement()}
                  isRevising={isRevising}
                  isHdActive={isHdActive}
                  onToggleHd={handleToggleHd}
                  isUpscaling={isUpscaling}
                  hasElement={!!currentElement}
                  isVectorizing={isVectorizing}
                  onVectorize={handleVectorize}
                />
              </div>

              {/* 2. ZONA MEJA INSPEKSI & KANVAS PRATINJAU */}
              <div className="flex-1 flex items-center justify-center min-h-0 w-full overflow-hidden">
                <PreviewCanvas
                  currentElement={currentElement}
                  onRegenerate={handleRegenerate}
                  onSaveToCollection={handleSaveToCollection}
                  onDownload={handleDownloadElement}
                  isGenerating={isGenerating}
                  isRevising={isRevising}
                  revisingStatus={revisingStatus}
                  isUpscaling={isUpscaling}
                  upscaleProgress={upscaleProgress}
                  onSubmitInpaint={(maskBase64) => handleReviseElement(maskBase64)}
                  isInpainting={isInpainting}
                  onToggleInpaint={() => setIsInpainting((prev) => !prev)}
                  brushSize={brushSize}
                  onChangeBrushSize={setBrushSize}
                  revisionPrompt={revisionPrompt}
                  onChangeRevisionPrompt={setRevisionPrompt}
                  bgTestMode={bgTestMode}
                  zoom={zoom}
                  onChangeZoom={setZoom}
                  pan={pan}
                  onChangePan={setPan}
                  onResetZoom={handleResetZoom}
                  referenceImage={referenceImage}
                  onSelectReferenceImage={handleSetReferenceImage}
                  onClearReferenceImage={() => setReferenceImage(null)}
                  referenceSimilarity={referenceSimilarity}
                  onChangeReferenceSimilarity={setReferenceSimilarity}
                  isWallpaperMode={activeTab === 'wallpaper'}
                  wallpaperTemplate={selectedWallpaperTemplate}
                />
              </div>
            </>
          )}
        </main>

        {/* BILAH SISI KANAN (SIDEBAR KOLEKSI ELEMEN AKSES CEPAT - HANYA TAMPIL SAAT DI MODE KANVAS) */}
        {activeTab !== 'collection' && (
          <GalleryDrawer
            isOpen={isGalleryOpen}
            onToggleOpen={() => setIsGalleryOpen((prev) => !prev)}
            elements={elements}
            activeElementId={currentElement ? currentElement.id : null}
            onSelectElement={handleSelectCollectionElement}
            onDeleteElement={handleDeleteElement}
            onCopyElement={handleCopyElement}
            onDownloadElement={handleDownloadElement}
            onAddNewElement={handleCreateNewElement}
            onUploadElement={handleUploadElement}
            onUpdateElement={handleUpdateElement}
          />
        )}
      </div>

      {/* 3. MODAL PENGATURAN 9ROUTER & MODEL AI */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {/* 4. NOTIFIKASI TOAST MELAYANG */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold border backdrop-blur-md transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 text-amber-200 border-amber-500/30'
              : 'bg-blue-950/90 text-blue-200 border-blue-500/30'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
