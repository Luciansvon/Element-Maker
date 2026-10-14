# Element Maker Studio 🎨✨

**Element Maker Studio** adalah aplikasi desktop mandiri berbasis kecerdasan buatan (AI) untuk memproduksi elemen poster, tipografi 3D timbul (*pop-up text*), wallpaper & latar belakang multi-perangkat, serta aset grafis siap cetak beresolusi tinggi.

Aplikasi ini dibangun menggunakan arsitektur modern yang menggabungkan performa bodi desktop **Rust (Tauri v2)**, antarmuka studio interaktif **React (Vite + Tailwind CSS)**, serta mesin pemroses gambar & AI **FastAPI (Python)**.

---

## 🌟 Fitur Unggulan Studio

### 1. 🖼️ Mode Objek Grafis (Graphic Elements)
* **Pemotongan Latar Otomatis (Auto Background Removal)**: Menggunakan kecerdasan buatan visual **IS-Net** (*isnet-general-use*) yang mampu melubangi celah-celah sempit objek dengan presisi tinggi.
* **Sistem Auto-QC (De-halo & Despill)**: Membersihkan pantulan warna latar (*chroma key green/blue screen*) dan debu piksel liar di tepi potongan sehingga hasil PNG tembus pandang bersih siap tempel ke Canva/Photoshop.
* **Mode Benda Kaca & Bening (Glass Mode)**: Mengaktifkan *Alpha Matting* untuk mempertahankan transparansi alami pada botol kaca, gelas, kristal, dan cipratan air.

### 2. 🔤 Mode Tipografi 3D Pop-Up (3D Typography)
* **Huruf Timbul Tebal & Bevel Mengkilap**: Menghasilkan teks 3D bergaya modern (*die-cut sticker outline*, bayangan timbul melayang, dan permukaan reflektif).
* **Pelindung Ejaan Teks**: Menjaga kata yang diapit tanda kutip agar dicetak persis oleh AI tanpa salah eja atau huruf terbolak-balik.

### 3. 📱 Mode Wallpaper & Background Maker (Multi-Device)
* **Katalog Template Layar Lengkap**: Pilihan ukuran layar laptop/PC, ponsel (HP), dan tablet dari berbagai merek terpopuler (FHD, 2K, 4K UHD, hingga rasio memanjang ponsel).
* **Pencarian Dimensi Cepat**: Cari resolusi layar perangkat berdasarkan nama tipe atau model.
* **Ukuran Bebas (Custom Size)**: Masukkan lebar dan tinggi (Width × Height dalam piksel) secara manual sesuai kebutuhan cetak poster atau spanduk baliho.

### 4. 🎯 Gambar-ke-Gambar (Image-to-Image / Reference Locking)
* **Kotak Referensi Berskala Bebas**: Kotak gambar referensi terletak di pojok kiri atas meja kanvas dan ukurannya dapat diperbesar/diperkecil sesuka hati dengan menarik sudut kotak (*smooth 60 FPS scaling*).
* **Tingkat Kemiripan Fleksibel (60% - 100%)**:
  * `60%`: Inspirasi gaya & warna umum dengan kebebasan interpretasi.
  * `80%`: Rekomendasi seimbang antara karakteristik referensi dan ide baru.
  * `100%`: Identik murni (kunci mati bentuk fisik, anatomi, warna, dan subjek foto referensi).
* **AI Vision Prompt Optimizer**: Menelaah ciri visual gambar referensi terlebih dahulu sebelum merapikan teks perintah pengguna.

### 5. 🔍 Penajaman Resolusi Ekstra (Real-ESRGAN AI Super Resolution)
* Tombol **HD (High Definition)** melipatgandakan resolusi gambar hingga 4× menggunakan mesin **Real-ESRGAN** (*ncnn-vulkan*) tanpa blur atau pecah.

### 6. 📐 Vektorisasi Kurva SVG (Bitmap to Vector)
* Mengonversi gambar raster/PNG menjadi kurva vektor **SVG murni** (*marching squares contour extraction*) yang dapat diperbesar hingga ukuran baliho tanpa kehilangan ketajaman.

### 7. 🗄️ Laci Koleksi Internal (Offline & Mandiri)
* Seluruh elemen tersimpan otomatis di penyimpanan internal komputer (**IndexedDB**), aman tanpa bergantung pada database eksternal.
* Tombol aksi satu-klik yang tegas: **Salin ke Papan Klip (Ctrl+V)**, **Unduh PNG Asli**, dan **Hapus**.
* Mendukung mode **Multi-Pilih (Batch Actions)** untuk mengunduh atau menghapus banyak aset sekaligus.

---

## 🏗️ Arsitektur Sistem

```text
┌─────────────────────────────────────────────────────────────┐
│                 ELEMENT MAKER DESKTOP APP                   │
├───────────────────────────────┬─────────────────────────────┤
│   Bodi & Pengemas Desktop     │   Antarmuka Pengguna Studio │
│   Rust (Tauri v2 Engine)      │   React 18 + Vite + Tailwind│
│   - Manajemen proses otomatis │   - Meja inspeksi kanvas    │
│   - Tanpa jendela hitam CMD   │   - Kotak referensi skala   │
│   - Pengontrol hidup-mati RAM │   - Bilah mode & template   │
├───────────────────────────────┴─────────────────────────────┤
│                 Jembatan API Lokal (Port 8009)              │
├─────────────────────────────────────────────────────────────┤
│                 Mesin Server AI (FastAPI Python)            │
│   - AI Gateway (Koneksi ke 9Router / Model Gambar / Visi)   │
│   - Pemotong Latar IS-Net ONNX + Auto-QC De-halo            │
│   - Penajam Kualitas Real-ESRGAN Vulkan                     │
│   - Marching Squares SVG Vectorizer                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menggunakan Aplikasi Desktop (Rekomendasi Utama)
1. Cukup klik dua kali berkas shortcut **`Element Maker Studio.lnk`** atau **`Element-Maker.exe`** yang ada di Desktop Anda.
2. Aplikasi akan otomatis membuka studio dan menyalakan mesin AI di belakang layar.
3. Saat jendela aplikasi ditutup, seluruh proses server otomatis dimatikan secara bersih.

*Atau melalui peluncur di dalam folder proyek:*
```cmd
run_element_maker.bat
```

---

### Opsi 2: Menjalankan Mode Pengembangan (Development Mode)
Jika Anda ingin mengubah kode sumber tampilan atau algoritma mesin:

1. **Jalankan Backend Server:**
   ```powershell
   .\.venv\Scripts\activate
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8009 --reload
   ```
   *(Atau jalankan file `run_backend.bat`)*

2. **Jalankan Frontend Studio:**
   ```powershell
   cd frontend
   npm run dev
   ```
   Aplikasi dapat diakses melalui peramban di `http://localhost:5173`.

---

## 🛠️ Cara Kompilasi Ulang Desktop (Rust Build)

Untuk mengompilasi ulang berkas executable `.exe` menggunakan Rust:

```powershell
# 1. Pastikan aset frontend terbaru sudah dikompilasi
npm --prefix frontend run build

# 2. Kompilasi biner release dengan Cargo
cd src-tauri
cargo build --release
```

Berkas eksekutif hasil rilis akan berada di folder:
`src-tauri/target/release/Element-Maker.exe` (~8.8 MB).

---

## 🧪 Pengujian Otomatis (Automated Testing)

Uji kestabilan seluruh modul backend, logika AI Gateway, pemotong latar, dan pengoptimal prompt:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -v
```

---

## 🔒 Privasi & Keamanan Data
* **Keamanan Kunci Akses**: Kunci API disimpan murni di penyimpanan lokal peramban (*LocalStorage*), tidak pernah diunggah ke server pihak ketiga mana pun di luar endpoint gerbang AI yang ditentukan pengguna.
* **Isolasi Berkas**: Data gambar dan riwayat koleksi sepenuhnya berada di komputer lokal.

---

## 👤 Pengembang
* Dibuat dan dikembangkan oleh **Luciansvon**.
