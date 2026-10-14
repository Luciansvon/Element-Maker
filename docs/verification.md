# Panduan Verifikasi & Uji Kualitas: Element Maker

Dokumen ini mencatat alur uji kelayakan fungsi dan bukti kualitas (*Quality Assurance*) untuk sistem Element Maker.

---

## 1. Matriks Uji Fungsi Inti

| Skenario Uji | Tindakan | Hasil yang Diharapkan | Status |
|---|---|---|---|
| **Uji 1: Sambungan 9Router** | Tekan tombol 'Tes Sambungan' di Pengaturan | Status hijau 'Tersambung', daftar model terisi otomatis dari `GET /v1/models` | Lolos (PASS) |
| **Uji 2: Mode Tanpa Latar (No BG)** | Ketik perintah elemen dengan opsi No BG aktif | Gambar dihasilkan, latar terpotong, saluran transparansi bersih, lolos QC | Lolos (PASS) |
| **Uji 3: Mode Latar Polos (Putih/Warna)** | Pilih 'Latar Polos' dengan warna putih/pilihan | Gambar berada di atas kanvas warna padat yang bersih | Lolos (PASS) |
| **Uji 4: Mode Latar Kustom** | Ketik elemen + deskripsi latar kustom | Objek menyatu alami dengan suasana latar yang diminta | Lolos (PASS) |
| **Uji 5: Kuas Perbaikan (Inpainting)** | Arsir bagian objek, ketik revisi, tekan perbaiki | Hanya area terarsir yang berubah, bagian objek lain tetap utuh | Lolos (PASS) |
| **Uji 6: Tombol Urungkan (Undo/Redo)** | Tekan tombol Undo setelah perbaikan kuas | Gambar kembali ke versi sebelum diperbaiki | Lolos (PASS) |
| **Uji 7: Simpan ke Koleksi (IndexedDB)** | Tekan tombol 'Simpan' pada meja inspeksi | Elemen masuk ke Laci Koleksi dan tetap ada saat halaman direfresh | Lolos (PASS) |
| **Uji 8: Salin ke Papan Klip (Ctrl+V)** | Tekan tombol 'Salin' pada elemen di koleksi | Gambar tersalin ke memori komputer dan bisa langsung di-paste ke Photoshop/Canva | Lolos (PASS) |
| **Uji 9: Unduh Berkas PNG** | Tekan tombol 'Unduh' | Berkas PNG beresolusi penuh terunduh ke laptop | Lolos (PASS) |
| **Uji 10: Kuas Sulam Tambah Objek Cerdas** | Arsir area kanvas/kursi, ketik 'tambah laki-laki sedang duduk' | Objek baru menyatu utuh, tidak terpotong kaku seukuran kuas arsir | Lolos (PASS) |
| **Uji 11: Prompt Optimizer Adaptif** | Ketik elemen spesifik lalu tekan tombol bintang optimizer | Prompt diperkaya sesuai konteks material (furnitur/makanan/tipografi) | Lolos (PASS) |
| **Uji 12: Logo Resmi 3D Sparkle** | Buka aplikasi dan periksa favicon, header, serta modal | Logo 3D sparkle tampil tajam dan estetik di seluruh aplikasi | Lolos (PASS) |

---

## 2. Bukti Verifikasi (Evidence)

### Hasil Uji Unit Backend (`tests/test_backend_api.py`)
Tanggal: 13 Oktober 2026  
Status: **3 Lolos (PASS)** dalam 3.00 detik
```text
tests\test_backend_api.py ...                                            [100%]
============================== 3 passed in 3.00s ==============================
```
* **Hasil Uji Potong Gambar**: Sudut kanvas terpotong menjadi alpha 0 (transparan), objek tengah tetap utuh dengan warna dan transparansi terjaga.
* **Hasil Uji Status QC**: Laporan menghasilkan status `PASS` dengan pembersihan sisa debu alpha.

---

### Hasil Pengujian Live Browser (Google Chrome Asli)
Tanggal: 13 Oktober 2026  
Peramban: Google Chrome Versi 154.0.8037.98 (Host Windows)  
Metode: Automasi Playwright dengan tangkapan layar penuh (Full Viewport 1440x900)

#### Status Temuan Kendala / Bug (Bug Ledger Update)
1. **[Tuntas - Lolos Verifikasi] Laci Koleksi Elemen Terpotong ke Bawah Layar**:
   * *Status*: **FIXED & VERIFIED**. Tata letak telah dipindahkan ke Sidebar Kanan yang *collapsible* (bisa dibuka/tutup), membuat kanvas tengah lega dan tidak ada elemen yang terpotong.
2. **[Tuntas - Lolos Verifikasi] Tombol Gear Pengaturan Header**:
   * *Status*: **FIXED & VERIFIED**. Tombol telah dibungkus elemen semantik dengan atribut `data-testid="settings-button"` dan `title="Pengaturan Sambungan & Model AI"`.
3. **[Tuntas - Lolos Verifikasi] Modal Pengaturan & Penutupan Interaktif**:
   * *Status*: **FIXED & VERIFIED**. Tombol tutup modal `data-testid="close-settings-modal"` merespons dengan mulus tanpa interupsi backdrop.
4. **[Tuntas - Lolos Verifikasi] Pengaktifan Penuh Sidebar Kiri (Alih-alih Dihilangkan)**:
   * *Keputusan Mas Bima*: Daripada dihilangkan, sidebar kiri dibuat bekerja penuh sebagai panel navigasi studio profesional.
   * *Solusi*: Mengaktifkan 4 menu kerja aktif:
     1. **Objek Grafis**: Pembuat elemen poster terpotong bersih transparan (PNG).
     2. **Tipografi 3D**: Studio pembuatan huruf/teks timbul 3D gaya pop-up stiker tebal.
     3. **Laci Koleksi**: Membuka laci riwayat aset tersimpan di sisi kanan.
     4. **Pengaturan AI**: Membuka modal pengaturan model dan sambungan 9Router.
   * *Status*: **FIXED & VERIFIED** (Bukti live browser: `verify_04_sidebar_modes.png`).
5. **[Tuntas - Lolos Verifikasi] Fleksibilitas Model 9Router & Penyesuaian Pengaturan**:
   * *Kendala*: Sebelumnya sistem mengunci model secara kaku ke merek OpenAI (`dall-e-3` dan `dall-e-2`), sehingga memunculkan error 400 dari 9Router (`No credentials for provider: openai`).
   * *Solusi*: Menghilangkan hardcode model, mendukung mode '⭐ Bawaan 9Router (Otomatis / Default)', serta menambahkan pengaturan model terpisah (Generate & Inpaint) dengan tombol 'Panggil Model Aktif' yang berhasil memuat 82 model aktif langsung dari 9Router.
   * *Status*: **FIXED & VERIFIED** (Bukti live browser: `settings_modal_models_1791860160495.png`).
6. **[Tuntas - Lolos Verifikasi] Fitur Zoom, Pan Kanvas & Pintasan Keyboard Global**:
   * *Kendala*: Elemen hasil generate di kanvas tidak bisa diperbesar untuk memeriksa detail potongan tepi, dan belum ada pintasan tombol cepat seperti di Photoshop.
   * *Solusi*: Memasang modul zoom melayang (Zoom In, Zoom Out, Indikator %, Reset Fit) dan geser pan, mendukung roda scroll mouse non-passive, serta memasang pendengar pintasan keyboard (`Ctrl+C`, `Ctrl+V`, `Ctrl+S`, `Ctrl+Enter`, `Ctrl+=`, `Ctrl+-`, `Ctrl+0`).
   * *Status*: **FIXED & VERIFIED** (Bukti live browser: `verify_01_initial.png`, `verify_02_zoomed_in.png`, `verify_03_optimal_75percent.png`).
7. **[Tuntas - Lolos Verifikasi] Pemasangan Logo Resmi 3D Sparkle**:
   * *Solusi*: Memasang aset logo resmi 3D sparkle ke Favicon browser, Header studio, dan Header modal Pengaturan.
   * *Status*: **FIXED & VERIFIED** (Bukti live browser: `header_logo_verification_1791861137409.png`).
8. **[Tuntas - Lolos Verifikasi] Kuas Sulam Tambah Objek Cerdas (Anti-Pemotongan Kaku)**:
   * *Kendala*: Saat meminta tambah objek baru (misal laki-laki duduk di kursi), sistem sebelumnya menjepit gambar ke dalam mask arsiran secara kaku, sehingga kepala/badan objek terpotong janggal.
   * *Solusi*: Menambahkan deteksi cerdas penambahan objek baru (`is_adding_object`), meniadakan compositing kaku yang merusak objek baru, serta memotong latar belakang secara bersih via `bg_qc_engine`.
   * *Status*: **FIXED & VERIFIED**.
9. **[Tuntas - Lolos Verifikasi] Prompt Optimizer Adaptif & Paham Konteks**:
   * *Kendala*: Tombol bintang sebelumnya hanya menempelkan template teks generik yang sama untuk semua jenis objek.
   * *Solusi*: Menambahkan mesin klasifikasi konteks cerdas di backend dan frontend yang membedakan Furnitur, Makanan, Karakter/Orang, Tipografi 3D, Kendaraan, dan Alam, sehingga detail yang ditambahkan selalu relevan dengan material fisik objek.
   * *Status*: **FIXED & VERIFIED**.
10. **[Tuntas - Lolos Verifikasi] Tombol Kirim Bilah Atas & Skema Revisi Elemen Konsisten Berbasis Vision AI**:
    * *Kendala*: Tombol Kirim di toolbar atas macet tidak merespons klik jika kuas arsir belum digoreskan, dan pemanggilnya sempat mengalami *syntax error* selector DOM.
    * *Solusi*:
      1. Membuka kunci tombol Kirim di `CanvasToolbar` sehingga selalu aktif dan dapat diklik kapan saja (baik dengan kuas maupun hanya instruksi teks).
      2. Menerapkan skema resmi Mas Bima: Mas Bima beri instruksi -> AI Vision menganalisis ciri visual objek asli -> AI merekayasa gambar ulang dengan konsisten tanpa mengubah yang tidak diminta -> QC Engine membersihkan latar belakang -> gambar dikirim kembali ke kanvas.
      3. Menyediakan indikator proses langsung di kanvas: *'AI Vision sedang menganalisis gambar asli...'* dan *'Menjaga konsistensi visual dan memotong latar belakang bersih'*.
    * *Status*: **FIXED & VERIFIED** (Bukti live browser: `element_maker_revised_1791863694463.png`).
11. **[Tuntas - Lolos Verifikasi] 3 Fitur Baru Poster: Tipografi 3D, Potong Kaca & Air, serta Vektor (SVG)**:
    * *Tipografi 3D Pop-Up*: Disediakan studio khusus di bilah bawah dengan 5 preset gaya pop-up siap pakai (Balon Pop-up, Emas Mewah, Stiker Timbul, Neon 3D, Kayu Ukir) dan tombol cetak instan.
    * *Mode Pemotong Latar Kaca & Air*: Disediakan tombol opsi `💧 Kaca & Air` di kartu Tanpa Latar (No BG) dengan algoritma *alpha matting* untuk menjaga transparansi benda tembus pandang (gelas kaca, air, botol bening) agar tidak hilang atau berlubang.
    * *Konversi Vektor (SVG)*: Disediakan tombol `📐 Vektor (SVG)` di toolbar kanvas untuk mengubah elemen gambar raster/bitmap (PNG) menjadi kurva vektor murni (SVG) tajam tanpa pecah saat diperbesar berapapun di aplikasi desain seperti Illustrator atau CorelDRAW.
    * *Kesesuaian Tampilan 75%*: Terverifikasi 100% pas dalam 1 layar utuh tanpa terpotong dan nyaman dipandang pada zoom standar 75%.
    * *Status*: **FIXED & VERIFIED** (Bukti live browser: `verify_04_sidebar_modes.png`, `verify_05_vectorize_done.png`, `verify_06_typography_3d_mode.png`, `verify_07_typography_75percent.png`).
12. **[Tuntas - Lolos Verifikasi] Fitur Kotak Reference (Gambar-ke-Gambar / Multimodal img2img) & Penguncian Karakter**:
    * *Penempatan Kotak Reference*: Tampil presisi di pojok kiri atas kanvas inspeksi kerja sesuai pilihan tata letak Mas Bima (selalu tampak bahkan sebelum gambar diunggah dengan tombol interaktif `+ Pasang Foto`).
    * *Interaksi Antarmuka Studio*:
      - Unggah foto via dialog file dan seret-lepas (*drag-and-drop*) langsung bekerja nyata.
      - Kotak dapat diskalakan bebas ukurannya (*resizable handle*) dengan memori ukuran otomatis tersimpan di peramban.
      - Dilengkapi tombol hapus cepat (`X`) dan lapisan ganti foto saat disorot kursor (*hover*).
    * *Penguncian Karakter & Modifikasi Teks Cerdas*:
      - Sistem menganalisis visual foto referensi via AI Vision dan mengunci identitas fisik subjek secara ketat (warna bulu/material solid, spesies, dan aksesori bawaan).
      - Menjalankan instruksi teks pengguna secara harmonis (contoh uji: menambahkan dasi kupu-kupu merah / kacamata hitam pada kucing hitam bertopi nelayan).
    * *Pemotongan Latar Belakang Otomatis (QC PASS)*: Latar belakang studio langsung dipotong bersih secara otomatis menjadi PNG transparan tanpa mengikis subjek utama.
    * *Status*: **FIXED & VERIFIED** (Bukti live browser: `frontend/tests/screenshots/ref_02_loaded_box.png`, `ref_04_ready_to_generate.png`, `ref_06_canvas_result.png`, dan artefak `live_test_reference_result.png`).


