import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Wallet,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  Lock,
  Receipt,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { User, TransactionRecord, DepositOrder } from '../types.js';

interface UserDashboardProps {
  user: User;
  onOpenDeposit: () => void;
  onViewInvoice: (tx: TransactionRecord) => void;
  onRefreshUser: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onOpenDeposit,
  onViewInvoice,
  onRefreshUser,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'deposits' | 'security'>('transactions');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const res = await api.getOrderHistory();
        if (res.status && Array.isArray(res.data)) {
          setTransactions(res.data);
        }
      } else if (activeTab === 'deposits') {
        const res = await api.getDepositHistory();
        if (res.status && Array.isArray(res.data)) {
          setDeposits(res.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    if (!/^\d{6}$/.test(pinInput)) {
      setPinMessage({ type: 'error', text: 'PIN harus berupa 6 angka rahasia.' });
      return;
    }

    try {
      const res = await api.setPin(pinInput);
      if (res.status) {
        setPinMessage({ type: 'success', text: 'PIN Transaksi Keamanan berhasil diperbarui!' });
        setPinInput('');
        onRefreshUser();
      } else {
        setPinMessage({ type: 'error', text: res.message || 'Gagal menyimpan PIN.' });
      }
    } catch (err) {
      setPinMessage({ type: 'error', text: 'Terjadi kendala sistem.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* User Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-2xl shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{user.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-bold uppercase">
                  {user.role === 'admin' ? 'Super Admin' : 'Member Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">@{user.username} • {user.email}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Enkripsi 256-bit Aktif</span>
                </span>
                <span>•</span>
                <span>HP: {user.phone}</span>
              </div>
            </div>
          </div>

          {/* Saldo Pill & Topup Button */}
          <div className="w-full sm:w-auto bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between sm:justify-start gap-4">
            <div>
              <p className="text-[10px] text-slate-400">Total Saldo Akun</p>
              <p className="text-lg font-extrabold text-cyan-400 font-mono">
                Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <button
              id="dashboard-btn-deposit"
              onClick={onOpenDeposit}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Isi Saldo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          id="tab-dash-trx"
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'transactions'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Riwayat Transaksi</span>
        </button>

        <button
          id="tab-dash-dep"
          type="button"
          onClick={() => setActiveTab('deposits')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'deposits'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Riwayat Deposit</span>
        </button>

        <button
          id="tab-dash-sec"
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'security'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Pengaturan PIN &amp; Keamanan</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {/* TAB 1: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Daftar Transaksi Terakhir</h3>
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p>Belum ada riwayat transaksi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-medium">Reff ID / Invoice</th>
                      <th className="pb-3 font-medium">Layanan</th>
                      <th className="pb-3 font-medium">Tujuan</th>
                      <th className="pb-3 font-medium">Total Harga</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.map((tx) => (
                      <tr key={tx.reff_id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-mono text-cyan-400 font-semibold">{tx.reff_id}</td>
                        <td className="py-3 font-medium text-white">{tx.layanan}</td>
                        <td className="py-3 font-mono text-slate-300">{tx.target}</td>
                        <td className="py-3 font-mono text-white">Rp {Number(tx?.price || 0).toLocaleString('id-ID')}</td>
                        <td className="py-3">
                          {tx.status === 'success' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                              Sukses
                            </span>
                          ) : tx.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-rose-950 border border-rose-800 text-rose-400 text-[10px] font-bold">
                              Gagal
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onViewInvoice(tx)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Struk
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Riwayat Pengisian Saldo (Deposit)</h3>
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {deposits.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p>Belum ada riwayat deposit saldo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-medium">ID Tiket</th>
                      <th className="pb-3 font-medium">Metode</th>
                      <th className="pb-3 font-medium">Nominal Transfer</th>
                      <th className="pb-3 font-medium">Saldo Diterima</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-mono text-cyan-400 font-semibold">{dep.reff_id}</td>
                        <td className="py-3 font-semibold text-white">{dep.metode || 'QRIS'}</td>
                        <td className="py-3 font-mono text-white">Rp {Number(dep?.nominal || 0).toLocaleString('id-ID')}</td>
                        <td className="py-3 font-mono text-emerald-400 font-bold">
                          Rp {Number(dep?.get_balance || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3">
                          {dep.status === 'success' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                              Berhasil Masuk
                            </span>
                          ) : dep.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-bold">
                              Menunggu
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                              Batal
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">
                          {new Date(dep.created_at).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SECURITY & PIN SETTINGS */}
        {activeTab === 'security' && (
          <div className="max-w-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Keamanan Transaksi &amp; PIN</h3>
              <p className="text-xs text-slate-400">
                Lindungi saldo akun Anda dari transaksi tidak sah dengan mengaktifkan 6 Digit PIN Keamanan.
              </p>
            </div>

            {pinMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  pinMessage.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800 text-rose-300'
                }`}
              >
                {pinMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{pinMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSetPin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {user.hasPin ? 'Ganti 6 Digit PIN Transaksi' : 'Buat 6 Digit PIN Transaksi Baru'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-user-pin"
                    type="password"
                    maxLength={6}
                    placeholder="Masukkan 6 angka rahasia"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono tracking-widest"
                  />
                </div>
              </div>

              <button
                id="btn-save-pin"
                type="submit"
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {user.hasPin ? 'Perbarui PIN Transaksi' : 'Aktifkan PIN Transaksi'}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Status Enkripsi Akun Anda</span>
              </p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Password dilindungi hashing PBKDF2-SHA512 (100.000 iterasi)</li>
                <li>• Session token ditandatangani secara kriptografis HMAC-SHA256</li>
                <li>• Riwayat transaksi terlindungi dengan perlindungan Anti-Injection WAF</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
