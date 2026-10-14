import base64
import io
import json
import asyncio
import threading
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
from PIL import Image

from ..services.ai_gateway import ai_gateway, base64_to_image, image_to_base64
from ..services.bg_remover import bg_qc_engine, REMBG_AVAILABLE
from ..services.vectorizer import image_to_svg, svg_to_data_uri
from ..services.enhancer import enhance_image_hd

router = APIRouter(prefix="/api", tags=["Element Maker API"])


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Perintah teks elemen yang diinginkan")
    mode: str = Field("no_bg", description="Mode latar belakang: no_bg, plain_bg, custom_bg, atau wallpaper")
    custom_bg: Optional[str] = Field("", description="Deskripsi suasana latar jika mode custom_bg")
    color: Optional[str] = Field("#FFFFFF", description="Warna dasar latar jika mode plain_bg")
    model: Optional[str] = Field("", description="Nama model AI di 9Router/API (kosongkan untuk bawaan 9Router)")
    base_url: Optional[str] = Field("http://localhost:20128/v1", description="Alamat server 9Router/API")
    api_key: Optional[str] = Field("", description="Kunci akses jika diperlukan")
    glass_mode: Optional[bool] = Field(False, description="Aktifkan alpha matting khusus benda bening (kaca & air)")
    reference_image: Optional[str] = Field("", description="Gambar referensi/Pinterest (base64) untuk panduan estetika gaya")
    reference_similarity: Optional[int] = Field(80, description="Tingkat kemiripan referensi: 60, 70, 80, 90, 100 (%)")
    aspect_ratio: Optional[str] = Field("", description="Rasio aspek wallpaper (misal 16:9, 9:16, 21:9)")
    target_width: Optional[int] = Field(None, description="Lebar target piksel layar")
    target_height: Optional[int] = Field(None, description="Tinggi target piksel layar")


class InpaintRequest(BaseModel):
    image_base64: str = Field(..., description="Gambar elemen asal (base64)")
    mask_base64: str = Field(..., description="Gambar masker coretan kuas arsir (base64)")
    prompt: str = Field(..., description="Instruksi revisi untuk bagian yang diarsir")
    original_prompt: Optional[str] = Field("", description="Deskripsi prompt awal objek")
    model: Optional[str] = Field("", description="Nama model edit AI (kosongkan untuk bawaan 9Router)")
    base_url: Optional[str] = Field("http://localhost:20128/v1", description="Alamat server 9Router/API")
    api_key: Optional[str] = Field("", description="Kunci akses")
    no_bg: Optional[bool] = Field(True, description="Apakah hasil tambalan tetap dipotong tanpa latar")


class UpscaleRequest(BaseModel):
    image_base64: str = Field(..., description="Gambar asal (base64)")
    scale: Optional[int] = Field(2, ge=1, le=4, description="Faktor pembesar (1x sampai 4x)")


class RemoveBgRequest(BaseModel):
    image_base64: str = Field(..., description="Gambar asal (base64)")
    refine_edges: Optional[bool] = Field(True, description="Jalankan de-halo smoothing")
    glass_mode: Optional[bool] = Field(False, description="Aktifkan alpha matting khusus benda bening (kaca & air)")


class VectorizeRequest(BaseModel):
    image_base64: str = Field(..., description="Gambar elemen PNG yang ingin diubah ke kurva vektor SVG")
    num_colors: Optional[int] = Field(16, description="Jumlah layer warna vektor jika mode trace (misal 8, 16, 24)")
    method: Optional[str] = Field("ai_vision", description="Metode kurva: 'ai_vision' (desain ulang AI murni) atau 'trace' (jiplak cepat)")
    model: Optional[str] = Field("", description="Nama model vision AI jika mode ai_vision")
    base_url: Optional[str] = Field("http://localhost:20128/v1", description="Alamat server 9Router/API")
    api_key: Optional[str] = Field("", description="Kunci akses jika diperlukan")


class ReviseElementRequest(BaseModel):
    image_base64: str = Field(..., description="Gambar elemen asal (base64)")
    instruction: str = Field(..., description="Instruksi tambah atau hapus objek dari Mas Bima")
    original_prompt: Optional[str] = Field("", description="Deskripsi prompt awal objek")
    mask_base64: Optional[str] = Field("", description="Mask coretan kuas arsir jika ada (opsional)")
    model: Optional[str] = Field("", description="Nama model edit AI (kosongkan untuk bawaan 9Router)")
    vision_model: Optional[str] = Field("", description="Nama model vision AI jika ditentukan")
    base_url: Optional[str] = Field("http://localhost:20128/v1", description="Alamat server 9Router/API")
    api_key: Optional[str] = Field("", description="Kunci akses")
    no_bg: Optional[bool] = Field(True, description="Apakah hasil tetap dipotong tanpa latar")


class OptimizePromptRequest(BaseModel):
    prompt: str = Field(..., description="Prompt teks awal pengguna")
    model: Optional[str] = Field("", description="Model utama global (dipakai jika model chat)")
    optimizer_model: Optional[str] = Field("", description="Model khusus optimizer pilihan pengguna (kosongkan untuk otomatis pintar)")
    base_url: Optional[str] = Field("http://localhost:20128/v1", description="Alamat 9Router")
    api_key: Optional[str] = Field("", description="Kunci akses")
    mode: Optional[str] = Field("no_bg", description="Mode latar: no_bg, plain_bg, atau custom_bg")
    color: Optional[str] = Field("#FFFFFF", description="Warna latar jika mode plain_bg")
    custom_bg: Optional[str] = Field("", description="Suasana latar jika mode custom_bg")
    glass_mode: Optional[bool] = Field(False, description="Benda bening (kaca & air)")
    is_typography: Optional[bool] = Field(False, description="True jika permintaan tipografi/teks 3D")
    reference_image: Optional[str] = Field("", description="Gambar referensi base64 jika ada")
    reference_similarity: Optional[int] = Field(80, description="Tingkat kemiripan referensi (60-100%)")


class TestConnectionRequest(BaseModel):
    base_url: str = Field(..., description="Alamat server AI")
    api_key: Optional[str] = Field("", description="Kunci API")
    provider: Optional[str] = Field("custom", description="Nama provider")


@router.get("/health")
async def health_check():
    """
    Pemeriksaan kesehatan sistem backend Element Maker.
    """
    return {
        "status": "online",
        "service": "Element Maker Backend",
        "rembg_ready": REMBG_AVAILABLE,
        "model_used": getattr(bg_qc_engine, "_model_name", "unknown"),
    }


@router.get("/models")
async def get_available_models(
    base_url: str = "http://localhost:20128/v1",
    api_key: str = "",
    authorization: Optional[str] = Header(None),
):
    """
    Mengambil daftar model AI aktif dari 9Router.
    Dukungan pembacaan kunci dari header Authorization: Bearer ... agar kunci tidak perlu terekspos di URL.
    """
    resolved_key = api_key
    if not resolved_key and authorization and authorization.startswith("Bearer "):
        resolved_key = authorization.split("Bearer ", 1)[1].strip()

    try:
        models = await ai_gateway.get_models(base_url=base_url, api_key=resolved_key)
        return {"status": "ok", "models": models}
    except Exception as e:
        return {"status": "error", "message": str(e), "models": ["dall-e-3", "flux-pro", "stable-diffusion-xl"]}


@router.post("/settings/test-connection")
async def test_connection_endpoint(req: TestConnectionRequest):
    """
    Menguji sambungan secara nyata ke server provider AI.
    """
    import time
    import httpx

    start_time = time.time()
    clean_base = req.base_url.rstrip("/")
    url = f"{clean_base}/models"
    headers = {}
    if req.api_key:
        headers["Authorization"] = f"Bearer {req.api_key}"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers=headers)
            latency = int((time.time() - start_time) * 1000)

            if resp.status_code == 200:
                models_data = resp.json()
                count = len(models_data.get("data", [])) if isinstance(models_data, dict) and "data" in models_data else 0
                return {
                    "status": "ok",
                    "latency_ms": latency,
                    "message": f"Terhubung dengan sukses! Latensi: {latency} ms ({count} model terdeteksi).",
                    "models_count": count,
                }
            elif resp.status_code == 401:
                return {
                    "status": "error",
                    "message": "Kunci Akses (API Key) ditolak oleh server (Error 401 Unauthorized). Silakan periksa kunci Anda.",
                }
            else:
                # Coba uji ping ke base URL langsung jika /models berbeda format
                try:
                    ping_resp = await client.get(clean_base, headers=headers)
                    latency = int((time.time() - start_time) * 1000)
                    if ping_resp.status_code in [200, 301, 302, 403]:
                        return {
                            "status": "ok",
                            "latency_ms": latency,
                            "message": f"Server aktif dan merespons (Latensi: {latency} ms).",
                        }
                except Exception:
                    pass
                return {
                    "status": "error",
                    "message": f"Server merespons kode status {resp.status_code}: {resp.text[:120]}",
                }
    except httpx.ConnectError:
        return {
            "status": "error",
            "message": f"Tidak dapat terhubung ke server di {req.base_url}. Pastikan server/9Router sedang aktif.",
        }
    except httpx.TimeoutException:
        return {
            "status": "error",
            "message": f"Koneksi ke {req.base_url} memakan waktu terlalu lama (Timeout melebihi 8 detik).",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gagal menguji sambungan: {str(e)}",
        }


@router.get("/settings/9router-accounts")
async def get_9router_accounts_endpoint(port: int = 20128):
    """
    Mengambil daftar akun yang terhubung dan aktif di 9Router lokal.
    """
    import httpx
    url = f"http://localhost:{port}/api/providers"
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                conns = data.get("connections", [])
                cleaned_conns = []
                for c in conns:
                    cleaned_conns.append({
                        "provider": c.get("provider", "unknown"),
                        "name": c.get("name") or c.get("email") or "Tanpa Nama",
                        "email": c.get("email"),
                        "status": c.get("testStatus", "unknown"),
                    })
                return {
                    "status": "ok",
                    "active": True,
                    "connections": cleaned_conns,
                    "total": len(cleaned_conns),
                }
    except Exception:
        pass

    return {
        "status": "offline",
        "active": False,
        "connections": [],
        "message": "9Router lokal tidak aktif atau belum berjalan di port 20128.",
    }


@router.post("/generate")
async def generate_element(req: GenerateRequest):
    """
    Membuat elemen baru berdasarkan teks perintah dan pilihan mode latar.
    """
    try:
        result = await ai_gateway.generate_element(
            prompt=req.prompt,
            mode=req.mode,
            custom_bg=req.custom_bg or "",
            color=req.color or "#FFFFFF",
            model=req.model or "",
            base_url=req.base_url or "http://localhost:20128/v1",
            api_key=req.api_key or "",
            glass_mode=req.glass_mode or False,
            reference_image=req.reference_image or "",
            reference_similarity=req.reference_similarity if req.reference_similarity is not None else 80,
            aspect_ratio=req.aspect_ratio or "",
            target_width=req.target_width,
            target_height=req.target_height,
        )
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inpaint")
async def inpaint_element(req: InpaintRequest):
    """
    Memperbaiki atau menambah bagian tertentu pada objek menggunakan kuas arsir.
    """
    try:
        result = await ai_gateway.inpaint_element(
            image_base64=req.image_base64,
            mask_base64=req.mask_base64,
            prompt=req.prompt,
            original_prompt=req.original_prompt or "",
            model=req.model or "",
            base_url=req.base_url or "http://localhost:20128/v1",
            api_key=req.api_key or "",
            no_bg=req.no_bg if req.no_bg is not None else True,
        )
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/revise-element")
async def revise_element_endpoint(req: ReviseElementRequest):
    """
    Merevisi atau menambah/menghapus objek pada gambar secara konsisten menggunakan AI Vision.
    Skema Mas Bima:
    1. Mas Bima ketik instruksi tambah/hapus objek
    2. AI menganalisis detail gambar kanvas via Vision
    3. AI membuat ulang secara konsisten tanpa mengubah yang tidak diminta
    4. QC Engine memotong latar belakang sampai bersih
    5. Kirim kembali ke kanvas pengguna
    """
    try:
        result = await ai_gateway.revise_element(
            image_base64=req.image_base64,
            instruction=req.instruction,
            original_prompt=req.original_prompt or "",
            mask_base64=req.mask_base64 or "",
            model=req.model or "",
            vision_model=req.vision_model or "",
            base_url=req.base_url or "http://localhost:20128/v1",
            api_key=req.api_key or "",
            no_bg=req.no_bg if req.no_bg is not None else True,
        )
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-bg")
async def remove_background_endpoint(req: RemoveBgRequest):
    """
    Memotong latar belakang gambar mandiri dengan sistem QC otomatis.
    """
    try:
        img = await asyncio.to_thread(base64_to_image, req.image_base64)
        clean_img, qc_report = await asyncio.to_thread(
            bg_qc_engine.process_image,
            img,
            refine_edges=req.refine_edges,
            glass_mode=req.glass_mode or False,
        )
        clean_b64 = await asyncio.to_thread(image_to_base64, clean_img)
        return {
            "status": "ok",
            "image_base64": f"data:image/png;base64,{clean_b64}",
            "qc_report": qc_report,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upscale")
async def upscale_element(req: UpscaleRequest):
    """
    Meningkatkan ketajaman dan resolusi gambar untuk kebutuhan cetak poster besar (HD).
    Menggabungkan perbesaran Lanczos 2x, Unsharp Masking mikro, dan kontras lokal.
    """
    try:
        img = await asyncio.to_thread(base64_to_image, req.image_base64)
        scale_factor = req.scale or 2
        enhanced_img, metrics = await asyncio.to_thread(enhance_image_hd, img, scale=scale_factor)
        enhanced_b64 = await asyncio.to_thread(image_to_base64, enhanced_img)
        
        return {
            "status": "ok",
            "image_base64": f"data:image/png;base64,{enhanced_b64}",
            "scale": scale_factor,
            "dimensions": f"{enhanced_img.width}x{enhanced_img.height}",
            "metrics": metrics,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upscale-stream")
async def upscale_element_stream(req: UpscaleRequest):
    """
    Meningkatkan ketajaman dan resolusi gambar dengan streaming status progres persentase (%)
    secara langsung ke peramban menggunakan Server-Sent Events (SSE).
    """
    async def event_generator():
        loop = asyncio.get_running_loop()
        queue = asyncio.Queue()

        def progress_cb(pct: int, msg: str):
            loop.call_soon_threadsafe(
                queue.put_nowait,
                {"type": "progress", "progress": pct, "message": msg}
            )

        def worker():
            try:
                img = base64_to_image(req.image_base64)
                scale_factor = req.scale or 2
                enhanced_img, metrics = enhance_image_hd(img, scale=scale_factor, progress_cb=progress_cb)

                result_payload = {
                    "status": "ok",
                    "image_base64": f"data:image/png;base64,{image_to_base64(enhanced_img)}",
                    "scale": scale_factor,
                    "dimensions": f"{enhanced_img.width}x{enhanced_img.height}",
                    "metrics": metrics,
                }
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    {"type": "done", "result": result_payload}
                )
            except Exception as e:
                loop.call_soon_threadsafe(
                    queue.put_nowait,
                    {"type": "error", "message": str(e)}
                )

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()

        while True:
            item = await queue.get()
            yield f"data: {json.dumps(item)}\n\n"
            if item.get("type") in ("done", "error"):
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/vectorize")
async def vectorize_element(req: VectorizeRequest):
    """
    Mengonversi gambar elemen bitmap (PNG) menjadi kurva vektor murni (SVG).
    Hasilnya tidak akan pernah pecah walau dicetak seukuran baliho raksasa.
    """
    try:
        # 1. Jika gambar sudah berupa format SVG (seperti elemen bawaan)
        if req.image_base64.startswith("data:image/svg+xml"):
            raw_content = req.image_base64.split(",", 1)[1] if "," in req.image_base64 else req.image_base64
            import urllib.parse
            if "%" in raw_content:
                svg_code = urllib.parse.unquote(raw_content)
            else:
                try:
                    missing_pad = len(raw_content) % 4
                    if missing_pad:
                        raw_content += "=" * (4 - missing_pad)
                    svg_code = base64.b64decode(raw_content).decode("utf-8", errors="ignore")
                except Exception:
                    svg_code = raw_content

            return {
                "status": "ok",
                "svg_code": svg_code,
                "image_base64": req.image_base64,
                "method": "native_svg",
                "colors_used": req.num_colors or 16,
            }

        # 2. Jika metode AI Vision diminta (Desain ulang bentuk menjadi kurva SVG bersih dari nol)
        if (req.method or "ai_vision") == "ai_vision":
            try:
                svg_code = await ai_gateway.generate_svg_from_image(
                    image_base64=req.image_base64,
                    base_url=req.base_url or "http://localhost:20128/v1",
                    api_key=req.api_key or "",
                    model=req.model or "",
                )
                svg_data_uri = await asyncio.to_thread(svg_to_data_uri, svg_code)
                return {
                    "status": "ok",
                    "svg_code": svg_code,
                    "image_base64": svg_data_uri,
                    "method": "ai_vision",
                    "colors_used": "AI Vector",
                }
            except Exception as ai_v_err:
                print(f"Peringatan: Gagal membuat SVG via AI Vision ({ai_v_err}), beralih ke tracing cepat.")

        # 3. Fallback atau Mode Trace Cepat (Jiplak Berbasis Matriks Warna)
        img = await asyncio.to_thread(base64_to_image, req.image_base64)
        svg_code = await asyncio.to_thread(image_to_svg, img, num_colors=req.num_colors or 16)
        svg_data_uri = await asyncio.to_thread(svg_to_data_uri, svg_code)
        return {
            "status": "ok",
            "svg_code": svg_code,
            "image_base64": svg_data_uri,
            "method": "trace",
            "colors_used": req.num_colors or 16,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengonversi ke kurva vektor: {str(e)}")


@router.post("/optimize-prompt")
async def optimize_prompt_endpoint(req: OptimizePromptRequest):
    """
    Mengoptimalkan ide prompt sederhana menjadi prompt visual poster yang setia
    pada maksud pengguna, menganalisis gambar referensi via AI Vision jika disediakan,
    dan sadar konteks mode latar.
    """
    from ..services.prompt_optimizer import (
        build_optimizer_messages,
        fallback_optimize,
        pick_optimizer_model,
    )

    raw_prompt = req.prompt.strip()
    if not raw_prompt:
        raise HTTPException(status_code=400, detail="Prompt tidak boleh kosong.")

    mode = (req.mode or "no_bg").strip()
    glass = bool(req.glass_mode)
    is_typo = bool(req.is_typography)

    # 1. Jika ada gambar referensi, jalankan AI Vision untuk menganalisis karakteristik visual referensi terlebih dahulu
    reference_analysis = ""
    if req.reference_image and req.reference_image.strip():
        try:
            v_model = req.optimizer_model if (req.optimizer_model and req.optimizer_model.lower() not in ["auto", "default", "9router-default"]) else ""
            reference_analysis = await ai_gateway.analyze_reference_image(
                image_base64=req.reference_image,
                base_url=req.base_url or "http://localhost:20128/v1",
                api_key=req.api_key or "",
                model=v_model,
            )
            if reference_analysis:
                print(f"Hasil Analisis AI Vision Referensi: {reference_analysis[:100]}...")
        except Exception as ref_err:
            print(f"Peringatan: Gagal menganalisis gambar referensi via AI Vision: {ref_err}")

    # Tentukan model penulis: pilihan khusus optimizer > model utama (jika chat) > bawaan pintar.
    available_names: list = []
    try:
        available_names = await ai_gateway.get_models(
            base_url=req.base_url or "http://localhost:20128/v1",
            api_key=req.api_key or "",
        )
    except Exception:
        available_names = []
    model_candidate = pick_optimizer_model(
        optimizer_model=req.optimizer_model or "",
        global_model=req.model or "",
        available_models=available_names,
    )

    # Coba optimasi via model penulis yang pintar
    try:
        import httpx
        url = f"{(req.base_url or 'http://localhost:20128/v1').rstrip('/')}/chat/completions"
        headers = {}
        resolved_key = await ai_gateway.resolve_api_key(req.base_url or "http://localhost:20128/v1", req.api_key or "")
        if resolved_key:
            headers["Authorization"] = f"Bearer {resolved_key}"

        messages = build_optimizer_messages(
            prompt=raw_prompt,
            mode=mode,
            color=req.color or "#FFFFFF",
            custom_bg=req.custom_bg or "",
            glass_mode=glass,
            is_typography=is_typo,
            reference_analysis=reference_analysis,
            reference_similarity=req.reference_similarity or 80,
        )

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                url,
                json={
                    "model": model_candidate,
                    "messages": messages,
                    "max_tokens": 200,
                    "temperature": 0.3,
                    "stream": False,
                },
                headers=headers,
            )
            if resp.status_code == 200:
                data = resp.json()
                optimized = data["choices"][0]["message"]["content"].strip().strip('"').strip("'")
                # Buang pengantar basa-basi jika model bandel menyisipkannya
                for prefix in ["berikut promptnya:", "berikut hasilnya:", "prompt optimal:", "hasil:"]:
                    if optimized.lower().startswith(prefix):
                        optimized = optimized[len(prefix):].strip()
                return {
                    "status": "ok",
                    "optimized_prompt": optimized,
                    "model_used": model_candidate,
                    "reference_analysis": reference_analysis,
                }
    except Exception as e:
        print(f"Menggunakan pengoptimal prompt lokal sadar konteks: {e}")

    # Mesin lokal sadar konteks (offline): tidak menambah hiasan bertentangan
    optimized_fallback = fallback_optimize(
        prompt=raw_prompt,
        mode=mode,
        color=req.color or "#FFFFFF",
        custom_bg=req.custom_bg or "",
        glass_mode=glass,
        is_typography=is_typo,
        reference_analysis=reference_analysis,
        reference_similarity=req.reference_similarity or 80,
    )
    return {
        "status": "ok",
        "optimized_prompt": optimized_fallback,
        "model_used": "lokal-sadar-konteks",
        "reference_analysis": reference_analysis,
    }
