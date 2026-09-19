import React, { useState } from 'react';
import {
  FileText,
  Zap,
  HeartPulse,
  Wifi,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Wallet,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { PostpaidInquiryResult, User, TransactionRecord } from '../types.js';

interface BillInquiryProps {
  user: User | null;
  onSuccessPay: (tx: TransactionRecord) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
}

export const BillInquiry: React.FC<BillInquiryProps> = ({
  user,
  onSuccessPay,
  onOpenAuth,
  onOpenDeposit,
}) => {
  const [selectedService, setSelectedService] = useState<'PPLN' | 'BPJS' | 'PINT1' | 'HP1'>('PPLN');
  const [customerNo, setCustomerNo] = useState('');
  const [inquiryResult, setInquiryResult] = useState<PostpaidInquiryResult | null>(null);
  const [loadingInquiry, setLoadingInquiry] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'qris'>('saldo');
  const [pin, setPin] = useState('');

  const services = [
    {
      code: 'PPLN',
      name: 'PLN Pascabayar',
      desc: 'Tagihan Listrik Bulanan',
      icon: Zap,
      placeholder: 'Masukkan 12 digit ID Pelanggan PLN',
    },
    {
      code: 'BPJS',
      name: 'BPJS Kesehatan',
      desc: 'Iuran Bulanan BPJS Mandiri',
      icon: HeartPulse,
      placeholder: 'Masukkan 13 digit No. Kartu BPJS / Virtual Account',
    },
    {
      code: 'PINT1',
      name: 'Indihome / Telkom',
      desc: 'Internet Speedy & Telepon',
      icon: Wifi,
      placeholder: 'Masukkan Nomor Pelanggan / No. Telepon Rumah',
    },
    {
      code: 'HP1',
      name: 'Halo Postpaid',
      desc: 'Kartu Halo Pasca Bayar',
      icon: PhoneCall,
      placeholder: 'Masukkan Nomor Kartu Halo (0811/0812...)',
    },
  ];

  const currentService = services.find((s) => s.code === selectedService)!;

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInquiryResult(null);

    if (!customerNo.trim()) {
      setError('Masukkan nomor pelanggan yang ingin dicek.');
      return;
    }

    setLoadingInquiry(true);

    try {
      const res = await api.inquireBill(selectedService, customerNo.trim());
      if (res.status && res.data) {
        setInquiryResult(res.data);
      } else {
        setError(res.message || 'Tagihan tidak ditemukan atau telah lunas.');
      }
    } catch (err) {
      setError('Gagal memeriksa data tagihan.');
    } finally {
      setLoadingInquiry(false);
    }
  };

  const handlePayBill = async () => {
    if (!inquiryResult) return;
    setError(null);

    if (paymentMethod === 'saldo') {
      if (!user) {
        onOpenAuth('login');
        return;
      }
      if ((user.balance || 0) < Number(inquiryResult.total_tagihan || 0)) {
        setError(
          `Saldo tidak mencukupi (Saldo: Rp ${Number(user?.balance || 0).toLocaleString('id-ID')}). Total tagihan: Rp ${Number(inquiryResult.total_tagihan || 0).toLocaleString('id-ID')}. Silakan isi saldo deposit.`
        );
        return;
      }
    }

    setLoadingPay(true);

    try {
      const res = await api.payBill({
        code: inquiryResult.code,
        customer_no: inquiryResult.nomor_pelanggan,
        reff_id: inquiryResult.reff_id,
        total_tagihan: inquiryResult.total_tagihan,
        payment_method: paymentMethod,
        pin: pin || undefined,
      });

      if (res.status && res.data) {
        onSuccessPay(res.data);
      } else {
        setError(res.message || 'Gagal memproses pembayaran tagihan.');
      }
    } catch (err) {
      setError('Terjadi kendala keamanan saat memproses pembayaran.');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Cek &amp; Bayar Tagihan Pascabayar
            </h2>
            <p className="text-xs text-slate-400">
              Inquiry resmi realtime terkoneksi ke Atlantic H2H Gateway PLN, BPJS, dan Telkom
            </p>
          </div>
        </div>
      </div>

      {/* Service Type Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {services.map((srv) => {
          const Icon = srv.icon;
          const isSelected = selectedService === srv.code;
          return (
            <button
              key={srv.code}
              id={`service-btn-${String(srv?.code || 'service').toLowerCase()}`}
              type="button"
              onClick={() => {
                setSelectedService(srv.code as any);
                setInquiryResult(null);
                setError(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950/50 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    Dipilih
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-white">{srv.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{srv.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Inquiry Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <form onSubmit={handleInquiry} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Nomor Pelanggan / ID Tagihan {currentService.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono">Gateway Verified</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-customer-bill"
                  type="text"
                  placeholder={currentService.placeholder}
                  value={customerNo}
                  onChange={(e) => setCustomerNo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <button
                id="btn-inquire-bill"
                type="submit"
                disabled={loadingInquiry}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loadingInquiry ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Memeriksa Tagihan...</span>
                  </>
                ) : (
                  <>
                    <span>Cek Tagihan Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Inquiry Result Sheet */}
        {inquiryResult && (
          <div className="pt-4 border-t border-slate-800 space-y-5 animate-in fade-in">
            <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs">Informasi Tagihan Resmi</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  REFF: {inquiryResult.reff_id}
                </span>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 text-[11px]">Nama Pelanggan</p>
                  <p className="font-bold text-white uppercase text-sm mt-0.5">
                    {inquiryResult.nama_pelanggan || 'PELANGGAN SETIA'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-[11px]">Nomor Pelanggan</p>
                  <p className="font-mono font-bold text-cyan-400 mt-0.5">
                    {inquiryResult.nomor_pelanggan}
                  </p>
                </div>

                {inquiryResult.detail?.tarif && (
                  <div>
                    <p className="text-slate-400 text-[11px]">Tarif / Daya</p>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {inquiryResult.detail.tarif}{' '}
                      {inquiryResult.detail.daya ? `(${inquiryResult.detail.daya} VA)` : ''}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-slate-400 text-[11px]">Lembar / Periode Tagihan</p>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {inquiryResult.detail?.lembar_tagihan || 1} Lembar Tagihan
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Nilai Tagihan Pokok:</span>
                  <span className="font-mono">
                    Rp {Number(inquiryResult?.harga || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Biaya Administrasi:</span>
                  <span className="font-mono">
                    Rp {Number(inquiryResult?.biaya_admin || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-extrabold text-cyan-400">
                  <span>Total yang Harus Dibayar:</span>
                  <span className="font-mono text-base">
                    Rp {Number(inquiryResult?.total_tagihan || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-200 block">Pilih Pembayaran Tagihan</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="bill-pay-saldo"
                  onClick={() => setPaymentMethod('saldo')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'saldo'
                      ? 'bg-cyan-950/70 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                    <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Saldo Akun Ibad Store</span>
                  </div>
                  {user ? (
                    <p className="text-[11px] text-slate-400">
                      Saldo Anda: Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-400">Masuk akun untuk gunakan saldo</p>
                  )}
                </button>

                <button
                  type="button"
                  id="bill-pay-qris"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'bg-cyan-950/70 border-cyan-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs mb-1">QRIS (Semua Bank &amp; E-Wallet)</div>
                  <p className="text-[10px] text-slate-400">Scan QRIS dari Mobile Banking atau E-Wallet</p>
                </button>
              </div>
            </div>

            {/* Pay Action Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="btn-confirm-pay-bill"
                type="button"
                onClick={handlePayBill}
                disabled={loadingPay}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loadingPay ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>Mengeksekusi Pembayaran Tagihan...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      Bayar Tagihan Sekarang (Rp {Number(inquiryResult.total_tagihan || 0).toLocaleString('id-ID')})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
