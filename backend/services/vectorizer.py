import base64
import numpy as np
from PIL import Image
import skimage.measure


def image_to_svg(image: Image.Image, num_colors: int = 16, max_dim: int = 512) -> str:
    """
    Mengonversi gambar bitmap (PNG/RGBA) menjadi format kurva vektor SVG.
    Sangat berguna untuk desainer grafis poster yang ingin mencetak dalam ukuran baliho
    tanpa pecah (resolusi tak terbatas).
    """
    if image.mode != "RGBA":
        image_rgba = image.convert("RGBA")
    else:
        image_rgba = image.copy()

    # Sesuaikan ukuran agar proses kurva vektor berjalan secepat kilat (< 1 detik)
    w, h = image_rgba.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        image_rgba = image_rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)
        w, h = new_w, new_h

    # Dapatkan saluran transparansi (alpha)
    alpha = np.array(image_rgba)[:, :, 3]
    visible_mask = alpha > 40

    # Kuantisasi warna menjadi palet warna dominan (Image Trace)
    # Gunakan gambar RGB dengan latar netral untuk palet
    rgb_img = image_rgba.convert("RGB")
    quantized = rgb_img.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette()

    quant_np = np.array(quantized)

    svg_paths = []

    # Iterasi setiap layer warna untuk mengekstrak kontur vektor
    for color_idx in range(num_colors):
        if not palette or len(palette) < (color_idx + 1) * 3:
            continue
        color_rgb = palette[color_idx * 3 : color_idx * 3 + 3]
        if len(color_rgb) < 3:
            continue
        hex_color = f"#{color_rgb[0]:02x}{color_rgb[1]:02x}{color_rgb[2]:02x}"

        # Masker piksel untuk warna ini yang tidak transparan
        layer_mask = (quant_np == color_idx) & visible_mask
        if not np.any(layer_mask):
            continue

        # Ekstrak kontur kurva menggunakan marching squares (skimage)
        contours = skimage.measure.find_contours(layer_mask.astype(float), 0.5)

        for contour in contours:
            # Lewati kontur yang terlalu kecil (noise piksel liar)
            if len(contour) < 4:
                continue

            # Buat perintah path SVG
            # Catatan: skimage menghasilkan koordinat (baris/y, kolom/x)
            pts = [f"{pt[1]:.1f} {pt[0]:.1f}" for pt in contour]
            d = f"M {pts[0]} L " + " L ".join(pts[1:]) + " Z"
            svg_paths.append(f'  <path d="{d}" fill="{hex_color}" stroke="{hex_color}" stroke-width="0.5" stroke-linejoin="round" />')

    # Susun berkas SVG lengkap
    svg_header = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
    svg_body = "\n".join(svg_paths)
    svg_footer = "</svg>"

    return f"{svg_header}\n{svg_body}\n{svg_footer}"


def svg_to_data_uri(svg_str: str) -> str:
    """
    Mengonversi string SVG menjadi format Data URI base64.
    """
    b64 = base64.b64encode(svg_str.encode("utf-8")).decode("utf-8")
    return f"data:image/svg+xml;base64,{b64}"
