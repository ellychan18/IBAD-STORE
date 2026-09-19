import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  AlertCircle,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { TransactionRecord } from '../types.js';

interface OrderTrackerProps {
  onViewInvoice: (tx: TransactionRecord) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ onViewInvoice }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await api.checkOrder(query.trim());
      if (res.status && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Transaksi tidak ditemukan. Periksa No. Invoice atau Reff ID Anda.');
      }
    } catch (err) {
      setError('Gagal memeriksa pesanan.');
    } finally {
      setLoading(false);
    }
  };

  const copySn = (sn: string) => {
    navigator.clipboard.writeText(sn);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Lacak Pesanan / Cek Transaksi
            </h2>
            <p className="text-xs text-slate-400">
              Pantau status pengisian pulsa, diamond game, dan token PLN secara real-time
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-bold text-slate-200">
            Masukkan No. Invoice, Reff ID, atau No. HP / ID Akun
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-tracker-query"
                type="text"
                placeholder="Contoh: IBAD-L9X9... atau 08123456789"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            <button
              id="btn-track-order"
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Mengecek...</span>
                </>
              ) : (
                <>
                  <span>Cari Pesanan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction Result Display */}
        {result && (
          <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
            <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 space-y-4">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">INVOICE:</span>
                  <span className="font-mono font-bold text-white text-xs">{result.reff_id}</span>
                </div>

                <div className="flex items-center gap-2">
                  {result.status === 'success' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Transaksi Sukses
                    </span>
                  ) : result.status === 'pending' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-500 text-amber-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      Sedang Diproses
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-rose-950 border border-rose-500 text-rose-400 text-xs font-bold flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      Gagal / Dibatalkan
                    </span>
                  )}
                </div>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px]">Layanan / Produk</p>
                  <p className="font-bold text-white text-sm mt-0.5">{result.layanan}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[11px]">Tujuan / No. Meter / ID</p>
                  <p className="font-mono font-bold text-cyan-400 mt-0.5">{result.target}</p>
                </div>

                <div>
                  <p className="text-slate-400 text-[11px]">Metode Pembayaran</p>
                  <p className="font-semibold text-slate-200 capitalize mt-0.5">
                    {result.payment_method === 'saldo' ? 'Saldo Akun Ibad Store' : 'QRIS / Direct Gateway'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-[11px]">Waktu Transaksi</p>
                  <p className="font-mono text-slate-300 mt-0.5">
                    {result?.created_at ? new Date(result.created_at).toLocaleString('id-ID') : '-'}
                  </p>
                </div>
              </div>

              {/* Serial Number (SN / PLN Token) Display */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    Serial Number (SN) / Token / Bukti Ref
                  </span>
                  {result.sn && (
                    <button
                      onClick={() => copySn(result.sn!)}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Tersalin!' : 'Salin SN'}</span>
                    </button>
                  )}
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs font-bold text-emerald-400 break-all select-all">
                  {result.sn || (result.status === 'pending' ? 'Menunggu serial number dari provider...' : '-')}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-[10px] text-slate-400">Total Harga:</span>
                  <p className="text-base font-extrabold text-white font-mono">
                    Rp {Number(result?.price || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <button
                  id="btn-view-invoice"
                  onClick={() => onViewInvoice(result)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-cyan-400" />
                  <span>Lihat Struk Transaksi</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
