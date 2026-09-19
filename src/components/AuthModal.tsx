import React, { useState } from 'react';
import {
  X,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { api, authStorage } from '../services/api.js';
import type { User } from '../types.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ identifier: username || email, password });
        if (res.status && res.data) {
          authStorage.setToken(res.data.token);
          onSuccess(res.data.user);
          onClose();
        } else {
          setError(res.message || 'Gagal login. Periksa username dan password.');
        }
      } else {
        const res = await api.register({ username, name, email, phone, password });
        if (res.status && res.data) {
          authStorage.setToken(res.data.token);
          onSuccess(res.data.user);
          onClose();
        } else {
          setError(res.message || 'Gagal mendaftar akun.');
        }
      }
    } catch (err: any) {
      setError('Terjadi kendala keamanan saat memproses data.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: 'admin' | 'member') => {
    if (role === 'admin') {
      setUsername('ibadadmin');
      setPassword('IbadSecure2026!');
    } else {
      setUsername('memberibad');
      setPassword('Member123!');
    }
    setMode('login');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          id="btn-close-auth"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">IBAD STORE</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {mode === 'login' ? 'Masuk ke Portal Member Resmi' : 'Daftar Akun Member Baru'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            id="tab-btn-login"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            id="tab-btn-register"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Daftar Member
          </button>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="mb-5 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-900 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Akses Cepat Demo:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-demo-admin"
              onClick={() => handleQuickDemo('admin')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-200 cursor-pointer shadow-sm"
            >
              Admin Demo
            </button>
            <button
              type="button"
              id="btn-demo-member"
              onClick={() => handleQuickDemo('member')}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 rounded-lg text-[10px] font-black border border-indigo-200 cursor-pointer shadow-sm"
            >
              Member Demo
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-auth-name"
                    type="text"
                    required
                    placeholder="Nama Lengkap Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">No. WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="input-auth-phone"
                    type="tel"
                    required
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              {mode === 'login' ? 'Username atau Email' : 'Pilih Username Unik'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-auth-username"
                type="text"
                required
                placeholder="Username akun"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Kata Sandi (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="input-auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Masuk ke Akun' : 'Daftar Sekarang'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
