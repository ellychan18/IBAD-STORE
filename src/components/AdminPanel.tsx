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
  Trash2,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { User, TransactionRecord, DepositOrder, ProductItem, SecurityAuditLog } from '../types.js';
import { AtlanticTransferHub } from './AtlanticTransferHub.js';
import { AdminChartsView } from './AdminChartsView.js';

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

  const handleClearTransactions = async () => {
    try {
      const res = await api.clearAdminTransactions();
      if (res.status) {
        showToast('Seluruh riwayat monitor transaksi berhasil dibersihkan.');
        setTransactions([]);
        const mRes = await api.getAdminMetrics();
        if (mRes.status && mRes.data) setMetrics(mRes.data);
      }
    } catch (e: any) {
      showToast('Gagal membersihkan transaksi: ' + e.message);
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
      const email = String(u.email || '').toLowerCase();
      if (email === 'ibadcode.id@gmail.com') return false;
      const dummyUsernames = ['admin', 'demo_admin', 'member', 'demo_member', 'demo', 'ibadadmin'];
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
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Banner - Bright & Clean Modern Style */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              <span>PORTAL MASTER ADMINISTRATOR &amp; AUDIT MONITOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pusat Kontrol &amp; Pengawasan Ibad Store
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Database MongoDB Atlas Realtime &amp; Gateway Atlantic H2H (Logged in as: <span className="text-indigo-600 font-bold">{adminUser.name}</span>)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="admin-btn-refresh-all"
              onClick={loadAllData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Segarkan Data</span>
            </button>

            <button
              id="admin-btn-sync-gateway"
              onClick={handleSyncGateway}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sinkron Atlantic H2H</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid - Bright & Crisp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Transaksi Sukses</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            Rp {(metrics?.totalTurnover || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{metrics?.totalSuccessTx || 0} Transaksi Selesai</span>
          </div>
        </div>

        {/* Total Orders Count */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Semua Pesanan Masuk</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.totalTransactions || transactions.length}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Realtime order feed di database
          </div>
        </div>

        {/* Registered Users */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Pengguna Terdaftar</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.totalUsers || usersList.length} Akun
          </div>
          <div className="text-[11px] text-indigo-600 font-bold">
            Tersimpan aman di MongoDB
          </div>
        </div>

        {/* Gateway Atlantic Balance */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Saldo Live Atlantic H2H</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600">
            Rp {Number(gatewayInfo?.balance ?? 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-emerald-700">{gatewayInfo?.statusGateway || 'ACTIVE'}</span>
            </div>
            <span>{gatewayInfo?.latencyMs ? `${gatewayInfo.latencyMs} ms` : 'Live H2H'}</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs - Bright Clean Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          id="admin-tab-metrics"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'metrics'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Diagram &amp; Analitik</span>
        </button>

        <button
          id="admin-tab-transfer"
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'transfer'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Atlantic H2H Transfer &amp; Bank Hub</span>
        </button>

        <button
          id="admin-tab-txs"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Monitoring Transaksi ({transactions.length})</span>
        </button>

        <button
          id="admin-tab-deposits"
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'deposits'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Verifikasi Deposit ({deposits.filter((d) => d.status === 'pending').length} Pending)</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pengguna MongoDB ({filteredUsers.length})</span>
        </button>

        <button
          id="admin-tab-products"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Katalog Layanan ({productsList.length})</span>
        </button>

        <button
          id="admin-tab-security"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          <span>WAF Incident Logs ({securityLogs.length})</span>
        </button>
      </div>

      {/* ================= TAB -1: METRICS & DIAGRAMS ================= */}
      {activeTab === 'metrics' && (
        <AdminChartsView
          transactions={transactions}
          deposits={deposits}
          totalUsers={usersList.length}
        />
      )}

      {/* ================= TAB 0: ATLANTIC TRANSFER & BANK HUB ================= */}
      {activeTab === 'transfer' && (
        <AtlanticTransferHub />
      )}

      {/* ================= TAB 1: TRANSACTIONS ================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-tx-search"
                type="text"
                placeholder="Cari Invoice, Reff ID, Nomor HP, Target..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>

            {/* Status Filter & Actions */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['all', 'pending', 'success', 'failed'].map((st) => (
                  <button
                    key={st}
                    id={`admin-tx-filter-${st}`}
                    onClick={() => setTxFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                      txFilter === st
                        ? 'bg-white text-indigo-700 font-black shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'Semua Status' : st}
                  </button>
                ))}
              </div>

              {transactions.length > 0 && (
                <button
                  id="admin-btn-clear-txs"
                  onClick={handleClearTransactions}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  title="Hapus riwayat pesanan"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Kosongkan Riwayat</span>
                </button>
              )}
            </div>
          </div>

          {/* Transactions Table - Bright Style */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Activity className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-sm font-bold text-slate-800">
                          Belum ada pesanan masuk
                        </div>
                        <p className="text-xs text-slate-500">
                          Data pesanan/transaksi baru dari pelanggan akan otomatis tercatat dan muncul di sini secara real-time.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((tx, idx) => (
                    <tr key={`admin-tx-${tx.reff_id || tx.id || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-mono text-indigo-600 font-bold">{tx.reff_id}</div>
                        <div className="text-[10px] text-slate-400">
                          {tx?.created_at ? new Date(tx.created_at).toLocaleString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-bold text-slate-900">{tx.layanan}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{tx.code}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                        {tx.target}
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900">
                        Rp {Number(tx?.price || 0).toLocaleString('id-ID')}
                        <div className="text-[10px] text-slate-500 font-normal">
                          {tx.payment_method === 'saldo' ? 'Saldo Akun' : 'Direct'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {tx.sn || <span className="text-slate-400">-</span>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            tx.status === 'success'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 border border-amber-200 text-amber-700'
                              : 'bg-rose-50 border border-rose-200 text-rose-700'
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer transition-all"
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
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Belum ada riwayat deposit yang tercatat.
                    </td>
                  </tr>
                ) : (
                  deposits.map((dep, idx) => (
                    <tr key={`admin-dep-${dep.id || dep.reff_id || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="font-mono text-indigo-600 font-bold">{dep.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {dep?.created_at ? new Date(dep.created_at).toLocaleString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-600">
                        {dep.userId || 'Guest'}
                      </td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {dep.metode || dep.bank || 'QRIS'}
                      </td>

                      <td className="px-4 py-3.5 font-black text-amber-600">
                        Rp {Number(dep?.nominal || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5 font-black text-emerald-600">
                        Rp {Number(dep?.get_balance || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            dep.status === 'success'
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                              : dep.status === 'pending'
                              ? 'bg-amber-50 border border-amber-200 text-amber-700'
                              : 'bg-rose-50 border border-rose-200 text-rose-700'
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
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                            >
                              Setujui
                            </button>
                            <button
                              id={`admin-btn-reject-dep-${dep.id}`}
                              onClick={() => handleDepositAction(dep.id, 'reject')}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {dep.status === 'success' && (
                          <span className="text-[11px] text-emerald-600 font-bold">Telah Terkredit</span>
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
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-user-search"
                type="text"
                placeholder="Cari Username, Nama, Email, No. HP..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total: <span className="text-slate-900 font-black">{filteredUsers.length}</span> Pengguna
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Akun &amp; Username</th>
                  <th className="px-4 py-3">Email &amp; WhatsApp</th>
                  <th className="px-4 py-3">Saldo Akun</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">PIN Keamanan</th>
                  <th className="px-4 py-3 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u, idx) => (
                  <tr key={`admin-usr-${u.id || u.username || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="font-mono text-indigo-600 text-[11px] font-bold">@{u.username}</div>
                    </td>

                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="text-slate-800">{u.email}</div>
                      <div className="text-[11px] text-slate-500">{u.phone}</div>
                    </td>

                    <td className="px-4 py-3.5 font-black text-emerald-600">
                      Rp {Number(u?.balance || 0).toLocaleString('id-ID')}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.username === 'ibad18' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 border border-amber-200 text-amber-700">
                          👑 MASTER ADMIN
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            u.role === 'admin'
                              ? 'bg-rose-50 border border-rose-200 text-rose-700'
                              : 'bg-slate-100 border border-slate-200 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {u.hasPin ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Aktif (6 Digit)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum disetel</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        id={`admin-btn-edit-balance-${u.id}`}
                        onClick={() => {
                          setSelectedUserForBalance(u);
                          setNewBalanceInput(String(u.balance));
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
                      >
                        Atur Saldo
                      </button>

                      {u.username !== 'ibad18' && (
                        <button
                          id={`admin-btn-toggle-role-${u.id}`}
                          onClick={() => handleToggleUserRole(u)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 cursor-pointer transition-all"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {categories.map((cat, idx) => (
                <button
                  key={`admin-cat-${cat || 'all'}-${idx}`}
                  id={`admin-prod-cat-${cat}`}
                  onClick={() => setProductCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                    productCategory === cat
                      ? 'bg-indigo-50 border border-indigo-300 text-indigo-700'
                      : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Total: <span className="text-indigo-600 font-black">{filteredProducts.length}</span> Layanan Live
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((p, idx) => (
              <div
                key={`admin-prod-${p.code || p.name || 'item'}-${idx}`}
                className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 line-clamp-1">{p.name}</h3>
                    <span className="font-mono text-xs text-slate-400 font-medium">Kode: {p.code}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      p.status === 'available' || p.status === 'aktif'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Harga Modal H2H</div>
                    <div className="font-mono text-slate-700 font-bold">Rp {Number(p?.price || 0).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-600 font-bold">Harga Jual User</div>
                    <div className="font-mono font-black text-indigo-600">
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
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Incident ID &amp; Waktu</th>
                  <th className="px-4 py-3">Jenis Ancaman</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Endpoint Target</th>
                  <th className="px-4 py-3">IP Sumber</th>
                  <th className="px-4 py-3 text-right">Tindakan WAF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {securityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Sistem aman. Belum ada aktivitas ancaman mencurigakan terdeteksi.
                    </td>
                  </tr>
                ) : (
                  securityLogs.map((log, idx) => (
                    <tr key={`admin-sec-${log.id || log.incidentId || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-indigo-600 font-bold">
                        <div>{log.incidentId}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          {log?.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-rose-600">
                        {log.threatType}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 border border-rose-200 text-rose-700">
                          {log.severity}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-700 font-medium">
                        {log.endpoint}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-500">
                        {log.ip}
                      </td>

                      <td className="px-4 py-3.5 text-right font-black text-emerald-600">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <span>Atur Saldo Pengguna</span>
              </h3>
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="text-slate-500">Nama Pengguna:</div>
              <div className="font-bold text-slate-900 text-sm">{selectedUserForBalance.name} (@{selectedUserForBalance.username})</div>
              <div className="text-slate-500">{selectedUserForBalance.email}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nominal Saldo Baru (Rp):</label>
              <input
                id="admin-input-new-balance"
                type="number"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                placeholder="Contoh: 150000"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-save-balance"
                onClick={handleSaveUserBalance}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Simpan Saldo ke MongoDB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT TRANSACTION ================= */}
      {selectedTxForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span>Ubah Status Transaksi</span>
              </h3>
              <button
                onClick={() => setSelectedTxForEdit(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-mono text-indigo-600 font-bold">{selectedTxForEdit.reff_id}</div>
              <div className="font-bold text-slate-900">{selectedTxForEdit.layanan}</div>
              <div className="text-slate-500">Target: {selectedTxForEdit.target}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Status Pesanan:</label>
              <select
                id="admin-select-tx-status"
                value={editTxStatus}
                onChange={(e) => setEditTxStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="success">SUCCESS (Berhasil)</option>
                <option value="pending">PENDING (Sedang Diproses)</option>
                <option value="failed">FAILED (Gagal)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Serial Number (SN) / Token / Voucher:</label>
              <input
                id="admin-input-tx-sn"
                type="text"
                value={editTxSn}
                onChange={(e) => setEditTxSn(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
                placeholder="Contoh: 1234-5678-9012-3456"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTxForEdit(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="admin-btn-save-tx"
                onClick={handleSaveTxStatus}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-500/20 cursor-pointer"
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
