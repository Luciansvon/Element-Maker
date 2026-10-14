import React, { useState, useRef } from 'react';
import {
  Copy,
  Download,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  Folder,
  CheckSquare,
  Square,
  X,
  Plus,
  Sparkles,
  Upload,
  Edit2,
  Layers,
  Type,
  FileCheck,
  Monitor,
} from 'lucide-react';

import ConfirmModal from './ConfirmModal';

export default function GalleryDrawer({
  elements = [],
  activeElementId = null,
  onSelectElement,
  onDeleteElement,
  onCopyElement,
  onDownloadElement,
  isOpen = true,
  onToggleOpen,
  onAddNewElement,
  onUploadElement,
  onUpdateElement,
}) {
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, objects, typography, hd
  const [copiedId, setCopiedId] = useState(null);

  // State Ubah Nama (Inline Rename)
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // State Hapus Satuan
  const [elementToDelete, setElementToDelete] = useState(null);

  // State Fitur Pilih Banyak (Multi-Select Batch Delete & Batch Download)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // Filter elemen berdasarkan kategori & kata kunci pencarian
  const filteredElements = elements.filter((item) => {
    // Filter Kategori
    if (categoryFilter === 'typography') {
      const isTypo = item.is_typography || (item.title && item.title.startsWith('3D:')) || (item.prompt && item.prompt.toLowerCase().includes('typography'));
      if (!isTypo) return false;
    } else if (categoryFilter === 'hd') {
      if (!item.is_hd) return false;
    } else if (categoryFilter === 'wallpaper') {
      if (!item.is_wallpaper && item.mode !== 'wallpaper') return false;
    } else if (categoryFilter === 'objects') {
      const isTypo = item.is_typography || (item.title && item.title.startsWith('3D:')) || (item.prompt && item.prompt.toLowerCase().includes('typography'));
      const isWall = item.is_wallpaper || item.mode === 'wallpaper';
      if (isTypo || isWall) return false;
    }

    // Filter Pencarian Teks
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.prompt && item.prompt.toLowerCase().includes(q))
    );
  });

  const handleCopy = async (e, elem) => {
    e.stopPropagation();
    if (onCopyElement) {
      await onCopyElement(elem);
      setCopiedId(elem.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDownload = (e, elem) => {
    e.stopPropagation();
    if (onDownloadElement) {
      onDownloadElement(elem);
    }
  };

  // Unduh Massal Elemen Terpilih Sekaligus
  const handleBatchDownload = () => {
    const itemsToDownload = filteredElements.filter((e) => selectedIds.includes(e.id));
    itemsToDownload.forEach((elem, index) => {
      setTimeout(() => {
        if (onDownloadElement) onDownloadElement(elem);
      }, index * 300);
    });
  };

  const handleDeleteSingle = (e, elem) => {
    e.stopPropagation();
    setElementToDelete(elem);
  };

  const handleConfirmSingleDelete = () => {
    if (elementToDelete && onDeleteElement) {
      onDeleteElement(elementToDelete.id);
      setSelectedIds((prev) => prev.filter((id) => id !== elementToDelete.id));
      setElementToDelete(null);
    }
  };

  // Toggle Centang Item pada Mode Pilih Banyak
  const toggleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Pilih Semua / Batalkan Semua
  const handleSelectAll = () => {
    if (selectedIds.length === filteredElements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredElements.map((e) => e.id));
    }
  };

  // Eksekusi Hapus Massal yang Dicentang
  const handleConfirmBatchDelete = () => {
    if (onDeleteElement && selectedIds.length > 0) {
      onDeleteElement(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
      setIsBatchDeleteModalOpen(false);
    }
  };

  // Tangani Unggah Gambar Manual dari Komputer
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 24);
      const newElem = {
        id: `elem_upload_${Date.now()}`,
        title: cleanName || 'Gambar Komputer',
        prompt: `Elemen diunggah: ${file.name}`,
        mode: 'no_bg',
        image_base64: base64,
        created_at: new Date().toISOString(),
      };
      if (onUploadElement) {
        onUploadElement(newElem);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Mulai Ubah Nama Elemen
  const startRename = (e, elem) => {
    e.stopPropagation();
    setEditingId(elem.id);
    setEditingTitle(elem.title || elem.prompt || 'Elemen Poster');
  };

  // Simpan Ubah Nama Elemen
  const saveRename = (e, elem) => {
    e.stopPropagation();
    if (onUpdateElement && editingTitle.trim()) {
      onUpdateElement({
        ...elem,
        title: editingTitle.trim(),
      });
    }
    setEditingId(null);
  };

  // Batal Ubah Nama
  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Jika sidebar ditutup, tampilkan tab melayang
  if (!isOpen) {
    return (
      <aside className="relative flex-shrink-0 flex items-center select-none z-30">
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-l-2xl bg-[#151D2A] hover:bg-[#1E293B] border-y border-l border-[#232F45] text-slate-200 hover:text-white shadow-2xl transition-all hover:scale-105 group"
          title="Buka Koleksi Elemen"
        >
          <ChevronLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
          <Folder className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold tracking-wide">Koleksi ({elements.length})</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 sm:w-88 flex-shrink-0 glass-panel border-y-0 border-r-0 border-l border-white/[0.07] flex flex-col h-full select-none z-30 transition-all duration-300">
      {/* Input File Tersembunyi untuk Unggah Gambar dari Komputer */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. HEADER SIDEBAR KOLEKSI */}
      <div className="p-4 border-b border-white/[0.07] space-y-2.5">
        {/* Baris 1: Judul Koleksi di Kiri & Tombol Tutup Laci di Kanan (Selalu Terlihat & Anti-Offside) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center text-blue-400">
              <Folder className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Koleksi Elemen</h3>
              <p className="text-[11px] text-slate-400">{filteredElements.length} aset tersimpan</p>
            </div>
          </div>

          {/* Tombol Tutup Sidebar */}
          <button
            onClick={onToggleOpen}
            className="w-8 h-8 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-transparent hover:border-white/[0.1] cursor-pointer"
            title="Sembunyikan / Tutup Koleksi"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Baris 2: Tombol Aksi Cepat (Baru, Unggah, Pilih) Ditata Pas 3 Kolom */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* Tombol Tambah Elemen Baru */}
          <button
            type="button"
            onClick={onAddNewElement}
            className="px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#151D2A]/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer shadow-sm"
            title="Buka kanvas kosong baru untuk mulai membuat elemen dari nol"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Baru</span>
          </button>

          {/* Tombol Unggah Gambar dari Komputer */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#151D2A]/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer shadow-sm"
            title="Unggah gambar dari komputer ke koleksi"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Unggah</span>
          </button>

          {/* Tombol Masuk Mode Pilih Banyak */}
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedIds([]);
            }}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isSelectionMode
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#151D2A]/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-slate-500'
            }`}
            title="Pilih beberapa elemen sekaligus untuk diunduh atau dihapus"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{isSelectionMode ? 'Selesai' : 'Pilih'}</span>
          </button>
        </div>

        {/* Baris Kontrol Mode Pilih Banyak (Jika Aktif) */}
        {isSelectionMode ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#151D2A]/80 border border-blue-500/30">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
            >
              {selectedIds.length === filteredElements.length && filteredElements.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Pilih Semua ({selectedIds.length}/{filteredElements.length})</span>
            </button>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5">
                {/* Tombol Unduh Terpilih Sekaligus */}
                <button
                  onClick={handleBatchDownload}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  title="Unduh semua elemen yang dicentang sekaligus"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh ({selectedIds.length})</span>
                </button>

                {/* Tombol Hapus Terpilih */}
                <button
                  onClick={() => setIsBatchDeleteModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  title="Hapus semua elemen yang dicentang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Kolom Pencarian & Tab Filter Cepat */
          <div className="space-y-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari di koleksi..."
                className="w-full bg-[#121A28]/80 border border-white/[0.08] focus:border-blue-400 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Tab Filter Kategori Cepat */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {[
                { id: 'all', label: 'Semua', icon: Layers },
                { id: 'objects', label: 'Objek', icon: Folder },
                { id: 'typography', label: '3D Teks', icon: Type },
                { id: 'hd', label: 'HD ✨', icon: Sparkles },
                { id: 'wallpaper', label: 'Wallpaper', icon: Monitor },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-400/40 shadow-sm'
                        : 'bg-[#121A28]/60 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. DAFTAR KARTU ELEMEN (GRID VERTIKAL DENGAN SCROLL) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredElements.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 text-xs">
            {searchQuery
              ? 'Tidak ada elemen yang cocok dengan pencarian.'
              : categoryFilter !== 'all'
              ? `Belum ada elemen dalam kategori ${categoryFilter}.`
              : 'Belum ada elemen di koleksi.'}
          </div>
        ) : (
          filteredElements.map((elem) => {
            const isActive = activeElementId === elem.id;
            const isCopied = copiedId === elem.id;
            const isSelected = selectedIds.includes(elem.id);
            const isEditingThis = editingId === elem.id;

            return (
              <div
                key={elem.id}
                data-element-card="true"
                onClick={() => {
                  if (isSelectionMode) {
                    toggleSelectItem(elem.id);
                  } else if (onSelectElement) {
                    onSelectElement(elem);
                  }
                }}
                className={`relative group cursor-pointer rounded-2xl p-3 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-2 border-rose-500 bg-[#24151B] shadow-lg shadow-rose-900/20'
                    : isActive
                    ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20 glass-panel'
                    : 'glass-soft hover:border-slate-500'
                }`}
              >
                {/* Kotak Centang Mode Pilih Banyak */}
                {isSelectionMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectItem(elem.id);
                    }}
                    className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                        : 'bg-[#151D2A]/90 border-slate-500 text-transparent hover:border-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Gambar Thumbnail di Latar Transparan Gelap */}
                <div className="w-full h-36 rounded-xl bg-[#0B1220]/90 border border-white/[0.06] flex items-center justify-center p-2 overflow-hidden mb-2.5 relative">
                  {/* Badge HD / 3D Teks Mengapung di Sudut Kiri Atas Gambar (z-20 Anti-Tertimpa) */}
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1 pointer-events-none">
                    {elem.is_hd && (
                      <span className="px-2 py-0.5 rounded-md bg-black/85 border border-amber-400/70 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-md shadow-lg shadow-black/60">
                        HD {elem.dimensions || '2048px'}
                      </span>
                    )}
                    {elem.is_typography && (
                      <span className="px-2 py-0.5 rounded-md bg-black/85 border border-blue-400/70 text-[10px] font-mono font-bold text-blue-300 backdrop-blur-md shadow-lg shadow-black/60">
                        3D Teks
                      </span>
                    )}
                  </div>

                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 70% 20%, rgba(34,211,238,0.14) 0%, transparent 55%), radial-gradient(circle at 20% 85%, rgba(168,85,247,0.12) 0%, transparent 55%)',
                    }}
                  />
                  <img
                    src={elem.image_base64}
                    alt={elem.title || elem.prompt}
                    className="relative z-10 max-h-full max-w-full object-contain drop-shadow select-none pointer-events-none transition-transform duration-200 group-hover:scale-105"
                  />
                </div>

                {/* Judul Elemen & Fitur Ganti Nama (Rename) */}
                <div className="mb-2">
                  {isEditingThis ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(e, elem);
                          if (e.key === 'Escape') cancelRename(e);
                        }}
                        className="flex-1 bg-[#151D2A] border border-blue-400 rounded-lg px-2 py-0.5 text-xs text-white outline-none"
                      />
                      <button
                        onClick={(e) => saveRename(e, elem)}
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                        title="Simpan nama"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                        title="Batal"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group/title">
                      <h4 className="text-xs font-bold text-slate-200 truncate flex-1" title={elem.title || elem.prompt}>
                        {elem.title || elem.prompt || 'Elemen Poster'}
                      </h4>
                      {!isSelectionMode && (
                        <button
                          onClick={(e) => startRename(e, elem)}
                          className="opacity-0 group-hover/title:opacity-100 p-1 hover:text-blue-400 text-slate-500 transition-all ml-1"
                          title="Ubah nama elemen"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {elem.mode === 'no_bg' ? 'Tanpa Latar (PNG)' : elem.mode === 'plain_bg' ? 'Latar Polos' : 'Latar Kustom'}
                  </p>
                </div>

                {/* 3 Tombol Aksi Bawah (Salin, Unduh, Hapus - Dibuat Jauh Lebih Visible & Jelas) */}
                {!isSelectionMode && (
                  <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-white/[0.08] text-xs">
                    {/* Tombol Salin */}
                    <button
                      type="button"
                      onClick={(e) => handleCopy(e, elem)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-400/50 shadow-emerald-900/30 ring-1 ring-emerald-400/40'
                          : 'bg-[#152033]/90 hover:bg-blue-600/30 text-blue-300 hover:text-blue-100 border border-blue-500/30 hover:border-blue-400/60'
                      }`}
                      title="Salin gambar PNG ke Papan Klip (Ctrl+V ke Photoshop/Canva)"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-blue-400" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>

                    {/* Tombol Unduh PNG */}
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, elem)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-[#112620]/90 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 hover:border-emerald-400/60 transition-all shadow-sm cursor-pointer"
                      title="Unduh berkas PNG transparan ke komputer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unduh</span>
                    </button>

                    {/* Tombol Hapus Satuan */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(e, elem)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-[#261418]/90 hover:bg-rose-600/30 text-rose-300 hover:text-rose-100 border border-rose-500/30 hover:border-rose-400/60 transition-all shadow-sm cursor-pointer"
                      title="Hapus dari koleksi"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: KONFIRMASI HAPUS ELEMEN SATUAN */}
      <ConfirmModal
        isOpen={!!elementToDelete}
        title="Hapus dari Koleksi"
        message={`Apakah kamu yakin ingin menghapus "${elementToDelete?.title || elementToDelete?.prompt || 'elemen ini'}" dari koleksi studio? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Elemen"
        cancelText="Batal"
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setElementToDelete(null)}
      />

      {/* MODAL 2: KONFIRMASI HAPUS BANYAK (BATCH DELETE) */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        title={`Hapus ${selectedIds.length} Elemen Sekaligus`}
        message={`Apakah kamu yakin ingin menghapus ${selectedIds.length} elemen yang dipilih dari koleksi studio? Semua elemen terpilih akan dihapus secara permanen.`}
        confirmText={`Hapus Semua (${selectedIds.length})`}
        cancelText="Batal"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setIsBatchDeleteModalOpen(false)}
      />
    </aside>
  );
}
