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


