/**
 * Layanan Komunikasi API Backend Element Maker
 * Menghubungkan antarmuka React dengan server backend FastAPI mandiri.
 */

// Deteksi apakah aplikasi berjalan di dalam aplikasi desktop mandiri (Tauri)
const isDesktopApp = typeof window !== 'undefined' && Boolean(
  window.__TAURI_INTERNALS__ ||
  window.__TAURI__ ||
  window.location.protocol === 'tauri:' ||
  window.location.protocol === 'asset:' ||
  window.location.hostname === 'tauri.localhost'
);

const API_BASE = isDesktopApp ? 'http://127.0.0.1:8009/api' : '/api';

/**
 * Memeriksa status kesehatan server backend dan ketersediaan mesin potong background (rembg).
 * @returns {Promise<{status: string, service: string, rembg_ready: boolean}>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Server backend tidak merespons (Status: ${res.status})`);
  }
  return res.json();
}

/**
 * Mengambil daftar model AI aktif dari 9Router atau gerbang AI yang ditentukan.
 * @param {string} baseUrl - Alamat server gerbang (default: http://localhost:20128/v1)
 * @param {string} apiKey - Kunci API jika diperlukan
 * @returns {Promise<{status: string, models: string[]}>}
 */
export async function getAvailableModels(baseUrl = 'http://localhost:20128/v1', apiKey = '') {
  const params = new URLSearchParams({
    base_url: baseUrl,
    api_key: apiKey,
  });
  const res = await fetch(`${API_BASE}/models?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Gagal mengambil daftar model AI (Status: ${res.status})`);
  }
  return res.json();
}

/**
 * Membuat elemen baru berdasarkan teks instruksi prompt dan mode latar belakang.
 * @param {Object} params
 * @param {string} params.prompt - Teks elemen yang ingin dibuat
 * @param {'no_bg'|'plain_bg'|'custom_bg'} params.mode - Mode latar belakang
 * @param {string} [params.custom_bg] - Deskripsi suasana latar jika mode custom_bg
 * @param {string} [params.color] - Kode heksadesimal warna latar jika mode plain_bg
 * @param {string} [params.model] - Nama model generator AI
 * @param {string} [params.base_url] - Alamat gerbang 9Router
 * @param {string} [params.api_key] - Kunci API
 * @returns {Promise<{status: string, image_base64: string, prompt_used: string, mode: string, qc_report?: any}>}
 */
export async function generateElement({
  prompt,
  mode = 'no_bg',
  custom_bg = '',
  color = '#FFFFFF',
  model = '',
  base_url = 'http://localhost:20128/v1',
  api_key = '',
  glass_mode = false,
  reference_image = '',
  reference_similarity = 80,
  aspect_ratio = '',
  target_width = null,
  target_height = null,
}) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      mode,
      custom_bg,
      color,
      model,
      base_url,
      api_key,
      glass_mode,
      reference_image,
      reference_similarity,
      aspect_ratio,
      target_width,
      target_height,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Gagal menghasilkan elemen dengan AI');
  }
  return data;
}

/**
 * Memperbaiki atau menyulam bagian objek gambar menggunakan masker kuas (inpainting).
 * @param {Object} params
 * @param {string} params.image_base64 - Gambar asli dalam format base64
 * @param {string} params.mask_base64 - Gambar masker area coretan dalam format base64
 * @param {string} params.prompt - Instruksi revisi perbaikan
 * @param {string} [params.original_prompt] - Prompt awal gambar asli
 * @param {string} [params.model] - Nama model edit (default: bawaan 9Router)
 * @param {string} [params.base_url] - Alamat gerbang 9Router
 * @param {string} [params.api_key] - Kunci API
 * @param {boolean} [params.no_bg] - Apakah hasil tetap dipotong tanpa latar belakang
 * @returns {Promise<{status: string, image_base64: string, prompt_used: string, qc_report?: any}>}
 */
export async function inpaintElement({
  image_base64,
  mask_base64,
  prompt,
  original_prompt = '',
  model = '',
  base_url = 'http://localhost:20128/v1',
  api_key = '',
  no_bg = true,
}) {
  const res = await fetch(`${API_BASE}/inpaint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64,
      mask_base64,
      prompt,
      original_prompt,
      model,
      base_url,
      api_key,
      no_bg,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Gagal memperbaiki bagian elemen gambar');
  }
  return data;
}

/**
 * Merevisi atau menambah/menghapus objek pada gambar secara konsisten menggunakan alur AI Vision.
 * @param {Object} params
 * @param {string} params.imageBase64 - Gambar kanvas aktif
 * @param {string} params.instruction - Instruksi tambah/hapus objek
 * @param {string} [params.originalPrompt] - Deskripsi prompt awal
 * @param {string} [params.maskBase64] - Gambar mask kuas arsir jika ada
 * @param {string} [params.model] - Model gambar AI
 * @param {string} [params.visionModel] - Model vision AI
 * @param {string} [params.baseUrl] - URL 9Router
 * @param {string} [params.apiKey] - Kunci API
 * @param {boolean} [params.noBg] - Bersihkan latar belakang (transparan)
 * @returns {Promise<{status: string, image_base64: string, prompt_used: string, vision_analysis: string, qc_report?: any}>}
 */
export async function reviseElement({
  imageBase64,
  instruction,
  originalPrompt = '',
  maskBase64 = '',
  model = '',
  visionModel = '',
  baseUrl = 'http://localhost:20128/v1',
  apiKey = '',
  noBg = true,
}) {
  const res = await fetch(`${API_BASE}/revise-element`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: imageBase64,
      instruction,
      original_prompt: originalPrompt,
      mask_base64: maskBase64,
      model,
      vision_model: visionModel,
      base_url: baseUrl,
      api_key: apiKey,
      no_bg: noBg,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Gagal merevisi elemen dengan AI Vision');
  }
  return data;
}

/**
 * Memotong latar belakang gambar secara mandiri menggunakan modul QC.
 * @param {Object} params
 * @param {string} params.image_base64 - Gambar asal dalam format base64
 * @param {boolean} [params.refine_edges=true] - Aktifkan penghalusan tepian
 * @returns {Promise<{status: string, image_base64: string, qc_report: any}>}
 */
export async function removeBackground({ image_base64, refine_edges = true }) {
  const res = await fetch(`${API_BASE}/remove-bg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64,
      refine_edges,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Gagal memotong latar belakang gambar');
  }
  return data;
}

/**
 * Meningkatkan resolusi dan ketajaman gambar (Upscaling HD).
 * @param {Object} params
 * @param {string} params.image_base64 - Gambar asal dalam format base64
 * @param {number} [params.scale=2] - Faktor pembesaran (default: 2x)
 * @returns {Promise<{status: string, image_base64: string, scale: number, dimensions: string}>}
 */
export async function upscaleElement({ image_base64, scale = 2 }) {
  const res = await fetch(`${API_BASE}/upscale`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64,
      scale,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Gagal meningkatkan resolusi gambar');
  }
  return data;
}

/**
 * Meningkatkan resolusi dan ketajaman gambar (Upscaling HD) dengan pelaporan progres persentase realtime.
 * @param {Object} params
 * @param {string} params.image_base64 - Gambar asal dalam format base64
 * @param {number} [params.scale=2] - Faktor pembesaran (default: 2x)
 * @param {Function} [onProgress] - Callback (percent, message) untuk progres realtime
 * @returns {Promise<{status: string, image_base64: string, scale: number, dimensions: string}>}
 */
export async function upscaleElementStream({ image_base64, scale = 2 }, onProgress) {
  const res = await fetch(`${API_BASE}/upscale-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64,
      scale,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Gagal memulai peningkatan HD');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalResult = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || ''; // Sisa potongan yang belum lengkap

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed.startsWith('data:')) continue;
      let payload = null;
      try {
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        payload = JSON.parse(jsonStr);

        if (payload.type === 'progress') {
          if (onProgress) {
            onProgress(payload.progress, payload.message);
          }
        } else if (payload.type === 'done') {
          finalResult = payload.result;
          if (onProgress) {
            onProgress(100, 'Selesai! ✨');
          }
        } else if (payload.type === 'error') {
          throw new Error(payload.message || 'Peningkatan HD gagal');
        }
      } catch (parseErr) {
        if (payload?.type === 'error') throw parseErr;
        console.warn('Gagal membaca event stream:', parseErr);
      }
    }
  }

  if (!finalResult) {
    throw new Error('Tidak menerima hasil akhir dari mesin HD');
  }

  return finalResult;
}


/**
 * Mengoptimalkan ide prompt sederhana menjadi prompt poster visual berkualitas tinggi.
 * Optimizer sadar konteks: wajib dikirimi mode latar agar tidak menabur kata bertentangan.
 * @param {Object} params
 * @param {string} params.prompt - Teks prompt awal pengguna
 * @param {string} [params.model] - Model utama global (dipakai bila model chat)
 * @param {string} [params.optimizer_model] - Model khusus optimizer (kosongkan untuk otomatis pintar)
 * @param {string} [params.base_url] - Alamat 9Router
 * @param {string} [params.api_key] - Kunci API
 * @param {string} [params.mode] - Mode latar: no_bg | plain_bg | custom_bg
 * @param {string} [params.color] - Warna latar jika plain_bg
 * @param {string} [params.custom_bg] - Suasana latar jika custom_bg
 * @param {boolean} [params.glass_mode] - Benda bening (kaca & air)
 * @param {boolean} [params.is_typography] - True jika tipografi/teks 3D
 * @param {string} [params.reference_image] - Gambar referensi (base64) jika ada
 * @param {number} [params.reference_similarity] - Tingkat kemiripan referensi (60-100%)
 * @returns {Promise<{status: string, optimized_prompt: string, model_used?: string, reference_analysis?: string}>}
 */
export async function optimizePrompt({
  prompt,
  model = '',
  optimizer_model = '',
  base_url = 'http://localhost:20128/v1',
  api_key = '',
  mode = 'no_bg',
  color = '#FFFFFF',
  custom_bg = '',
  glass_mode = false,
  is_typography = false,
  reference_image = '',
  reference_similarity = 80,
}) {
  const res = await fetch(`${API_BASE}/optimize-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model,
      optimizer_model,
      base_url,
      api_key,
      mode,
      color,
      custom_bg,
      glass_mode,
      is_typography,
      reference_image,
      reference_similarity,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Gagal mengoptimalkan prompt');
  }
  return data;
}

/**
 * Mengonversi gambar elemen bitmap (PNG) menjadi kurva vektor murni (SVG).
 * @param {Object} params
 * @param {string} params.image_base64 - Gambar asal dalam format base64
 * @param {number} [params.num_colors=16] - Jumlah layer warna kurva
 * @returns {Promise<{status: string, svg_code: string, image_base64: string, colors_used: number}>}
 */
export async function vectorizeElement({
  image_base64,
  num_colors = 16,
  method = 'ai_vision',
  base_url = 'http://localhost:20128/v1',
  api_key = '',
  model = '',
}) {
  const res = await fetch(`${API_BASE}/vectorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64,
      num_colors,
      method,
      base_url,
      api_key,
      model,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Gagal mengonversi gambar ke kurva vektor SVG');
  }
  return data;
}

/**
 * Menguji sambungan secara nyata ke server provider AI.
 * @param {string} baseUrl - Alamat server
 * @param {string} apiKey - Kunci API
 * @param {string} provider - Nama provider
 * @returns {Promise<{status: string, message: string, latency_ms?: number, models_count?: number}>}
 */
export async function testConnection(baseUrl, apiKey = '', provider = 'custom') {
  const res = await fetch(`${API_BASE}/settings/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base_url: baseUrl,
      api_key: apiKey,
      provider,
    }),
  });
  return res.json();
}

/**
 * Mengambil daftar akun yang terhubung dan aktif di 9Router lokal.
 * @param {number} [port=20128]
 * @returns {Promise<{status: string, active: boolean, connections: Array, message?: string}>}
 */
export async function get9RouterAccounts(port = 20128) {
  const res = await fetch(`${API_BASE}/settings/9router-accounts?port=${port}`);
  return res.json();
}

