"""
Pengujian optimizer sadar konteks: tidak menambah bumbu bertentangan.
"""

from backend.services.prompt_optimizer import (
    build_background_rule,
    build_optimizer_messages,
    fallback_optimize,
    is_chat_capable_model,
    pick_optimizer_model,
)


def test_pick_optimizer_prefers_explicit_choice():
    assert pick_optimizer_model("ag/claude-sonnet-4-6", "dall-e-3") == "ag/claude-sonnet-4-6"


def test_pick_optimizer_ignores_image_model_global():
    # Model utama gambar (tidak bisa menulis) wajib dilewati ke bawaan pintar.
    picked = pick_optimizer_model("", "dall-e-3", [])
    assert picked == "ag/gemini-3.8-flash"


def test_pick_optimizer_follows_chat_global_model():
    picked = pick_optimizer_model("", "cx/gpt-5.1", [])
    assert picked == "cx/gpt-5.1"


def test_pick_optimizer_finds_smart_model_from_list():
    picked = pick_optimizer_model("", "", ["flux-schnell", "ag/gemini-3.8-flash"])
    assert picked == "ag/gemini-3.8-flash"


def test_is_chat_capable_rejects_image_models():
    assert not is_chat_capable_model("dall-e-3")
    assert not is_chat_capable_model("flux-schnell")
    assert not is_chat_capable_model("cogview-3")
    assert not is_chat_capable_model("")
    assert is_chat_capable_model("ag/gemini-3.8-flash")
    assert is_chat_capable_model("cx/gpt-5.1")


def test_fallback_plain_bg_tidak_menulis_terisolasi():
    hasil = fallback_optimize("pita emas mewah", mode="plain_bg", color="#FF0000")
    assert "#FF0000" in hasil
    assert "terisolasi" not in hasil.lower()
    assert "tanpa latar" not in hasil.lower()


def test_fallback_custom_bg_mempertahankan_suasana():
    hasil = fallback_optimize(
        "burger lezat", mode="custom_bg", custom_bg="di atas meja kayu"
    )
    assert "di atas meja kayu" in hasil
    assert "terisolasi" not in hasil.lower()
    assert "putih bersih" not in hasil.lower()


def test_fallback_no_bg_boleh_terisolasi():
    hasil = fallback_optimize("burger lezat", mode="no_bg")
    assert "terisolasi" in hasil.lower()


def test_fallback_flat_style_tidak_ditimpa_fotorealistis():
    hasil = fallback_optimize("ikon kopi gaya flat minimalis", mode="no_bg")
    assert "fotorealistis" not in hasil.lower()
    assert "foto profesional" not in hasil.lower()


def test_fallback_tipografi_terdeteksi_tanpa_prefix():
    hasil = fallback_optimize("tipografi 3D: PROMO navy outline biru muda", mode="no_bg")
    assert "3D" in hasil
    assert "PROMO" in hasil


def test_fallback_tipografi_flag_mengikuti_warna_diminta():
    hasil = fallback_optimize(
        "tulisan navy dengan outline biru muda berteks 'IKI JEPORO'",
        mode="no_bg",
        is_typography=True,
    )
    assert "IKI JEPORO" in hasil
    assert "balon" not in hasil.lower()
    assert "neon" not in hasil.lower()
    assert "emas" not in hasil.lower()
    assert "foto profesional" not in hasil.lower()
    assert "terpotong melayang" not in hasil.lower()
    assert "fotorealistis" not in hasil.lower()
    assert "kualitas studio" not in hasil.lower()


def test_fallback_tipografi_promo_bebas_kata_fotografi():
    hasil = fallback_optimize("PROMO 50%", mode="no_bg", is_typography=True)
    assert "PROMO 50%" in hasil
    assert "foto profesional" not in hasil.lower()
    assert "terpotong melayang" not in hasil.lower()
    assert "fotorealistis" not in hasil.lower()
    assert "kualitas studio" not in hasil.lower()
    assert "pencahayaan studio terarah" not in hasil.lower()
    assert "elemen grafis terisolasi sempurna" not in hasil.lower()
    assert "timbul" in hasil.lower() or "bevel" in hasil.lower()


def test_system_prompt_memuat_aturan_latar_plain_bg():
    msgs = build_optimizer_messages("pita emas", mode="plain_bg", color="#00FF00")
    system = msgs[0]["content"]
    assert "#00FF00" in system
    assert "DILARANG" in system


def test_system_prompt_tipografi_melindungi_kutipan():
    msgs = build_optimizer_messages("tulisan 'AKU' biru navy", is_typography=True)
    system = msgs[0]["content"]
    assert "tanda kutip" in system.lower() or "kutip" in system.lower()


def test_system_prompt_melarang_kain_untuk_kucing():
    # Regresi kasus nyata: 'foto kucing' tidak boleh ditempeli 'lipatan kain pakaian'.
    msgs = build_optimizer_messages("foto kucing", mode="no_bg")
    system = msgs[0]["content"]
    assert "lipatan kain pakaian" in system  # sebagai contoh larangan eksplisit
    hasil = fallback_optimize("foto kucing", mode="no_bg")
    assert "kain" not in hasil.lower()
    assert "baju" not in hasil.lower()
    assert "selimut" not in hasil.lower()


def test_background_rule_custom_bg_melarang_terisolasi():
    rule = build_background_rule("custom_bg", custom_bg="di atas piring rotan")
    assert "di atas piring rotan" in rule
    assert "DILARANG" in rule
