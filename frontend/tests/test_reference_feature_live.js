import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('tests/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const CAT_IMAGE_PATH = path.resolve('../direct_test_gemini_cat.png');

async function testReferenceFeatureLive() {
  console.log('=== MEMULAI PENGUJIAN LIVE FITUR REFERENCE DI BROWSER ===\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const report = {
    steps: [],
    errors: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('[Browser Error]', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    report.errors.push(err.message);
    console.error('[Page Error]', err.message);
  });

  try {
    // 1. Buka aplikasi
    console.log('-> 1. Membuka aplikasi di http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // 2. Verifikasi Kotak Reference Kosong di Pojok Kiri Atas Kanvas
    console.log('-> 2. Memeriksa keberadaan Kotak Reference di kanvas...');
    const refBox = page.locator('div:has-text("+ Pasang Foto")').first();
    const isRefVisible = await refBox.isVisible();
    console.log(`   Kotak Reference terlihat: ${isRefVisible}`);
    report.steps.push({ step: 'Cek Kotak Reference Kosong', success: isRefVisible });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ref_01_empty_box.png') });

    // 3. Pasang foto kucing hitam ke kotak Reference
    console.log('-> 3. Memasang foto kucing hitam ke Kotak Reference...');
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(CAT_IMAGE_PATH);
    await page.waitForTimeout(1000);

    // 4. Verifikasi foto terpasang di kotak Reference
    const refBadge = page.locator('span:has-text("Reference")').first();
    const isBadgeVisible = await refBadge.isVisible();
    console.log(`   Badge Reference terlihat: ${isBadgeVisible}`);

    const deleteBtn = page.locator('button[title*="Hapus gambar Reference"]').first();
    const isDeleteBtnVisible = await deleteBtn.isVisible();
    console.log(`   Tombol Hapus (X) terlihat: ${isDeleteBtnVisible}`);
    report.steps.push({ step: 'Unggah Gambar Reference', success: isBadgeVisible && isDeleteBtnVisible });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ref_02_loaded_box.png') });

    // 5. Cek fitur Resize Kotak Reference
    console.log('-> 5. Menguji pengubahan ukuran (resize) Kotak Reference...');
    const resizeHandle = page.locator('div[title*="Tarik"]').first();
    if (await resizeHandle.isVisible()) {
      const boxBefore = await resizeHandle.boundingBox();
      if (boxBefore) {
        await page.mouse.move(boxBefore.x + boxBefore.width / 2, boxBefore.y + boxBefore.height / 2);
        await page.mouse.down();
        await page.mouse.move(boxBefore.x + 80, boxBefore.y + 80, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
      report.steps.push({ step: 'Resize Kotak Reference', success: true });
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ref_03_resized_box.png') });

    // 6. Masukkan prompt instruksi pembuatan elemen di bilah bawah
    console.log('-> 6. Mengetik prompt pembuatan elemen dengan referensi...');
    const promptInput = page.locator('input.glass-soft').first();
    await promptInput.fill('kucing hitam memakai dasi kupu-kupu merah');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ref_04_ready_to_generate.png') });
    report.steps.push({ step: 'Ketik Prompt Referensi', success: true });

    // 7. Klik Buat Elemen dan tunggu hasil generate AI
    console.log('-> 7. Mengklik tombol Buat Elemen...');
    const generateBtn = page.locator('button:has-text("Buat Elemen")').first();
    await generateBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ref_05_generating_in_progress.png') });

    console.log('-> 8. Menunggu AI selesai membuat elemen (hingga 90 detik)...');
    // Tunggu tombol Buat Elemen selesai loading atau toast sukses muncul
    await page.waitForSelector('text=Elemen grafis berhasil dibuat', { timeout: 90000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ref_06_canvas_result.png') });
    report.steps.push({ step: 'Generate dengan Referensi Selesai & Tampil di Kanvas', success: true });

    console.log('-> Seluruh langkah pengujian UI Kotak Reference Sukses!');
  } catch (err) {
    console.error('Kendala saat pengujian:', err);
    report.errors.push(err.message);
  } finally {
    await browser.close();
  }

  console.log('\n=== RANGKUMAN UJI COBA ===');
  console.log(JSON.stringify(report, null, 2));
}

testReferenceFeatureLive();
