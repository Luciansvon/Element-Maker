# Arahan Desain Antarmuka: Element Maker

Dokumen ini berisi konteks lengkap dan draf prompt untuk merancang antarmuka (UI) aplikasi Element Maker.

---

## Konteks Perancangan Antarmuka (Prompt Siap Pakai)

Berikut adalah ringkasan konteks visual yang bisa digunakan langsung sebagai perintah (prompt) untuk merancang antarmuka aplikasi:

```text
Rancang antarmuka pengguna (UI) modern, bersih, profesional, dan ergonomis untuk aplikasi desktop bernama "Element Maker" — sebuah studio pembuat elemen grafis dan poster berbasis kecerdasan buatan (AI).

1. TATA LETAK UTAMA (DESKTOP WORKSPACE):
- Area Header Atas:
  * Logo aplikasi "Element Maker" di kiri atas.
  * Status sambungan di kanan atas: lampu indikator hijau bulat "9Router Aktif" dan tombol ikon roda gigi untuk Pengaturan Sambungan / API.

- Zona Masukan Perintah (Bilah Atas / Panel Tengah):
  * Kotak ketik perintah (Prompt Bar) yang bersih, luas, dan lega dengan placeholder "Ketik elemen poster yang ingin kamu buat... (contoh: foto burger terpotong, pita emas mewah, ornamen daun 3D)".
  * Pilihan Mode Latar Belakang (3 Tombol Pilihan / Segmented Control yang tegas):
    1. "Tanpa Latar (No BG)" -> Ikon lapisan tembus pandang / kotak-kotak catur transparan.
    2. "Latar Polos" -> Ikon kanvas putih bersih dengan lingkaran palet warna di sampingnya.
    3. "Latar Kustom" -> Ikon pemandangan dengan kotak ketik kecil tambahan untuk memasukkan deskripsi suasana latar.
  * Tombol Aksi Utama: Tombol besar tegas "Buat Elemen" dengan ikon kilat/bintang kreasi.

- Zona Meja Inspeksi & Pratinjau (Tengah Layar):
  * Kanvas pratinjau besar di tengah dengan latar belakang default kotak-kotak catur (menunjukkan transparansi gambar hasil potongan).
  * Bilah Alat Inspeksi (Floating Toolbar di atas kanvas):
    - Tombol Penguji Latar: Lingkaran Catur Transparan, Lingkaran Putih, Lingkaran Hitam (untuk menguji kebersihan tepian objek).
    - Tombol Kuas Perbaikan (Inpainting): Ikon kuas lukis dengan slider ukuran kuas, tombol Undo/Redo, dan kotak teks mini "Ubah bagian terarsir ini menjadi...".
    - Tombol Ketajaman: Tombol toggle "Tingkatkan HD".
  * Tombol Tindakan Akhir di Bawah Kanvas:
    - Tombol "Buat Ulang" (Sekunder/Garis).
    - Tombol "Simpan ke Koleksi" (Primer/Menonjol).

- Zona Laci Koleksi (Bilah Sisi / Drawer Bawah):
  * Menampilkan deretan kartu mini (thumbnail) elemen-elemen yang sudah disimpan ke memori aplikasi.
  * Setiap kartu memiliki tombol aksi cepat saat kursor diarahkan:
    - Tombol "Salin" (Ikon papan klip untuk langsung Ctrl+V ke Photoshop/Canva).
    - Tombol "Unduh PNG" (Ikon panah unduh).
    - Tombol "Hapus".

2. GAYA & ESTETIKA VISUAL:
- Gaya: Studio desain profesional, minimalis, rapi, bernuansa workstation kreatif, anti-berantakan.
- Warna: Latar belakang netral hangat / dark-slate modern, kartu berbayang halus, kontras tinggi yang nyaman di mata, aksen tombol aktif yang tegas dan elegan.
- Hirarki: Meja inspeksi gambar menjadi bintang utama tampilan layar, bilah perintah mudah dijangkau, dan laci koleksi tidak memakan tempat saat tidak digunakan.
```
