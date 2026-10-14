/**
 * Pengelola Penyimpanan Lokal Berbasis IndexedDB untuk Element Maker
 * Menyimpan aset elemen grafis (gambar base64, prompt, mode latar, waktu pembuatan)
 * secara aman dan awet langsung di peramban pengguna.
 */

const DB_NAME = 'ElementMakerDB';
const DB_VERSION = 1;
const STORE_NAME = 'elements';

/**
 * Membuka atau menginisialisasi database IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new Error(`Gagal membuka penyimpanan IndexedDB: ${event.target.error}`));
    };
  });
}

/**
 * Menyimpan elemen grafis baru ke dalam IndexedDB.
 * @param {Object} element
 * @param {string} [element.id] - Identitas unik (otomatis dibuat jika kosong)
 * @param {string} element.image_base64 - Data gambar PNG base64
 * @param {string} element.prompt - Teks instruksi pembuatan
 * @param {string} [element.mode] - Mode latar (no_bg, plain_bg, custom_bg)
 * @param {string} [element.created_at] - Waktu ISO string
 * @returns {Promise<Object>} Data elemen yang berhasil disimpan
 */
export async function saveElement(element) {
  const db = await openDB();
  const id = element.id || `elem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const itemToSave = {
    ...element,
    id,
    created_at: element.created_at || new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(itemToSave);

    request.onsuccess = () => {
      resolve(itemToSave);
    };

    request.onerror = (event) => {
      reject(new Error(`Gagal menyimpan elemen: ${event.target.error}`));
    };
  });
}

/**
 * Mengambil semua elemen yang tersimpan, diurutkan dari yang paling baru.
 * @returns {Promise<Array<Object>>} Daftar elemen
 */
export async function getAllElements() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result || [];
      // Urutkan dari yang terbaru ke terlama
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      resolve(results);
    };

    request.onerror = (event) => {
      reject(new Error(`Gagal membaca daftar elemen tersimpan: ${event.target.error}`));
    };
  });
}

/**
 * Menghapus elemen berdasarkan ID dari IndexedDB.
 * @param {string} id - ID elemen yang ingin dihapus
 * @returns {Promise<boolean>}
 */
export async function deleteElement(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      reject(new Error(`Gagal menghapus elemen ID ${id}: ${event.target.error}`));
    };
  });
}

/**
 * Mengosongkan seluruh koleksi elemen tersimpan.
 * @returns {Promise<boolean>}
 */
export async function clearAllElements() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      reject(new Error(`Gagal mengosongkan penyimpanan: ${event.target.error}`));
    };
  });
}
