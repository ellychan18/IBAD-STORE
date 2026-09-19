import React, { useState, useEffect, useRef } from 'react';
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
          dark: '#020617',
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
          <Wallet className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Masuk untuk Mengisi Saldo</h3>
          <p className="text-xs text-slate-400 mb-6">
            Silakan masuk atau daftar akun terlebih dahulu untuk mengelola saldo dan transaksi Anda.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20"
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
          // Refresh user
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Isi Saldo Akun (Deposit)</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Saldo Saat Ini: Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <button
            id="btn-close-deposit-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!activeTicket ? (
            /* CREATE DEPOSIT TICKET VIEW */
            <form onSubmit={handleCreateTicket} className="space-y-6">
              {/* Nominal selector */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-200 block">Pilih Nominal Deposit</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickNominals.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => {
                        setNominal(nom);
                        setCustomNominal(String(nom));
                      }}
                      className={`py-2.5 px-3 rounded-xl border font-mono font-bold transition-all cursor-pointer ${
                        Number(customNominal) === nom
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      Rp {Number(nom || 0).toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Atau Masukkan Nominal Kustom (Min Rp 2.000)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                      Rp
                    </span>
                    <input
                      id="input-custom-deposit"
                      type="number"
                      min={2000}
                      step={1000}
                      value={customNominal}
                      onChange={(e) => setCustomNominal(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-200 block">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {methods.map((m) => {
                    const isSelected = selectedMethod === m.metode;
                    return (
                      <button
                        key={m.metode}
                        type="button"
                        id={`dep-method-${String(m?.metode || 'method').toLowerCase()}`}
                        onClick={() => setSelectedMethod(m.metode)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{m.metode}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                            {m.fee_persen > 0 ? `${m.fee_persen}% Fee` : m.fee > 0 ? `Rp ${m.fee}` : 'Gratis Fee'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{m.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                id="btn-create-deposit-ticket"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Membuat Tiket Pembayaran...</span>
                  </>
                ) : (
                  <span>Lanjutkan Pembayaran Deposit</span>
                )}
              </button>
            </form>
          ) : (
            /* ACTIVE TICKET PAYMENT VIEW */
            <div className="space-y-5 animate-in fade-in">
              {activeTicket.status === 'success' ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white">Deposit Berhasil Diterima!</h4>
                  <p className="text-xs text-emerald-300">
                    Saldo sebesar{' '}
                    <span className="font-bold font-mono">
                      Rp {Number(activeTicket?.get_balance || 0).toLocaleString('id-ID')}
                    </span>{' '}
                    telah ditambahkan ke akun Anda.
                  </p>
                  <button
                    onClick={() => setActiveTicket(null)}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Buat Deposit Baru
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400">ID TIKET DEPOSIT</span>
                        <p className="font-mono font-bold text-cyan-400 text-xs">{activeTicket.reff_id}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse">
                        Menunggu Pembayaran
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Transfer Tepat:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-base font-extrabold text-cyan-400">
                          Rp {Number(activeTicket?.nominal || 0).toLocaleString('id-ID')}
                        </span>
                        <button
                          onClick={() => copyToClipboard(String(activeTicket.nominal), 'nominal')}
                          className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                          title="Salin nominal"
                        >
                          {copied === 'nominal' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>Saldo Masuk Bersih:</span>
                      <span className="font-mono text-white">
                        Rp {Number(activeTicket?.get_balance || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* QRIS Display */}
                  {qrDataUrl && (
                    <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center text-slate-950 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Scan QRIS dengan Aplikasi Apapun
                      </p>
                      <img
                        src={qrDataUrl}
                        alt="QRIS Payment"
                        className="w-48 h-48 object-contain rounded-lg shadow-sm"
                      />
                      <p className="text-[10px] text-slate-500 font-mono text-center">
                        BCA Mobile, Livin, GoPay, OVO, DANA, ShopeePay
                      </p>
                    </div>
                  )}

                  {/* Bank Transfer Details */}
                  {activeTicket.bank && activeTicket.tujuan && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Bank Tujuan</span>
                        <span className="font-bold text-white">{activeTicket.bank}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Nomor Rekening</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-cyan-400">{activeTicket.tujuan}</span>
                          <button
                            onClick={() => copyToClipboard(activeTicket.tujuan!, 'tujuan')}
                            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {copied === 'tujuan' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Atas Nama</span>
                        <span className="font-semibold text-slate-200">{activeTicket.atas_nama}</span>
                      </div>
                    </div>
                  )}

                  {/* Virtual Account Details */}
                  {activeTicket.nomor_va && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px]">Nomor Virtual Account</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-cyan-400 text-sm">
                            {activeTicket.nomor_va}
                          </span>
                          <button
                            onClick={() => copyToClipboard(activeTicket.nomor_va!, 'va')}
                            className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {copied === 'va' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ticket Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      id="btn-check-deposit-status"
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={statusChecking}
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${statusChecking ? 'animate-spin' : ''}`} />
                      <span>Cek Status Pembayaran (Realtime)</span>
                    </button>

                    {/* Instant Demo Simulator Button */}
                    <button
                      id="btn-demo-approve"
                      type="button"
                      onClick={handleDemoApprove}
                      className="w-full py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simulasi Bayar Instan (Uji Coba Cepat)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelTicket}
                      className="w-full py-2 text-slate-400 hover:text-rose-400 text-[11px] font-medium"
                    >
                      Batalkan Tiket Ini
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
