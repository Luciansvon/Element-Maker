/**
 * Database Template Resolusi Layar & Rasio Aspek
 * Wallpaper & Background Maker
 * Kategori: Smartphone, Tablet, Laptop & Desktop, Monitor Ultrawide
 */

export const WALLPAPER_CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'phone', label: 'Smartphone / HP' },
  { id: 'tablet', label: 'Tablet / iPad' },
  { id: 'desktop', label: 'Laptop & Desktop' },
  { id: 'ultrawide', label: 'Ultrawide Monitor' }
];

export const WALLPAPER_TEMPLATES = [
  // ==========================================
  // 1. SMARTPHONE / HP (category: 'phone')
  // ==========================================
  // --- Standar Umum HP ---
  {
    id: 'phone-std-1080x2400',
    category: 'phone',
    brand: 'Umum / Standar',
    model: 'FHD+ Modern (1080 x 2400)',
    width: 1080,
    height: 2400,
    aspectRatio: '20:9',
    isDefault: true,
    tags: ['umum', 'standar', 'fhd+', 'full hd+', 'android', '20:9', 'smartphone', 'hp']
  },
  {
    id: 'phone-std-1080x1920',
    category: 'phone',
    brand: 'Umum / Standar',
    model: 'FHD Standar 16:9 (1080 x 1920)',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    isDefault: false,
    tags: ['umum', 'standar', 'fhd', '1080p', '16:9', '9:16', 'smartphone', 'hp']
  },
  {
    id: 'phone-std-1080x2340',
    category: 'phone',
    brand: 'Umum / Standar',
    model: 'FHD+ 19.5:9 (1080 x 2340)',
    width: 1080,
    height: 2340,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['umum', 'standar', 'fhd+', '19.5:9', 'smartphone', 'hp']
  },
  {
    id: 'phone-std-1440x3200',
    category: 'phone',
    brand: 'Umum / Standar',
    model: 'QHD+ Flagship (1440 x 3200)',
    width: 1440,
    height: 3200,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['umum', 'standar', 'qhd+', '2k', '1440p', 'flagship', 'smartphone', 'hp']
  },
  {
    id: 'phone-std-720x1600',
    category: 'phone',
    brand: 'Umum / Standar',
    model: 'HD+ Entry Level (720 x 1600)',
    width: 720,
    height: 1600,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['umum', 'standar', 'hd+', '720p', 'entry', 'smartphone', 'hp']
  },

  // --- Apple iPhone ---
  {
    id: 'apple-iphone-16-pro-max',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 16 Pro Max',
    width: 1320,
    height: 2868,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '16', 'pro', 'max', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-16-pro',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 16 Pro',
    width: 1206,
    height: 2622,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '16', 'pro', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-16-plus',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 16 Plus',
    width: 1290,
    height: 2796,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '16', 'plus', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-16',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 16',
    width: 1179,
    height: 2556,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '16', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-15-pro-max',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    width: 1290,
    height: 2796,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '15', 'pro', 'max', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-15-pro',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    width: 1179,
    height: 2556,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '15', 'pro', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-15-plus',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Plus',
    width: 1290,
    height: 2796,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '15', 'plus', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-15',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15',
    width: 1179,
    height: 2556,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '15', 'ios', 'retina', 'dynamic island']
  },
  {
    id: 'apple-iphone-14-pro-max',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14 Pro Max',
    width: 1290,
    height: 2796,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '14', 'pro', 'max', 'ios', 'dynamic island']
  },
  {
    id: 'apple-iphone-14-pro',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    width: 1179,
    height: 2556,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '14', 'pro', 'ios', 'dynamic island']
  },
  {
    id: 'apple-iphone-14-plus',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14 Plus',
    width: 1284,
    height: 2778,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '14', 'plus', 'ios']
  },
  {
    id: 'apple-iphone-14-13-12',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14 / 13 / 13 Pro / 12',
    width: 1170,
    height: 2532,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '14', '13', '12', 'pro', 'ios']
  },
  {
    id: 'apple-iphone-13-12-mini',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 13 mini / 12 mini',
    width: 1080,
    height: 2340,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['apple', 'iphone', '13', '12', 'mini', 'ios']
  },
  {
    id: 'apple-iphone-se-3',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone SE (Gen 2 & 3)',
    width: 750,
    height: 1334,
    aspectRatio: '16:9',
    isDefault: false,
    tags: ['apple', 'iphone', 'se', 'se2', 'se3', 'ios']
  },

  // --- Samsung Galaxy ---
  {
    id: 'samsung-galaxy-s24-ultra',
    category: 'phone',
    brand: 'Samsung',
    model: 'Samsung Galaxy S24 Ultra',
    width: 1440,
    height: 3120,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 's24', 'ultra', 'android', 'amoled', 'qhd+']
  },
  {
    id: 'samsung-galaxy-s24-plus',
    category: 'phone',
    brand: 'Samsung',
    model: 'Samsung Galaxy S24+',
    width: 1440,
    height: 3120,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 's24+', 's24 plus', 'android', 'amoled', 'qhd+']
  },
  {
    id: 'samsung-galaxy-s24',
    category: 'phone',
    brand: 'Samsung',
    model: 'Samsung Galaxy S24',
    width: 1080,
    height: 2340,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 's24', 'android', 'amoled', 'fhd+']
  },
  {
    id: 'samsung-galaxy-s23-ultra',
    category: 'phone',
    brand: 'Samsung',
    model: 'Samsung Galaxy S23 Ultra',
    width: 1440,
    height: 3088,
    aspectRatio: '19.3:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 's23', 'ultra', 'android', 'amoled', 'qhd+']
  },
  {
    id: 'samsung-galaxy-s23',
    category: 'phone',
    brand: 'Samsung',
    model: 'Samsung Galaxy S23 / S23+',
    width: 1080,
    height: 2340,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 's23', 'plus', 'android', 'amoled', 'fhd+']
  },
  {
    id: 'samsung-galaxy-z-fold-6-inner',
    category: 'phone',
    brand: 'Samsung',
    model: 'Galaxy Z Fold 6 (Layar Dalam Terbuka)',
    width: 1856,
    height: 2160,
    aspectRatio: '20.9:18',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'z fold 6', 'foldable', 'layar dalam', 'inner', 'tablet mode']
  },
  {
    id: 'samsung-galaxy-z-fold-6-cover',
    category: 'phone',
    brand: 'Samsung',
    model: 'Galaxy Z Fold 6 (Layar Luar Cover)',
    width: 968,
    height: 2376,
    aspectRatio: '22.1:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'z fold 6', 'foldable', 'cover', 'layar luar']
  },
  {
    id: 'samsung-galaxy-z-flip-6-main',
    category: 'phone',
    brand: 'Samsung',
    model: 'Galaxy Z Flip 6 (Layar Utama)',
    width: 1080,
    height: 2640,
    aspectRatio: '22:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'z flip 6', 'flip', 'clamshell', 'fhd+']
  },
  {
    id: 'samsung-galaxy-z-flip-6-cover',
    category: 'phone',
    brand: 'Samsung',
    model: 'Galaxy Z Flip 6 (Cover Screen Flex Window)',
    width: 720,
    height: 748,
    aspectRatio: '1:1.04',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'z flip 6', 'cover', 'flex window', 'widget']
  },
  {
    id: 'samsung-galaxy-a55-a35',
    category: 'phone',
    brand: 'Samsung',
    model: 'Galaxy A55 / A35 / A25 5G',
    width: 1080,
    height: 2340,
    aspectRatio: '19.5:9',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'a55', 'a35', 'a25', 'seri a', 'android', 'fhd+']
  },

  // --- Xiaomi / Redmi / POCO ---
  {
    id: 'xiaomi-14-ultra',
    category: 'phone',
    brand: 'Xiaomi',
    model: 'Xiaomi 14 Ultra',
    width: 1440,
    height: 3200,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['xiaomi', '14', 'ultra', 'flagship', 'hyperos', 'amoled', 'wqhd+']
  },
  {
    id: 'xiaomi-14',
    category: 'phone',
    brand: 'Xiaomi',
    model: 'Xiaomi 14',
    width: 1200,
    height: 2670,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['xiaomi', '14', 'hyperos', '1.5k', 'amoled']
  },
  {
    id: 'xiaomi-redmi-note-13-pro-plus',
    category: 'phone',
    brand: 'Xiaomi',
    model: 'Redmi Note 13 Pro+ / Pro 5G',
    width: 1220,
    height: 2712,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['xiaomi', 'redmi', 'note 13 pro', 'note 13 pro+', '1.5k', 'amoled']
  },
  {
    id: 'xiaomi-redmi-note-13',
    category: 'phone',
    brand: 'Xiaomi',
    model: 'Redmi Note 13 (4G / 5G)',
    width: 1080,
    height: 2400,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['xiaomi', 'redmi', 'note 13', 'fhd+', 'amoled']
  },
  {
    id: 'xiaomi-poco-f6-pro',
    category: 'phone',
    brand: 'Xiaomi',
    model: 'POCO F6 Pro',
    width: 1440,
    height: 3200,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['poco', 'f6 pro', 'xiaomi', 'flagship', 'wqhd+', '2k']
  },
  {
    id: 'xiaomi-poco-f6',
    category: 'phone',
    brand: 'Xiaomi',
    model: 'POCO F6 / X6 Pro',
    width: 1220,
    height: 2712,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['poco', 'f6', 'x6 pro', 'xiaomi', 'crystalres', '1.5k']
  },

  // --- Google Pixel ---
  {
    id: 'google-pixel-9-pro-xl',
    category: 'phone',
    brand: 'Google',
    model: 'Google Pixel 9 Pro XL',
    width: 1344,
    height: 2992,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['google', 'pixel', '9', 'pro', 'xl', 'super actua', 'oled']
  },
  {
    id: 'google-pixel-9-pro',
    category: 'phone',
    brand: 'Google',
    model: 'Google Pixel 9 Pro',
    width: 1280,
    height: 2856,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['google', 'pixel', '9', 'pro', 'super actua', 'oled']
  },
  {
    id: 'google-pixel-9',
    category: 'phone',
    brand: 'Google',
    model: 'Google Pixel 9',
    width: 1080,
    height: 2424,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['google', 'pixel', '9', 'actua', 'oled']
  },
  {
    id: 'google-pixel-8-pro',
    category: 'phone',
    brand: 'Google',
    model: 'Google Pixel 8 Pro',
    width: 1344,
    height: 2992,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['google', 'pixel', '8', 'pro', 'super actua', 'oled']
  },
  {
    id: 'google-pixel-8-8a',
    category: 'phone',
    brand: 'Google',
    model: 'Google Pixel 8 / 8a',
    width: 1080,
    height: 2400,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['google', 'pixel', '8', '8a', 'actua', 'oled', 'fhd+']
  },

  // --- Merek Lain (Asus ROG, Oppo, Vivo, OnePlus) ---
  {
    id: 'asus-rog-phone-8',
    category: 'phone',
    brand: 'Asus',
    model: 'Asus ROG Phone 8 / 8 Pro',
    width: 1080,
    height: 2400,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['asus', 'rog', 'phone 8', 'gaming', 'amoled', '165hz']
  },
  {
    id: 'oppo-find-x7-ultra',
    category: 'phone',
    brand: 'Oppo',
    model: 'Oppo Find X7 Ultra',
    width: 1440,
    height: 3168,
    aspectRatio: '19.8:9',
    isDefault: false,
    tags: ['oppo', 'find x7', 'ultra', 'coloros', '2k', 'qhd+']
  },
  {
    id: 'oppo-reno-12-pro',
    category: 'phone',
    brand: 'Oppo',
    model: 'Oppo Reno 12 Pro',
    width: 1080,
    height: 2412,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['oppo', 'reno 12', 'pro', 'coloros', 'fhd+', 'amoled']
  },
  {
    id: 'vivo-x100-pro',
    category: 'phone',
    brand: 'Vivo',
    model: 'Vivo X100 Pro',
    width: 1260,
    height: 2800,
    aspectRatio: '20:9',
    isDefault: false,
    tags: ['vivo', 'x100', 'pro', 'funtouch', 'origin', '1.5k', 'zeiss']
  },
  {
    id: 'oneplus-12',
    category: 'phone',
    brand: 'OnePlus',
    model: 'OnePlus 12',
    width: 1440,
    height: 3168,
    aspectRatio: '19.8:9',
    isDefault: false,
    tags: ['oneplus', '12', 'pro', 'oxygenos', '2k', 'qhd+']
  },

  // ==========================================
  // 2. TABLET (category: 'tablet')
  // ==========================================
  // --- Standar Umum Tablet ---
  {
    id: 'tablet-std-1600x2560',
    category: 'tablet',
    brand: 'Umum / Standar',
    model: '2K WQXGA Tablet (1600 x 2560)',
    width: 1600,
    height: 2560,
    aspectRatio: '16:10',
    isDefault: true,
    tags: ['umum', 'standar', 'tablet', '2k', 'wqxga', '16:10', 'android']
  },
  {
    id: 'tablet-std-1200x1920',
    category: 'tablet',
    brand: 'Umum / Standar',
    model: 'FHD Tablet (1200 x 1920)',
    width: 1200,
    height: 1920,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['umum', 'standar', 'tablet', 'fhd', '1200p', '16:10']
  },
  {
    id: 'tablet-std-1536x2048',
    category: 'tablet',
    brand: 'Umum / Standar',
    model: 'Standar Tablet 4:3 (1536 x 2048)',
    width: 1536,
    height: 2048,
    aspectRatio: '3:4',
    isDefault: false,
    tags: ['umum', 'standar', 'tablet', '4:3', '3:4']
  },

  // --- Apple iPad ---
  {
    id: 'apple-ipad-pro-13-m4',
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Pro 13" (M4 OLED)',
    width: 2064,
    height: 2752,
    aspectRatio: '3:4',
    isDefault: false,
    tags: ['apple', 'ipad', 'pro', '13', 'm4', 'oled', 'ultra retina xdr', 'ipados']
  },
  {
    id: 'apple-ipad-pro-11-m4',
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Pro 11" (M4 OLED)',
    width: 1668,
    height: 2420,
    aspectRatio: '1:1.45',
    isDefault: false,
    tags: ['apple', 'ipad', 'pro', '11', 'm4', 'oled', 'ultra retina xdr', 'ipados']
  },
  {
    id: 'apple-ipad-air-13-m2',
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Air 13" (M2)',
    width: 2048,
    height: 2732,
    aspectRatio: '3:4',
    isDefault: false,
    tags: ['apple', 'ipad', 'air', '13', 'm2', 'liquid retina', 'ipados']
  },
  {
    id: 'apple-ipad-air-11-m2',
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Air 11" (M2) & iPad 10th Gen',
    width: 1640,
    height: 2360,
    aspectRatio: '1:1.44',
    isDefault: false,
    tags: ['apple', 'ipad', 'air', '11', '10th gen', 'm2', 'liquid retina']
  },
  {
    id: 'apple-ipad-mini-6',
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Mini 6 / Mini 7',
    width: 1488,
    height: 2266,
    aspectRatio: '3:2',
    isDefault: false,
    tags: ['apple', 'ipad', 'mini', 'mini 6', 'mini 7', 'compact tablet']
  },

  // --- Samsung Galaxy Tab ---
  {
    id: 'samsung-galaxy-tab-s9-ultra',
    category: 'tablet',
    brand: 'Samsung',
    model: 'Samsung Galaxy Tab S9 Ultra (14.6")',
    width: 1848,
    height: 2960,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'tab', 's9', 'ultra', 'amoled', 'large tablet']
  },
  {
    id: 'samsung-galaxy-tab-s9-plus',
    category: 'tablet',
    brand: 'Samsung',
    model: 'Samsung Galaxy Tab S9+ (12.4")',
    width: 1752,
    height: 2800,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'tab', 's9+', 's9 plus', 'amoled']
  },
  {
    id: 'samsung-galaxy-tab-s9',
    category: 'tablet',
    brand: 'Samsung',
    model: 'Samsung Galaxy Tab S9 / S9 FE (11")',
    width: 1600,
    height: 2560,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['samsung', 'galaxy', 'tab', 's9', 's9 fe', 'amoled']
  },

  // --- Xiaomi Pad ---
  {
    id: 'xiaomi-pad-6s-pro',
    category: 'tablet',
    brand: 'Xiaomi',
    model: 'Xiaomi Pad 6S Pro 12.4" (3K)',
    width: 2032,
    height: 3048,
    aspectRatio: '2:3',
    isDefault: false,
    tags: ['xiaomi', 'pad 6s pro', 'tablet', '3k', '3:2', 'hyperos']
  },
  {
    id: 'xiaomi-pad-6',
    category: 'tablet',
    brand: 'Xiaomi',
    model: 'Xiaomi Pad 6 / 6 Pro (11")',
    width: 1800,
    height: 2880,
    aspectRatio: '10:16',
    isDefault: false,
    tags: ['xiaomi', 'pad 6', 'pad 6 pro', 'tablet', 'wqhd+']
  },

  // ==========================================
  // 3. LAPTOP & DESKTOP (category: 'desktop')
  // ==========================================
  // --- Standar Umum Monitor / Laptop ---
  {
    id: 'desktop-fhd-1080p',
    category: 'desktop',
    brand: 'Umum / Standar',
    model: 'Full HD 1080p (1920 x 1080)',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    isDefault: true,
    tags: ['fhd', '1080p', 'full hd', '16:9', 'pc', 'monitor', 'laptop', 'desktop']
  },
  {
    id: 'desktop-2k-qhd',
    category: 'desktop',
    brand: 'Umum / Standar',
    model: '2K QHD 1440p (2560 x 1440)',
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    isDefault: true,
    tags: ['2k', 'qhd', '1440p', '16:9', 'gaming monitor', 'pc', 'desktop']
  },
  {
    id: 'desktop-4k-uhd',
    category: 'desktop',
    brand: 'Umum / Standar',
    model: '4K UHD (3840 x 2160)',
    width: 3840,
    height: 2160,
    aspectRatio: '16:9',
    isDefault: true,
    tags: ['4k', 'uhd', '2160p', '16:9', 'ultra hd', 'tv', 'pc', 'monitor']
  },
  {
    id: 'desktop-fhd-plus-16-10',
    category: 'desktop',
    brand: 'Umum / Standar',
    model: 'FHD+ WUXGA 16:10 (1920 x 1200)',
    width: 1920,
    height: 1200,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['fhd+', 'wuxga', '1200p', '16:10', 'modern laptop']
  },
  {
    id: 'desktop-qhd-plus-16-10',
    category: 'desktop',
    brand: 'Umum / Standar',
    model: 'QHD+ WQXGA 16:10 (2560 x 1600)',
    width: 2560,
    height: 1600,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['qhd+', 'wqxga', '1600p', '16:10', 'laptop gaming', 'creator']
  },
  {
    id: 'desktop-laptop-standar-hd',
    category: 'desktop',
    brand: 'Umum / Standar',
    model: 'HD Laptop Klasik (1366 x 768)',
    width: 1366,
    height: 768,
    aspectRatio: '16:9',
    isDefault: false,
    tags: ['hd', 'laptop', 'klasik', '768p', 'entry']
  },

  // --- Apple MacBook & iMac & Displays ---
  {
    id: 'apple-macbook-pro-16',
    category: 'desktop',
    brand: 'Apple',
    model: 'MacBook Pro 16" (Liquid Retina XDR)',
    width: 3456,
    height: 2234,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['apple', 'macbook', 'macbook pro', '16 inch', 'macos', 'retina xdr']
  },
  {
    id: 'apple-macbook-pro-14',
    category: 'desktop',
    brand: 'Apple',
    model: 'MacBook Pro 14" (Liquid Retina XDR)',
    width: 3024,
    height: 1964,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['apple', 'macbook', 'macbook pro', '14 inch', 'macos', 'retina xdr']
  },
  {
    id: 'apple-macbook-air-15',
    category: 'desktop',
    brand: 'Apple',
    model: 'MacBook Air 15"',
    width: 2880,
    height: 1864,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['apple', 'macbook', 'air', '15 inch', 'macos', 'liquid retina']
  },
  {
    id: 'apple-macbook-air-13',
    category: 'desktop',
    brand: 'Apple',
    model: 'MacBook Air 13" (M2 / M3)',
    width: 2560,
    height: 1664,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['apple', 'macbook', 'air', '13 inch', 'm2', 'm3', 'macos']
  },
  {
    id: 'apple-imac-24',
    category: 'desktop',
    brand: 'Apple',
    model: 'iMac 24" 4.5K Retina',
    width: 4480,
    height: 2520,
    aspectRatio: '16:9',
    isDefault: false,
    tags: ['apple', 'imac', '24 inch', '4.5k', 'retina', 'macos', 'desktop']
  },
  {
    id: 'apple-studio-display-5k',
    category: 'desktop',
    brand: 'Apple',
    model: 'Apple Studio Display 27" 5K',
    width: 5120,
    height: 2880,
    aspectRatio: '16:9',
    isDefault: false,
    tags: ['apple', 'studio display', '5k', '27 inch', 'retina', 'pro']
  },
  {
    id: 'apple-pro-display-xdr-6k',
    category: 'desktop',
    brand: 'Apple',
    model: 'Apple Pro Display XDR 32" 6K',
    width: 6016,
    height: 3384,
    aspectRatio: '16:9',
    isDefault: false,
    tags: ['apple', 'pro display xdr', '6k', '32 inch', 'retina', 'reference']
  },

  // --- Laptop Windows Populer (Dell, Lenovo, Asus, HP) ---
  {
    id: 'dell-xps-13-3k-oled',
    category: 'desktop',
    brand: 'Dell',
    model: 'Dell XPS 13 / Plus (3K OLED)',
    width: 2880,
    height: 1800,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['dell', 'xps 13', 'xps', '3k', 'oled', '16:10', 'windows']
  },
  {
    id: 'dell-xps-16-4k-uhd',
    category: 'desktop',
    brand: 'Dell',
    model: 'Dell XPS 15 / 16 (4K+ UHD+)',
    width: 3840,
    height: 2400,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['dell', 'xps 15', 'xps 16', '4k+', 'uhd+', 'oled', '16:10']
  },
  {
    id: 'lenovo-thinkpad-x1-carbon-2-8k',
    category: 'desktop',
    brand: 'Lenovo',
    model: 'Lenovo ThinkPad X1 Carbon (2.8K OLED)',
    width: 2880,
    height: 1800,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['lenovo', 'thinkpad', 'x1 carbon', '2.8k', 'oled', 'business']
  },
  {
    id: 'lenovo-yoga-9i-4k',
    category: 'desktop',
    brand: 'Lenovo',
    model: 'Lenovo Yoga 9i (4K OLED)',
    width: 3840,
    height: 2400,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['lenovo', 'yoga', 'yoga 9i', '4k', 'oled', 'convertible']
  },
  {
    id: 'asus-rog-zephyrus-g14',
    category: 'desktop',
    brand: 'Asus',
    model: 'Asus ROG Zephyrus G14 (3K OLED)',
    width: 2880,
    height: 1800,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['asus', 'rog', 'zephyrus g14', 'oled', 'gaming laptop', '16:10']
  },
  {
    id: 'asus-rog-zephyrus-g16',
    category: 'desktop',
    brand: 'Asus',
    model: 'Asus ROG Zephyrus G16 (2.5K OLED)',
    width: 2560,
    height: 1600,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['asus', 'rog', 'zephyrus g16', '2.5k', 'oled', 'gaming laptop']
  },
  {
    id: 'asus-zenbook-14-oled',
    category: 'desktop',
    brand: 'Asus',
    model: 'Asus Zenbook 14 OLED (2.8K)',
    width: 2880,
    height: 1800,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['asus', 'zenbook', '14 oled', '2.8k', 'ultrabook']
  },
  {
    id: 'hp-spectre-x360-14',
    category: 'desktop',
    brand: 'HP',
    model: 'HP Spectre x360 14 (2.8K OLED)',
    width: 2880,
    height: 1800,
    aspectRatio: '16:10',
    isDefault: false,
    tags: ['hp', 'spectre x360', '2.8k', 'oled', 'convertible', 'windows']
  },

  // ==========================================
  // 4. MONITOR ULTRAWIDE & SUPER ULTRAWIDE (category: 'ultrawide')
  // ==========================================
  // --- 21:9 Ultrawide ---
  {
    id: 'ultrawide-uwqhd-3440x1440',
    category: 'ultrawide',
    brand: 'Umum / Standar',
    model: 'UWQHD 34" Ultrawide (3440 x 1440)',
    width: 3440,
    height: 1440,
    aspectRatio: '21:9',
    isDefault: true,
    tags: ['ultrawide', 'uwqhd', '3440x1440', '21:9', 'gaming monitor', 'curved']
  },
  {
    id: 'ultrawide-wfhd-2560x1080',
    category: 'ultrawide',
    brand: 'Umum / Standar',
    model: 'WFHD 29"-34" Ultrawide (2560 x 1080)',
    width: 2560,
    height: 1080,
    aspectRatio: '21:9',
    isDefault: false,
    tags: ['ultrawide', 'wfhd', '2560x1080', '21:9', 'full hd ultrawide']
  },
  {
    id: 'ultrawide-uwqhd-plus-3840x1600',
    category: 'ultrawide',
    brand: 'Umum / Standar',
    model: 'UWQHD+ 38" Ultrawide (3840 x 1600)',
    width: 3840,
    height: 1600,
    aspectRatio: '24:10',
    isDefault: false,
    tags: ['ultrawide', 'uwqhd+', '3840x1600', '38 inch', '24:10', 'curved']
  },
  {
    id: 'ultrawide-5k2k-5120x2160',
    category: 'ultrawide',
    brand: 'Umum / Standar',
    model: '5K2K WUHD 34"-40" Ultrawide (5120 x 2160)',
    width: 5120,
    height: 2160,
    aspectRatio: '21:9',
    isDefault: false,
    tags: ['ultrawide', '5k2k', 'wuhd', '5120x2160', '21:9', 'lg ultrafine', 'dell ultrasharp']
  },

  // --- 32:9 Super Ultrawide ---
  {
    id: 'super-ultrawide-dqhd-5120x1440',
    category: 'ultrawide',
    brand: 'Samsung',
    model: 'DQHD 49" Super Ultrawide - Odyssey G9 (5120 x 1440)',
    width: 5120,
    height: 1440,
    aspectRatio: '32:9',
    isDefault: true,
    tags: ['super ultrawide', 'samsung', 'odyssey g9', 'dqhd', '5120x1440', '32:9', '49 inch', 'dual qhd']
  },
  {
    id: 'super-ultrawide-dfhd-3840x1080',
    category: 'ultrawide',
    brand: 'Samsung',
    model: 'DFHD 49" Super Ultrawide - CHG90 (3840 x 1080)',
    width: 3840,
    height: 1080,
    aspectRatio: '32:9',
    isDefault: false,
    tags: ['super ultrawide', 'dfhd', 'dual fhd', '3840x1080', '32:9', '49 inch']
  },
  {
    id: 'super-ultrawide-duhd-7680x2160',
    category: 'ultrawide',
    brand: 'Samsung',
    model: 'Dual 4K UHD 57" - Odyssey Neo G9 (7680 x 2160)',
    width: 7680,
    height: 2160,
    aspectRatio: '32:9',
    isDefault: false,
    tags: ['super ultrawide', 'samsung', 'odyssey neo g9', '57 inch', 'dual 4k', 'duhd', '7680x2160', '32:9']
  }
];

/**
 * Helper Utility Functions
 */
export const getTemplatesByCategory = (category) => {
  if (!category || category === 'all') return WALLPAPER_TEMPLATES;
  return WALLPAPER_TEMPLATES.filter((t) => t.category === category);
};

export const getDefaultTemplate = (category = 'desktop') => {
  const matches = WALLPAPER_TEMPLATES.filter((t) => t.category === category && t.isDefault);
  return matches[0] || WALLPAPER_TEMPLATES[0];
};

export const searchTemplates = (query, category = 'all') => {
  let list = WALLPAPER_TEMPLATES;
  if (category && category !== 'all') {
    list = list.filter((t) => t.category === category);
  }
  if (!query || query.trim() === '') return list;
  const q = query.toLowerCase().trim();
  return list.filter((t) => {
    return (
      t.model.toLowerCase().includes(q) ||
      t.brand.toLowerCase().includes(q) ||
      t.aspectRatio.toLowerCase().includes(q) ||
      `${t.width}x${t.height}`.includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
};
