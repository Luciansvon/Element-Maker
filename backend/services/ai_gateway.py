import base64
import io
import re
from typing import Optional, List, Dict, Any, Tuple
import httpx
from PIL import Image
from .bg_remover import bg_qc_engine

# Izinkan pemrosesan gambar resolusi tinggi tanpa batasan piksel bawaan PIL
Image.MAX_IMAGE_PIXELS = None

DEFAULT_9ROUTER_URL = "http://localhost:20128/v1"


def get_adaptive_chroma_tag(prompt: str) -> str:
    """
    Menentukan warna latar kontras adaptif ala Green Screen studio:
    - Jika objek mengandung warna hijau: gunakan layar biru (#0000FF).
    - Objek umum/teks/merah/emas: gunakan layar hijau (#00FF00).
    """
    is_green = bool(re.search(
        r'\b(hijau|daun|pohon|rumput|lumut|melon|alpukat|tanaman|zamrud|katak|bayam|selada|sayur|timun|brokoli|cabai|pandan|matcha|cendol|burger|salad|green|leaf|plant|tree|grass|moss|emerald|lime|mint|forest|frog|lettuce|cucumber|broccoli)\b',
        prompt or "",
        re.I
    ))
    if is_green:
        return "pure solid flat vivid chroma blue background (#0000FF), studio blue screen backdrop"
    return "pure solid flat vivid chroma green background (#00FF00), studio green screen backdrop"


def image_to_base64(img: Image.Image) -> str:
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


def base64_to_image(b64_str: str) -> Image.Image:
    # Hilangkan awalan data URL jika ada
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    b64_str = b64_str.strip()
    missing_padding = len(b64_str) % 4
    if missing_padding:
        b64_str += "=" * (4 - missing_padding)
    image_bytes = base64.b64decode(b64_str)
    return Image.open(io.BytesIO(image_bytes))


class AIGatewayService:
    """
    Layanan jembatan penghubung antara Element Maker dengan 9Router atau API AI kustom.
    """

    async def resolve_api_key(self, base_url: str = DEFAULT_9ROUTER_URL, api_key: str = "") -> str:
        """
        Otomatis mengambil API key aktif dari 9Router lokal jika api_key tidak diberikan pengguna.
        """
        if api_key and api_key.strip():
            return api_key.strip()
        if "20128" in base_url or "localhost" in base_url or "127.0.0.1" in base_url:
            try:
                clean_base = base_url.split("/v1")[0].rstrip("/")
                keys_url = f"{clean_base}/api/keys"
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.get(keys_url)
                    if resp.status_code == 200:
                        data = resp.json()
                        keys = data.get("keys", [])
                        if keys and "key" in keys[0]:
                            return keys[0]["key"]
            except Exception:
                pass
        return ""

    async def get_models(self, base_url: str = DEFAULT_9ROUTER_URL, api_key: str = "") -> list[str]:
        """
        Mengambil daftar model yang sedang aktif dari 9Router (GET /v1/models).
        """
        api_key = await self.resolve_api_key(base_url, api_key)
        url = f"{base_url.rstrip('/')}/models"
        headers = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    models_list = []
                    if "data" in data and isinstance(data["data"], list):
                        for m in data["data"]:
                            if "id" in m:
                                models_list.append(m["id"])
                    return models_list
            except Exception:
                pass
        # Cadangan daftar model populer jika 9Router belum menyala
        return ["dall-e-3", "flux-pro", "flux-schnell", "stable-diffusion-xl"]

    async def generate_element(
        self,
        prompt: str,
        mode: str = "no_bg",
        custom_bg: str = "",
        color: str = "#FFFFFF",
        model: str = "",
        base_url: str = DEFAULT_9ROUTER_URL,
        api_key: str = "",
        glass_mode: bool = False,
        reference_image: str = "",
        reference_similarity: int = 80,
        aspect_ratio: str = "",
        target_width: Optional[int] = None,
        target_height: Optional[int] = None,
    ) -> dict:
        """
        Membuat elemen dengan panduan prompt cerdas, referensi gambar (Image-to-Image),
        tingkat kemiripan (60% - 100%), dan pemotongan otomatis.
        """
        # Pastikan API key terisi otomatis dari 9Router jika belum diisi pengguna
        api_key = await self.resolve_api_key(base_url, api_key)

        # Analisis Gambar Referensi (Image-to-Image / Reference) jika disediakan
        reference_analysis = ""
        if reference_image and reference_image.strip():
            try:
                reference_analysis = await self.analyze_reference_image(
                    image_base64=reference_image,
                    base_url=base_url,
                    api_key=api_key,
                )
            except Exception as r_err:
                print(f"Peringatan analisis gambar referensi: {r_err}")

        # Pembisik Prompt Cerdas (Steering) Sesuai Pilihan Kemiripan Mas Bima (60%, 70%, 80%, 90%, 100%)
        steered_prompt = prompt.strip()
        if reference_analysis:
            sim = int(reference_similarity) if reference_similarity else 80
            if sim >= 100:
                similarity_instruction = (
                    "CRITICAL 100% STRICT IDENTITY PRESERVATION: The primary subject MUST be the exact same character/object as in the reference: [" + reference_analysis.strip() + "]. "
                    "Strictly lock 100% of its physical identity, anatomy, facial features, exact colors, surface textures, and materials without alterations. "
                    "Only add or modify: [" + prompt.strip() + "] directly onto this identical subject."
                )
            elif sim >= 90:
                similarity_instruction = (
                    "STRICT 90% HIGH-FIDELITY PRESERVATION: Closely mirror the exact species/model, structural shape, surface materials, and color scheme of the reference: [" + reference_analysis.strip() + "]. "
                    "Keep the subject strongly faithful while applying: [" + prompt.strip() + "]."
                )
            elif sim >= 80:
                similarity_instruction = (
                    "STRONG 80% VISUAL LIKENESS: Maintain strong visual resemblance and core physical characteristics of the reference: [" + reference_analysis.strip() + "]. "
                    "Accurately reflect its shape, primary color palette, and visual identity while cleanly incorporating: [" + prompt.strip() + "]."
                )
            elif sim >= 70:
                similarity_instruction = (
                    "MODERATE 70% INSPIRATION & FORM: Inspired by the reference subject: [" + reference_analysis.strip() + "], "
                    "sharing similar silhouette, aesthetic style, and primary colors, but allowing flexible adaptation for: [" + prompt.strip() + "]."
                )
            else:
                similarity_instruction = (
                    "CREATIVE 60% STYLE & MOOD TRANSFER: Take artistic inspiration, color tones, lighting mood, and stylistic essence from reference: [" + reference_analysis.strip() + "]. "
                    "Freely interpret and create a new unique element based on: [" + prompt.strip() + "]."
                )

            steered_prompt = f"{similarity_instruction} Specific instruction: [{prompt.strip()}]."

        chroma_tag = get_adaptive_chroma_tag(prompt)

        if mode == "no_bg":
            # Arahan agar objek terisolasi di atas latar kontras studio (Layar Hijau/Biru)
            if glass_mode:
                steered_prompt += f", transparent clear glass or water liquid with natural optical refractions and clean reflections, single isolated graphic element, centered, {chroma_tag}, no floor, no ground, no shadow on backdrop, studio cutout ready"
            else:
                steered_prompt += f", single isolated subject, sharp clean edges, {chroma_tag}, no border, no outline, no sticker frame, no halo, no ground, no shadow on backdrop, clean isolated cutout ready"
        elif mode == "plain_bg":
            # Sesuai ide Mas Bima: buat di atas layar kontras dulu agar potongan bersih & kilau utuh, lalu ditempel ke kanvas polos
            steered_prompt += f", single isolated subject, sharp clean edges, {chroma_tag}, no border, no outline, no sticker frame, no halo, no ground, no shadow on backdrop, clean isolated cutout ready"
        elif mode == "custom_bg" and custom_bg:
            steered_prompt += f", set against {custom_bg.strip()}, harmonious background integration"
        elif mode == "wallpaper":
            steered_prompt += ", full edge-to-edge wallpaper composition, breathtaking visual scenery, cinematic lighting, 8k resolution, crisp detail, perfect device wallpaper background"
            if aspect_ratio:
                steered_prompt += f", {aspect_ratio} aspect ratio composition"

        url = f"{base_url.rstrip('/')}/images/generations"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "prompt": steered_prompt,
            "n": 1,
            "size": "1024x1024",
            "response_format": "b64_json",
        }

        # Penyesuaian ukuran/rasio untuk mode wallpaper
        if mode == "wallpaper":
            if aspect_ratio:
                payload["aspect_ratio"] = aspect_ratio
            if target_width and target_height:
                if target_height > target_width:
                    payload["size"] = "1024x1792"
                elif target_width > target_height:
                    payload["size"] = "1792x1024"

        # Tentukan model generator gambar yang tepat untuk 9Router lokal
        clean_model = (model or "").strip()
        is_9router = "20128" in base_url or "localhost" in base_url or "127.0.0.1" in base_url
        if is_9router:
            if not clean_model or clean_model.lower() in ["auto", "default", "9router-default", "dall-e-3"]:
                clean_model = "ag/gemini-3.1-flash-image"

        if clean_model:
            payload["model"] = clean_model

        # Jika ada gambar referensi (Image-to-Image), sematkan ke payload agar 9Router membacanya langsung secara multimodal
        if reference_image and reference_image.strip():
            payload["image"] = reference_image.strip()
            payload["similarity"] = int(reference_similarity)
            payload["strength"] = round(int(reference_similarity) / 100.0, 2)

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                err_txt = resp.text
                if resp.status_code == 401 or "invalid_api_key" in err_txt or "Missing API key" in err_txt:
                    raise Exception("Sambungan ke 9Router memerlukan Kunci Akses (API Key). Silakan buka menu Pengaturan (ikon roda gigi) di bilah atas.")
                if "No credentials for provider" in err_txt:
                    raise Exception("9Router belum memiliki kredensial untuk provider model ini. Silakan periksa atau ganti model di menu Pengaturan (ikon roda gigi).")
                raise Exception(f"Gagal dari server AI ({resp.status_code}): {err_txt[:120]}")

            result = resp.json()
            if "data" not in result or len(result["data"]) == 0:
                raise Exception("Server AI tidak mengembalikan gambar.")

            first_item = result["data"][0]
            if "b64_json" in first_item:
                raw_image = base64_to_image(first_item["b64_json"])
            elif "url" in first_item:
                img_resp = await client.get(first_item["url"])
                raw_image = Image.open(io.BytesIO(img_resp.content))
            else:
                raise Exception("Format gambar tidak dikenali dari respon AI.")

        # Jika mode Tanpa Latar (No BG) atau Latar Polos (Plain BG): Jalankan Pemotong AI Vision + Mesin QC
        qc_report = None
        final_image = raw_image
        if mode in ["no_bg", "plain_bg"]:
            final_image, qc_report = bg_qc_engine.process_image(raw_image, glass_mode=glass_mode)

            # Jika mode Latar Polos (Plain BG): tempelkan objek yang terpotong bersih ke kanvas warna polos pilihan Mas Bima
            if mode == "plain_bg":
                bg_color = (color or "#FFFFFF").strip()
                canvas = Image.new("RGBA", final_image.size, bg_color)
                canvas.paste(final_image, (0, 0), final_image)
                final_image = canvas.convert("RGB")

        # Jika mode Wallpaper: pastikan resolusi keluaran pas dengan dimensi target piksel perangkat (misal 3840x2160)
        if mode == "wallpaper" and target_width and target_height:
            if final_image.size != (target_width, target_height):
                final_image = final_image.resize((target_width, target_height), Image.Resampling.LANCZOS)

        return {
            "image_base64": f"data:image/png;base64,{image_to_base64(final_image)}",
            "prompt_used": steered_prompt,
            "mode": mode,
            "aspect_ratio": aspect_ratio,
            "dimensions": f"{final_image.width}x{final_image.height}",
            "reference_analysis": reference_analysis,
            "qc_report": qc_report,
        }

    async def inpaint_element(
        self,
        image_base64: str,
        mask_base64: str,
        prompt: str,
        original_prompt: str = "",
        model: str = "",
        base_url: str = DEFAULT_9ROUTER_URL,
        api_key: str = "",
        no_bg: bool = True,
    ) -> dict:
        """
        Melakukan perbaikan/tambal sulam bagian objek menggunakan kuas arsir (inpainting)
        dengan perlindungan konsistensi piksel asli dan fallback cerdas jika 9Router belum mendukung /images/edits.
        """
        img_original = base64_to_image(image_base64)
        img_mask = base64_to_image(mask_base64)

        # Ubah ke bytes untuk dikirim via form multipart
        img_bytes = io.BytesIO()
        img_original.convert("RGBA").save(img_bytes, format="PNG")
        img_bytes.seek(0)

        mask_bytes = io.BytesIO()
        img_mask.convert("RGBA").save(mask_bytes, format="PNG")
        mask_bytes.seek(0)

        api_key = await self.resolve_api_key(base_url, api_key)
        url = f"{base_url.rstrip('/')}/images/edits"
        headers = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        # 1. Konteks Pengarah Perintah ala GPT (Prompt Steering) untuk menjaga identitas objek
        steered_prompt = (
            f"Seamlessly edit only the designated masked area: {prompt.strip()}. "
            "Strictly preserve, lock, and maintain the exact form, colors, texture, and identity "
            "of the unmasked main subject without altering any unmasked details."
        )

        files = {
            "image": ("image.png", img_bytes.getvalue(), "image/png"),
            "mask": ("mask.png", mask_bytes.getvalue(), "image/png"),
        }
        data = {
            "prompt": steered_prompt,
            "n": 1,
            "size": "1024x1024",
            "response_format": "b64_json",
        }

        clean_model = (model or "").strip()
        if clean_model and clean_model.lower() not in ["auto", "default", "9router-default"]:
            data["model"] = clean_model

        edited_image = None
        used_prompt = steered_prompt

        # Tahap A: Coba panggil /images/edits
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, files=files, data=data)
                if resp.status_code == 200:
                    result = resp.json()
                    first_item = result["data"][0]
                    if "b64_json" in first_item:
                        edited_image = base64_to_image(first_item["b64_json"])
                    else:
                        img_resp = await client.get(first_item["url"])
                        edited_image = Image.open(io.BytesIO(img_resp.content))
                elif resp.status_code == 401 or "invalid_api_key" in resp.text:
                    raise Exception("Sambungan 9Router membutuhkan Kunci Akses (API Key). Silakan buka menu Pengaturan (ikon roda gigi) di bilah atas untuk memasukkan API Key.")
        except Exception as e:
            if "API Key" in str(e):
                raise e
            print(f"Panggilan /images/edits tidak didukung atau bermasalah: {e}")

        is_fallback = False
        # Tahap B: Jika /images/edits tidak tersedia di router (misal return 404/500), gunakan fallback cerdas /images/generations
        if edited_image is None:
            is_fallback = True
            combined_prompt = f"{prompt.strip()}"
            if original_prompt.strip():
                combined_prompt = f"{original_prompt.strip()}, with addition of {prompt.strip()}"
            chroma_tag = get_adaptive_chroma_tag(combined_prompt)
            combined_prompt += f", single isolated graphic element, centered, {chroma_tag}, sharp edges, clean isolated cutout ready"
            used_prompt = combined_prompt

            gen_url = f"{base_url.rstrip('/')}/images/generations"
            gen_payload = {
                "prompt": combined_prompt,
                "n": 1,
                "size": "1024x1024",
                "response_format": "b64_json",
            }
            if clean_model and clean_model.lower() not in ["auto", "default", "9router-default"]:
                gen_payload["model"] = clean_model

            async with httpx.AsyncClient(timeout=120.0) as client:
                resp_gen = await client.post(gen_url, json=gen_payload, headers={"Content-Type": "application/json", **headers})
                if resp_gen.status_code != 200:
                    err_txt = resp_gen.text
                    if resp_gen.status_code == 401 or "invalid_api_key" in err_txt or "Missing API key" in err_txt:
                        raise Exception("Sambungan ke 9Router memerlukan Kunci Akses (API Key). Silakan masukkan API Key di menu Pengaturan (ikon roda gigi).")
                    if "No credentials for provider" in err_txt:
                        raise Exception("9Router belum memiliki kredensial untuk provider model ini. Silakan periksa atau ganti model di menu Pengaturan (ikon roda gigi).")
                    raise Exception(f"Server AI 9Router menolak permintaan ({resp_gen.status_code}): {err_txt[:100]}")

                gen_data = resp_gen.json()
                first_item = gen_data["data"][0]
                if "b64_json" in first_item:
                    edited_image = base64_to_image(first_item["b64_json"])
                else:
                    img_resp = await client.get(first_item["url"])
                    edited_image = Image.open(io.BytesIO(img_resp.content))

        # 2. Rekat Ulang Piksel Asli (Pixel Preservation Compositing Cerdas)
        # Deteksi apakah perintah adalah penambahan objek baru
        prompt_lower = prompt.lower()
        is_adding_object = any(kw in prompt_lower for kw in [
            "tambah", "tambahkan", "add", "beri", "berikan", "taruh", "letakkan",
            "orang", "laki", "wanita", "pria", "anak", "duduk", "pegang", "pakai",
            "piring", "gelas", "topi", "kacamata", "dengan", "with"
        ])

        # Hanya lakukan compositing kaku jika BUKAN penambahan objek baru dan BUKAN fallback re-generasi
        # Agar objek baru (misal orang duduk di kursi) tidak terpotong kepalanya atau badannya oleh gambar lama!
        if not is_adding_object and not is_fallback:
            try:
                resized_orig = img_original.convert("RGBA").resize(edited_image.size, Image.Resampling.LANCZOS)
                mask_resized = img_mask.convert("L").resize(edited_image.size, Image.Resampling.LANCZOS)
                composite_image = Image.composite(edited_image.convert("RGBA"), resized_orig, mask_resized)
                edited_image = composite_image
            except Exception as comp_err:
                print(f"Warning compositing pixel lock: {comp_err}")

        qc_report = None
        if no_bg:
            edited_image, qc_report = bg_qc_engine.process_image(edited_image)

        if qc_report is not None:
            qc_report["inpaint_mode"] = "fallback_regeneration" if is_fallback else "native_edit"

        return {
            "image_base64": f"data:image/png;base64,{image_to_base64(edited_image)}",
            "prompt_used": used_prompt,
            "qc_report": qc_report,
        }

    async def analyze_image_vision(
        self,
        image_base64: str,
        base_url: str = DEFAULT_9ROUTER_URL,
        api_key: str = "",
        model: str = "",
    ) -> str:
        """
        Menganalisis karakteristik visual objek kanvas menggunakan AI Vision
        untuk mengunci konsistensi gaya, warna, pencahayaan, dan bentuk objek.
        """
        clean_b64 = image_base64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",", 1)[1]

        api_key = await self.resolve_api_key(base_url, api_key)
        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        vision_model = (model or "").strip()
        if not vision_model or vision_model.lower() in ["auto", "default", "9router-default"]:
            active_models = await self.get_models(base_url, api_key)
            candidates = [
                m for m in active_models
                if any(k in m.lower() for k in ["gemini", "claude", "gpt-4o", "vision", "qwen", "flash"])
            ]
            vision_model = candidates[0] if candidates else "ag/gemini-2.5-flash"

        payload = {
            "model": vision_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Kamu adalah asisten analisis visual desain grafis profesional. "
                        "Deskripsikan objek utama pada gambar secara padat (maksimal 2 kalimat): "
                        "sebutkan nama objek, bentuk, warna utama, tekstur material, sudut kamera, dan pencahayaannya."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analisis detail visual objek ini untuk menjaga konsistensi elemen desain grafis poster.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{clean_b64}",
                            },
                        },
                    ],
                },
            ],
            "max_tokens": 150,
            "temperature": 0.2,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                raise Exception(f"Vision error ({resp.status_code}): {resp.text[:120]}")

    async def revise_element(
        self,
        image_base64: str,
        instruction: str,
        original_prompt: str = "",
        mask_base64: str = "",
        model: str = "",
        vision_model: str = "",
        base_url: str = DEFAULT_9ROUTER_URL,
        api_key: str = "",
        no_bg: bool = True,
    ) -> dict:
        """
        Alur Konsistensi Objek Mas Bima:
        1. User Prompt: Instruksi tambah/hapus objek.
        2. AI Vision Analisa: Membaca objek kanvas agar tahu ciri visual aslinya.
        3. AI Generate Ulang Konsisten: Meracik prompt yang mempertahankan objek lama + menambah/menghapus objek baru.
        4. AI Check Ulang: Memotong latar belakang via QC Engine.
        5. Kirim kembali ke kanvas user.
        """
        api_key = await self.resolve_api_key(base_url, api_key)
        if mask_base64 and mask_base64.strip():
            return await self.inpaint_element(
                image_base64=image_base64,
                mask_base64=mask_base64,
                prompt=instruction,
                original_prompt=original_prompt,
                model=model,
                base_url=base_url,
                api_key=api_key,
                no_bg=no_bg,
            )

        vision_analysis = ""
        # Tahap 2: AI Analisa pakai Vision
        try:
            vision_analysis = await self.analyze_image_vision(
                image_base64=image_base64,
                base_url=base_url,
                api_key=api_key,
                model=vision_model,
            )
        except Exception as v_err:
            print(f"Vision analysis fallback to prompt: {v_err}")

        # Tahap 3: AI Generate Ulang dengan Konsisten
        base_subject = vision_analysis.strip() if vision_analysis.strip() else original_prompt.strip()
        if not base_subject:
            base_subject = "main graphic element"

        clean_inst = instruction.strip()
        lower_inst = clean_inst.lower()

        # Deteksi aksi: apakah menghapus objek atau menambah objek
        is_remove = any(kw in lower_inst for kw in ["hapus", "hilangkan", "buang", "remove", "delete", "tanpa", "without"])

        chroma_tag = get_adaptive_chroma_tag(base_subject)
        chroma_tail = (
            f"Single isolated graphic element, centered, {chroma_tag}, sharp clean edges, clean isolated cutout ready"
            if no_bg
            else "Harmonious background integration, maintain original background atmosphere and lighting"
        )

        if is_remove:
            steered_prompt = (
                f"{base_subject}, modified by completely removing {clean_inst}. "
                "Retain and perfectly preserve the exact visual style, proportions, lighting, and textures of all other parts. "
                f"{chroma_tail}"
            )
        else:
            steered_prompt = (
                f"{base_subject}, seamlessly combined with addition of {clean_inst}. "
                "Strictly maintain consistent visual identity, identical color palette, lighting, texture, and materials of the original subject. "
                f"{chroma_tail}"
            )

        gen_url = f"{base_url.rstrip('/')}/images/generations"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "prompt": steered_prompt,
            "n": 1,
            "size": "1024x1024",
            "response_format": "b64_json",
        }

        # Tentukan model generator gambar yang tepat untuk 9Router lokal
        clean_model = (model or "").strip()
        is_9router = "20128" in base_url or "localhost" in base_url or "127.0.0.1" in base_url
        if is_9router:
            if not clean_model or clean_model.lower() in ["auto", "default", "9router-default", "dall-e-3"]:
                clean_model = "ag/gemini-3.1-flash-image"

        if clean_model:
            payload["model"] = clean_model

        # Masukkan gambar asli kanvas ke payload agar 9Router membacanya secara multimodal langsung
        if image_base64 and image_base64.strip():
            payload["image"] = image_base64.strip()

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(gen_url, json=payload, headers=headers)
            if resp.status_code != 200:
                err_txt = resp.text
                if resp.status_code == 401 or "invalid_api_key" in err_txt or "Missing API key" in err_txt:
                    raise Exception("Sambungan ke 9Router memerlukan Kunci Akses (API Key). Silakan masukkan API Key di menu Pengaturan (ikon roda gigi).")
                if "No credentials for provider" in err_txt:
                    raise Exception("9Router belum memiliki kredensial untuk provider model ini. Silakan periksa atau ganti model di menu Pengaturan (ikon roda gigi).")
                raise Exception(f"Server AI 9Router menolak permintaan ({resp.status_code}): {err_txt[:100]}")

            gen_data = resp.json()
            first_item = gen_data["data"][0]
            if "b64_json" in first_item:
                edited_image = base64_to_image(first_item["b64_json"])
            else:
                img_resp = await client.get(first_item["url"])
                edited_image = Image.open(io.BytesIO(img_resp.content))

        # Tahap 4: AI Check Ulang & Bersihkan Latar (QC Engine)
        qc_report = None
        if no_bg:
            edited_image, qc_report = bg_qc_engine.process_image(edited_image)

        # Tahap 5: Kirim ke User
        return {
            "image_base64": f"data:image/png;base64,{image_to_base64(edited_image)}",
            "prompt_used": steered_prompt,
            "vision_analysis": vision_analysis,
            "qc_report": qc_report,
        }

    async def analyze_reference_image(
        self,
        image_base64: str,
        base_url: str = DEFAULT_9ROUTER_URL,
        api_key: str = "",
        model: str = "",
    ) -> str:
        """
        Menganalisis gambar referensi (misal dari Pinterest) menggunakan AI Vision
        untuk mengekstrak estetika gaya seni, warna, pencahayaan, dan teknik visual.
        """
        clean_b64 = image_base64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",", 1)[1]

        api_key = await self.resolve_api_key(base_url, api_key)
        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        vision_model = (model or "").strip()
        # Jika model kosong atau model khusus generator gambar (dall-e, flux, dll), alihkan ke model vision pintar
        image_only = any(k in vision_model.lower() for k in [
            "dall-e", "flux", "sdxl", "stable-diffusion", "imagen",
            "cogview", "sd3", "midjourney", "ideogram",
        ])
        if not vision_model or vision_model.lower() in ["auto", "default", "9router-default"] or image_only:
            active_models = await self.get_models(base_url, api_key)
            candidates = [
                m for m in active_models
                if any(k in m.lower() for k in ["gemini", "claude", "gpt-4o", "vision", "qwen", "flash"])
                and not any(x in m.lower() for x in ["flux", "sdxl", "cogview"])
            ]
            vision_model = candidates[0] if candidates else "ag/gemini-2.5-flash"

        payload = {
            "model": vision_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert character and subject analyst for graphic design. "
                        "Thoroughly analyze this reference image to lock down the exact subject identity and aesthetic style:\n"
                        "1. SPECIFIC SUBJECT IDENTITY: Identify the exact subject, exact breed/species, and strictly precise colors (for example: 'a solid pure jet-black domestic cat with completely black fur, no white markings, and greenish-yellow eyes', or 'a brown walnut wooden chair'). "
                        "2. ARTISTIC STYLE: Specify the rendering style (e.g. realistic studio photography, 3D render, flat illustration), camera angle, and studio lighting.\n"
                        "Provide a concise 2-sentence description in English that forcefully locks the exact physical identity and solid colors of the subject so the image generator never alters its breed or fur/material colors."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Identify the exact subject physical identity, exact solid colors, and visual style of this reference image.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{clean_b64}",
                            },
                        },
                    ],
                },
            ],
            "max_tokens": 200,
            "temperature": 0.2,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                raise Exception(f"Vision error ({resp.status_code}): {resp.text[:120]}")

    async def generate_svg_from_image(
        self,
        image_base64: str,
        base_url: str = DEFAULT_9ROUTER_URL,
        api_key: str = "",
        model: str = "",
    ) -> str:
        """
        Menggunakan AI Vision untuk mengamati bentuk objek pada gambar,
        memahami geometri siluet dan komponennya, lalu mendesain ulang kurva SVG murni.
        """
        clean_b64 = image_base64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",", 1)[1]

        api_key = await self.resolve_api_key(base_url, api_key)
        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        vision_model = (model or "").strip()
        if not vision_model or vision_model.lower() in ["auto", "default", "9router-default"]:
            active_models = await self.get_models(base_url, api_key)
            candidates = [
                m for m in active_models
                if any(k in m.lower() for k in ["gemini", "claude", "gpt-4o", "vision", "qwen", "flash"])
            ]
            vision_model = candidates[0] if candidates else "ag/gemini-2.5-flash"

        system_instruction = (
            "Kamu adalah master desainer grafis vektor dan ahli kode SVG profesional.\n"
            "Tugasmu: Amati gambar objek yang diberikan, pahami struktur bentuknya (siluet, lekukan bodi, bagian-bagian utama, warna dominan), "
            "lalu gambar ulang objek tersebut menjadi kode SVG murni (<svg>...</svg>) yang bersih, rapi, dan proporsional dari nol.\n\n"
            "ATURAN PEMBUATAN SVG:\n"
            "1. Hasilkan HANYA kode SVG yang valid di dalam blok ```xml atau ```svg (atau langsung diawali <svg> dan diakhiri </svg>).\n"
            "2. Gunakan elemen bentuk vektor seperti <path>, <rect>, <circle>, <ellipse>, <polygon> dengan koordinat yang rapi dan kurva halus.\n"
            "3. Wajib gunakan viewBox=\"0 0 512 512\" dan atribut width=\"100%\" height=\"100%\".\n"
            "4. Tangkap esensi, bentuk, dan warna utama objek secara jelas dengan gaya ilustrasi/desain vektor grafis yang elegan.\n"
            "5. Pastikan semua kurva memiliki fill atau stroke warna yang tepat dan harmonis. Latar belakang SVG harus transparan (tanpa balok rect penutup latar belakang).\n"
            "6. JANGAN sertakan penjelasan teks atau basa-basi apa pun. Wajib hanya kode SVG murni."
        )

        payload = {
            "model": vision_model,
            "messages": [
                {
                    "role": "system",
                    "content": system_instruction,
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Pahami bentuk objek gambar ini dan buat ulang menjadi kode kurva SVG murni yang rapi, mulus, dan proporsional.",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{clean_b64}",
                            },
                        },
                    ],
                },
            ],
            "max_tokens": 2048,
            "temperature": 0.2,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"].strip()
                svg_code = self._extract_svg_code(raw_text)
                if svg_code:
                    return svg_code
                raise Exception("AI tidak menghasilkan format kode SVG yang valid.")
            else:
                raise Exception(f"Vision error ({resp.status_code}): {resp.text[:120]}")

    def _extract_svg_code(self, text: str) -> str:
        """
        Mengekstrak dan membersihkan blok kode SVG dari balasan teks AI.
        """
        import re
        match = re.search(r"```(?:xml|svg)?\s*(<svg[\s\S]*?<\/svg>)\s*```", text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        match_direct = re.search(r"(<svg[\s\S]*?<\/svg>)", text, re.IGNORECASE)
        if match_direct:
            return match_direct.group(1).strip()
        return ""


ai_gateway = AIGatewayService()

