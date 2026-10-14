/**
 * Utilitas Pengonversi Vektor SVG ke Citra Resolusi Tinggi (PNG) di Peramban
 * Memungkinkan elemen bawaan atau kurva vektor dirender ke bitmap resolusi tinggi
 * sebelum diproses oleh mesin penajam HD atau mesin pemotong latar belakang.
 */

export function rasterizeSvgToPng(svgDataUri, targetSize = 1024) {
  return new Promise((resolve, reject) => {
    try {
      let src = svgDataUri;
      if (!src.startsWith('data:image/svg+xml')) {
        src = `data:image/svg+xml;utf8,${encodeURIComponent(svgDataUri)}`;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Gagal menginisialisasi kanvas 2D untuk konversi'));
          return;
        }

        // Gambar SVG pada kanvas beresolusi tinggi dengan interpolasi halus
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetSize, targetSize);

        // Ekspor ke data URL format PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      };

      img.onerror = (err) => {
        reject(new Error(`Gagal memuat gambar SVG untuk konversi: ${err}`));
      };

      img.src = src;
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Memastikan data URI gambar berada dalam format PNG murni.
 * Jika sudah PNG, langsung dikembalikan.
 * Jika berupa SVG, dikonversi menggunakan rasterizeSvgToPng.
 * Jika format citra lain (JPEG, WebP, dsb.), digambar ke kanvas HTML dan diekspor ke PNG.
 */
export async function ensurePngDataUrl(dataUrl, targetMaxDim = 1024) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return dataUrl;
  }

  // Jika sudah PNG murni
  if (dataUrl.startsWith('data:image/png;base64,')) {
    return dataUrl;
  }

  // Jika berupa SVG
  if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.includes('<svg')) {
    return await rasterizeSvgToPng(dataUrl, targetMaxDim);
  }

  // Format citra lain (JPEG, WebP, dsb.)
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || targetMaxDim;
        canvas.height = img.naturalHeight || img.height || targetMaxDim;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Gagal menginisialisasi kanvas 2D untuk konversi PNG'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = (err) => {
        reject(new Error(`Gagal memuat gambar untuk konversi PNG: ${err}`));
      };

      img.src = dataUrl;
    } catch (e) {
      reject(e);
    }
  });
}
