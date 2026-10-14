import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('tests/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runLiveTest() {
  console.log('=== MEMULAI PENGUJIAN LIVE BROWSER: ELEMENT MAKER ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true, // Menggunakan Google Chrome resmi di sistem lokal Mas Bima
    viewport: { width: 1440, height: 900 },
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const bugsFound = [];
  const logs = [];

  // Pantau pesan console dan error dari peramban
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      bugsFound.push({
        type: 'Console Error',
        text: msg.text(),
        location: msg.location(),
      });
    }
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    bugsFound.push({
      type: 'Uncaught Page Error',
      text: err.message,
      stack: err.stack,
    });
  });

  page.on('requestfailed', (req) => {
    bugsFound.push({
      type: 'Network Request Failed',
      url: req.url(),
      failure: req.failure()?.errorText,
    });
  });

  try {
    // -------------------------------------------------------------------------
    // RUTE 1: PEMUATAN AWAL & VERIFIKASI TATA LETAK STUDIO 1:1
    // -------------------------------------------------------------------------
    console.log('-> Menjalankan Rute 1: Pemuatan Awal & Verifikasi Tata Letak Baru...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_load.png'), fullPage: true });

    // Verifikasi Elemen Penting
    const headerTitle = await page.textContent('h1');
    if (!headerTitle || !headerTitle.includes('Element Maker')) {
      bugsFound.push({ type: 'Visual/UI', description: 'Judul header "Element Maker" tidak ditemukan atau salah.' });
    }

    const routerStatus = await page.locator('text=9Router Aktif').count();
    if (routerStatus === 0) {
      bugsFound.push({ type: 'Visual/UI', description: 'Status "9Router Aktif" tidak muncul di bilah atas.' });
    }

    const activeSidebarTab = await page.locator('button:has-text("Buat Elemen")').count();
    if (activeSidebarTab === 0) {
      bugsFound.push({ type: 'Visual/UI', description: 'Tab "Buat Elemen" pada sidebar tidak ditemukan.' });
    }

    const promptInput = await page.locator('input[placeholder*="Ketik elemen poster"]').count();
    if (promptInput === 0) {
      bugsFound.push({ type: 'Visual/UI', description: 'Kolom input prompt utama tidak ditemukan di bagian bawah.' });
    }

    const canvasElement = await page.locator('img[alt*="Burger"], img[alt*="Elemen"], svg').count();
    if (canvasElement === 0) {
      bugsFound.push({ type: 'Visual/UI', description: 'Gambar elemen pada kanvas tengah tidak dirender.' });
    }

    console.log('   Rute 1 selesai.');

    // -------------------------------------------------------------------------
    // RUTE 2: PENGUJIAN MODE LATAR BELAKANG & MASUKAN DI BAGIAN BAWAH
    // -------------------------------------------------------------------------
    console.log('-> Menjalankan Rute 2: Interaksi Mode Latar Belakang di Bawah...');
    
    // Klik Mode Latar Polos
    const plainBgCard = page.locator('text=Latar Polos').first();
    await plainBgCard.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_mode_plain_bg.png') });

    // Klik Mode Latar Kustom
    const customBgCard = page.locator('text=Latar Kustom').first();
    await customBgCard.click();
    await page.waitForTimeout(500);
    
    // Cek apakah input custom bg muncul dan bisa diketik
    const customBgInput = page.locator('input[placeholder*="piring"], input[placeholder*="studio"]').first();
    if (await customBgInput.count() > 0) {
      await customBgInput.fill('di atas meja kayu gelap dengan lampu studio');
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Input teks untuk Latar Kustom tidak ditemukan saat mode dipilih.' });
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_mode_custom_bg.png') });

    // Kembalikan ke Mode No BG
    const noBgCard = page.locator('text=Tanpa Latar (No BG)').first();
    await noBgCard.click();
    await page.waitForTimeout(500);

    // Coba ketik di kolom prompt utama di bawah
    const mainInput = page.locator('input[placeholder*="Ketik elemen poster"]').first();
    await mainInput.fill('foto burger lezat terpotong keju lumer');
    await page.waitForTimeout(300);

    console.log('   Rute 2 selesai.');

    // -------------------------------------------------------------------------
    // RUTE 3: PENGUJIAN MEJA INSPEKSI & FLOATING TOOLBAR
    // -------------------------------------------------------------------------
    console.log('-> Menjalankan Rute 3: Meja Inspeksi (Uji Warna Latar & HD Toggle)...');

    // Uji Warna Latar Putih
    const whiteSwatch = page.locator('button[title*="putih" i], button[title*="White" i]').first();
    if (await whiteSwatch.count() > 0) {
      await whiteSwatch.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_canvas_white_bg.png') });
    } else {
      bugsFound.push({ type: 'Visual/UI', description: 'Tombol swatch Uji Latar Putih tidak ditemukan.' });
    }

    // Uji Warna Latar Hitam
    const blackSwatch = page.locator('button[title*="hitam" i], button[title*="Black" i]').first();
    if (await blackSwatch.count() > 0) {
      await blackSwatch.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_canvas_black_bg.png') });
    } else {
      bugsFound.push({ type: 'Visual/UI', description: 'Tombol swatch Uji Latar Hitam tidak ditemukan.' });
    }

    // Kembalikan ke Latar Catur
    const checkerSwatch = page.locator('button[title*="catur" i], button[title*="transparan" i]').first();
    if (await checkerSwatch.count() > 0) {
      await checkerSwatch.click();
      await page.waitForTimeout(400);
    }

    // Toggle HD
    const hdToggle = page.locator('text=Tingkatkan HD').first();
    if (await hdToggle.count() > 0) {
      await hdToggle.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_hd_toggle_active.png') });
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Sakelar Tingkatkan HD tidak ditemukan.' });
    }

    console.log('   Rute 3 selesai.');

    // -------------------------------------------------------------------------
    // RUTE 4: PENGUJIAN ALAT KUAS PERBAIKAN & TOMBOL TERAPKAN/TAMBAH OBJEK
    // -------------------------------------------------------------------------
    console.log('-> Menjalankan Rute 4: Alat Kuas Inpainting & Penambahan Objek...');

    // Aktifkan kuas perbaikan
    const inpaintBtn = page.locator('button[title*="Aktifkan Kuas"]').first();
    if (await inpaintBtn.count() > 0) {
      await inpaintBtn.click();
      await page.waitForTimeout(500);
    }

    const inpaintSlider = page.locator('input[type="range"]').first();
    if (await inpaintSlider.count() > 0) {
      await inpaintSlider.fill('48');
      await page.waitForTimeout(300);
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Slider ukuran kuas inpainting tidak ditemukan.' });
    }

    const inpaintInput = page.locator('input[placeholder*="contoh: tambahkan piring"]').first();
    if (await inpaintInput.count() > 0) {
      await inpaintInput.fill('tambahkan piring keramik');
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_inpaint_inputs.png') });
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Kolom teks instruksi inpainting tidak ditemukan.' });
    }

    // Cek apakah tombol "Terapkan / Tambah Objek" ada
    const applyInpaintBtn = page.locator('button:has-text("Terapkan / Tambah Objek")').first();
    if (await applyInpaintBtn.count() === 0) {
      bugsFound.push({ type: 'Visual/UI', description: 'Tombol "Terapkan / Tambah Objek" tidak ditemukan di kanvas inpainting.' });
    }

    // Tutup mode inpainting
    const cancelInpaintBtn = page.locator('button:has-text("Batal")').first();
    if (await cancelInpaintBtn.count() > 0) {
      await cancelInpaintBtn.click();
      await page.waitForTimeout(400);
    }

    console.log('   Rute 4 selesai.');

    // -------------------------------------------------------------------------
    // RUTE 5: PENGUJIAN SIDEBAR KANAN KOLEKSI & AKSI BUKA/TUTUP
    // -------------------------------------------------------------------------
    console.log('-> Menjalankan Rute 5: Sidebar Kanan Koleksi & Aksi Buka/Tutup...');

    // Cek jumlah kartu elemen di sidebar kanan
    const elementCards = page.locator('[data-element-card="true"]');
    const cardCount = await elementCards.count();
    console.log(`   Ditemukan ${cardCount} kartu elemen di sidebar kanan.`);
    if (cardCount < 4) {
      bugsFound.push({ type: 'Visual Bug', description: `Jumlah kartu elemen di galeri terlalu sedikit (${cardCount}), seharusnya ada 8 elemen awal.` });
    }

    // Klik kartu kedua (Pita Emas) untuk melihat pergantian gambar kanvas
    if (cardCount > 1) {
      await elementCards.nth(1).click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_select_gold_ribbon.png') });
    }

    // Uji tombol Tutup / Sembunyikan Koleksi
    const hideGalleryBtn = page.locator('button[title*="Sembunyikan Koleksi"]').first();
    if (await hideGalleryBtn.count() > 0) {
      await hideGalleryBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08b_gallery_collapsed.png') });

      // Verifikasi tombol tab melayang "Koleksi (8)" muncul di tepi kanan
      const openGalleryBtn = page.locator('button[title*="Buka Koleksi"]').first();
      if (await openGalleryBtn.count() > 0) {
        await openGalleryBtn.click();
        await page.waitForTimeout(500);
      } else {
        bugsFound.push({ type: 'Functional Bug', description: 'Tombol pembuka koleksi tidak muncul saat sidebar kanan ditutup.' });
      }
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Tombol "Sembunyikan Koleksi" pada sidebar kanan tidak ditemukan.' });
    }

    // Tes pencarian di koleksi
    const searchInput = page.locator('input[placeholder*="Cari di koleksi"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Burger');
      await page.waitForTimeout(400);
      const filteredCount = await page.locator('[data-element-card="true"]').count();
      if (filteredCount > 3) {
        bugsFound.push({ type: 'Functional Bug', description: 'Filter pencarian galeri tidak menyaring kartu dengan benar.' });
      }
      await searchInput.fill(''); // Bersihkan kembali
      await page.waitForTimeout(400);
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Kolom input pencarian koleksi tidak ditemukan.' });
    }

    // Cek tombol Salin & Unduh
    const copyBtn = page.locator('button:has-text("Salin")').first();
    if (await copyBtn.count() > 0) {
      await copyBtn.click();
      await page.waitForTimeout(400);
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Tombol "Salin" pada kartu elemen tidak ditemukan.' });
    }

    // Uji Tombol "Pilih Banyak" (Multi-Select)
    const multiSelectBtn = page.locator('button:has-text("Pilih Banyak")').first();
    if (await multiSelectBtn.count() > 0) {
      await multiSelectBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09b_multi_select_mode.png') });

      // Kembali ke mode normal
      const finishSelectBtn = page.locator('button:has-text("Selesai")').first();
      if (await finishSelectBtn.count() > 0) {
        await finishSelectBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Klik tombol "Simpan ke Koleksi" di kanvas
    const saveCollectionBtn = page.locator('button:has-text("Simpan ke Koleksi")').first();
    if (await saveCollectionBtn.count() > 0) {
      await saveCollectionBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_save_to_collection.png') });
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Tombol "Simpan ke Koleksi" di bawah kanvas tidak ditemukan.' });
    }

    console.log('   Rute 5 selesai.');

    // -------------------------------------------------------------------------
    // RUTE 6: PENGUJIAN MODAL PENGATURAN (SETTINGS)
    // -------------------------------------------------------------------------
    console.log('-> Menjalankan Rute 6: Modal Pengaturan...');

    const gearBtn = page.locator('button[data-testid="settings-button"], button[title*="Pengaturan"]').first();
    if (await gearBtn.count() > 0) {
      await gearBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_settings_modal_opened.png') });

      // Verifikasi elemen modal
      const modalHeader = await page.locator('text=Pengaturan Sambungan & Model AI').count();
      if (modalHeader === 0) {
        bugsFound.push({ type: 'Visual/UI', description: 'Judul modal pengaturan tidak muncul saat tombol gear diklik.' });
      }

      // Tutup modal menggunakan tombol silang modal dengan data-testid spesifik
      const closeBtn = page.locator('button[data-testid="close-settings-modal"], button[data-testid="cancel-settings-modal"]').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(400);
      }
    } else {
      bugsFound.push({ type: 'Functional Bug', description: 'Tombol roda gigi Pengaturan tidak ditemukan di bilah atas.' });
    }

    console.log('   Rute 6 selesai.');

    // -------------------------------------------------------------------------
    // RUTE 7: PENGUJIAN NAVIGASI TAB SIDEBAR KIRI
    // -------------------------------------------------------------------------
    console.log('-> Menjalankan Rute 7: Navigasi Sidebar Kiri...');
    const koleksiTab = page.locator('button:has-text("Koleksi")').first();
    if (await koleksiTab.count() > 0) {
      await koleksiTab.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_sidebar_koleksi_tab.png') });
    }

    const buatElemenTab = page.locator('button:has-text("Buat Elemen")').first();
    if (await buatElemenTab.count() > 0) {
      await buatElemenTab.click();
      await page.waitForTimeout(400);
    }

    console.log('   Rute 7 selesai.');

  } catch (err) {
    bugsFound.push({
      type: 'Eksepsi Uji Fatal',
      text: err.message,
      stack: err.stack,
    });
  } finally {
    await browser.close();
  }

  // Tampilkan rangkuman temuan
  console.log('\n===================================================');
  console.log('HASIL PENGUMPULAN BUG (BUG COLLECTION LEDGER):');
  console.log(`Total Temuan Bug/Kendala: ${bugsFound.length}`);
  console.log('===================================================');
  
  bugsFound.forEach((b, idx) => {
    console.log(`\n[Temuan #${idx + 1}] (${b.type}):`);
    console.log(JSON.stringify(b, null, 2));
  });

  // Simpan hasil audit ke berkas JSON
  fs.writeFileSync(
    path.resolve('tests/bug_audit_results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), totalBugs: bugsFound.length, bugs: bugsFound, logs }, null, 2)
  );

  console.log('\nHasil lengkap disimpan di tests/bug_audit_results.json');
}

runLiveTest();
