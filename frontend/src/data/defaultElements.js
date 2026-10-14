/**
 * Data Elemen Bawaan (Default Elements) untuk Element Maker
 * Menampilkan 8 koleksi elemen grafis awal persis seperti di referensi desain UI.
 */

// Generator SVG Data URIs beresolusi tinggi dengan tampilan realistis dan transparan
export const defaultElements = [
  {
    id: 'elem-burger',
    title: 'Burger Lezat Terpotong',
    prompt: 'foto burger lezat terpotong melayang dengan keju meleleh, selada segar, tomat, dan irisan bawang',
    mode: 'no_bg',
    created_at: '2026-10-13T08:00:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#000" flood-opacity="0.35"/>
          </filter>
          <radialGradient id="topBun" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stop-color="#f59e0b"/>
            <stop offset="60%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#b45309"/>
          </radialGradient>
          <linearGradient id="patty" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#451a03"/>
            <stop offset="50%" stop-color="#78350f"/>
            <stop offset="100%" stop-color="#270e02"/>
          </linearGradient>
          <linearGradient id="cheese" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
        <g filter="url(#shadow)">
          <!-- Roti Atas -->
          <ellipse cx="250" cy="180" rx="145" ry="75" fill="url(#topBun)"/>
          <!-- Wijen -->
          <circle cx="210" cy="140" r="3.5" fill="#fef3c7"/>
          <circle cx="250" cy="130" r="3.5" fill="#fef3c7"/>
          <circle cx="280" cy="150" r="3.5" fill="#fef3c7"/>
          <circle cx="180" cy="165" r="3" fill="#fef3c7"/>
          <circle cx="310" cy="165" r="3" fill="#fef3c7"/>
          <circle cx="230" cy="170" r="3" fill="#fef3c7"/>
          
          <!-- Bawang Merah Melayang -->
          <ellipse cx="360" cy="200" rx="22" ry="14" fill="none" stroke="#be185d" stroke-width="6" transform="rotate(-25 360 200)"/>
          <ellipse cx="360" cy="200" rx="16" ry="10" fill="none" stroke="#fbcfe8" stroke-width="3" transform="rotate(-25 360 200)"/>

          <!-- Keju Meleleh -->
          <polygon points="120,225 380,225 360,250 310,240 260,285 220,245 180,270 140,240" fill="url(#cheese)"/>
          
          <!-- Daging Patty Tebal -->
          <rect x="110" y="215" width="280" height="55" rx="22" fill="url(#patty)"/>
          
          <!-- Tomat Segar -->
          <rect x="125" y="260" width="250" height="20" rx="10" fill="#dc2626"/>
          <!-- Irisan Tomat Melayang -->
          <ellipse cx="370" cy="265" rx="18" ry="12" fill="#ef4444" transform="rotate(35 370 265)"/>

          <!-- Selada Keriting Segar -->
          <path d="M95,275 Q125,295 155,275 Q185,298 215,275 Q245,295 275,275 Q305,298 335,275 Q365,295 405,275 Q385,310 335,300 Q285,315 250,300 Q200,315 150,300 Q105,310 95,275 Z" fill="#22c55e"/>
          
          <!-- Roti Bawah -->
          <path d="M125,290 L375,290 C375,340 320,365 250,365 C180,365 125,340 125,290 Z" fill="url(#topBun)"/>
          
          <!-- Daun Selada Melayang -->
          <path d="M190,165 Q160,185 180,210 Q200,195 190,165 Z" fill="#4ade80" transform="rotate(-20 185 190)"/>
          <path d="M210,310 Q225,335 240,315 Q230,300 210,310 Z" fill="#4ade80"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'elem-leaf',
    title: 'Daun Hijau Segar',
    prompt: 'tangkai daun hijau tropis segar dengan serat daun detail realistis 3D',
    mode: 'no_bg',
    created_at: '2026-10-13T07:50:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <filter id="leafShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000" flood-opacity="0.3"/>
          </filter>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4ade80"/>
            <stop offset="50%" stop-color="#22c55e"/>
            <stop offset="100%" stop-color="#15803d"/>
          </linearGradient>
        </defs>
        <g filter="url(#leafShadow)">
          <!-- Batang -->
          <path d="M100,400 Q240,320 380,140" fill="none" stroke="#166534" stroke-width="8" stroke-linecap="round"/>
          <!-- Daun Puncak -->
          <path d="M380,140 C420,100 450,130 430,170 C400,210 360,180 380,140 Z" fill="url(#leafGrad)"/>
          <!-- Daun Sisi Kiri -->
          <path d="M250,260 C200,200 230,150 280,180 C310,200 290,250 250,260 Z" fill="url(#leafGrad)"/>
          <path d="M180,330 C130,280 160,220 210,250 C230,270 210,320 180,330 Z" fill="url(#leafGrad)"/>
          <!-- Daun Sisi Kanan -->
          <path d="M300,220 C360,190 390,240 350,270 C320,290 280,250 300,220 Z" fill="url(#leafGrad)"/>
          <path d="M230,290 C290,260 320,310 280,340 C250,350 220,320 230,290 Z" fill="url(#leafGrad)"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'elem-splash',
    title: 'Cipratan Air Jernih',
    prompt: 'cipratan air jernih kristal 3D dinamis dengan butiran tetesan air membeku di udara',
    mode: 'no_bg',
    created_at: '2026-10-13T07:45:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <filter id="waterGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#38bdf8" flood-opacity="0.4"/>
          </filter>
          <linearGradient id="waterGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.9"/>
            <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#e0f2fe" stop-opacity="0.95"/>
          </linearGradient>
        </defs>
        <g filter="url(#waterGlow)">
          <path d="M180,380 C150,320 110,260 160,220 C190,195 210,240 230,280 C240,210 260,130 310,140 C340,150 330,240 320,290 C350,240 400,210 420,250 C440,290 380,360 320,380 Z" fill="url(#waterGrad)"/>
          <!-- Tetesan Air Melayang -->
          <circle cx="130" cy="190" r="12" fill="#bae6fd"/>
          <circle cx="100" cy="230" r="7" fill="#bae6fd"/>
          <circle cx="320" cy="110" r="14" fill="#e0f2fe"/>
          <circle cx="370" cy="150" r="8" fill="#bae6fd"/>
          <circle cx="430" cy="200" r="11" fill="#bae6fd"/>
          <circle cx="270" cy="180" r="6" fill="#e0f2fe"/>
          <circle cx="210" cy="150" r="9" fill="#bae6fd"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'elem-flower',
    title: 'Bunga Merah Merekah',
    prompt: 'bunga lili merah merekah elegan dengan kelopak bertekstur halus dan putik sari kuning',
    mode: 'no_bg',
    created_at: '2026-10-13T07:40:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <radialGradient id="petalRed" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="50%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </radialGradient>
        </defs>
        <g>
          <!-- 6 Kelopak Bunga -->
          <ellipse cx="250" cy="150" rx="45" ry="90" fill="url(#petalRed)" transform="rotate(0 250 250)"/>
          <ellipse cx="250" cy="150" rx="45" ry="90" fill="url(#petalRed)" transform="rotate(60 250 250)"/>
          <ellipse cx="250" cy="150" rx="45" ry="90" fill="url(#petalRed)" transform="rotate(120 250 250)"/>
          <ellipse cx="250" cy="150" rx="45" ry="90" fill="url(#petalRed)" transform="rotate(180 250 250)"/>
          <ellipse cx="250" cy="150" rx="45" ry="90" fill="url(#petalRed)" transform="rotate(240 250 250)"/>
          <ellipse cx="250" cy="150" rx="45" ry="90" fill="url(#petalRed)" transform="rotate(300 250 250)"/>
          <!-- Pusat Sari Bunga -->
          <circle cx="250" cy="250" r="28" fill="#facc15"/>
          <circle cx="245" cy="245" r="4" fill="#713f12"/>
          <circle cx="255" cy="245" r="4" fill="#713f12"/>
          <circle cx="250" cy="255" r="4" fill="#713f12"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'elem-ribbon',
    title: 'Pita Emas Mewah',
    prompt: 'pita emas mewah mengkilap 3D meliuk dinamis gaya elegan premium',
    mode: 'no_bg',
    created_at: '2026-10-13T07:55:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <filter id="ribbonShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity="0.3"/>
          </filter>
          <linearGradient id="goldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="35%" stop-color="#eab308"/>
            <stop offset="70%" stop-color="#ca8a04"/>
            <stop offset="100%" stop-color="#854d0e"/>
          </linearGradient>
          <linearGradient id="goldGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#ca8a04"/>
            <stop offset="50%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#a16207"/>
          </linearGradient>
        </defs>
        <g filter="url(#ribbonShadow)">
          <!-- Liukan Belakang -->
          <path d="M120,290 C160,330 240,320 280,270 L290,210 C240,250 170,260 120,290 Z" fill="url(#goldGrad2)"/>
          <!-- Pita Utama Meliuk -->
          <path d="M80,240 C140,160 250,180 320,260 C380,320 440,240 420,180 C360,230 320,210 270,160 C200,90 100,160 80,240 Z" fill="url(#goldGrad1)"/>
          <!-- Ekor Pita -->
          <polygon points="80,240 120,290 85,320 60,280" fill="#a16207"/>
          <polygon points="420,180 440,230 460,200 450,160" fill="#a16207"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'elem-rock',
    title: 'Batu Putih Tekstur',
    prompt: 'batu mineral putih marmer geometri 3D tekstur permukaan halus realistis',
    mode: 'no_bg',
    created_at: '2026-10-13T07:35:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <filter id="rockShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="12" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#rockShadow)">
          <!-- Faset Batu Marmer Geometris -->
          <polygon points="250,140 370,220 340,340 180,360 120,260" fill="#f8fafc"/>
          <polygon points="250,140 370,220 300,260 210,230" fill="#ffffff"/>
          <polygon points="370,220 340,340 280,300 300,260" fill="#cbd5e1"/>
          <polygon points="340,340 180,360 220,290 280,300" fill="#94a3b8"/>
          <polygon points="180,360 120,260 190,250 220,290" fill="#cbd5e1"/>
          <polygon points="120,260 250,140 210,230 190,250" fill="#e2e8f0"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'elem-stroke',
    title: 'Sapuan Cat Biru',
    prompt: 'sapuan kuas cat akrilik biru kobalt dinamis bertekstur tebal artistik',
    mode: 'no_bg',
    created_at: '2026-10-13T07:30:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <linearGradient id="paintGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#1d4ed8"/>
            <stop offset="50%" stop-color="#2563eb"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
        </defs>
        <g transform="rotate(-15 250 250)">
          <path d="M80,240 Q160,200 240,230 Q320,260 420,210 Q380,270 280,260 Q180,270 80,240 Z" fill="url(#paintGrad)"/>
          <path d="M120,260 Q200,230 300,250 Q390,280 430,240 Q360,300 260,290 Q160,290 120,260 Z" fill="#1e40af"/>
          <circle cx="435" cy="225" r="5" fill="#38bdf8"/>
          <circle cx="450" cy="240" r="3" fill="#2563eb"/>
          <circle cx="70" cy="245" r="4" fill="#1d4ed8"/>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'elem-coffee',
    title: 'Cangkir Kopi Cipratan',
    prompt: 'cangkir keramik putih berisi kopi hitam panas dengan cipratan cairan kopi meliuk dramatis',
    mode: 'no_bg',
    created_at: '2026-10-13T07:25:00.000Z',
    image_base64: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
        <defs>
          <filter id="coffeeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#coffeeShadow)">
          <!-- Cipratan Kopi Melayang -->
          <path d="M220,250 C190,180 150,150 170,120 C190,95 230,140 240,190 C260,130 290,90 320,110 C340,130 310,210 270,250 Z" fill="#451a03"/>
          <circle cx="160" cy="100" r="7" fill="#542308"/>
          <circle cx="330" cy="90" r="9" fill="#542308"/>
          <circle cx="210" cy="110" r="5" fill="#542308"/>
          
          <!-- Cangkir Keramik Putih -->
          <ellipse cx="250" cy="270" rx="90" ry="30" fill="#f1f5f9"/>
          <ellipse cx="250" cy="270" rx="80" ry="25" fill="#451a03"/>
          <path d="M160,270 L180,360 C180,390 220,400 250,400 C280,400 320,390 320,360 L340,270 Z" fill="#ffffff"/>
          <!-- Pegangan Cangkir -->
          <path d="M330,290 C370,290 370,350 320,360" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
        </g>
      </svg>
    `)}`,
  },
];
