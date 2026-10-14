"""
Mesin Pengoptimal Prompt Sadar Konteks (Context-Aware Prompt Optimizer).

Prinsip kerja seperti penjahit setia: hanya merapikan dan menajamkan
maksud asli pengguna, dilarang mengganti bahan atau menambah hiasan
yang bertentangan dengan pesanan.
"""

from typing import Optional

# Model bawaan yang cukup pintar untuk menulis prompt (murah & cepat).
DEFAULT_OPTIMIZER_MODEL = "ag/gemini-3.8-flash"

# Kata kunci model yang hanya bisa menggambar (tidak bisa diajak menulis prompt).
# Jika setting global berisi salah satu ini, optimizer tidak boleh ikut-ikutan.
IMAGE_ONLY_KEYWORDS = [
    "dall-e", "flux", "sdxl", "stable-diffusion", "imagen",
    "cogview", "sd3", "midjourney", "ideogram",
]

# Gaya yang jika diminta pengguna, dilarang ditimpa jadi fotorealistis.
FLAT_STYLE_KEYWORDS = [
    "flat", "minimalis", "minimalist", "vektor", "vector", "kartun",
    "cartoon", "anime", "line art", "sketsa", "doodle", "stiker",
    "siluet", "silhouette", "monokrom", "duotone",
]

# Kata larangan/negasi yang wajib dihormati (jangan dilanggar optimizer).
NEGATION_KEYWORDS = [
    "tanpa", "tanpa latar", "jangan", "hindari", "no ", "without",
    "jangan tambah", "jangan ubah", "tanpa teks", "tanpa tulisan",
]


def is_chat_capable_model(model_name: str) -> bool:
    """Cek apakah sebuah nama model bisa diajak menulis (chat), bukan khusus gambar."""
    name = (model_name or "").strip().lower()
    if not name or name in ["auto", "default", "9router-default"]:
        return False
    return not any(k in name for k in IMAGE_ONLY_KEYWORDS)


def pick_optimizer_model(
    optimizer_model: str = "",
    global_model: str = "",
    available_models: Optional[list] = None,
) -> str:
    """
    Pilih model penulis prompt dengan urutan:
    1. Pilihan khusus optimizer (jika diisi pengguna di Pengaturan).
    2. Model utama global (jika ternyata model chat yang pintar).
    3. Model bawaan pintar (Gemini 3.8 Flash).
    Jika daftar model aktif tersedia dan model pilihan tidak ada di sana,
    tetap pakai pilihan pengguna (provider kadang menyembunyikan nama),
    kecuali pilihannya kosong.
    """
    picked = (optimizer_model or "").strip()
    if picked and picked.lower() not in ["auto", "default", "9router-default"]:
        return picked

    global_pick = (global_model or "").strip()
    if is_chat_capable_model(global_pick):
        return global_pick

    # Jika model utama kosong/otomatis, coba cari model chat pintar dari daftar aktif.
    if available_models:
        for m in available_models:
            ml = m.lower()
            if any(k in ml for k in ["gemini", "claude", "gpt-4o", "gpt-5", "qwen", "deepseek"]) \
                    and is_chat_capable_model(m):
                return m

    return DEFAULT_OPTIMIZER_MODEL


def detect_flat_style(prompt: str) -> bool:
    """Deteksi apakah pengguna meminta gaya datar/non-fotorealistik."""
    p = (prompt or "").lower()
    return any(k in p for k in FLAT_STYLE_KEYWORDS)


def has_negation(prompt: str) -> bool:
    """Deteksi apakah prompt berisi larangan yang wajib dihormati."""
    p = (prompt or "").lower()
    return any(k in p for k in NEGATION_KEYWORDS)


def build_background_rule(mode: str, color: str = "", custom_bg: str = "", glass_mode: bool = False) -> str:
    """
    Aturan latar sesuai pilihan mode pengguna.
    Ini yang mencegah optimizer menabur kata bertentangan
    (misal menulis 'latar putih terisolasi' padahal pengguna pilih Latar Kustom).
    """
    mode = (mode or "no_bg").strip()
    if mode == "wallpaper":
        return (
            "Pengguna sedang membuat WALLPAPER / LATAR BELAKANG LAYAR PENUH. "
            "Terapkan kaidah komposisi visual profesional (visual-design-rules): "
            "1. KOMPOSISI & RASIO: Terapkan Rule of Thirds atau Golden Ratio (tempatkan titik fokus/subjek utama pada persimpangan sepertiga bidang, garis cakrawala pada sepertiga bawah atau atas, hindari pembagian 50/50 mati di tengah). "
            "2. TIGA BIDANG KEDALAMAN (3 Planes of Depth): Bangun pemandangan dengan siluet/pembingkai depan (Foreground), aksi/subjek utama di bidang tengah (Midground), dan pemandangan atmosferik belakang (Background) dengan ruang bernapas alami (negative space 25-40%). "
            "3. HARMONI WARNA 60-30-10: 60% suasana dominan/lingkungan dasar, 30% elemen struktural pendukung, 10% aksen fokal/cahaya mencolok. Terapkan perspektif atmosferik (elemen jauh lebih sejuk dan desaturasi halus). "
            "4. PENCAHAYAAN: Tata pencahayaan 3-titik sinematik (Key light utama, Fill light pengisi lembut, dan Rim light garis kilau tepi). "
            "Fokus pada keindahan komposisi pemandangan, atmosfer sinematik, kedalaman ruang, "
            "dan detail latar belakang utuh tepi-ke-tepi (edge-to-edge). DILARANG menulis 'tanpa latar', "
            "'terisolasi', 'transparan', 'layar hijau', 'stiker', atau 'cutout'."
        )
    if mode == "plain_bg":
        warna = (color or "#FFFFFF").strip()
        return (
            f"Pengguna memilih LATAR POLOS berwarna {warna}. "
            "Wajib pertahankan latar polos tersebut. DILARANG menulis "
            "'tanpa latar', 'terisolasi', 'transparan', 'latar putih bersih', "
            "atau warna latar lain yang berbeda."
        )
    if mode == "custom_bg":
        suasana = (custom_bg or "").strip()
        if suasana:
            return (
                f"Pengguna memilih LATAR KUSTOM: '{suasana}'. "
                "Wajib pertahankan suasana latar itu apa adanya. DILARANG menulis "
                "'tanpa latar', 'terisolasi', 'transparan', atau 'latar putih bersih'."
            )
        return (
            "Pengguna memilih LATAR KUSTOM (deskripsi menyusul). "
            "DILARANG menulis 'tanpa latar', 'terisolasi', atau 'latar putih bersih'."
        )
    # mode no_bg
    if glass_mode:
        return (
            "Pengguna memilih TANPA LATAR untuk benda bening (kaca/air). "
            "Boleh menulis 'terisolasi dengan transparansi kaca alami', "
            "tapi DILARANG menulis latar berwarna atau latar berpola."
        )
    return (
        "Pengguna memilih TANPA LATAR (transparan, siap tempel). "
        "Boleh menulis 'elemen terisolasi di latar kontras studio (layar hijau/biru) siap potong', "
        "tapi DILARANG menulis latar pemandangan atau latar berpola."
    )


def build_optimizer_messages(
    prompt: str,
    mode: str = "no_bg",
    color: str = "#FFFFFF",
    custom_bg: str = "",
    glass_mode: bool = False,
    is_typography: bool = False,
    reference_analysis: str = "",
    reference_similarity: int = 80,
) -> list:
    """
    Susun pesan system + user untuk model penulis prompt.
    Konteks mode latar dan analisis AI Vision gambar referensi diselipkan sebagai panduan presisi.
    """
    ref_clean = (reference_analysis or "").strip()
    sim = int(reference_similarity) if reference_similarity else 80

    # Cabang khusus Tipografi 3D: gunakan instruksi terpisah yang murni estetika desain grafis huruf
    if is_typography:
        ref_typo_note = ""
        if ref_clean:
            ref_typo_note = (
                f"\nGAMBAR REFERENSI TERSEDIA (ANALISIS AI VISION):\n\"{ref_clean}\"\n"
                "PANDUAN REFERENSI TIPOGRAFI:\n"
                "- Serap gaya visual, ketebalan timbul, dan palet warna dari referensi huruf di atas.\n"
                "- Terapkan murni pada kata/teks yang diminta pengguna tanpa mengubah ejaan kata.\n"
            )
        system_content = (
            "Anda adalah spesialis desainer grafis tipografi 3D pop-up untuk poster modern.\n"
            "TUGAS: Tulis ulang instruksi tipografi pengguna menjadi 1 paragraf prompt visual huruf timbul 3D yang padat (maksimal 50 kata) dalam Bahasa Indonesia.\n"
            "ATURAN MUTLAK:\n"
            "1. TEKS WAJIB: Teks atau kata yang ingin dicetak (terutama yang diapit tanda kutip atau huruf kapital) WAJIB disalin persis tanpa mengubah ejaan atau susunan huruf.\n"
            "2. ESTETIKA HURUF: Fokus murni pada elemen desain grafis huruf: ketebalan timbul (3D extrusion tebal proporsional), lekukan bevel halus berkilau, garis luar stiker kontras (die-cut sticker outline tegas), dan bayangan timbul pop-up melayang tipis.\n"
            "3. WARNA & MATERIAL ADAPTIF: Jika pengguna menyebut warna (misal: navy, emas, neon, merah, putih) atau material (misal: chrome, akrilik, kayu, metalik), pertahankan dan tonjolkan karakteristik warna dan material tersebut. DILARANG memaksa gaya template yang tidak diminta (misal jangan jadikan balon karet jika tidak diminta).\n"
            "4. LARANGAN KERAS FOTOGRAFI: DILARANG KERAS menggunakan kata-kata fotografi objek seperti: 'foto profesional', 'terpotong melayang', 'fotorealistis', 'kualitas studio', 'pencahayaan studio terarah', 'kamera', 'isometrik', atau menambahkan objek/makanan/orang yang tidak diminta.\n"
            + ref_typo_note
            + "5. OUTPUT: Balas HANYA dengan 1 paragraf prompt murni tanpa kalimat pembuka, tanpa tanda petik pembungkus, dan tanpa pengantar."
        )
        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": f"[Mode: Tipografi 3D Pop-Up] {prompt.strip()}"},
        ]

    bg_rule = build_background_rule(mode, color, custom_bg, glass_mode)
    flat_note = (
        "Pengguna meminta gaya datar/sederhana (flat/minimalis/vektor/kartun). "
        "DILARANG menimpa dengan kata 'fotorealistis', 'foto profesional', atau '8K'. "
        "Ikuti gaya datar yang diminta."
        if detect_flat_style(prompt) else ""
    )

    # Panduan khusus saat ada gambar referensi yang dianalisis oleh AI Vision
    ref_guidance = ""
    if ref_clean:
        if sim >= 100:
            sim_instruction = (
                "KUNCI IDENTITAS FISIK 100% MUTLAK: Subjek WAJIB sama persis dengan referensi: "
                "kunci jenis/spesies, bentuk fisik, anatomi, tekstur, dan warna solid aslinya secara mutlak. "
                "Hanya terapkan modifikasi/tambahan yang diminta pengguna (pakaian, aksesoris, aksi) langsung pada subjek ini. "
                "PANDUAN ESTETIKA: Kaidah komposisi (Rule of Thirds, kedalaman ruang 3 bidang, pencahayaan) HANYA diaplikasikan pada pembingkaian (framing) pemandangan latar, DILARANG mengubah fisik dan warna asli subjek referensi!"
            )
        elif sim >= 90:
            sim_instruction = (
                "KEMIRIPAN TINGGI 90%: Ikuti struktur bentuk, warna utama, dan material referensi dengan sangat ketat "
                "sambil mengaplikasikan permintaan pengguna."
            )
        elif sim >= 80:
            sim_instruction = (
                "KEMIRIPAN KUAT 80% (SEIMBANG): Pertahankan karakteristik visual utama, siluet, dan palet warna referensi "
                "secara jelas sambil menyatukan permintaan pengguna."
            )
        elif sim >= 70:
            sim_instruction = (
                "INSPIRASI BENTUK 70%: Mengambil inspirasi siluet, gaya, dan warna dasar dari referensi dengan fleksibilitas wajar."
            )
        else:
            sim_instruction = (
                "INSPIRASI GAYA 60%: Mengambil atmosfer gaya seni, warna, dan pencahayaan referensi dengan kebebasan interpretasi kreatif."
            )

        ref_guidance = (
            f"\nGAMBAR REFERENSI TERSEDIA (HASIL ANALISIS AI VISION):\n"
            f"\"{ref_clean}\"\n"
            f"PANDUAN KEMIRIPAN ({sim}%): {sim_instruction}\n"
            "ATURAN MUTLAK PENYATUAN REFERENSI:\n"
            "- Subjek utama WAJIB mengakar kuat pada subjek di gambar referensi di atas (misal: ksatria berbaju zirah pelat perak di padang bunga, kucing hitam, kursi jati, dll).\n"
            "- DILARANG KERAS MENOLAK ATAU BERKATA TIDAK BISA MELIHAT GAMBAR: Gambar referensi SUDAH dilihat dan dianalisis oleh AI Vision secara lengkap pada deskripsi di atas. Anda WAJIB langsung menulis deskripsi prompt visualnya!\n"
            "- JIKA PENGGUNA MEMINTA 'ubah ukuran...', 'buatkan wallpaper...', 'sesuaikan...', ATAU MENGACU PADA REFERENSI: Gambarkan ulang subjek dan adegan utuh dari analisis referensi di atas secara memukau dalam format yang diminta (misal: komposisi wallpaper pemandangan sinematik layar penuh tepi-ke-tepi).\n"
            "- Satukan permintaan pengguna (misal pakaian, aksesoris, pose, penambahan objek) langsung ke subjek referensi secara alami.\n"
            "- Serap pencahayaan, atmosfer pemandangan, dan detail tekstur bahan dari referensi.\n"
        )

    system_content = (
        "Anda adalah penjahit prompt visual yang setia: merapikan dan menajamkan "
        "maksud pengguna tanpa mengganti pesanan.\n"
        "TUGAS: Tulis ulang ide pengguna menjadi 1 paragraf prompt visual padat "
        "(maksimal 60 kata) dalam Bahasa Indonesia yang mengalir.\n"
        "ATURAN SETIA (wajib dipatuhi):\n"
        "1. Jangan menambah objek, hewan, orang, makanan, atau properti baru "
        "yang tidak disebut pengguna (misal: dilarang menambahkan lipatan kain pakaian jika hanya meminta foto kucing, kecuali karakteristik fisik yang sudah terkunci dari gambar referensi di bawah).\n"
        "2. Jangan menambah/mengganti warna, bahan, atau gaya yang tidak diminta. "
        "Jika pengguna menyebut warna/jumlah/bahan tertentu, pertahankan persis.\n"
        "3. Hormati semua larangan pengguna (kata 'tanpa', 'jangan', 'hindari', "
        "'tanpa latar', 'tanpa teks'). Jangan melanggarnya.\n"
        "4. Hanya boleh memperkaya detail yang SUDAH ada: tekstur bahan yang disebut, "
        "pencahayaan studio yang netral, ketajaman detail, komposisi postur alami.\n"
        "5. Jika ide pengguna sudah rinci, kembalikan hampir apa adanya dengan "
        "rapihan kecil saja (jangan dipanjangkan paksa).\n"
        f"6. KONTEKS LATAR: {bg_rule}\n"
        + (f"7. GAYA: {flat_note}\n" if flat_note else "")
        + ref_guidance
        + "8. DILARANG KERAS MENOLAK ATAU MENGELUARKAN KALIMAT PERCAKAPAN: Dilarang membalas 'Permintaan ini tidak menyertakan gambar...', "
        "'Unggah gambar...', atau meminta foto. Anda WAJIB SELALU menghasilkan prompt visual murni yang siap dieksekusi!\n"
        "9. Balas HANYA dengan 1 paragraf prompt murni. Tanpa tanda petik pembungkus, "
        "tanpa nomor, tanpa kalimat pengantar seperti 'Berikut promptnya:'."
    )

    context_line = (
        f"[Konteks: mode={mode}, is_typography={is_typography}"
        + (f", referensi_aktif=True, kemiripan={sim}%" if ref_clean else "")
        + "] "
    )
    user_content = f"{context_line}Instruksi Pengguna: {prompt.strip()}"
    if ref_clean:
        user_content += f"\n[Rangkuman Visual Referensi: {ref_clean}]"

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_content},
    ]


def fallback_optimize(
    prompt: str,
    mode: str = "no_bg",
    color: str = "#FFFFFF",
    custom_bg: str = "",
    glass_mode: bool = False,
    is_typography: bool = False,
    reference_analysis: str = "",
    reference_similarity: int = 80,
) -> str:
    """
    Pengoptimal lokal (offline) yang sadar konteks.
    Dipakai saat server AI tidak merespons. Aturannya sama dengan versi AI:
    tidak menambah hiasan yang bertentangan dengan mode dan gaya pengguna.
    """
    raw = (prompt or "").strip()
    if not raw:
        return raw
    p = raw.lower()
    ref_clean = (reference_analysis or "").strip()

    # Cabang tipografi: deteksi eksplisit atau kata kunci tipografi/teks
    typo_hit = is_typography or any(
        k in p for k in [
            "tipografi", "tifografi", "typography", "tulisan", "teks", "huruf",
            "font", "kata", "kalimat", "judul", "3d", "pop-up", "popup", "bevel",
        ]
    )
    if typo_hit:
        # Deteksi atribut bahan dan warna yang disebut pengguna secara adaptif
        material_details = []
        if any(k in p for k in ["chrome", "krom", "perak", "silver"]):
            material_details.append("finishing logam chrome dengan pantulan specular mengkilap")
        elif any(k in p for k in ["emas", "gold"]):
            material_details.append("lapisan emas berkilau mewah dengan bevel elegan")
        elif any(k in p for k in ["kayu", "wood", "ukir"]):
            material_details.append("tekstur serat kayu ukir timbul yang rapi")
        elif any(k in p for k in ["kaca", "akrilik", "glass"]):
            material_details.append("tekstur akrilik glossy dengan kilau jernih")
        elif any(k in p for k in ["neon", "glow", "berpendar"]):
            material_details.append("pendaran neon terang dengan outline cahaya")

        # Jika pengguna belum punya frasa timbul 3D
        has_3d = "3d" in p or "timbul" in p
        lead_3d = "" if has_3d else "huruf timbul 3D tebal proporsional"

        details_core = [
            d for d in [
                lead_3d,
                "bevel halus dengan pantulan kilau elegan",
                *material_details,
                "garis luar stiker die-cut tegas",
                "bayangan pop-up tipis",
            ] if d
        ]
        enrichment = ", ".join(details_core)
        return f"{raw}, {enrichment}"

    # Ekor latar sesuai mode (tidak pernah bertentangan).
    if (mode or "no_bg") == "plain_bg":
        bg_tail = f"dengan latar polos warna {(color or '#FFFFFF').strip()} yang bersih"
    elif (mode or "no_bg") == "custom_bg" and (custom_bg or "").strip():
        bg_tail = f"dengan latar {(custom_bg or '').strip()} yang menyatu alami"
    elif (mode or "no_bg") == "custom_bg":
        bg_tail = "dengan latar kustom yang menyatu alami"
    elif (mode or "no_bg") == "wallpaper":
        bg_tail = "komposisi pemandangan sinematik layar penuh tepi-ke-tepi dengan kedalaman 3 bidang (foreground, midground, background), pencahayaan atmosferik berimbang, dan proporsi Rule of Thirds"
    else:
        bg_tail = "terisolasi rapi siap tempel" if not glass_mode \
            else "terisolasi dengan transparansi kaca alami"

    # Jika pengguna minta gaya datar, jangan tempel bumbu fotorealistis.
    if detect_flat_style(raw):
        base_res = f"{raw}, {bg_tail}, gaya datar bersih dengan bentuk tegas dan warna solid"
        if ref_clean:
            return f"{ref_clean}, diselaraskan dengan permintaan: {base_res}"
        return base_res

    if any(k in p for k in ["kursi", "sofa", "meja", "lemari", "rak", "bangku", "lounge", "stool", "bed", "furniture", "interior", "lampu", "kayu"]):
        details = (
            "dengan serat dan tekstur bahan yang disebut terlihat nyata, "
            "proporsi ergonomis, finishing rapi, pencahayaan studio lembut"
        )
    elif any(k in p for k in ["burger", "pizza", "kopi", "teh", "kue", "roti", "ayam", "mie", "nasi", "es", "minuman", "jus", "daging", "steak", "keju", "buah", "makanan", "sushi", "bakso", "sate"]):
        details = (
            "dengan kesegaran dan tekstur bahan yang disebut terlihat menggugah, "
            "pencahayaan hangat studio kuliner"
        )
    elif any(k in p for k in ["orang", "laki", "pria", "wanita", "anak", "gadis", "karakter", "astronot", "wajah", "kucing", "anjing", "hewan", "burung", "kuda"]):
        details = (
            "dengan pose alami proporsional dan detail bahan yang disebut tetap konsisten, "
            "pencahayaan studio lembut"
        )
    elif any(k in p for k in ["mobil", "motor", "sepeda", "kapal", "pesawat", "robot", "mesin", "helm", "kendaraan", "truk", "bus"]):
        details = (
            "dengan detail lekukan dan material yang disebut terlihat presisi, "
            "pencahayaan studio dramatis lembut"
        )
    elif any(k in p for k in ["daun", "bunga", "pohon", "mawar", "tanaman", "kaktus", "rumput", "jamur"]):
        details = (
            "dengan detail urat dan tekstur alami yang disebut terlihat segar, "
            "pencahayaan pagi lembut"
        )
    else:
        details = "dengan tekstur dan detail bahan yang disebut terlihat tajam, pencahayaan studio terarah"

    if ref_clean:
        result = f"{ref_clean}, diaplikasikan dengan permintaan: {raw}, {details}, {bg_tail}"
        if "tanpa latar" in p or "transparan" in p:
            result = f"{ref_clean}, diaplikasikan dengan permintaan: {raw}, {details}"
    else:
        result = f"{raw}, {details}, {bg_tail}"
        if "tanpa latar" in p or "transparan" in p:
            result = f"{raw}, {details}"

    return result

