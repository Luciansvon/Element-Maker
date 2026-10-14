import React, { useState, useRef } from 'react';
import {
  Folder,
  Search,
  Plus,
  Upload,
  CheckSquare,
  Square,
  Check,
  Copy,
  Download,
  Trash2,
  Edit2,
  X,
  Layers,
  Type,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Palette,
  Monitor,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function FullGalleryView({
  elements = [],
  onSelectElement,
  onDeleteElement,
  onCopyElement,
  onDownloadElement,
  onAddNewElement,
  onUploadElement,
  onUpdateElement,
}) {
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, objects, typography, hd
  const [copiedId, setCopiedId] = useState(null);

  // State Ubah Nama
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // State Hapus Satuan
  const [elementToDelete, setElementToDelete] = useState(null);

  // State Fitur Pilih Banyak (Batch Download & Batch Delete)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // Filter elemen berdasarkan kategori & pencarian teks
  const filteredElements = elements.filter((item) => {
    // Filter Kategori
    if (categoryFilter === 'typography') {
      const isTypo =
        item.is_typography ||
        (item.title && item.title.startsWith('3D:')) ||
        (item.prompt && item.prompt.toLowerCase().includes('typography'));
      if (!isTypo) return false;
    } else if (categoryFilter === 'hd') {
      if (!item.is_hd) return false;
    } else if (categoryFilter === 'wallpaper') {
      if (!item.is_wallpaper && item.mode !== 'wallpaper') return false;
    } else if (categoryFilter === 'objects') {
      const isTypo =
        item.is_typography ||
        (item.title && item.title.startsWith('3D:')) ||
        (item.prompt && item.prompt.toLowerCase().includes('typography'));
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

  // Unduh Massal Terpilih
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
      setElementToDelete(null);
    }
  };

  // Toggle Centang Item pada Mode Pilih Banyak
  const toggleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredElements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredElements.map((e) => e.id));
    }
  };

  const handleConfirmBatchDelete = () => {
    if (onDeleteElement && selectedIds.length > 0) {
      selectedIds.forEach((id) => onDeleteElement(id));
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

  // Ubah Nama Elemen
  const startRename = (e, elem) => {
    e.stopPropagation();
    setEditingId(elem.id);
    setEditingTitle(elem.title || elem.prompt || 'Elemen Poster');
  };

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

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Input File Tersembunyi untuk Unggah Gambar dari Komputer */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. HEADER UTAMA GALERI FULL INVENTORY */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-4 border border-white/[0.08] shadow-2xl space-y-3.5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-lg shadow-blue-500/20">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Galeri Inventaris Elemen</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                  {elements.length} Aset
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Semua hasil generate tersimpan aman. Klik salah satu untuk membuka ke meja kanvas kerja.
              </p>
            </div>
          </div>

          {/* Tombol Aksi Kanan Header */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-[#151D2A] hover:bg-[#1C2638] border border-white/[0.1] text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Unggah gambar dari komputer ke galeri"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Unggah Gambar</span>
            </button>

            <button
              type="button"
              onClick={onAddNewElement}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-blue-600/20"
              title="Buka kanvas kosong baru untuk mulai membuat elemen dari nol"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Elemen Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds([]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isSelectionMode
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#151D2A] hover:bg-[#1C2638] border border-white/[0.1] text-slate-300 hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isSelectionMode ? 'Selesai Pilih' : 'Pilih Banyak'}</span>
            </button>
          </div>
        </div>

        {/* Baris Kontrol Pencarian & Filter Kategori */}
        {isSelectionMode ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121A28] border border-blue-500/30">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
            >
              {selectedIds.length === filteredElements.length && filteredElements.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Pilih Semua ({selectedIds.length}/{filteredElements.length} aset)</span>
            </button>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  title="Unduh semua elemen yang dicentang sekaligus"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Terpilih ({selectedIds.length})</span>
                </button>

                <button
                  onClick={() => setIsBatchDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  title="Hapus semua elemen yang dicentang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-white/[0.05]">
            {/* Tab Filter Kategori Cepat */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'Semua Aset', icon: Layers },
                { id: 'objects', label: 'Objek Gambar', icon: Folder },
                { id: 'typography', label: 'Tipografi 3D', icon: Type },
                { id: 'hd', label: 'Kualitas HD ✨', icon: Sparkles },
                { id: 'wallpaper', label: 'Wallpaper Layar', icon: Monitor },
              ].map((tab) => {
                const Icon = tab.icon;
                const isCurrent = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-400/40 shadow-md shadow-blue-500/10'
                        : 'bg-[#151D2A]/60 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Kolom Pencarian */}
            <div className="relative flex items-center min-w-[220px] sm:min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aset dalam inventaris..."
                className="w-full bg-[#121A28]/90 border border-white/[0.08] focus:border-blue-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 outline-none transition-all shadow-inner"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. AREA GRID GALERI LEGA & MEWAH */}
      <div className="flex-1 overflow-y-auto pr-1 pb-6 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredElements.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm glass-panel rounded-2xl border border-white/[0.06] p-8">
            <Folder className="w-10 h-10 text-slate-500 mx-auto mb-3 opacity-60" />
            <p className="font-semibold text-slate-300">Tidak ada elemen yang ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? 'Coba gunakan kata kunci pencarian yang lain.'
                : 'Mulai buat elemen poster atau teks 3D baru sekarang.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredElements.map((elem) => {
              const isCopied = copiedId === elem.id;
              const isSelected = selectedIds.includes(elem.id);
              const isEditingThis = editingId === elem.id;

              return (
                <div
                  key={elem.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelectItem(elem.id);
                    }
                  }}
                  className={`group rounded-2xl p-3.5 flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? 'border-2 border-rose-500 bg-[#24151B] shadow-lg shadow-rose-900/20'
                      : 'glass-panel hover:border-slate-500 shadow-xl'
                  }`}
                >
                  {/* Kotak Centang Mode Pilih Banyak */}
                  {isSelectionMode && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(elem.id);
                      }}
                      className={`absolute top-4 right-4 z-20 w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                          : 'bg-[#151D2A]/90 border-slate-500 text-transparent hover:border-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Gambar Pratinjau Besar & Indah */}
                  <div className="w-full h-44 rounded-xl bg-[#090F1C]/95 border border-white/[0.06] flex items-center justify-center p-3 overflow-hidden mb-3 relative group/img">
                    {/* Badge HD & 3D Teks Mengapung di Sudut Kiri Atas Gambar (z-20 Anti-Tertimpa) */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
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
                          'radial-gradient(circle at 60% 25%, rgba(34,211,238,0.12) 0%, transparent 60%), radial-gradient(circle at 25% 80%, rgba(168,85,247,0.1) 0%, transparent 60%)',
                      }}
                    />
                    <img
                      src={elem.image_base64}
                      alt={elem.title || elem.prompt}
                      className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Judul & Keterangan Aset */}
                  <div className="mb-3">
                    {isEditingThis ? (
                      <div className="flex items-center gap-1 mb-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRename(e, elem);
                            if (e.key === 'Escape') cancelRename(e);
                          }}
                          className="flex-1 bg-[#151D2A] border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-white outline-none font-semibold"
                        />
                        <button
                          onClick={(e) => saveRename(e, elem)}
                          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                          title="Simpan"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 cursor-pointer"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group/title mb-0.5">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate flex-1" title={elem.title || elem.prompt}>
                          {elem.title || elem.prompt || 'Elemen Poster'}
                        </h3>
                        {!isSelectionMode && (
                          <button
                            onClick={(e) => startRename(e, elem)}
                            className="opacity-0 group-hover/title:opacity-100 p-1 hover:text-blue-400 text-slate-500 transition-all ml-1 cursor-pointer"
                            title="Ubah nama elemen"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {elem.prompt || 'Tanpa deskripsi prompt'}
                    </p>
                  </div>

                  {/* Tombol Aksi Utama: Buka di Meja Kanvas */}
                  {!isSelectionMode && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => onSelectElement && onSelectElement(elem)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer group/btn"
                      >
                        <Palette className="w-3.5 h-3.5 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                        <span>Buka di Meja Kanvas</span>
                      </button>

                      {/* Baris Tombol Aksi Sekunder (Salin, Unduh, Hapus - Dibuat Jauh Lebih Visible & Jelas) */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-xs">
                        {/* Tombol Salin */}
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, elem)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-400/50 shadow-emerald-900/30 ring-1 ring-emerald-400/40'
                              : 'bg-[#152033]/90 hover:bg-blue-600/30 text-blue-300 hover:text-blue-100 border border-blue-500/30 hover:border-blue-400/60'
                          }`}
                          title="Salin gambar PNG ke Papan Klip"
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

                        {/* Tombol Unduh */}
                        <button
                          type="button"
                          onClick={(e) => handleDownload(e, elem)}
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-[#112620]/90 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 hover:border-emerald-400/60 transition-all shadow-sm cursor-pointer"
                          title="Unduh berkas gambar PNG"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Unduh</span>
                        </button>

                        {/* Tombol Hapus */}
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL KONFIRMASI HAPUS SATUAN */}
      <ConfirmModal
        isOpen={!!elementToDelete}
        title="Hapus dari Koleksi"
        message={`Apakah kamu yakin ingin menghapus "${elementToDelete?.title || elementToDelete?.prompt || 'elemen ini'}" dari koleksi studio? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Elemen"
        cancelText="Batal"
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setElementToDelete(null)}
      />

      {/* MODAL KONFIRMASI HAPUS MASSAL */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        title={`Hapus ${selectedIds.length} Elemen Sekaligus`}
        message={`Apakah kamu yakin ingin menghapus ${selectedIds.length} elemen yang dipilih dari koleksi studio? Semua elemen terpilih akan dihapus secara permanen.`}
        confirmText={`Hapus Semua (${selectedIds.length})`}
        cancelText="Batal"
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setIsBatchDeleteModalOpen(false)}
      />
    </div>
  );
}
