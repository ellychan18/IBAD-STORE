import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Gamepad2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Database,
  ArrowUpRight,
  Sliders,
  DollarSign,
  AlertTriangle,
  Lock,
  ChevronRight,
  FileText,
  UserCheck,
  TrendingUp,
  Server,
  Zap,
  Building2,
  ArrowRightLeft,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { User, TransactionRecord, DepositOrder, ProductItem, SecurityAuditLog } from '../types.js';
import { AtlanticTransferHub } from './AtlanticTransferHub.js';

interface AdminPanelProps {
  adminUser: User;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ adminUser, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'transfer' | 'metrics' | 'transactions' | 'deposits' | 'users' | 'products' | 'security'>('transfer');
  
  // Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [deposits, setDeposits] = useState<DepositOrder[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditLog[]>([]);
  const [gatewayInfo, setGatewayInfo] = useState<any>(null);

  // Filters & Search
  const [loading, setLoading] = useState(false);
  const [txFilter, setTxFilter] = useState<string>('all');
  const [txSearch, setTxSearch] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [productCategory, setProductCategory] = useState<string>('all');

  // Modals & Actions
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<User | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [selectedTxForEdit, setSelectedTxForEdit] = useState<TransactionRecord | null>(null);
  const [editTxStatus, setEditTxStatus] = useState<TransactionRecord['status']>('success');
  const [editTxSn, setEditTxSn] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [mRes, tRes, dRes, uRes, pRes, sRes, gRes] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminTransactions(),
        api.getAdminDeposits(),
        api.getAdminUsers(),
        api.getProducts(),
        api.getAdminSecurityLogs(),
        api.getAdminGatewayBalance(),
      ]);

      if (mRes.status && mRes.data) setMetrics(mRes.data);
      if (tRes.status && Array.isArray(tRes.data)) setTransactions(tRes.data);
      if (dRes.status && Array.isArray(dRes.data)) setDeposits(dRes.data);
      if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
      if (pRes.status && Array.isArray(pRes.data)) setProductsList(pRes.data);
      if (sRes.status && Array.isArray(sRes.data)) setSecurityLogs(sRes.data);
      if (gRes.status) setGatewayInfo(gRes);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGateway = async () => {
    setLoading(true);
    try {
      const res = await api.syncProducts();
      if (res.status) {
        showToast(res.message || 'Sinkronisasi layanan Atlantic H2H berhasil.');
        const pRes = await api.getProducts();
        if (pRes.status && Array.isArray(pRes.data)) setProductsList(pRes.data);
      } else {
        showToast('Sinkronisasi selesai: ' + res.message);
      }
    } catch (err: any) {
      showToast('Gagal sinkronisasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await api.actionAdminDeposit({ id, action });
      if (res.status) {
        showToast(res.message || `Deposit berhasil di-${action}`);
        const dRes = await api.getAdminDeposits();
        if (dRes.status && Array.isArray(dRes.data)) setDeposits(dRes.data);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      }
    } catch (err: any) {
      showToast('Gagal memproses deposit: ' + err.message);
    }
  };

  const handleSaveUserBalance = async () => {
    if (!selectedUserForBalance || newBalanceInput === '') return;
    try {
      const res = await api.updateAdminUserBalance({
        userId: selectedUserForBalance.id,
        newBalance: Number(newBalanceInput),
      });
      if (res.status) {
        showToast(res.message || 'Saldo berhasil diubah.');
        setSelectedUserForBalance(null);
        setNewBalanceInput('');
        const uRes = await api.getAdminUsers();
        if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
      }
    } catch (e: any) {
      showToast('Gagal mengubah saldo: ' + e.message);
    }
  };

  const handleToggleUserRole = async (user: User) => {
    if (user.username === 'ibad18') {
      showToast('Akun ibad18 adalah Master Administrator tunggal dan tidak dapat diubah rolenya.');
      return;
    }
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await api.updateAdminUserRole({ userId: user.id, role: nextRole });
      if (res.status) {
        showToast(`Role ${user.name} berhasil diubah menjadi ${nextRole.toUpperCase()}`);
        const uRes = await api.getAdminUsers();
        if (uRes.status && Array.isArray(uRes.data)) setUsersList(uRes.data);
      }
    } catch (e: any) {
      showToast('Gagal mengubah role: ' + e.message);
    }
  };

  const handleSaveTxStatus = async () => {
    if (!selectedTxForEdit) return;
    try {
      const res = await api.updateAdminTransactionStatus({
        id: selectedTxForEdit.reff_id || selectedTxForEdit.id,
        status: editTxStatus,
        sn: editTxSn || undefined,
      });
      if (res.status) {
        showToast(res.message || 'Status transaksi berhasil diperbarui.');
        setSelectedTxForEdit(null);
        const tRes = await api.getAdminTransactions();
        if (tRes.status && Array.isArray(tRes.data)) setTransactions(tRes.data);
      }
    } catch (e: any) {
      showToast('Gagal update transaksi: ' + e.message);
    }
  };

  // Filtered transactions
  const filteredTxs = transactions.filter((tx) => {
    if (!tx) return false;
    const matchStatus = txFilter === 'all' || tx.status === txFilter;
    const q = String(txSearch || '').toLowerCase().trim();
    const id = String(tx.id || '').toLowerCase();
    const reffId = String(tx.reff_id || '').toLowerCase();
    const layanan = String(tx.layanan || '').toLowerCase();
    const target = String(tx.target || '').toLowerCase();
    const custName = String(tx.customer_name || '').toLowerCase();
    const matchSearch =
      !q ||
      id.includes(q) ||
      reffId.includes(q) ||
      layanan.includes(q) ||
      target.includes(q) ||
      custName.includes(q);
    return matchStatus && matchSearch;
  });

  // Filtered users - STRICT SINGLE ADMIN ibad18 & Real Users Only
  const filteredUsers = usersList
    .filter((u) => {
      if (!u) return false;
      const username = String(u.username || '').toLowerCase();
      // Purge any dummy demo accounts from UI display
      const dummyUsernames = ['admin', 'demo_admin', 'member', 'demo_member', 'demo'];
      if (username && dummyUsernames.includes(username)) {
        return false;
      }
      return true;
    })
    .filter((u) => {
      if (!u) return false;
      const q = String(userSearch || '').toLowerCase().trim();
      const username = String(u.username || '').toLowerCase();
      const name = String(u.name || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const phone = String(u.phone || '').toLowerCase();
      return (
        !q ||
        username.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      );
    });

  // Filtered products
  const categories = ['all', ...Array.from(new Set(productsList.map((p) => p.category).filter(Boolean)))];
  const filteredProducts = productsList.filter((p) => productCategory === 'all' || p.category === productCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-950 border border-cyan-500/80 text-cyan-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-cyan-900/60 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-800 text-cyan-400 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>PORTAL MASTER ADMINISTRATOR &amp; AUDIT MONITOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pusat Kontrol &amp; Pengawasan Ibad Store
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Database MongoDB Atlas Realtime &amp; Gateway Atlantic H2H (Logged in as: <span className="text-cyan-400 font-semibold">{adminUser.name}</span>)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="admin-btn-refresh-all"
              onClick={loadAllData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/80 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Segarkan Data</span>
            </button>

            <button
              id="admin-btn-sync-gateway"
              onClick={handleSyncGateway}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sinkron Atlantic H2H</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Transaksi Sukses</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            Rp {(metrics?.totalTurnover || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{metrics?.totalSuccessTx || 0} Transaksi Selesai</span>
          </div>
        </div>

        {/* Total Orders Count */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Semua Pesanan Masuk</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.totalTransactions || transactions.length}
          </div>
          <div className="text-[11px] text-slate-400">
            Realtime order feed di database
          </div>
        </div>

        {/* Registered Users */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Pengguna Terdaftar</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.totalUsers || usersList.length} Akun
          </div>
          <div className="text-[11px] text-indigo-400">
            Tersimpan aman di MongoDB
          </div>
        </div>

        {/* Gateway Atlantic Balance */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Gateway Atlantic H2H</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-cyan-300">
            {gatewayInfo?.statusGateway || 'ONLINE'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Latency: {gatewayInfo?.latencyMs || 24} ms</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          id="admin-tab-transfer"
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'transfer'
              ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/80 text-cyan-400 hover:bg-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Atlantic H2H Transfer &amp; Bank Hub</span>
        </button>

        <button
          id="admin-tab-txs"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Monitoring Transaksi ({transactions.length})</span>
        </button>

        <button
          id="admin-tab-deposits"
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'deposits'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Verifikasi Deposit ({deposits.filter((d) => d.status === 'pending').length} Pending)</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pengguna MongoDB ({filteredUsers.length})</span>
        </button>

        <button
          id="admin-tab-products"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Katalog Layanan ({productsList.length})</span>
        </button>

        <button
          id="admin-tab-security"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>WAF Incident Logs ({securityLogs.length})</span>
        </button>
      </div>

      {/* ================= TAB 0: ATLANTIC TRANSFER & BANK HUB ================= */}
      {activeTab === 'transfer' && (
        <AtlanticTransferHub />
      )}

      {/* ================= TAB 1: TRANSACTIONS ================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-tx-search"
                type="text"
                placeholder="Cari Invoice, Reff ID, Nomor HP, Target..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'pending', 'success', 'failed'].map((st) => (
                <button
                  key={st}
                  id={`admin-tx-filter-${st}`}
                  onClick={() => setTxFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                    txFilter === st
                      ? 'bg-cyan-950 border border-cyan-500 text-cyan-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'all' ? 'Semua Status' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Waktu &amp; Invoice</th>
                  <th className="px-4 py-3">Layanan / Produk</th>
                  <th className="px-4 py-3">Target / ID</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Serial Number (SN)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada transaksi yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((tx, idx) => (
                    <tr key={`admin-tx-${tx.reff_id || tx.id || idx}-${idx}`} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-mono text-cyan-400 font-bold">{tx.reff_id}</div>
                        <div className="text-[10px] text-slate-500">
                          {tx?.created_at ? new Date(tx.created_at).toLocaleString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-semibold text-white">{tx.layanan}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{tx.code}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-200">
                        {tx.target}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-white">
                        Rp {Number(tx?.price || 0).toLocaleString('id-ID')}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {tx.payment_method === 'saldo' ? 'Saldo Akun' : 'Direct'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300 max-w-xs truncate">
                        {tx.sn || <span className="text-slate-600">-</span>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.status === 'success'
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                              : tx.status === 'pending'
                              ? 'bg-amber-950 border border-amber-800 text-amber-400'
                              : 'bg-rose-950 border border-rose-800 text-rose-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          id={`admin-btn-edit-tx-${tx.reff_id}`}
                          onClick={() => {
                            setSelectedTxForEdit(tx);
                            setEditTxStatus(tx.status);
                            setEditTxSn(tx.sn || '');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer transition-all"
                        >
                          Ubah
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DEPOSITS ================= */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">ID Tiket &amp; Waktu</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Metode Bayar</th>
                  <th className="px-4 py-3">Nominal Transfer</th>
                  <th className="px-4 py-3">Saldo Diterima</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Belum ada riwayat deposit yang tercatat.
                    </td>
                  </tr>
                ) : (
                  deposits.map((dep, idx) => (
                    <tr key={`admin-dep-${dep.id || dep.reff_id || idx}-${idx}`} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-mono text-cyan-400 font-bold">{dep.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {dep?.created_at ? new Date(dep.created_at).toLocaleString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {dep.userId || 'Guest'}
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-white">
                        {dep.metode || dep.bank || 'QRIS'}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-amber-400">
                        Rp {Number(dep?.nominal || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-emerald-400">
                        Rp {Number(dep?.get_balance || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            dep.status === 'success'
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                              : dep.status === 'pending'
                              ? 'bg-amber-950 border border-amber-800 text-amber-400'
                              : 'bg-rose-950 border border-rose-800 text-rose-400'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {dep.status === 'pending' && (
                          <>
                            <button
                              id={`admin-btn-approve-dep-${dep.id}`}
                              onClick={() => handleDepositAction(dep.id, 'approve')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Setujui
                            </button>
                            <button
                              id={`admin-btn-reject-dep-${dep.id}`}
                              onClick={() => handleDepositAction(dep.id, 'reject')}
                              className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {dep.status === 'success' && (
                          <span className="text-[11px] text-emerald-400 font-semibold">Telah Terkredit</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: USERS ================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-user-search"
                type="text"
                placeholder="Cari Username, Nama, Email, No. HP..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Total: <span className="text-white font-bold">{filteredUsers.length}</span> Pengguna
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Akun &amp; Username</th>
                  <th className="px-4 py-3">Email &amp; WhatsApp</th>
                  <th className="px-4 py-3">Saldo Akun</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">PIN Keamanan</th>
                  <th className="px-4 py-3 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u, idx) => (
                  <tr key={`admin-usr-${u.id || u.username || idx}-${idx}`} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="font-mono text-cyan-400 text-[11px]">@{u.username}</div>
                    </td>

                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="text-slate-300">{u.email}</div>
                      <div className="text-[11px] text-slate-500">{u.phone}</div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-emerald-400">
                      Rp {Number(u?.balance || 0).toLocaleString('id-ID')}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.username === 'ibad18' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300">
                          👑 MASTER ADMIN
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === 'admin'
                              ? 'bg-rose-950 border border-rose-800 text-rose-400'
                              : 'bg-slate-800 border border-slate-700 text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.hasPin ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif (6 Digit)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Belum disetel</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        id={`admin-btn-edit-balance-${u.id}`}
                        onClick={() => {
                          setSelectedUserForBalance(u);
                          setNewBalanceInput(String(u.balance));
                        }}
                        className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                      >
                        Atur Saldo
                      </button>

                      {u.username !== 'ibad18' && (
                        <button
                          id={`admin-btn-toggle-role-${u.id}`}
                          onClick={() => handleToggleUserRole(u)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer transition-all"
                        >
                          {u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PRODUCTS ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {categories.map((cat, idx) => (
                <button
                  key={`admin-cat-${cat || 'all'}-${idx}`}
                  id={`admin-prod-cat-${cat}`}
                  onClick={() => setProductCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                    productCategory === cat
                      ? 'bg-cyan-950 border border-cyan-500 text-cyan-400'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              Total: <span className="text-cyan-400 font-bold">{filteredProducts.length}</span> Layanan Live
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((p, idx) => (
              <div
                key={`admin-prod-${p.code || p.name || 'item'}-${idx}`}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1.5 line-clamp-1">{p.name}</h3>
                    <span className="font-mono text-xs text-slate-400">Kode: {p.code}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      p.status === 'available' || p.status === 'aktif'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-500">Harga Modal H2H</div>
                    <div className="font-mono text-slate-300">Rp {Number(p?.price || 0).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-400">Harga Jual User</div>
                    <div className="font-mono font-bold text-cyan-400">
                      Rp {Number(p?.sellPrice || p?.price || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: SECURITY LOGS ================= */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Incident ID &amp; Waktu</th>
                  <th className="px-4 py-3">Jenis Ancaman</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Endpoint Target</th>
                  <th className="px-4 py-3">IP Sumber</th>
                  <th className="px-4 py-3 text-right">Tindakan WAF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {securityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Sistem aman. Belum ada aktivitas ancaman mencurigakan terdeteksi.
                    </td>
                  </tr>
                ) : (
                  securityLogs.map((log, idx) => (
                    <tr key={`admin-sec-${log.id || log.incidentId || idx}-${idx}`} className="hover:bg-slate-850/50 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-cyan-400 font-semibold">
                        <div>{log.incidentId}</div>
                        <div className="text-[10px] text-slate-500 font-sans">
                          {log?.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-rose-400">
                        {log.threatType}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-950 border border-rose-800 text-rose-300">
                          {log.severity}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {log.endpoint}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {log.ip}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                        {log.actionTaken}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER BALANCE ================= */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <span>Atur Saldo Pengguna</span>
              </h3>
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="text-slate-400">Nama Pengguna:</div>
              <div className="font-bold text-white text-sm">{selectedUserForBalance.name} (@{selectedUserForBalance.username})</div>
              <div className="text-slate-500">{selectedUserForBalance.email}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nominal Saldo Baru (Rp):</label>
              <input
                id="admin-input-new-balance"
                type="number"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="Contoh: 150000"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-save-balance"
                onClick={handleSaveUserBalance}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Simpan Saldo ke MongoDB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT TRANSACTION ================= */}
      {selectedTxForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Ubah Status Transaksi</span>
              </h3>
              <button
                onClick={() => setSelectedTxForEdit(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="font-mono text-cyan-400 font-bold">{selectedTxForEdit.reff_id}</div>
              <div className="font-semibold text-white">{selectedTxForEdit.layanan}</div>
              <div className="text-slate-400">Target: {selectedTxForEdit.target}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status Pesanan:</label>
              <select
                id="admin-select-tx-status"
                value={editTxStatus}
                onChange={(e) => setEditTxStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="success">SUCCESS (Berhasil)</option>
                <option value="pending">PENDING (Sedang Diproses)</option>
                <option value="failed">FAILED (Gagal)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Serial Number (SN) / Token / Voucher:</label>
              <input
                id="admin-input-tx-sn"
                type="text"
                value={editTxSn}
                onChange={(e) => setEditTxSn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="Contoh: 1234-5678-9012-3456"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTxForEdit(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-save-tx"
                onClick={handleSaveTxStatus}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
