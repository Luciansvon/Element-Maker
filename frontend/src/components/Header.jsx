import React from 'react';
import {
  Sparkles,
  Settings,
  Box,
  Type,
  Monitor,
  FolderArchive,
  Sliders,
} from 'lucide-react';

export default function Header({
  isOnline = true,
  onOpenSettings,
  onCheckHealth,
  activeTab = 'objects',
  onSelectTab,
}) {
  const navTabs = [
    { id: 'objects', label: 'Objek Grafis', icon: Box, desc: 'Bahan poster terpotong' },
    { id: 'typography', label: 'Tipografi 3D', icon: Type, desc: 'Teks timbul pop-up stiker' },
    { id: 'wallpaper', label: 'Wallpaper & BG', icon: Monitor, desc: 'Semua layar HP, laptop, PC' },
    { id: 'collection', label: 'Laci Koleksi', icon: FolderArchive, desc: 'Riwayat aset disimpan' },
    { id: 'settings', label: 'Pengaturan AI', icon: Sliders, desc: 'Model 9Router & API' },
  ];

  return (
    <header className="w-full glass-panel border-x-0 border-t-0 border-b border-white/[0.07] px-5 py-2 flex items-center justify-between select-none z-40 transition-colors gap-3">
      {/* Sisi Kiri: Logo Studio Bintang 4-Sudut Neon & Judul */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 border border-white/25 shadow-[0_0_18px_rgba(139,92,246,0.55)]">
          <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide font-sans">
              Element Maker
            </h1>
          </div>
          <p className="text-[10px] text-cyan-400/90 font-medium tracking-wide">
            AI Graphic Element Studio
          </p>
        </div>
      </div>

      {/* Sisi Tengah: Tab Navigasi Mode Kerja Studio (Horizontal Tabs) */}
      <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-[#0B0F1B]/90 border border-white/[0.08] backdrop-blur-xl shadow-inner">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/40 via-purple-600/40 to-indigo-600/40 text-white border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-blue-300/30 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent font-medium'
              }`}
              title={`${tab.label} - ${tab.desc}`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-blue-300 drop-shadow-[0_0_6px_rgba(147,197,253,0.6)]' : 'text-slate-400'
                }`}
              />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sisi Kanan: Status 9Router, Tombol Pengaturan, dan Kontrol Jendela */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Status Sambungan 9Router Glass Pill */}
        <div
          onClick={onCheckHealth}
          className="flex items-center gap-2 text-xs text-slate-200 font-semibold cursor-pointer hover:text-white transition-all bg-[#121A28]/70 hover:bg-[#162133]/80 px-3 py-1.5 rounded-xl border border-white/[0.08] shadow-sm backdrop-blur-md"
          title="Klik untuk menyegarkan status sambungan 9Router"
        >
          <span className="relative flex h-2 w-2">
            {isOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}
          </span>
          <span className="text-[11px] sm:text-xs tracking-wide">
            {isOnline ? '9Router Aktif' : 'Terputus'}
          </span>
        </div>

        {/* Tombol Roda Gigi Pengaturan */}
        <button
          onClick={onOpenSettings}
          title="Pengaturan Sambungan & Model AI"
          aria-label="Pengaturan Sambungan & Model AI"
          className="w-8 h-8 rounded-xl border border-white/[0.08] bg-[#121A28]/70 hover:bg-[#182438]/80 hover:border-blue-400/40 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm backdrop-blur-md cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
