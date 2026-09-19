import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  Receipt,
  Share2,
} from 'lucide-react';
import type { TransactionRecord } from '../types.js';

interface InvoiceModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!transaction) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="px-6 py-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Struk Resmi Transaksi
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Logo & Store Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-1">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">IBAD STORE</h3>
            <p className="text-[10px] text-slate-400 font-mono">Gateway Atlantic H2H Verified</p>
          </div>

          {/* Status Chip */}
          <div className="flex justify-center">
            {transaction.status === 'success' ? (
              <span className="px-3.5 py-1 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PEMBAYARAN SUKSES
              </span>
            ) : transaction.status === 'pending' ? (
              <span className="px-3.5 py-1 rounded-full bg-amber-950 border border-amber-500 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                TRANSAKSI DIPROSES
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full bg-rose-950 border border-rose-500 text-rose-400 text-xs font-bold">
                TRANSAKSI GAGAL
              </span>
            )}
          </div>

          {/* Details Table */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400 text-[11px]">No. Invoice / Reff</span>
              <div className="flex items-center gap-1 font-mono font-bold text-cyan-400">
                <span>{transaction.reff_id}</span>
                <button
                  onClick={() => handleCopy(transaction.reff_id, 'reff')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {copied === 'reff' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Waktu:</span>
              <span className="font-mono">{transaction?.created_at ? new Date(transaction.created_at).toLocaleString('id-ID') : '-'}</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Layanan:</span>
              <span className="font-bold text-white text-right max-w-[200px] truncate">
                {transaction.layanan}
              </span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Nomor / ID Tujuan:</span>
              <span className="font-mono font-bold text-cyan-400">{transaction.target}</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Metode Pembayaran:</span>
              <span className="capitalize">{transaction.payment_method}</span>
            </div>

            {/* Serial Number */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold">Serial Number / Token:</span>
                {transaction.sn && (
                  <button
                    onClick={() => handleCopy(transaction.sn!, 'sn')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    {copied === 'sn' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'sn' ? 'Disalin' : 'Salin'}</span>
                  </button>
                )}
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-emerald-400 font-bold break-all text-center">
                {transaction.sn || (transaction.status === 'pending' ? 'Sedang diproses oleh provider...' : '-')}
              </div>
            </div>

            {/* Total Price */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-extrabold text-white">
              <span>Total Bayar:</span>
              <span className="text-cyan-400 font-mono text-base">
                Rp {Number(transaction?.price || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <p className="text-center text-[10px] text-slate-500 leading-tight">
            Struk ini adalah bukti pembayaran digital sah dari Ibad Store yang dilindungi enkripsi kriptografis.
          </p>
        </div>

        {/* Modal footer actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
