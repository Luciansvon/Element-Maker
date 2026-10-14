import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Check,
  Server,
  Key,
  Cpu,
  Paintbrush,
  Info,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { getAvailableModels, testConnection, get9RouterAccounts } from '../services/api';

const PROVIDER_PRESETS = [
  {
    id: '9router',
    name: '9Router (Lokal & Langganan)',
    desc: 'Akun ChatGPT, Antigravity, Kiro, Gemini via 9Router lokal',
    defaultUrl: 'http://localhost:20128/v1',
    models: ['ag/gemini-3.1-flash-image', 'ag/gemini-3.8-flash', 'ag/claude-sonnet-4-6', 'cx/gpt-5.1', 'dall-e-3', 'flux-schnell'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Langsung)',
    desc: 'Multi-model API Key (Flux, Imagen, SDXL)',
    defaultUrl: 'https://openrouter.ai/api/v1',
    models: ['google/imagen-3.0-generate-002', 'black-forest-labs/flux-1-schnell', 'stabilityai/stable-diffusion-xl-base-1.0'],
  },
  {
    id: 'openai',
    name: 'OpenAI Resmi',
    desc: 'API Key resmi OpenAI untuk DALL-E 3 & DALL-E 2',
    defaultUrl: 'https://api.openai.com/v1',
    models: ['dall-e-3', 'dall-e-2'],
  },
  {
    id: 'zhipu',
    name: 'Zhipu AI (CogView)',
    desc: 'Model gambar CogView hemat biaya',
    defaultUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['cogview-3', 'cogview-3-plus'],
  },
  {
    id: 'custom',
    name: 'Kustom / Endpoint Bebas',
    desc: 'Alamat server AI lokal atau proxy sendiri',
    defaultUrl: '',
    models: [],
  },
];

export default function SettingsModal({
  isOpen = false,
  onClose,
  config = {
    baseUrl: 'http://localhost:20128/v1',
    apiKey: '',
    model: '',
    inpaintModel: '',
    provider: '9router',
  },
  onSaveConfig,
}) {
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (config.baseUrl?.includes('openrouter.ai')) return 'openrouter';
    if (config.baseUrl?.includes('api.openai.com')) return 'openai';
    if (config.baseUrl?.includes('bigmodel.cn')) return 'zhipu';
    if (config.baseUrl?.includes('20128')) return '9router';
    return config.provider || '9router';
  });

  const [formData, setFormData] = useState({
    baseUrl: config.baseUrl || 'http://localhost:20128/v1',
    apiKey: config.apiKey || '',
    model: config.model ?? '',
    inpaintModel: config.inpaintModel ?? '',
    optimizerModel: config.optimizerModel ?? '',
  });

  const [availableModels, setAvailableModels] = useState([
    'ag/gemini-3.8-flash',
    'ag/claude-sonnet-4-6',
    'cx/gpt-5.1',
    'openrouter/free',
    'flux-pro',
    'flux-schnell',
    'stable-diffusion-xl',
    'dall-e-3',
    'dall-e-2',
  ]);

  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchMessage, setFetchMessage] = useState(null);
  const [isCustomGenModel, setIsCustomGenModel] = useState(false);
  const [isCustomInpaintModel, setIsCustomInpaintModel] = useState(false);
  const [isCustomOptimizerModel, setIsCustomOptimizerModel] = useState(false);

  // State Uji Sambungan Nyata
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // State Deteksi Akun 9Router
  const [routerAccounts, setRouterAccounts] = useState([]);
  const [isRouterActive, setIsRouterActive] = useState(false);
  const [isLoadingRouter, setIsLoadingRouter] = useState(false);

  useEffect(() => {
    if (config) {
      let prov = config.provider;
      if (!prov) {
        if (config.baseUrl?.includes('openrouter.ai')) prov = 'openrouter';
        else if (config.baseUrl?.includes('api.openai.com')) prov = 'openai';
        else if (config.baseUrl?.includes('bigmodel.cn')) prov = 'zhipu';
        else if (config.baseUrl?.includes('20128')) prov = '9router';
        else prov = '9router';
      }
      setSelectedProvider(prov);

      setFormData({
        baseUrl: config.baseUrl || 'http://localhost:20128/v1',
        apiKey: config.apiKey || '',
        model: config.model ?? '',
        inpaintModel: config.inpaintModel ?? '',
        optimizerModel: config.optimizerModel ?? '',
      });
      if (config.model && !availableModels.includes(config.model) && config.model !== '') {
        setIsCustomGenModel(true);
      }
      if (config.inpaintModel && !availableModels.includes(config.inpaintModel) && config.inpaintModel !== '') {
        setIsCustomInpaintModel(true);
      }
      if (config.optimizerModel && !availableModels.includes(config.optimizerModel) && config.optimizerModel !== '') {
        setIsCustomOptimizerModel(true);
      }
    }
  }, [config, isOpen]);

  // Muat akun 9Router ketika modal dibuka atau provider 9router dipilih
  useEffect(() => {
    if (isOpen && selectedProvider === '9router') {
      fetch9RouterAccounts();
    }
  }, [isOpen, selectedProvider]);

  const fetch9RouterAccounts = async () => {
    setIsLoadingRouter(true);
    try {
      const res = await get9RouterAccounts(20128);
      if (res.status === 'ok' && res.connections) {
        setRouterAccounts(res.connections);
        setIsRouterActive(true);
      } else {
        setIsRouterActive(false);
        setRouterAccounts([]);
      }
    } catch {
      setIsRouterActive(false);
      setRouterAccounts([]);
    } finally {
      setIsLoadingRouter(false);
    }
  };

  if (!isOpen) return null;

  // Ganti Provider & Otomatis Isi URL Default
  const handleSelectProvider = (provId) => {
    setSelectedProvider(provId);
    setTestResult(null);
    setFetchMessage(null);

    const preset = PROVIDER_PRESETS.find((p) => p.id === provId);
    if (preset && preset.defaultUrl) {
      setFormData((prev) => ({
        ...prev,
        baseUrl: preset.defaultUrl,
      }));
      if (preset.models.length > 0) {
        setAvailableModels(preset.models);
      }
    }
  };

  // Uji Sambungan Nyata
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(formData.baseUrl, formData.apiKey, selectedProvider);
      setTestResult(res);
    } catch (err) {
      setTestResult({
        status: 'error',
        message: `Gagal menguji sambungan: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Ambil Daftar Model Aktif
  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    setFetchMessage(null);
    try {
      const res = await getAvailableModels(formData.baseUrl, formData.apiKey);
      if (res.models && res.models.length > 0) {
        setAvailableModels(res.models);
        setFetchMessage({
          type: 'success',
          text: `Berhasil memuat ${res.models.length} model aktif dari server!`,
        });
      } else {
        setFetchMessage({
          type: 'info',
          text: 'Server aktif, menggunakan model default yang tersedia.',
        });
      }
    } catch (err) {
      setFetchMessage({
        type: 'error',
        text: `Gagal memanggil model: ${err.message}`,
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveConfig) {
      onSaveConfig({
        ...formData,
        provider: selectedProvider,
        model: formData.model.trim(),
        inpaintModel: formData.inpaintModel.trim(),
        optimizerModel: (formData.optimizerModel || '').trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#101726] border border-[#232F45] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0E1522] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Element Maker"
                className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Pengaturan Sambungan & Model AI</h3>
              <p className="text-xs text-slate-400">Pilih penyedia AI (9Router, OpenRouter, OpenAI, Zhipu) dan uji sambungan nyata</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Tutup Pengaturan"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Formulir */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* 1. KOTAK PILIHAN PENYEDIA AI (MULTI-PROVIDER SELECTOR) */}
          <div className="space-y-2">
            <label className="text-slate-200 font-bold flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-400" />
              <span>Pilih Penyedia AI (Provider)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROVIDER_PRESETS.map((p) => {
                const isSelected = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProvider(p.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-400/30'
                        : 'bg-[#151D2A] border-[#232F45] text-slate-300 hover:border-slate-600 hover:bg-[#1A2436]'
                    }`}
                  >
                    <div>
                      <div className={`font-bold text-xs ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                        {p.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-400">
                        <Check className="w-3 h-3" />
                        <span>Aktif Dipilih</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. KARTU INFORMASI AKUN 9ROUTER (Jika Memilih 9Router) */}
          {selectedProvider === '9router' && (
            <div className="p-4 rounded-xl bg-[#0C1322] border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Status 9Router & Akun Langganan Mas Bima</h4>
                    <p className="text-[11px] text-slate-400">
                      {isRouterActive
                        ? `9Router terdeteksi aktif di port 20128 (${routerAccounts.length} akun terhubung)`
                        : '9Router lokal tidak terdeteksi di port 20128'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetch9RouterAccounts}
                    disabled={isLoadingRouter}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Segarkan daftar akun"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRouter ? 'animate-spin' : ''}`} />
                  </button>
                  <a
                    href="http://localhost:20128"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all"
                    title="Buka kendali 9Router untuk login akun baru"
                  >
                    <span>Buka 9Router</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Daftar Akun Aktif di 9Router */}
              {routerAccounts.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Akun Langganan Terdeteksi:
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                    {routerAccounts.map((acc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#151D2A] text-[11px]"
                      >
                        <span className="font-semibold text-slate-200 uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {acc.provider}
                        </span>
                        <span className="text-slate-300 truncate max-w-[200px]" title={acc.name || acc.email}>
                          {acc.email || acc.name}
                        </span>
                        <span className={`text-[10px] font-bold ${acc.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {acc.status === 'active' ? '● Aktif' : '○ Siap'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. ALAMAT SERVER & KUNCI API */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="flex items-center justify-between text-slate-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span>Alamat Server (Base URL)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Format OpenAI: harus berakhiran /v1</span>
              </label>
              <input
                type="text"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="http://localhost:20128/v1"
                required
                className="w-full bg-[#151D2A] border border-[#232F45] focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none font-mono text-xs transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center justify-between text-slate-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kunci Akses (API Key)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {selectedProvider === '9router' ? 'Kosongkan jika 9Router tanpa sandi' : 'Wajib diisi untuk provider resmi'}
                </span>
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={
                  selectedProvider === 'openrouter'
                    ? 'sk-or-v1-...'
                    : selectedProvider === 'openai'
                    ? 'sk-...'
                    : 'Tempel Kunci Akses (API Key)...'
                }
                className="w-full bg-[#151D2A] border border-[#232F45] focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none font-mono text-xs transition-colors"
              />
            </div>

            {/* Tombol Uji Sambungan Nyata (*Test Connection*) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !formData.baseUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Wifi className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse text-blue-400' : 'text-emerald-400'}`} />
                <span>{isTesting ? 'Menguji Sambungan...' : '⚡ Uji Sambungan Nyata (Test Connection)'}</span>
              </button>

              {/* Tampilan Hasil Tes Koneksi Nyata */}
              {testResult && (
                <div
                  className={`mt-2 p-3 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                    testResult.status === 'ok'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {testResult.status === 'ok' ? (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. BAGIAN MODEL & TOMBOL SINKRONISASI MODEL */}
          <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Daftar Model AI</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Panggil model yang aktif di server atau pilih dari daftar bawaan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isLoadingModels}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
                <span>Panggil Model Aktif</span>
              </button>
            </div>

            {/* Pesan status fetch */}
            {fetchMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  fetchMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : fetchMessage.type === 'error'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>{fetchMessage.text}</span>
              </div>
            )}

            {/* Model Generator Utama */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span>Model Pembuat Elemen Utama (Generate)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomGenModel(!isCustomGenModel)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  {isCustomGenModel ? 'Pilih dari Daftar' : 'Ketik Manual'}
                </button>
              </div>

              {isCustomGenModel ? (
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Contoh: ag/gemini-3.8-flash, dall-e-3, atau kosongkan untuk otomatis"
                  className="w-full bg-[#151D2A] border border-[#232F45] focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none font-mono text-xs"
                />
              ) : (
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-[#151D2A] border border-[#232F45] focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none font-medium cursor-pointer text-xs"
                >
                  <option value="" className="bg-[#111827] text-amber-400 font-semibold">
                    ⭐ Otomatis / Bawaan Provider
                  </option>
                  {availableModels.map((m) => (
                    <option key={`gen-${m}`} value={m} className="bg-[#111827] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Model Kuas Sulam (Inpaint) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
                  <span>Model Kuas Perbaikan / Tambal Sulam (Inpaint)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomInpaintModel(!isCustomInpaintModel)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  {isCustomInpaintModel ? 'Pilih dari Daftar' : 'Ketik Manual'}
                </button>
              </div>

              {isCustomInpaintModel ? (
                <input
                  type="text"
                  value={formData.inpaintModel}
                  onChange={(e) => setFormData({ ...formData, inpaintModel: e.target.value })}
                  placeholder="Contoh: ag/gemini-3.8-flash atau biarkan kosong"
                  className="w-full bg-[#151D2A] border border-[#232F45] focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none font-mono text-xs"
                />
              ) : (
                <select
                  value={formData.inpaintModel}
                  onChange={(e) => setFormData({ ...formData, inpaintModel: e.target.value })}
                  className="w-full bg-[#151D2A] border border-[#232F45] focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none font-medium cursor-pointer text-xs"
                >
                  <option value="" className="bg-[#111827] text-amber-400 font-semibold">
                    ⭐ Otomatis / Bawaan Provider
                  </option>
                  {availableModels.map((m) => (
                    <option key={`inp-${m}`} value={m} className="bg-[#111827] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Model Penulis Optimizer (Prompt Writer) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Model Penulis Optimizer (Prompt Writer)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomOptimizerModel(!isCustomOptimizerModel)}
                  className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 underline cursor-pointer"
                >
                  {isCustomOptimizerModel ? 'Pilih dari Daftar' : 'Ketik Manual'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Otomatis Pintar = pakai Gemini 3.8 Flash bila tersedia, atau ikuti Model Utama bila itu model chat.
                Model gambar (dall-e, flux, cogview) tidak dipakai di sini karena tidak bisa menulis.
              </p>

              {isCustomOptimizerModel ? (
                <input
                  type="text"
                  value={formData.optimizerModel}
                  onChange={(e) => setFormData({ ...formData, optimizerModel: e.target.value })}
                  placeholder="Contoh: ag/gemini-3.8-flash atau kosongkan untuk otomatis pintar"
                  className="w-full bg-[#151D2A] border border-[#232F45] focus:border-fuchsia-500 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 outline-none font-mono text-xs"
                />
              ) : (
                <select
                  value={formData.optimizerModel}
                  onChange={(e) => setFormData({ ...formData, optimizerModel: e.target.value })}
                  className="w-full bg-[#151D2A] border border-[#232F45] focus:border-fuchsia-500 rounded-xl px-3.5 py-2 text-slate-100 outline-none font-medium cursor-pointer text-xs"
                >
                  <option value="" className="bg-[#111827] text-fuchsia-300 font-semibold">
                    ⭐ Otomatis Pintar (Gemini 3.8 / Ikuti Model Utama)
                  </option>
                  {availableModels.map((m) => (
                    <option key={`opt-${m}`} value={m} className="bg-[#111827] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Tombol Simpan & Tutup */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
