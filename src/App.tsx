import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
} from 'lucide-react';
import { api } from './services/api.js';
import type { User, ProductItem, TransactionRecord } from './types.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { ProductCatalog } from './components/ProductCatalog.js';
import { PromoBannerSlider } from './components/PromoBannerSlider.js';
import { OrderForm } from './components/OrderForm.js';
import { BillInquiry } from './components/BillInquiry.js';
import { DepositModal } from './components/DepositModal.js';
import { OrderTracker } from './components/OrderTracker.js';
import { UserDashboard } from './components/UserDashboard.js';
import { InvoiceModal } from './components/InvoiceModal.js';
import { AdminPanel } from './components/AdminPanel.js';
import { EditProfileModal } from './components/EditProfileModal.js';
import { TopLeaderboard } from './components/TopLeaderboard.js';
import { BottomNav } from './components/BottomNav.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'postpaid' | 'leaderboard' | 'tracker' | 'dashboard' | 'admin'>('catalog');
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<ProductItem | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<TransactionRecord | null>(null);

  // Success Notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check session
    api.getMe().then((res) => {
      if (res.status && res.data) {
        setUser(res.data);
      }
    });

    // Load products pure from database / Atlantic H2H
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.getProducts();
      if (res.status && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    if (activeTab === 'dashboard' || activeTab === 'admin') {
      setActiveTab('catalog');
    }
    showToast('Berhasil keluar dari akun dengan aman.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSuccessOrder = (tx: TransactionRecord) => {
    setSelectedProductForOrder(null);
    setActiveInvoice(tx);
    // Refresh user balance
    api.getMe().then((res) => {
      if (res.status && res.data) setUser(res.data);
    });
    showToast('Transaksi berhasil diproses!');
  };

  const handleSuccessBillPay = (tx: TransactionRecord) => {
    setActiveInvoice(tx);
    api.getMe().then((res) => {
      if (res.status && res.data) setUser(res.data);
    });
    showToast('Pembayaran tagihan pascabayar berhasil!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={handleOpenAuth}
        onOpenDeposit={() => setDepositModalOpen(true)}
        onOpenEditProfile={() => setEditProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-20 md:pb-8">
        {/* Promo Banner Slider with artwork imagery for Catalog View */}
        {activeTab === 'catalog' && (
          <PromoBannerSlider
            onSelectCategory={(cat) => {
              const el = document.getElementById('catalog-search-input');
              if (el) {
                el.focus();
                (el as HTMLInputElement).value = cat;
                el.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }}
            onOpenDeposit={() => setDepositModalOpen(true)}
          />
        )}

        {/* Dynamic Tab Views */}
        {activeTab === 'catalog' && (
          <ProductCatalog
            products={products}
            onSelectProduct={(p) => setSelectedProductForOrder(p)}
            onRefreshProducts={loadProducts}
            loading={loadingProducts}
          />
        )}

        {activeTab === 'postpaid' && (
          <BillInquiry
            user={user}
            onSuccessPay={handleSuccessBillPay}
            onOpenAuth={handleOpenAuth}
            onOpenDeposit={() => setDepositModalOpen(true)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <TopLeaderboard onGoToCatalog={() => setActiveTab('catalog')} />
        )}

        {activeTab === 'tracker' && (
          <OrderTracker onViewInvoice={(tx) => setActiveInvoice(tx)} />
        )}

        {activeTab === 'dashboard' && user && (
          <UserDashboard
            user={user}
            onOpenDeposit={() => setDepositModalOpen(true)}
            onViewInvoice={(tx) => setActiveInvoice(tx)}
            onRefreshUser={() => {
              api.getMe().then((res) => {
                if (res.status && res.data) setUser(res.data);
              });
            }}
          />
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <AdminPanel
            adminUser={user}
            onRefreshData={loadProducts}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onSelectTab={setActiveTab} />

      {/* Mobile Bottom Navigation Bar (iPhone / Android / Tablet) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={handleOpenAuth}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedInUser: User) => {
          setUser(loggedInUser);
          showToast(`Selamat datang kembali, ${loggedInUser.name}!`);
          if (loggedInUser.role === 'admin') {
            setActiveTab('admin');
          }
        }}
      />

      <DepositModal
        isOpen={depositModalOpen}
        user={user}
        onClose={() => setDepositModalOpen(false)}
        onSuccessDeposit={(updatedUser) => {
          setUser(updatedUser);
          const bal = updatedUser && typeof updatedUser.balance === 'number' ? updatedUser.balance.toLocaleString('id-ID') : '0';
          showToast(`Saldo deposit berhasil ditambahkan! Total: Rp ${bal}`);
        }}
        onOpenAuth={handleOpenAuth}
      />

      <OrderForm
        product={selectedProductForOrder}
        allProducts={products}
        user={user}
        onClose={() => setSelectedProductForOrder(null)}
        onSuccessOrder={handleSuccessOrder}
        onOpenDeposit={() => setDepositModalOpen(true)}
        onOpenAuth={handleOpenAuth}
      />

      <InvoiceModal
        transaction={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />

      {user && (
        <EditProfileModal
          user={user}
          isOpen={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          onSuccess={(updated) => {
            setUser(updated);
            showToast('Foto profil dan data akun berhasil diperbarui!');
          }}
        />
      )}
    </div>
  );
}
