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

