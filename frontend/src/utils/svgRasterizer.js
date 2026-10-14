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
