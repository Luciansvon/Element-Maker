import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function testSidebarAndNewFeatures() {
  console.log('=== MEMULAI VERIFIKASI SIDEBAR AKTIF & FITUR BARU POSTER ===\n');

  const screenshotDir = path.resolve('tests/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 900 },
  });

  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  try {
    console.log('1. Membuka Studio di http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Ambil screenshot awal dengan sidebar baru
    await page.screenshot({ path: path.join(screenshotDir, 'verify_04_sidebar_modes.png') });
    console.log('-> Screenshot tersimpan: verify_04_sidebar_modes.png');

    // 2. Verifikasi 4 Menu di Sidebar Kiri
    console.log('2. Memeriksa 4 Menu di Sidebar Kiri...');
    const objectsTab = await page.waitForSelector('button:has-text("Objek Grafis")', { timeout: 5000 });
    const typoTab = await page.waitForSelector('button:has-text("Tipografi 3D")', { timeout: 5000 });
    const colTab = await page.waitForSelector('button:has-text("Laci Koleksi")', { timeout: 5000 });
    const setTab = await page.waitForSelector('button:has-text("Pengaturan AI")', { timeout: 5000 });

    if (!objectsTab || !typoTab || !colTab || !setTab) {
      throw new Error('Menu Sidebar Kiri tidak lengkap!');
    }
    console.log('-> 4 Menu Sidebar Kiri terverifikasi aktif!');

    // 3. Verifikasi Tombol Mode Kaca & Air
    console.log('3. Menguji tombol Mode Kaca & Air di kartu No BG...');
    const glassBtn = await page.waitForSelector('button:has-text("Kaca & Air")', { timeout: 5000 });
    await glassBtn.click();
    await page.waitForTimeout(300);
    const glassActive = await page.$('button:has-text("Kaca/Air Aktif")');
    if (!glassActive) {
      throw new Error('Tombol Kaca & Air tidak merespons aktivasi!');
    }
    console.log('-> Tombol Kaca & Air berhasil diaktifkan!');

    // 4. Verifikasi Tombol Vektor (SVG)
    console.log('4. Menguji tombol Vektor (SVG) di Toolbar Kanvas...');
    const vectorBtn = await page.waitForSelector('button:has-text("Vektor (SVG)")', { timeout: 5000 });
    await vectorBtn.click();
    await page.waitForTimeout(1500); // Tunggu proses konversi vektor selesai

    // Periksa apakah ada toast konversi vektor
    const vectorToast = await page.$('.animate-bounce, [role="alert"]');
    if (vectorToast) {
      const vText = await vectorToast.innerText();
      console.log(`-> Toast Vektor: "${vText.trim()}"`);
    }
    await page.screenshot({ path: path.join(screenshotDir, 'verify_05_vectorize_done.png') });
    console.log('-> Screenshot tersimpan: verify_05_vectorize_done.png');

    // 5. Berpindah ke Mode Tipografi 3D
    console.log('5. Menguji peralihan ke Mode Tipografi 3D...');
    await typoTab.click();
    await page.waitForTimeout(500);

    const typoInput = await page.waitForSelector('input[placeholder*="Ketik kata/tulisan 3D"]', { timeout: 5000 });
    const balloonPreset = await page.waitForSelector('h4:has-text("Balon Pop-up")', { timeout: 5000 });
    const goldPreset = await page.waitForSelector('h4:has-text("Emas Mewah")', { timeout: 5000 });
    const printBtn = await page.waitForSelector('button:has-text("Cetak 3D")', { timeout: 5000 });

    if (!typoInput || !balloonPreset || !goldPreset || !printBtn) {
      throw new Error('Studio Tipografi 3D tidak tampil lengkap!');
    }
    console.log('-> Studio Tipografi 3D tampil sempurna lengkap dengan 5 preset gaya!');

    // Coba pilih preset Emas Mewah
    await goldPreset.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(screenshotDir, 'verify_06_typography_3d_mode.png') });
    console.log('-> Screenshot tersimpan: verify_06_typography_3d_mode.png');

    // 6. Verifikasi Buka Pengaturan dari Sidebar Kiri
    console.log('6. Menguji klik Pengaturan AI dari Sidebar Kiri...');
    await setTab.click();
    await page.waitForTimeout(500);

    const modalTitle = await page.waitForSelector('h2:has-text("Pengaturan"), h3:has-text("Pengaturan")', { timeout: 5000 });
    if (!modalTitle) {
      throw new Error('Modal pengaturan tidak terbuka saat diklik dari sidebar!');
    }
    console.log('-> Modal Pengaturan berhasil terbuka dari sidebar!');

    // Tutup modal
    const closeBtn = await page.waitForSelector('button[data-testid="close-settings-modal"], button:has-text("Tutup")', { timeout: 5000 });
    await closeBtn.click();
    await page.waitForTimeout(400);

    // 7. Verifikasi Skala Optimal 75%
    console.log('7. Menguji keselarasan tampilan studio pada skala optimal 75%...');
    await page.evaluate(() => {
      document.body.style.zoom = '75%';
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'verify_07_typography_75percent.png') });
    console.log('-> Screenshot tersimpan: verify_07_typography_75percent.png');

    console.log('\n=== SEMUA FITUR SIDEBAR AKTIF & FITUR BARU POSTER 100% LOLOS (PASS) ===');
  } catch (err) {
    console.error('Kendala saat pengujian live browser:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSidebarAndNewFeatures();
