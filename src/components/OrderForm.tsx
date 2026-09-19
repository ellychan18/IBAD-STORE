import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Wallet,
  QrCode,
  Building2,
  Lock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { ProductItem, User, TransactionRecord } from '../types.js';

interface OrderFormProps {
  product: ProductItem | null;
  allProducts: ProductItem[];
  user: User | null;
  onClose: () => void;
  onSuccessOrder: (transaction: TransactionRecord) => void;
  onOpenDeposit: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  product,
  allProducts,
  user,
  onClose,
  onSuccessOrder,
  onOpenDeposit,
  onOpenAuth,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(product);
  const [targetId, setTargetId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'qris' | 'bank' | 'va'>('saldo');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedProduct(product);
  }, [product]);

  if (!selectedProduct) return null;

  // Filter sibling products from same provider
  const siblingProducts = allProducts.filter(
    (p) => p.provider === selectedProduct.provider && !p.isPostpaid
  );

  const price = selectedProduct.sellPrice || selectedProduct.price;
  const prodCategory = String(selectedProduct.category || '').toLowerCase();
  const prodProvider = String(selectedProduct.provider || '').toLowerCase();

  const isGameWithZone =
    prodCategory.includes('game') &&
    (prodProvider.includes('mobile legends') ||
      prodProvider.includes('genshin'));

  const isPln = prodCategory.includes('pln');
  const isPulsa = prodCategory.includes('pulsa') || prodCategory.includes('e-money');

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetId.trim()) {
      setError(
        isPln
          ? 'Masukkan No. Meter / ID Pelanggan PLN.'
          : isPulsa
          ? 'Masukkan Nomor HP tujuan.'
          : 'Masukkan User ID akun game.'
      );
      return;
    }

    if (isGameWithZone && !zoneId.trim()) {
      setError('Masukkan Server / Zone ID akun.');
      return;
    }

    if (paymentMethod === 'saldo') {
      if (!user) {
        onOpenAuth('login');
        return;
      }
      if ((user.balance || 0) < price) {
        setError(`Saldo akun tidak mencukupi (Saldo: Rp ${Number(user?.balance || 0).toLocaleString('id-ID')}). Silakan isi saldo deposit terlebih dahulu.`);
        return;
      }
      if (user.hasPin && !pin) {
        setError('Masukkan 6 digit PIN Transaksi Keamanan Anda.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.createOrder({
        code: selectedProduct.code,
        target: targetId.trim(),
        zone: zoneId.trim() || undefined,
        payment_method: paymentMethod,
        pin: pin || undefined,
      });

      if (res.status && res.data) {
        onSuccessOrder(res.data);
      } else {
        setError(res.message || 'Gagal memproses transaksi.');
      }
    } catch (err: any) {
      setError('Terjadi kendala sistem. Permintaan terproteksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Formulir Pemesanan Aman</h3>
              <p className="text-[11px] text-cyan-400 font-mono">Layanan: {selectedProduct.provider}</p>
            </div>
          </div>

          <button
            id="btn-close-order-form"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Target Identification */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono">1</span>
                <span>
                  {isPln ? 'Nomor Meter / ID Pelanggan PLN' : isPulsa ? 'Nomor HP Tujuan' : 'Data Akun Game Tujuan'}
                </span>
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Anti-Injection Filtered</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={isGameWithZone ? 'sm:col-span-2' : 'sm:col-span-3'}>
                <input
                  id="order-input-target"
                  type="text"
                  placeholder={
                    isPln
                      ? 'Contoh: 14238910291'
                      : isPulsa
                      ? 'Contoh: 081234567890'
                      : 'Masukkan User ID (Contoh: 12345678)'
                  }
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              {isGameWithZone && (
                <div>
                  <input
                    id="order-input-zone"
                    type="text"
                    placeholder="Zone ID (2045)"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/80 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                </div>
              )}
            </div>

            {selectedProduct.note && (
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{selectedProduct.note}</span>
              </p>
            )}
          </div>

          {/* STEP 2: Denomination Picker */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono">2</span>
              <span>Pilih Nominal / Paket</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {siblingProducts.map((p) => {
                const isSelected = selectedProduct.code === p.code;
                const pPrice = p.sellPrice || p.price;
                return (
                  <button
                    key={p.code}
                    id={`denom-select-${p.code}`}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                    </div>
                    <span className="text-xs font-extrabold text-cyan-400 font-mono">
                      Rp {Number(pPrice || 0).toLocaleString('id-ID')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Payment Method Selection */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono">3</span>
              <span>Metode Pembayaran</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Saldo Akun */}
              <button
                type="button"
                id="pay-method-saldo"
                onClick={() => setPaymentMethod('saldo')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'saldo'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Saldo Akun Ibad Store</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800">
                    Bebas Biaya (0%)
                  </span>
                </div>
                {user ? (
                  <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                    <span>Saldo Tersedia:</span>
                    <span className="font-bold text-white font-mono">
                      Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-400">Harus masuk akun untuk menggunakan saldo</p>
                )}
              </button>

              {/* QRIS Standar */}
              <button
                type="button"
                id="pay-method-qris"
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  paymentMethod === 'qris'
                    ? 'bg-cyan-950/70 border-cyan-400 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>QRIS (Semua Bank &amp; E-Wallet)</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                    Biaya 0.7%
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Scan via DANA, GoPay, OVO, ShopeePay, BCA, Livin</p>
              </button>
            </div>

            {/* PIN Verification if using Saldo and PIN is configured */}
            {paymentMethod === 'saldo' && user && user.hasPin && (
              <div className="pt-2">
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  PIN Transaksi Keamanan (6 Digit)
                </label>
                <div className="relative max-w-xs">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="order-input-pin"
                    type="password"
                    maxLength={6}
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono tracking-widest"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Order Summary & Action */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-slate-400">Total Pembayaran</p>
            <p className="text-lg font-extrabold text-cyan-400 font-mono">
              Rp {Number(price || 0).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="btn-cancel-order"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-submit-order"
              type="button"
              onClick={handleSubmitOrder}
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Enkripsi &amp; Proses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Beli &amp; Bayar Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
