import React, { useState } from 'react';
import {
  Shield,
  Wallet,
  PlusCircle,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  Menu,
  X,
  Sliders,
  Layers,
  ReceiptText,
  Search,
} from 'lucide-react';
import type { User } from '../types.js';

interface NavbarProps {
  user: User | null;
  activeTab: 'catalog' | 'postpaid' | 'tracker' | 'dashboard' | 'admin';
  setActiveTab: (tab: 'catalog' | 'postpaid' | 'tracker' | 'dashboard' | 'admin') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenDeposit,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-850 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('catalog')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                    IBAD STORE
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-cyan-950 border border-cyan-800/80 text-cyan-400 rounded-md uppercase tracking-wider">
                    RESMI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Top Up Game, Pulsa &amp; PPOB Terpercaya
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/70 border border-slate-800/90 rounded-full px-2 py-1.5">
            <button
              id="nav-tab-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Katalog Layanan</span>
            </button>

            <button
              id="nav-tab-postpaid"
              onClick={() => setActiveTab('postpaid')}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'postpaid'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Tagihan Pascabayar</span>
            </button>

            <button
              id="nav-tab-tracker"
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lacak Pesanan</span>
            </button>

            {user?.role === 'admin' && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow-md shadow-rose-500/30'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/50'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </nav>

          {/* Right Action Controls: Balance & Auth */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                {/* Saldo Pill */}
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-750 rounded-full pl-3 pr-1.5 py-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-semibold text-white tracking-tight">
                      Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button
                    id="btn-quick-deposit"
                    onClick={onOpenDeposit}
                    className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2.5 py-1 rounded-full text-[11px] transition-colors cursor-pointer"
                    title="Isi Saldo Akun"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Deposit</span>
                  </button>
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    id="btn-user-dropdown"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-[10px]">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[80px] truncate hidden sm:inline">{user.name}</span>
                    {user.role === 'admin' && (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-[9px] font-extrabold text-slate-950 rounded uppercase">
                        Admin
                      </span>
                    )}
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-slate-800">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          {user.role === 'admin' && (
                            <span className="text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-cyan-400 font-mono">@{user.username}</p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Akun Terverifikasi</span>
                        </div>
                      </div>

                      {user.role === 'admin' && (
                        <button
                          id="dropdown-tab-admin"
                          onClick={() => {
                            setActiveTab('admin');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2.5 cursor-pointer bg-rose-950/20"
                        >
                          <Sliders className="w-3.5 h-3.5 text-rose-400" />
                          <span>Portal Admin Dashboard</span>
                        </button>
                      )}

                      <button
                        id="dropdown-tab-dashboard"
                        onClick={() => {
                          setActiveTab('dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2.5 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Riwayat &amp; Profil Akun</span>
                      </button>

                      <button
                        id="dropdown-tab-deposit"
                        onClick={() => {
                          onOpenDeposit();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white flex items-center gap-2.5 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Isi Saldo Deposit</span>
                      </button>

                      <div className="my-1 border-t border-slate-800"></div>

                      <button
                        id="dropdown-btn-logout"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-open-login"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-750 rounded-full transition-all cursor-pointer"
                >
                  Masuk
                </button>
                <button
                  id="btn-open-register"
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 rounded-full shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  Daftar
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1">
            <button
              id="mobile-nav-catalog"
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'catalog' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Katalog Layanan Digital</span>
            </button>

            <button
              id="mobile-nav-postpaid"
              onClick={() => {
                setActiveTab('postpaid');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'postpaid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              <ReceiptText className="w-4 h-4 text-cyan-400" />
              <span>Cek &amp; Bayar Tagihan Pascabayar</span>
            </button>

            <button
              id="mobile-nav-tracker"
              onClick={() => {
                setActiveTab('tracker');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                activeTab === 'tracker' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'
              }`}
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Lacak Pesanan / Cek Status</span>
            </button>

            {user?.role === 'admin' && (
              <button
                id="mobile-nav-admin"
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 text-rose-400 bg-rose-950/30 ${
                  activeTab === 'admin' ? 'border border-rose-500 text-rose-300' : ''
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
