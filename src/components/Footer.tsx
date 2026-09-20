import React from 'react';
import { ShieldCheck, CheckCircle2, Shield, Zap, Headphones, Sparkles, Gamepad2 } from 'lucide-react';

interface FooterProps {
  onSelectTab?: (tab: 'catalog' | 'postpaid' | 'tracker' | 'dashboard') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-slate-900 tracking-tight">IBAD STORE</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              Platform top up game terpercaya, voucher resmi, pulsa all operator, paket data, token PLN, serta pembayaran tagihan terlengkap dan tercepat di Indonesia.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Transaksi Aman &amp; Terverifikasi Resmi</span>
            </div>
          </div>

          {/* Supported Services */}
          <div className="space-y-2.5">
            <p className="text-slate-900 font-extrabold tracking-wide uppercase text-[11px]">Kategori Layanan</p>
            <ul className="space-y-1.5 text-slate-600">
              <li>• Top Up Game (MLBB, FF, HoK, Genshin, PUBG)</li>
              <li>• Pulsa &amp; Paket Data (Telkomsel, Indosat, XL, Tri)</li>
              <li>• Token Listrik PLN Prabayar 24 Jam</li>
              <li>• Saldo E-Wallet (DANA, GoPay, OVO, ShopeePay)</li>
              <li>• Tagihan Pasca (PLN, BPJS, PDAM, Internet)</li>
            </ul>
          </div>

          {/* Why Choose Us */}
          <div className="space-y-2.5">
            <p className="text-slate-900 font-extrabold tracking-wide uppercase text-[11px]">Keunggulan Kami</p>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Proses Cepat &amp; Otomatis 1-3 Detik</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Layanan Aktif 24 Jam Nonstop</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Harga Termurah Langsung Jalur Resmi</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Garansi Saldo Masuk 100%</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Layanan Pelanggan Responsif</span>
              </li>
            </ul>
          </div>

          {/* Payment Channels */}
          <div className="space-y-2.5">
            <p className="text-slate-900 font-extrabold tracking-wide uppercase text-[11px]">Metode Pembayaran</p>
            <p className="text-[11px] text-slate-500">
              Mendukung Pembayaran Otomatis 24/7 melalui:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['QRIS', 'BCA', 'BNI VA', 'BRI BRIVA', 'Mandiri VA', 'DANA', 'GoPay', 'OVO', 'ShopeePay'].map((ch) => (
                <span key={ch} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-700 font-bold">
                  {ch}
                </span>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-slate-500 font-medium">Bantuan &amp; Customer Support: support@ibadstore.id</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Ibad Store. Seluruh Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-4">
            <span>Privasi &amp; Keamanan Terjamin 100%</span>
            <span>•</span>
            <span>Server Resmi &amp; Terverifikasi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
