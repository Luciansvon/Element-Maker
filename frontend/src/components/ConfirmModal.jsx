import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen = false,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah kamu yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Hapus',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Kotak Modal Konfirmasi yang Diperbesar 40% Lebih Megah & Nyaman Dibaca */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111827] border border-[#232F45] shadow-2xl p-8 sm:p-9 flex flex-col items-center text-center space-y-6">
        {/* Ikon Tong Sampah Besar & Berbobot */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
          <Trash2 className="w-8 h-8" />
        </div>

        {/* Judul & Pesan Penjelasan yang Jelas & Besar */}
        <div className="space-y-2.5">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{title}</h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">{message}</p>
        </div>

        {/* Tombol Aksi Bawah yang Lega & Mantap */}
        <div className="flex items-center gap-4 w-full pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-3.5 rounded-2xl bg-[#151D2A] hover:bg-slate-800 text-slate-300 hover:text-white text-sm sm:text-base font-semibold border border-slate-700/60 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-sm sm:text-base font-bold shadow-xl shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
