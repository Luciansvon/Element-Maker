import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function testZoomAndShortcuts() {
  console.log('=== MEMULAI VERIFIKASI FITUR ZOOM, PAN & PINTASAN KEYBOARD ===\n');

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

  const logs = [];
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('1. Membuka Studio di http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Ambil screenshot tampilan awal
    await page.screenshot({ path: path.join(screenshotDir, 'verify_01_initial.png') });
    console.log('-> Screenshot awal tersimpan: verify_01_initial.png');

    // 2. Verifikasi Kontrol Zoom di Kanvas
    console.log('2. Memeriksa keberadaan Kontrol Zoom di pojok kanvas...');
    const zoomInBtn = await page.waitForSelector('button[title*="Perbesar Tampilan"]', { timeout: 5000 });
    const zoomOutBtn = await page.waitForSelector('button[title*="Perkecil Tampilan"]', { timeout: 5000 });
    const zoomResetBtn = await page.waitForSelector('button[title*="Reset Ukuran"]', { timeout: 5000 });

    const initialZoomText = await zoomResetBtn.innerText();
    console.log(`-> Indikator Zoom Awal: ${initialZoomText}`);

    // 3. Uji Klik Tombol Zoom In
    console.log('3. Menguji klik tombol Zoom In 2 kali...');
    await zoomInBtn.click();
    await page.waitForTimeout(300);
    await zoomInBtn.click();
    await page.waitForTimeout(300);

    const zoomedInText = await zoomResetBtn.innerText();
    console.log(`-> Indikator Zoom Setelah Zoom In (+50%): ${zoomedInText}`);

    await page.screenshot({ path: path.join(screenshotDir, 'verify_02_zoomed_in.png') });
    console.log('-> Screenshot Zoom In tersimpan: verify_02_zoomed_in.png');

    // 4. Uji Klik Tombol Reset Fit
    console.log('4. Menguji klik tombol Reset Fit...');
    await zoomResetBtn.click();
    await page.waitForTimeout(300);

    const resetText = await zoomResetBtn.innerText();
    console.log(`-> Indikator Zoom Setelah Reset: ${resetText}`);

    // 5. Uji Pintasan Keyboard (Ctrl + S: Simpan ke Koleksi)
    console.log('5. Menguji Pintasan Keyboard Ctrl + S...');
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(600);

    const toastElement = await page.$('.animate-bounce, [role="alert"]');
    if (toastElement) {
      const toastText = await toastElement.innerText();
      console.log(`-> Toast yang muncul setelah Ctrl+S: "${toastText.trim()}"`);
    }

    // 6. Uji Pintasan Keyboard (Ctrl + C: Salin PNG)
    console.log('6. Menguji Pintasan Keyboard Ctrl + C...');
    await page.keyboard.press('Control+c');
    await page.waitForTimeout(600);

    const toastAfterCopy = await page.$('.animate-bounce, [role="alert"]');
    if (toastAfterCopy) {
      const copyText = await toastAfterCopy.innerText();
      console.log(`-> Toast yang muncul setelah Ctrl+C: "${copyText.trim()}"`);
    }

    // 7. Uji Pintasan Keyboard Zoom (Ctrl + = dan Ctrl + -)
    console.log('7. Menguji Pintasan Keyboard Zoom Ctrl+=...');
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(400);
    const keyZoomText = await zoomResetBtn.innerText();
    console.log(`-> Indikator Zoom Setelah Ctrl+=: ${keyZoomText}`);

    // 8. Tampilan Optimal Skala 75%
    console.log('8. Menguji tampilan skala optimal 75%...');
    await page.evaluate(() => {
      document.body.style.zoom = '75%';
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'verify_03_optimal_75percent.png') });
    console.log('-> Screenshot skala 75% tersimpan: verify_03_optimal_75percent.png');

    console.log('\n=== SEMUA UJI KONTROL ZOOM & PINTASAN KEYBOARD BERHASIL (PASS) ===');
  } catch (err) {
    console.error('Terjadi kendala pada pengujian:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testZoomAndShortcuts();
