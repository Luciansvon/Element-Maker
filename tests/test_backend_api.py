import io
import pytest
from PIL import Image
from backend.services.bg_remover import bg_qc_engine
from backend.services.ai_gateway import image_to_base64, base64_to_image


def test_bg_qc_engine_synthetic_image():
    """
    Menguji mesin pemotong latar belakang dan auto-QC de-halo menggunakan gambar sintetis.
    """
    # Buat gambar sintetis 100x100: kotak merah di tengah latar putih
    img = Image.new("RGBA", (100, 100), (255, 255, 255, 255))
    for x in range(30, 70):
        for y in range(30, 70):
            img.putpixel((x, y), (255, 0, 0, 255))

    clean_img, qc_report = bg_qc_engine.process_image(img)

    assert clean_img is not None
    assert clean_img.mode == "RGBA"
    assert qc_report["qc_status"] == "PASS"

    # Sudut kanvas (0,0) seharusnya transparan
    corner_pixel = clean_img.getpixel((0, 0))
    assert corner_pixel[3] == 0, "Sudut kanvas seharusnya memiliki alpha 0 (tembus pandang)"

    # Pusat kotak merah (50,50) tetap merah dan utuh
    center_pixel = clean_img.getpixel((50, 50))
    assert center_pixel[0] >= 250, "Warna merah objek tengah harus tetap utuh"
    assert center_pixel[3] > 0, "Objek tengah harus tetap tampak (alpha > 0)"


def test_image_base64_conversion():
    """
    Menguji fungsi konversi gambar ke base64 dan sebaliknya.
    """
    img = Image.new("RGBA", (10, 10), (0, 255, 0, 255))
    b64 = image_to_base64(img)
    assert isinstance(b64, str)
    assert len(b64) > 0

    reconstructed = base64_to_image(b64)
    assert reconstructed.size == (10, 10)
    assert reconstructed.getpixel((5, 5)) == (0, 255, 0, 255)


def test_vectorize_svg():
    """
    Menguji konversi gambar bitmap menjadi kurva vektor murni SVG.
    """
    from backend.services.vectorizer import image_to_svg, svg_to_data_uri

    # Buat gambar sintetis sederhana dengan lingkaran merah
    img = Image.new("RGBA", (80, 80), (0, 0, 0, 0))
    for x in range(20, 60):
        for y in range(20, 60):
            img.putpixel((x, y), (255, 0, 0, 255))

    svg_str = image_to_svg(img, num_colors=4)
    assert "<svg" in svg_str
    assert "</svg>" in svg_str
    assert "viewBox" in svg_str
    assert "<path" in svg_str

    data_uri = svg_to_data_uri(svg_str)
    assert data_uri.startswith("data:image/svg+xml;base64,")


def test_revise_element_prompt_logic():
    """
    Menguji logika peracikan prompt konsisten untuk penambahan dan penghapusan objek.
    """
    # 1. Kasus penambahan objek: harus mempertahankan karakteristik objek asal
    base_subject = "kursi santai beludru hijau tosca"
    instruction_add = "tambahkan kucing putih sedang tidur di atasnya"
    lower_inst = instruction_add.lower()
    is_remove = any(kw in lower_inst for kw in ["hapus", "hilangkan", "buang", "remove", "delete", "tanpa", "without"])
    assert not is_remove

    prompt_add = (
        f"{base_subject}, seamlessly combined with addition of {instruction_add}. "
        "Strictly maintain consistent visual identity, identical color palette, lighting, texture, and materials of the original subject. "
        "Natural proportional composition, single isolated graphic element, centered, clean solid white background, sharp edges, sticker cutout ready"
    )
    assert "kursi santai beludru hijau tosca" in prompt_add
    assert "tambahkan kucing putih" in prompt_add
    assert "consistent visual identity" in prompt_add

    # 2. Kasus penghapusan objek: harus merancang pengecualian objek
    instruction_remove = "hapus bantal kecil di pojok"
    lower_remove = instruction_remove.lower()
    is_remove_detected = any(kw in lower_remove for kw in ["hapus", "hilangkan", "buang", "remove", "delete", "tanpa", "without"])
    assert is_remove_detected


def test_get_adaptive_chroma_tag_green_keywords():
    """
    Menguji agar objek berunsur hijau (selada, matcha, brokoli, sayur)
    tidak diberi layar hijau melainkan layar biru (BUG-BG5).
    """
    from backend.services.ai_gateway import get_adaptive_chroma_tag

    # Objek hijau harus memilih layar biru (blue screen)
    tag_burger = get_adaptive_chroma_tag("burger daging dengan selada segar dan tomat")
    assert "#0000FF" in tag_burger or "blue" in tag_burger.lower()

    tag_matcha = get_adaptive_chroma_tag("es krim matcha latte lezat")
    assert "#0000FF" in tag_matcha or "blue" in tag_matcha.lower()

    tag_salad = get_adaptive_chroma_tag("salad sayur brokoli dan timun segar")
    assert "#0000FF" in tag_salad or "blue" in tag_salad.lower()

    # Objek bukan hijau harus tetap memilih green screen bawaan
    tag_car = get_adaptive_chroma_tag("mobil sedan merah mengkilap")
    assert "#00FF00" in tag_car or "green" in tag_car.lower()


def test_bg_qc_green_object_preservation():
    """
    Menguji bahwa pembersihan chroma lembut mempertahankan inti objek hijau (BUG-BG2).
    """
    # Kanvas 100x100 dengan objek hijau solid di tengah (30:70, 30:70)
    img = Image.new("RGBA", (100, 100), (0, 0, 0, 0))
    for x in range(30, 70):
        for y in range(30, 70):
            img.putpixel((x, y), (34, 180, 34, 255))

    cleaned_img = bg_qc_engine._clean_chroma_leftovers(img, bg_type="green")

    # Pusat objek hijau (50, 50) tidak boleh bolong (alpha harus tetap 255)
    center_pixel = cleaned_img.getpixel((50, 50))
    assert center_pixel[3] == 255, "Inti objek hijau tidak boleh bolong/tergerus"


def test_upscale_request_scale_validation():
    """
    Menguji batas validasi scale pada UpscaleRequest (1 <= scale <= 4) (BUG-BE6).
    """
    from pydantic import ValidationError
    from backend.api.routes import UpscaleRequest

    # Skala 2 dan 4 valid
    req_valid = UpscaleRequest(image_base64="data:image/png;base64,abc", scale=2)
    assert req_valid.scale == 2

    # Skala 0 atau 5 harus ditolak dengan ValidationError
    with pytest.raises(ValidationError):
        UpscaleRequest(image_base64="data:image/png;base64,abc", scale=0)

    with pytest.raises(ValidationError):
        UpscaleRequest(image_base64="data:image/png;base64,abc", scale=5)


def test_base64_to_image_rejects_svg():
    """
    Menguji bahwa base64_to_image menolak data URI SVG mentah atau tag <svg (Bug 2 Backend).
    """
    with pytest.raises(ValueError, match="Format SVG perlu dirender ke PNG"):
        base64_to_image("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==")

    with pytest.raises(ValueError, match="Format SVG perlu dirender ke PNG"):
        base64_to_image('<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100"/></svg>')


def test_base64_to_image_rejects_oversized_payload():
    """
    Menguji bahwa base64_to_image menolak payload di atas 20 MB (Bug 2 Backend).
    """
    from backend.services.ai_gateway import MAX_BASE64_LENGTH

    oversized = "A" * (MAX_BASE64_LENGTH + 1)
    with pytest.raises(ValueError, match="Ukuran berkas gambar terlalu besar"):
        base64_to_image(oversized)


@pytest.mark.anyio
async def test_openai_inpaint_mask_transparency(monkeypatch):
    """
    Menguji bahwa pembuatan masker untuk inpainting OpenAI (/images/edits)
    membuat area putih (arsir kuas) menjadi transparan (alpha = 0) dan area hitam menjadi opak (alpha = 255) (Bug 5).
    """
    from backend.services.ai_gateway import ai_gateway

    # Buat gambar asal 50x50 dan masker 50x50
    orig = Image.new("RGBA", (50, 50), (255, 0, 0, 255))
    mask = Image.new("L", (50, 50), 0)  # background hitam (tidak diedit)
    # Area arsir putih (diedit) di tengah (20:30, 20:30)
    for x in range(20, 30):
        for y in range(20, 30):
            mask.putpixel((x, y), 255)

    captured_mask_bytes = None

    class MockResponse:
        status_code = 200

        def json(self):
            return {"data": [{"b64_json": image_to_base64(orig)}]}

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def post(self, url, *args, **kwargs):
            nonlocal captured_mask_bytes
            if "files" in kwargs and "mask" in kwargs["files"]:
                captured_mask_bytes = kwargs["files"]["mask"][1]
            return MockResponse()

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    orig_b64 = image_to_base64(orig)
    mask_b64 = image_to_base64(mask.convert("RGBA"))

    await ai_gateway.inpaint_element(
        image_base64=orig_b64,
        mask_base64=mask_b64,
        prompt="tambahkan topi",
        base_url="http://localhost:20128/v1",
        api_key="test-key",
        no_bg=False,
    )

    assert captured_mask_bytes is not None
    mask_result = Image.open(io.BytesIO(captured_mask_bytes))
    assert mask_result.mode == "RGBA"
    assert mask_result.size == (50, 50)

    # Area luar (hitam pada masker asli) harus opak (alpha = 255)
    outside_pixel = mask_result.getpixel((5, 5))
    assert outside_pixel[3] == 255, f"Area unmasked harus memiliki alpha=255, didapat: {outside_pixel[3]}"

    # Area dalam (putih pada masker asli) harus transparan (alpha = 0)
    inside_pixel = mask_result.getpixel((25, 25))
    assert inside_pixel[3] == 0, f"Area masked harus memiliki alpha=0 (transparan), didapat: {inside_pixel[3]}"


@pytest.mark.anyio
async def test_fetch_image_from_url_success():
    """
    Menguji fungsi _fetch_image_from_url berhasil mengunduh gambar dan mengonversi ke RGBA.
    """
    from unittest.mock import AsyncMock, MagicMock
    from backend.services.ai_gateway import ai_gateway

    test_img = Image.new("RGB", (20, 20), (255, 0, 0))
    buf = io.BytesIO()
    test_img.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    mock_resp = MagicMock()
    mock_resp.content = img_bytes
    mock_resp.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp

    result = await ai_gateway._fetch_image_from_url(mock_client, "http://fake.url/test.png")
    assert result.mode == "RGBA"
    assert result.size == (20, 20)
    mock_client.get.assert_called_once_with("http://fake.url/test.png")
    mock_resp.raise_for_status.assert_called_once()


@pytest.mark.anyio
async def test_fetch_image_from_url_oversized_reject():
    """
    Menguji bahwa _fetch_image_from_url menolak gambar dari URL dengan ukuran > 20 MB.
    """
    from unittest.mock import AsyncMock, MagicMock
    from backend.services.ai_gateway import ai_gateway, MAX_BASE64_LENGTH

    mock_resp = MagicMock()
    mock_resp.content = b"x" * (MAX_BASE64_LENGTH + 1)
    mock_resp.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_resp

    with pytest.raises(ValueError, match="Ukuran gambar dari URL terlalu besar"):
        await ai_gateway._fetch_image_from_url(mock_client, "http://fake.url/large.png")


@pytest.mark.anyio
async def test_inpaint_fallback_prompt_no_bg_true(monkeypatch):
    """
    Menguji bahwa saat fallback /images/generations aktif dengan no_bg=True,
    prompt menyertakan chroma tag studio green/blue screen dan isolated cutout.
    """
    from unittest.mock import MagicMock
    from backend.services.ai_gateway import ai_gateway

    orig = Image.new("RGBA", (30, 30), (255, 0, 0, 255))
    mask = Image.new("L", (30, 30), 255)

    captured_prompt = None

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def post(self, url, *args, **kwargs):
            nonlocal captured_prompt
            if "/images/edits" in url:
                mock_err = MagicMock()
                mock_err.status_code = 500
                mock_err.text = "Not supported"
                return mock_err
            if "/images/generations" in url:
                captured_prompt = kwargs["json"]["prompt"]
                mock_ok = MagicMock()
                mock_ok.status_code = 200
                mock_ok.json.return_value = {"data": [{"b64_json": image_to_base64(orig)}]}
                return mock_ok
            return MagicMock(status_code=400)

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    res = await ai_gateway.inpaint_element(
        image_base64=image_to_base64(orig),
        mask_base64=image_to_base64(mask.convert("RGBA")),
        prompt="daun hijau segar",
        original_prompt="tanaman pot",
        no_bg=True,
    )

    assert captured_prompt is not None
    assert "single isolated graphic element" in captured_prompt
    assert "clean isolated cutout ready" in captured_prompt
    assert "#0000FF" in captured_prompt or "chroma blue" in captured_prompt
    assert res["qc_report"]["inpaint_mode"] == "fallback_regeneration"


@pytest.mark.anyio
async def test_inpaint_fallback_prompt_no_bg_false(monkeypatch):
    """
    Menguji bahwa saat fallback /images/generations aktif dengan no_bg=False,
    prompt menyertakan integrasi latar belakang asli dan TIDAK menyertakan chroma tag.
    """
    from unittest.mock import MagicMock
    from backend.services.ai_gateway import ai_gateway

    orig = Image.new("RGBA", (30, 30), (255, 0, 0, 255))
    mask = Image.new("L", (30, 30), 255)

    captured_prompt = None

    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

        async def post(self, url, *args, **kwargs):
            nonlocal captured_prompt
            if "/images/edits" in url:
                mock_err = MagicMock()
                mock_err.status_code = 500
                mock_err.text = "Not supported"
                return mock_err
            if "/images/generations" in url:
                captured_prompt = kwargs["json"]["prompt"]
                mock_ok = MagicMock()
                mock_ok.status_code = 200
                mock_ok.json.return_value = {"data": [{"b64_json": image_to_base64(orig)}]}
                return mock_ok
            return MagicMock(status_code=400)

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    res = await ai_gateway.inpaint_element(
        image_base64=image_to_base64(orig),
        mask_base64=image_to_base64(mask.convert("RGBA")),
        prompt="tambahkan cangkir kopi",
        original_prompt="meja kayu di kafe",
        no_bg=False,
    )

    assert captured_prompt is not None
    assert "harmonious background integration, maintain original background atmosphere and lighting" in captured_prompt
    assert "chroma" not in captured_prompt
    assert "clean isolated cutout ready" not in captured_prompt




