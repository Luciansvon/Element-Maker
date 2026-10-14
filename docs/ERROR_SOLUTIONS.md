# Catatan Masalah Teknis & Solusi: Element Maker

Basis pengetahuan kendala teknis non-trivial yang ditemui selama perancangan dan implementasi Element Maker. Setiap entri mencatat gejala, akar masalah, solusi terverifikasi, dan cara pencegahan.

---

## ERR-EM1 — Port 8001 Bentrok dengan Layanan Lain (WinError 10048)
* **Gejala**: Server backend gagal dinyalakan dengan pesan `[winerror 10048] only one usage of each socket address is normally permitted` pada port 8001.
* **Akar Masalah**: Port 8001 sedang dipakai oleh proses lain di laptop (layanan BIMA_CORE).
* **Solusi**: Pindahkan port backend Element Maker ke port `8008`. Sesuaikan `backend/main.py`, `run_backend.bat`, dan konfigurasi proxy di `frontend/vite.config.js`.
* **Verifikasi**: Port 8008 diperiksa bebas melalui `Get-NetTCPConnection` dan backend berhasil mengikat socket serta merespons health check.

---

## ERR-EM2 — Setir Zoom Putus Kabel, Tombol Zoom Tidak Gerak
* **Gejala**: Tombol tambah kurang persen di sudut kanvas diklik tidak ada gerak, putar roda mouse tidak membesar, tombol papan ketik `Ctrl + tambah kurang nol` ubah angka tapi gambar diam. Ukuran selalu `scale(1)`.
* **Akar Masalah**: Ibarat setir tidak tersambung ke roda. Angka `zoom` dan `pan` dibuat di `frontend/src/App.jsx:71-72`, mesin kanvas bisa zoom di `frontend/src/components/PreviewCanvas.jsx:27-32,50-107,201-205`, tapi saat dipanggil di `frontend/src/App.jsx:475-488` kabel `zoom, onChangeZoom, pan, onChangePan, onResetZoom` tidak dikirim. Semua cek `if(onChangeZoom)` di `PreviewCanvas.jsx:52-69` gagal.
* **Solusi**: Sambung kabel saat panggil kanvas, kirim 5 kabel itu dari `App.jsx` ke `PreviewCanvas`. Pastikan tombol `ZoomOut, ZoomIn, Reset` di `PreviewCanvas.jsx:130-173` dan roda mouse di baris `64-74` terima perubahan.
* **Verifikasi**: Klik zoom harus ubah tulisan persen, roda mouse harus membesar sampai 400 persen, seret mouse harus geser gambar.
* **Pencegahan**: Setiap tambah tombol baru di kanvas, cek kabel props nyambung atau tidak sebelum bilang lolos.

## ERR-EM3 — Pintu Bengkel Terbuka Semua, Semua Situs Boleh Masuk (CORS Bintang)
* **Gejala**: Belum ada serangan, tapi pintu longgar. Semua situs internet bisa panggil dapur belakang dan baca jawaban gambar.
* **Akar Masalah**: Di `backend/main.py:14-15` tertulis `allow_origins=["*"]` campur `allow_credentials=True`. Mesin `Starlette` mengubah bintang jadi ikuti asal tamu, jadi semua situs lolos bawa kredensial.
* **Solusi**: Kunci pintu hanya untuk rumah sendiri, ganti jadi `allow_origins=["http://localhost:5173"]`. Kalau tidak butuh bawa kue kredensial, matikan `allow_credentials` jadi `False`.
* **Verifikasi**: Cari tulisan `allow_origins` di `backend/main.py`, pastikan tidak ada bintang lagi. Cek dari situs lain harus ditolak peramban.
* **Pencegahan**: Jangan pakai bintang untuk pintu kalau dapur hanya dipakai di laptop sendiri.

## ERR-EM4 — Kunci Ditaruh di Alamat Terbuka, Kunci Bisa Dibaca Orang (API Key di URL)
* **Gejala**: Kunci 9Router muncul di alamat seperti `/api/models?base_url=...&api_key=...`. Alamat tersimpan di riwayat peramban dan catatan mesin.
* **Akar Masalah**: Ruang depan kirim kunci lewat alamat di `frontend/src/services/api.js:27-30` pakai `URLSearchParams`, dapur belakang terima lewat alamat di `backend/api/routes.py:63` sebagai `api_key: str = ""`.
* **Solusi**: Kirim kunci lewat kepala surat rahasia `Authorization: Bearer ...`, jangan lewat alamat. Atau ubah jalur `/api/models` jadi `POST` dengan isi di badan surat.
* **Verifikasi**: Alamat tidak boleh lagi ada tulisan `api_key`. Cek catatan mesin `uvicorn` tidak ada kunci.
* **Pencegahan**: Semua kunci wajib lewat kepala surat, tidak boleh lewat alamat. Jangan cetak kunci di layar atau catatan.

## ERR-EM5 — Dongkrak Tanpa Rem, Minta Perbesar 100 Kali Bikin Hang (Scale Tanpa Batas)
* **Gejala**: Tombol `Tingkatkan HD` janji tajam, padahal hanya besarkan biasa pakai `LANCZOS` di `backend/api/routes.py:143`. Kalau isi `scale: 100` untuk gambar `1024x1024`, jadi `102400x102400` makan belasan GB memori, mesin bisa hang.
* **Akar Masalah**: Model `UspcaleRequest` di `backend/api/routes.py:34-36` hanya tulis bawaan `scale=2` tanpa batas atas dan tanpa saring ukuran gambar masuk di `backend/services/ai_gateway.py:16-21`.
* **Solusi**: Kasih rem, batasi `scale` 1 sampai 4, tolak gambar di atas 10 MB, ganti tulisan tombol jadi `Perbesar 2x` biar jujur. Kalau mau tajam sungguhan, perlu mesin AI baru, bukan `resize` biasa.
* **Verifikasi**: Kirim `scale: 100` harus ditolak dengan pesan jelas, kirim `scale: 2` jalan normal.
* **Pencegahan**: Setiap angka dari pengguna yang tentukan ukuran memori wajib ada batas atas.

## ERR-EM6 — Contoh Uji Masih Pakai Model Lama, Sebabkan Galat 400 Tidak Ada Kredensial
* **Gejala**: Uji coba gagal dengan pesan `400 No credentials for provider: openai` seperti dicatat di `docs/verification.md:54-55`.
* **Akar Masalah**: Pola lama kunci mati ke `dall-e-3` masih tertinggal di `test_generate_backend.py:7`, `scratch_check_endpoints.py:5,11`, `test_keys_9router.py:12`, padahal solusi baru sudah pakai mode `Bawaan 9Router Otomatis` dengan kirim kosong di `backend/services/ai_gateway.py:90-92` dan pilihan di `SettingsModal.jsx:232-233`.
* **Solusi**: Ganti contoh uji jadi model kosong bawaan 9Router, atau pindah ke map `tests/` dengan cek `assert status`. Jangan biarkan contoh gagal jadi acuan.
* **Verifikasi**: Cari `dall-e-3` di map akar, harus tidak ada lagi kecuali sebagai pilihan di menu. Uji contoh harus lolos tanpa galat 400.
* **Pencegahan**: Setiap ganti aturan model, sapu semua file uji lama di map akar.

## ERR-EM7 — Salah Mesin Uji, Modul Tidak Ketemu (Pytest Global Lawan Venv)
* **Gejala**: Jalan `pytest` global gagal `ModuleNotFoundError: No module named 'backend'` di `tests/test_backend_api.py:4`. Jalan `python -m pytest` global gagal `No module named pytest`. Kumpul 2 uji hanya jalan lewat `.venv`.
* **Akar Masalah**: Ibarat salah kunci pas. Mesin `pytest` global pakai `Python 3.12.10` tidak kenal map `backend`, mesin `python` global `3.13.15` tidak punya `pytest`. Hanya mesin `.venv` `Python 3.13.15` yang punya semua alat dan kenal jalan.
* **Solusi**: Selalu pakai `.\.venv\Scripts\python.exe -m pytest --collect-only tests/test_backend_api.py` untuk cek kumpul, dan `.\.venv\Scripts\python.exe -m pytest tests/test_backend_api.py -v` untuk jalan penuh. Jangan pakai `pytest` polos.
* **Verifikasi**: Kumpul harus tulis `collected 2 items`, jalan penuh harus tulis `2 passed`.
* **Pencegahan**: Tempel tulisan perintah `.venv` di dinding, jangan pakai mesin global untuk uji.

## ERR-EM8 — Kuas Sulam Diam-Diam Buat Gambar Baru Kalau Mesin Tetangga Gagal
* **Gejala**: Pengguna arsir bawah burger minta tambah piring, kira tambalan yang jalan, padahal gambar dibuat baru semua lalu ditempel.
* **Akar Masalah**: Di `backend/services/ai_gateway.py:157,189-190` coba sulam asli lewat `/images/edits` pakai `image.png + mask.png`. Kalau gagal `404/500`, diam-diam lari ke `POST /images/generations` di baris `207-224`, lalu kunci piksel asli di baris `245-248` dan potong lagi di baris `253-254` tanpa bilang ke pengguna.
* **Solusi**: Beri tahu jujur di layar, tulis `mesin sulam tidak didukung tetangga, buat gambar baru`. Tambah tanda di `qc_report` apakah lewat jalur sulam atau jalur buat baru.
* **Verifikasi**: Arsirkan kecil lalu lihat catatan jawaban, harus jelas lewat jalur mana. Piksel yang tidak diarsir harus tetap sama.
* **Pencegahan**: Setiap jalan cadangan yang beda cara kerja wajib kasih tahu pengguna, jangan diam-diam.
