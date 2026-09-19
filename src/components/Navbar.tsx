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
  Gamepad2,
  Sparkles,
  Camera,
  TrendingUp,
} from 'lucide-react';
import type { User } from '../types.js';

interface NavbarProps {
  user: User | null;
  activeTab: 'catalog' | 'postpaid' | 'tracker' | 'dashboard' | 'admin';
  setActiveTab: (tab: 'catalog' | 'postpaid' | 'tracker' | 'dashboard' | 'admin') => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
  onOpenEditProfile?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenDeposit,
  onOpenEditProfile,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 transition-all shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo with Gaming Theme */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('catalog')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-indigo-600 group-hover:text-cyan-600 transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-700 bg-clip-text text-transparent">
                    IBAD STORE
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-md uppercase tracking-wider shadow-sm">
                    PRO GAMER
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
                  Top Up Game, Voucher &amp; PPOB Tercepat 24 Jam
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded-full px-2 py-1.5 shadow-inner">
            <button
              id="nav-tab-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Katalog Game &amp; Top Up</span>
            </button>

            <button
              id="nav-tab-postpaid"
              onClick={() => setActiveTab('postpaid')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'postpaid'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Tagihan Pascabayar</span>
            </button>

            <button
              id="nav-tab-tracker"
              onClick={() => setActiveTab('tracker')}
              className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tracker'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lacak Pesanan</span>
            </button>

            {user?.role === 'admin' && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/30'
                    : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Right Action Controls: Balance & Auth */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                {/* Saldo Pill */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-3 pr-1.5 py-1 text-xs shadow-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-extrabold text-slate-900 font-mono tracking-tight">
                      Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <button
                    id="btn-quick-deposit"
                    onClick={onOpenDeposit}
                    className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold px-2.5 py-1 rounded-full text-[11px] shadow-sm transition-all cursor-pointer"
                    title="Isi Saldo Akun"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Deposit</span>
                  </button>
                </div>

                {/* User Dropdown with Avatar */}
                <div className="relative">
                  <button
                    id="btn-user-dropdown"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-slate-800 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    {/* User Avatar */}
                    <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-sm flex items-center justify-center shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-indigo-700 text-white flex items-center justify-center font-extrabold text-[10px]">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <span className="max-w-[85px] truncate hidden sm:inline text-slate-800 font-bold">
                      {user.name}
                    </span>

                    {user.role === 'admin' && (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-[9px] font-black text-white rounded uppercase">
                        Admin
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-3xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 divide-y divide-slate-100">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gradient-to-br from-indigo-50/60 to-cyan-50/40">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-sm shrink-0">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover bg-white"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-indigo-700 text-white flex items-center justify-center font-black text-sm">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                              {user.role === 'admin' && (
                                <span className="text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-300 px-1.5 py-0.2 rounded uppercase">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-indigo-600 font-mono font-semibold">@{user.username}</p>
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Akun Terverifikasi</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Action Links */}
                      <div className="py-1.5">
                        {/* Edit Profile & Avatar Button */}
                        <button
                          id="dropdown-btn-edit-profile"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenEditProfile?.();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <Camera className="w-4 h-4 text-indigo-600" />
                          <span>Ubah Foto Profil &amp; Avatar</span>
                        </button>

                        <button
                          id="dropdown-tab-dashboard"
                          onClick={() => {
                            setActiveTab('dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-cyan-600" />
                          <span>Profil Akun &amp; Riwayat</span>
                        </button>

                        <button
                          id="dropdown-tab-deposit"
                          onClick={() => {
                            onOpenDeposit();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <Wallet className="w-4 h-4 text-emerald-600" />
                          <span>Isi Saldo Deposit</span>
                        </button>

                        {user.role === 'admin' && (
                          <button
                            id="dropdown-tab-admin"
                            onClick={() => {
                              setActiveTab('admin');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                          >
                            <Sliders className="w-4 h-4 text-rose-600" />
                            <span>Portal Admin Dashboard</span>
                          </button>
                        )}
                      </div>

                      {/* Logout Button */}
                      <div className="py-1.5">
                        <button
                          id="dropdown-btn-logout"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Keluar Akun</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Masuk
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Daftar Member</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              setActiveTab('catalog');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Katalog Layanan &amp; Game</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('postpaid');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
              activeTab === 'postpaid'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Tagihan Pascabayar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tracker');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
              activeTab === 'tracker'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Lacak Status Pesanan</span>
          </button>

          {user && (
            <>
              <button
                onClick={() => {
                  onOpenEditProfile?.();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2.5"
              >
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Ubah Foto Profil &amp; Avatar</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profil Akun</span>
              </button>
            </>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 ${
                activeTab === 'admin'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
