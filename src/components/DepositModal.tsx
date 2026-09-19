import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Wallet,
  QrCode,
  Building2,
  Copy,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { DepositMethod, DepositOrder, User } from '../types.js';

interface DepositModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccessDeposit: (updatedUser: User) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccessDeposit,
  onOpenAuth,
}) => {
  const [methods, setMethods] = useState<DepositMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('QRIS');
  const [nominal, setNominal] = useState<number>(50000);
  const [customNominal, setCustomNominal] = useState<string>('50000');
  const [activeTicket, setActiveTicket] = useState<DepositOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusChecking, setStatusChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const quickNominals = [10000, 25000, 50000, 100000, 200000, 500000];

  useEffect(() => {
    if (isOpen) {
      api.getDepositMethods().then((res) => {
        if (res.status && Array.isArray(res.data)) {
          setMethods(res.data);
        }
      });
    }
  }, [isOpen]);

  // Generate QR Canvas if ticket has qr_string
  useEffect(() => {
    if (activeTicket?.qr_string) {
      QRCode.toDataURL(activeTicket.qr_string, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((e) => console.error('QR Render err', e));
    } else {
      setQrDataUrl(null);
    }
  }, [activeTicket]);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1">Masuk untuk Mengisi Saldo</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">
            Silakan masuk atau daftar akun terlebih dahulu untuk mengelola saldo dan transaksi Anda.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = Number(customNominal) || nominal;

    if (amount < 2000) {
      setError('Nominal deposit minimal adalah Rp 2.000.');
      return;
    }

    setLoading(true);

    try {
      const selected = methods.find((m) => m.metode === selectedMethod);
      const res = await api.createDeposit({
        nominal: amount,
        type: selected?.type || 'ewallet',
        method: String(selectedMethod || 'QRIS').toLowerCase(),
      });

      if (res.status && res.data) {
        setActiveTicket(res.data);
      } else {
        setError(res.message || 'Gagal membuat tiket deposit.');
      }
    } catch (err: any) {
      setError('Terjadi kendala sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!activeTicket) return;
    setStatusChecking(true);
    try {
      const res = await api.getDepositStatus(activeTicket.id);
      if (res.status && res.data) {
        setActiveTicket(res.data);
        if (res.data.status === 'success') {
          const meRes = await api.getMe();
          if (meRes.status && meRes.data) {
            onSuccessDeposit(meRes.data);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusChecking(false);
    }
  };

  const handleDemoApprove = async () => {
    if (!activeTicket) return;
    setStatusChecking(true);
    try {
      const res = await api.demoApproveDeposit(activeTicket.id);
      if (res.status) {
        setActiveTicket({ ...activeTicket, status: 'success' });
        const meRes = await api.getMe();
        if (meRes.status && meRes.data) {
          onSuccessDeposit(meRes.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusChecking(false);
    }
  };

  const handleCancelTicket = async () => {
    if (!activeTicket) return;
    try {
      await api.cancelDeposit(activeTicket.id);
      setActiveTicket(null);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Isi Saldo Akun (Deposit)</h3>
              <p className="text-[11px] text-indigo-600 font-bold font-mono">
                Saldo Saat Ini: Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <button
            id="btn-close-deposit-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!activeTicket ? (
            /* CREATE DEPOSIT TICKET VIEW */
            <form onSubmit={handleCreateTicket} className="space-y-6">
              {/* Nominal selector */}
              <div className="space-y-2.5">
                <label className="font-extrabold text-slate-900 block">Pilih Nominal Deposit</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickNominals.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => {
                        setNominal(nom);
                        setCustomNominal(String(nom));
                      }}
                      className={`py-2.5 px-3 rounded-xl border font-mono font-black transition-all cursor-pointer shadow-sm ${
                        Number(customNominal) === nom
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Rp {Number(nom || 0).toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                    Atau Masukkan Nominal Kustom (Min Rp 2.000)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      id="input-custom-deposit"
                      type="number"
                      min={2000}
                      step={1000}
                      value={customNominal}
                      onChange={(e) => setCustomNominal(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-black shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <label className="font-extrabold text-slate-900 block">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {methods.map((m) => {
                    const isSelected = selectedMethod === m.metode;
                    return (
                      <button
                        key={m.metode}
                        type="button"
                        id={`dep-method-${String(m?.metode || 'method').toLowerCase()}`}
                        onClick={() => setSelectedMethod(m.metode)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-slate-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs text-slate-900">{m.metode}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            {m.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{m.keterangan || 'Biaya admin otomatis'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  id="btn-create-deposit-ticket"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyiapkan Tiket Deposit...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Buat Tiket Deposit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ACTIVE DEPOSIT TICKET VIEW */
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500">Nomor Tiket Deposit</span>
                  <p className="font-mono font-black text-indigo-600 text-sm">{activeTicket.id}</p>
                </div>
                <div>
                  {activeTicket.status === 'success' ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Berhasil Masuk</span>
                    </span>
                  ) : activeTicket.status === 'pending' ? (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Menunggu Bayar</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                      Kadaluarsa
                    </span>
                  )}
                </div>
              </div>

              {/* Total Amount to Transfer */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-center space-y-1">
                <span className="text-[11px] text-slate-600 font-bold">
                  Transfer Tepat Sesuai Nominal Unik:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    Rp {Number(activeTicket.get_balance || activeTicket.nominal || 0).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        String(activeTicket.get_balance || activeTicket.nominal || 0),
                        'nominal'
                      )
                    }
                    className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {copied === 'nominal' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Pastikan 3 digit terakhir tepat agar saldo terverifikasi secara otomatis!
                </p>
              </div>

              {/* QRIS Code or VA Details */}
              {qrDataUrl && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-800">Scan QRIS Menggunakan Aplikasi E-Wallet / Mobile Banking</p>
                  <img
                    src={qrDataUrl}
                    alt="QRIS Deposit"
                    className="w-52 h-52 rounded-xl border border-slate-200 shadow-sm"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">NMID / QR Code Dynamic</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={statusChecking}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statusChecking ? 'animate-spin' : ''}`} />
                  <span>Cek Status Saldo</span>
                </button>

                <button
                  type="button"
                  onClick={handleDemoApprove}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  title="Simulasi Pembayaran Berhasil"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simulasi Bayar (Demo)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelTicket}
                  className="py-2.5 px-4 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batalkan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
