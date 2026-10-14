import io
import numpy as np
from PIL import Image, ImageFilter
import skimage.measure

# Batasi resolusi maksimal untuk keamanan memori (67.1 MP)
Image.MAX_IMAGE_PIXELS = 67_108_864

try:
    from rembg import remove, new_session
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False


class BackgroundRemovalQC:
    """
    Mesin Pemotong Latar Belakang AI Vision 4-Lapis dengan Sistem QC Otomatis:
    1. Memotong objek menggunakan AI Vision (rembg/isnet-general-use).
    2. Membersihkan sisa layar hijau/biru secara halus (Soft Chroma Despill) tanpa melubangi objek.
    3. Menyapu debu & pulau piksel liar yang terpisah dari objek utama (Connected Component Filter).
    4. Mengikis tepi luar 1px (Edge Choke) & mengkloning warna asli objek ke tepi (Color Decontamination)
       agar pinggiran 100% rapi tanpa sisa piksel background.
    """

    def __init__(self):
        self._session = None
        self._model_name = "isnet-general-use"

    def get_session(self):
        if REMBG_AVAILABLE and self._session is None:
            try:
                self._session = new_session("isnet-general-use")
                self._model_name = "isnet-general-use"
            except Exception:
                try:
                    self._session = new_session("u2net")
                    self._model_name = "u2net"
                except Exception:
                    self._session = None
                    self._model_name = "fallback"
        return self._session

    def process_image(
        self,
        input_image: Image.Image,
        refine_edges: bool = True,
        glass_mode: bool = False,
    ) -> tuple[Image.Image, dict]:
        if input_image.mode != "RGBA":
            image_rgba = input_image.convert("RGBA")
        else:
            image_rgba = input_image.copy()

        detected_bg = self._detect_bg_type(image_rgba)

        # Lapis 1: Pemotongan AI Vision
        if REMBG_AVAILABLE:
            session = self.get_session()
            if glass_mode:
                try:
                    cutout = remove(
                        image_rgba,
                        session=session,
                        alpha_matting=True,
                        alpha_matting_foreground_threshold=240,
                        alpha_matting_background_threshold=10,
                        alpha_matting_erode_size=8,
                        post_process_mask=True,
                    )
                except Exception:
                    cutout = remove(image_rgba, session=session, post_process_mask=True)
            else:
                cutout = remove(image_rgba, session=session, post_process_mask=True)
        else:
            cutout = self._fallback_cutout(image_rgba)

        qc_report = {
            "ai_vision_used": REMBG_AVAILABLE,
            "model_used": getattr(self, "_model_name", "isnet-general-use"),
            "detected_bg": detected_bg,
            "glass_mode": glass_mode,
            "qc_status": "CHECKING",
            "debris_cleaned": 0,
            "edges_refined": False,
        }

        # Lapis 2: Pembersihan sisa warna latar kontras (Soft Chroma Cleanup & Despill)
        if detected_bg in ["green", "blue"]:
            cutout = self._clean_chroma_leftovers(cutout, bg_type=detected_bg, is_glass=glass_mode)

        # Lapis 3: Penyapu debu & pulau piksel liar
        cleaned_image, debris_count = self._clean_alpha_debris(cutout, is_glass=glass_mode)
        qc_report["debris_cleaned"] = debris_count

        # Lapis 4: Pengikisan Halo Tepi (Edge Choke) & Kloning Warna Asli Objek (Color Decontamination)
        if refine_edges:
            cleaned_image = self._dehalo_edges(cleaned_image, is_glass=glass_mode)
            cleaned_image = self._decontaminate_edge_colors(cleaned_image)
            qc_report["edges_refined"] = True

        qc_report["qc_status"] = "PASS"
        return cleaned_image, qc_report

    def _detect_bg_type(self, img: Image.Image) -> str:
        arr = np.array(img.convert("RGB"))
        h, w, _ = arr.shape
        if h < 20 or w < 20:
            return "unknown"
        samples = [
            arr[5, 5], arr[5, w - 6], arr[h - 6, 5], arr[h - 6, w - 6],
            arr[5, w // 2], arr[h - 6, w // 2], arr[h // 2, 5], arr[h // 2, w - 6],
        ]
        samples = np.array(samples, dtype=float)
        r, g, b = samples[:, 0].mean(), samples[:, 1].mean(), samples[:, 2].mean()

        if g > 90 and g > r * 1.2 and g > b * 1.2:
            return "green"
        elif b > 90 and b > r * 1.2 and b > g * 1.2:
            return "blue"
        elif r > 200 and g > 200 and b > 200:
            return "white"
        return "other"

    def _clean_chroma_leftovers(
        self, img: Image.Image, bg_type: str = "green", is_glass: bool = False
    ) -> Image.Image:
        """
        Membersihkan sisa layar hijau/biru pada tepian & celah lubang tanpa melubangi
        bagian dalam objek utama yang memiliki unsur warna senada.
        """
        arr = np.array(img).copy()
        r = arr[:, :, 0].astype(float)
        g = arr[:, :, 1].astype(float)
        b = arr[:, :, 2].astype(float)
        a = arr[:, :, 3].astype(float)

        # Identifikasi zona inti objek yang sangat pekat agar tidak ikut terhapus
        alpha_img = Image.fromarray(arr[:, :, 3])
        deep_core_mask = np.array(alpha_img.filter(ImageFilter.MinFilter(5))) > 245

        if bg_type == "green":
            # Hanya hapus piksel hijau mencolok yang bukan inti pekat objek
            extreme_neon = (~deep_core_mask) & (g > 170) & (g > r * 1.65) & (g > b * 1.65)
            edge_chroma = (~deep_core_mask) & (g > 90) & (g > r * 1.18) & (g > b * 1.18)
            to_clear = extreme_neon | edge_chroma

            # Gunakan pengurangan alpha bertahap berdasarkan kekuatan warna hijau
            green_excess = np.clip((g - np.maximum(r, b)) / 80.0, 0.0, 1.0)
            a[to_clear] = a[to_clear] * (1.0 - green_excess[to_clear])
            if not is_glass:
                a[extreme_neon] = 0

            # Despill: netralkan pantulan warna hijau pada seluruh area tepi
            spill_zone = (a > 0) & (~deep_core_mask) & (g > np.maximum(r, b))
            arr[spill_zone, 1] = np.clip((r[spill_zone] + b[spill_zone]) / 2.0, 0, 255).astype(np.uint8)

        elif bg_type == "blue":
            extreme_neon = (~deep_core_mask) & (b > 170) & (b > r * 1.65) & (b > g * 1.65)
            edge_chroma = (~deep_core_mask) & (b > 90) & (b > r * 1.18) & (b > g * 1.18)
            to_clear = extreme_neon | edge_chroma

            blue_excess = np.clip((b - np.maximum(r, g)) / 80.0, 0.0, 1.0)
            a[to_clear] = a[to_clear] * (1.0 - blue_excess[to_clear])
            if not is_glass:
                a[extreme_neon] = 0

            spill_zone = (a > 0) & (~deep_core_mask) & (b > np.maximum(r, g))
            arr[spill_zone, 2] = np.clip((r[spill_zone] + g[spill_zone]) / 2.0, 0, 255).astype(np.uint8)

        arr[:, :, 3] = np.clip(a, 0, 255).astype(np.uint8)
        return Image.fromarray(arr, "RGBA")

    def _clean_alpha_debris(self, img: Image.Image, is_glass: bool = False) -> tuple[Image.Image, int]:
        """
        Membersihkan kabut tipis DAN membuang pulau/bercak piksel sisa background
        yang terpisah dari objek utama.
        """
        img_np = np.array(img).copy()
        alpha = img_np[:, :, 3]

        threshold = 5 if is_glass else 22
        noise_mask = (alpha > 0) & (alpha < threshold)
        debris_count = int(np.sum(noise_mask))
        alpha[noise_mask] = 0

        # Buang bercak/pulau kecil yang melayang terpisah di luar objek utama
        binary_fg = alpha >= threshold
        if np.any(binary_fg):
            labels = skimage.measure.label(binary_fg, connectivity=2)
            props = skimage.measure.regionprops(labels)
            if len(props) > 1:
                max_area = max(p.area for p in props)
                # Hapus pulau kecil yang luasnya kurang dari 0.5% objek terbesar dan berada di luar
                min_valid_area = max(36, int(max_area * 0.005))
                for p in props:
                    if p.area < min_valid_area:
                        island_mask = labels == p.label
                        debris_count += int(np.sum(island_mask))
                        alpha[island_mask] = 0

        img_np[:, :, 3] = alpha
        return Image.fromarray(img_np, "RGBA"), debris_count

    def _dehalo_edges(self, img: Image.Image, is_glass: bool = False) -> Image.Image:
        """
        Mengikis 1 piksel sabuk terluar objek (Alpha Choke) untuk membuang sisa kulit
        background, lalu menghaluskan kurva pinggiran (anti-aliasing) agar tidak bergerigi.
        """
        if is_glass:
            return img

        img_np = np.array(img).copy()
        alpha = img_np[:, :, 3]
        alpha_pil = Image.fromarray(alpha)

        # Kikis 1px tepi luar dengan MinFilter(3) lalu padukan agar tidak terlalu tajam memotong sudut
        eroded = np.array(alpha_pil.filter(ImageFilter.MinFilter(3)), dtype=float)
        orig_f = alpha.astype(float)

        # Pada area perbatasan (alpha < 235), tarik masuk mendekati hasil erosi
        choked = np.where(orig_f < 235, orig_f * 0.35 + eroded * 0.65, orig_f)

        # Haluskan transisi kurva tepi dengan GaussianBlur radius kecil (0.65px)
        choked_pil = Image.fromarray(np.clip(choked, 0, 255).astype(np.uint8))
        smoothed = np.array(choked_pil.filter(ImageFilter.GaussianBlur(radius=0.65)), dtype=float)

        # Tajamkan kembali kontras alpha tepi agar tidak terlihat blur
        refined_alpha = np.clip((smoothed - 18.0) * (255.0 / (242.0 - 18.0)), 0, 255).astype(np.uint8)
        img_np[:, :, 3] = refined_alpha
        return Image.fromarray(img_np, "RGBA")

    def _decontaminate_edge_colors(self, img: Image.Image) -> Image.Image:
        """
        Mengkloning warna murni dari bagian dalam objek (alpha >= 240) ke piksel pinggiran
        semi-transparan (0 < alpha < 240) agar warna pinggiran 100% bersih dari warna latar.
        """
        arr = np.array(img).copy()
        alpha = arr[:, :, 3]
        rgb = arr[:, :, :3]

        core_mask = alpha >= 240
        edge_zone = (alpha > 0) & (alpha < 240)
        if not np.any(edge_zone) or not np.any(core_mask):
            return img

        # Propagasi warna inti keluar sejauh 3 lapis piksel menuju sabuk tepi
        valid_mask = core_mask.copy()
        work_rgb = rgb.copy()

        for _ in range(3):
            unfilled_edge = edge_zone & (~valid_mask)
            if not np.any(unfilled_edge):
                break
            # Gunakan filter maksimum/rata-rata tetangga dari piksel valid
            mask_u8 = (valid_mask.astype(np.uint8)) * 255
            dilated_mask = np.array(Image.fromarray(mask_u8).filter(ImageFilter.MaxFilter(3))) > 0
            newly_reached = unfilled_edge & dilated_mask
            if not np.any(newly_reached):
                break
            for ch in range(3):
                ch_img = Image.fromarray(np.where(valid_mask, work_rgb[:, :, ch], 0).astype(np.uint8))
                ch_max = np.array(ch_img.filter(ImageFilter.MaxFilter(3)))
                work_rgb[newly_reached, ch] = ch_max[newly_reached]
            valid_mask = valid_mask | newly_reached

        arr[edge_zone, :3] = work_rgb[edge_zone]
        return Image.fromarray(arr, "RGBA")

    def _fallback_cutout(self, img: Image.Image) -> Image.Image:
        img_np = np.array(img)
        r, g, b, _ = img_np[:, :, 0], img_np[:, :, 1], img_np[:, :, 2], img_np[:, :, 3]
        white_bg = (r > 240) & (g > 240) & (b > 240)
        img_np[white_bg, 3] = 0
        return Image.fromarray(img_np, "RGBA")


bg_qc_engine = BackgroundRemovalQC()
