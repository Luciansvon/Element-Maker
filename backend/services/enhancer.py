"""
Modul Penajam Gambar Studio (Image Enhancer & Super Resolution Engine)
Meningkatkan resolusi dan ketajaman gambar secara nyata untuk kebutuhan cetak poster besar (HD).

Strategi 2 Lapis:
  1. UTAMA — Real-ESRGAN (AI Super Resolution): Mengisi detail baru yang realistis, bukan sekadar regangan.
  2. FALLBACK — Lanczos Halus: Jika Real-ESRGAN tidak tersedia, pakai perbesaran interpolasi
     dengan parameter yang lebih halus agar tidak kasar/bergerigi.
"""

import io
import os
import subprocess
import tempfile
import logging
from pathlib import Path
from PIL import Image, ImageFilter, ImageEnhance
from typing import Callable, Optional

# Batasi resolusi maksimal untuk keamanan memori (67.1 MP)
Image.MAX_IMAGE_PIXELS = 67_108_864

logger = logging.getLogger(__name__)

# Lokasi file executable Real-ESRGAN portable
REALESRGAN_DIR = Path(__file__).resolve().parent.parent / "tools" / "realesrgan"
REALESRGAN_EXE = REALESRGAN_DIR / "realesrgan-ncnn-vulkan.exe"

# Cek ketersediaan Real-ESRGAN saat modul dimuat
REALESRGAN_AVAILABLE = REALESRGAN_EXE.is_file()
if REALESRGAN_AVAILABLE:
    logger.info(f"Real-ESRGAN AI tersedia: {REALESRGAN_EXE}")
else:
    logger.warning(
        f"Real-ESRGAN AI TIDAK ditemukan di {REALESRGAN_EXE}. "
        "Fitur HD akan menggunakan fallback Lanczos (kualitas lebih rendah)."
    )


def _upscale_with_realesrgan(
    img: Image.Image,
    scale: int = 4,
    progress_cb: Optional[Callable] = None,
) -> Image.Image:
    """
    Membesarkan gambar menggunakan mesin AI Real-ESRGAN (ncnn-vulkan).
    Bekerja lewat subprocess: simpan gambar sementara > jalankan exe > baca hasil.
    """
    with tempfile.TemporaryDirectory(prefix="esrgan_") as tmpdir:
        input_path = os.path.join(tmpdir, "input.png")
        output_path = os.path.join(tmpdir, "output.png")

        # Simpan gambar input ke file sementara
        if progress_cb:
            progress_cb(10, "Menyiapkan gambar untuk mesin AI...")
        img.save(input_path, format="PNG")

        if progress_cb:
            progress_cb(20, "Menjalankan AI Super Resolution...")

        # Jalankan Real-ESRGAN dengan model yang tervalidasi di folder models/
        esrgan_scale = scale if scale in (2, 3, 4) else 4
        model_name = f"realesr-animevideov3-x{esrgan_scale}"
        x4plus_param = REALESRGAN_DIR / "models" / "realesrgan-x4plus.param"
        if x4plus_param.is_file() and esrgan_scale == 4:
            model_name = "realesrgan-x4plus"

        cmd = [
            str(REALESRGAN_EXE),
            "-i", input_path,
            "-o", output_path,
            "-s", str(esrgan_scale),
            "-n", model_name,
            "-f", "png",
        ]

        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                cwd=str(REALESRGAN_DIR),
            )

            # Pantau progres dari stderr Real-ESRGAN
            # Real-ESRGAN menuliskan progress percentage ke stderr
            stderr_output = []
            if process.stderr:
                for line in iter(process.stderr.readline, b""):
                    decoded = line.decode("utf-8", errors="ignore").strip()
                    stderr_output.append(decoded)
                    # Parse persentase jika tersedia (format: "xx.xx%")
                    if "%" in decoded:
                        try:
                            pct_str = decoded.split("%")[0].strip().split()[-1]
                            pct = float(pct_str)
                            # Skalakan 0-100% Real-ESRGAN menjadi 20-85% progres kita
                            mapped_pct = int(20 + (pct / 100) * 65)
                            if progress_cb:
                                progress_cb(mapped_pct, f"AI sedang memproses... {int(pct)}%")
                        except (ValueError, IndexError):
                            pass

            process.wait(timeout=120)

            if process.returncode != 0:
                err_msg = "\n".join(stderr_output)
                raise RuntimeError(f"Real-ESRGAN gagal (kode: {process.returncode}): {err_msg}")

        except subprocess.TimeoutExpired:
            process.kill()
            raise RuntimeError("Proses Real-ESRGAN melampaui batas waktu (120 detik).")
        except FileNotFoundError:
            raise RuntimeError("File executable Real-ESRGAN tidak ditemukan.")

        if progress_cb:
            progress_cb(88, "Membaca hasil AI Super Resolution...")

        # Baca gambar hasil
        if not os.path.exists(output_path):
            raise RuntimeError("Real-ESRGAN tidak menghasilkan file output.")

        result = Image.open(output_path)
        result.load()  # Pastikan data sudah dimuat sebelum temp dir dihapus

        return result


def _upscale_with_lanczos_smooth(
    img: Image.Image,
    scale: int = 2,
    progress_cb: Optional[Callable] = None,
) -> Image.Image:
    """
    Fallback: Perbesaran Lanczos dengan parameter HALUS.
    Berbeda dari versi lama yang terlalu agresif dan bikin kasar.
    """
    orig_w, orig_h = img.size
    target_w = int(orig_w * scale)
    target_h = int(orig_h * scale)

    has_alpha = img.mode == "RGBA"

    if progress_cb:
        progress_cb(15, "Memperbesar gambar dengan interpolasi Lanczos...")

    # Perbesaran Lanczos — metode interpolasi terbaik bawaan Pillow
    upscaled = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

    if progress_cb:
        progress_cb(50, "Menyempurnakan ketajaman secara halus...")

    if has_alpha:
        r, g, b, a = upscaled.split()
        rgb_img = Image.merge("RGB", (r, g, b))

        # Unsharp Mask HALUS — radius lebih kecil, percent lebih rendah, threshold lebih tinggi
        # Ini mencegah efek "kasar/bergerigi" yang terjadi di versi lama
        sharp_rgb = rgb_img.filter(
            ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=4)
        )

        if progress_cb:
            progress_cb(70, "Menyesuaikan kontras dan warna...")

        # Kontras SANGAT SEDIKIT — cukup memperjelas tanpa membuat kasar
        contrast_enhancer = ImageEnhance.Contrast(sharp_rgb)
        enhanced_rgb = contrast_enhancer.enhance(1.03)

        # Sharpness SANGAT SEDIKIT
        sharpness_enhancer = ImageEnhance.Sharpness(enhanced_rgb)
        final_rgb = sharpness_enhancer.enhance(1.05)

        r_new, g_new, b_new = final_rgb.split()
        result_img = Image.merge("RGBA", (r_new, g_new, b_new, a))
    else:
        sharp = upscaled.filter(
            ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=4)
        )
        contrast_enhancer = ImageEnhance.Contrast(sharp)
        enhanced = contrast_enhancer.enhance(1.03)
        sharpness_enhancer = ImageEnhance.Sharpness(enhanced)
        result_img = sharpness_enhancer.enhance(1.05)

    if progress_cb:
        progress_cb(90, "Finalisasi gambar...")

    return result_img


def enhance_image_hd(
    img: Image.Image,
    scale: int = 2,
    progress_cb: Optional[Callable] = None,
) -> tuple[Image.Image, dict]:
    """
    Meningkatkan resolusi dan ketajaman visual gambar secara nyata.
    - img: Objek PIL Image (RGBA atau RGB)
    - scale: Faktor pengali perbesaran (bawaan 2x)
    - progress_cb: Fungsi callback(persentase: int, pesan: str) untuk melaporkan progres

    Mengembalikan tuple: (gambar_hasil, info_metrik)
    """
    orig_w, orig_h = img.size

    # Pastikan format citra memiliki saluran warna yang memadai
    if img.mode not in ("RGBA", "RGB"):
        img = img.convert("RGBA")

    if progress_cb:
        progress_cb(5, "Memulai proses peningkatan HD...")

    engine_used = "lanczos_smooth"

    # Cek ulang ketersediaan Real-ESRGAN (bisa saja baru diinstall setelah server nyala)
    realesrgan_ready = REALESRGAN_EXE.is_file()

    if realesrgan_ready:
        engine_used = "realesrgan_ai"
        try:
            esrgan_scale = scale if scale in (2, 3, 4) else 4
            result_img = _upscale_with_realesrgan(img, scale=esrgan_scale, progress_cb=progress_cb)

            # Sesuaikan ukuran akhir jika skala yang diminta bukan 4x
            desired_w = int(orig_w * scale)
            desired_h = int(orig_h * scale)
            if result_img.size != (desired_w, desired_h):
                if progress_cb:
                    progress_cb(90, "Menyesuaikan ukuran akhir...")
                result_img = result_img.resize(
                    (desired_w, desired_h), Image.Resampling.LANCZOS
                )

        except Exception as e:
            logger.warning(f"Real-ESRGAN gagal, beralih ke fallback Lanczos: {e}")
            engine_used = "lanczos_smooth (fallback)"
            if progress_cb:
                progress_cb(10, "AI tidak tersedia, menggunakan metode alternatif...")
            result_img = _upscale_with_lanczos_smooth(img, scale=scale, progress_cb=progress_cb)
    else:
        if progress_cb:
            progress_cb(8, "Menggunakan metode Lanczos halus...")
        result_img = _upscale_with_lanczos_smooth(img, scale=scale, progress_cb=progress_cb)

    if progress_cb:
        progress_cb(95, "Menyiapkan hasil akhir...")

    info = {
        "original_dimensions": f"{orig_w}x{orig_h}",
        "enhanced_dimensions": f"{result_img.width}x{result_img.height}",
        "scale": scale,
        "is_hd": True,
        "engine": engine_used,
    }

    logger.info(
        f"Peningkatan HD selesai ({engine_used}): "
        f"{orig_w}x{orig_h} -> {result_img.width}x{result_img.height} (Skala {scale}x)"
    )

    if progress_cb:
        progress_cb(100, "Selesai! ✨")

    return result_img, info
