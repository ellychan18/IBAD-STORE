import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ShieldCheck, Flame, ArrowRight, Gamepad2, Gift, Zap } from 'lucide-react';

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  bgGradient: string;
  accentColor: string;
  imageUrl: string;
  ctaText: string;
  ctaCategory?: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'promo-1',
    title: 'Mobile Legends: Bang Bang',
    subtitle: 'Weekly Diamond Pass & Diamond Fast Delivery 24 Jam. Proses 1-3 Detik Otomatis!',
    tag: '⚡ PROMO SUPER KILAT',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    bgGradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    accentColor: 'text-amber-300',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Top Up MLBB Sekarang',
    ctaCategory: 'Mobile Legends',
  },
  {
    id: 'promo-2',
    title: 'Free Fire Booyah Pass & Diamond',
    subtitle: 'Diskon Spesial Member Mingguan & Bulanan. Murah, Aman, dan Resmi 100%.',
    tag: '🔥 DISKON TERBESAR',
    tagColor: 'bg-rose-100 text-rose-900 border-rose-300',
    bgGradient: 'from-rose-600 via-orange-600 to-amber-500',
    accentColor: 'text-amber-200',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Beli Diamond FF',
    ctaCategory: 'Free Fire',
  },
  {
    id: 'promo-3',
    title: 'Token PLN & Pascabayar Real-Time',
    subtitle: 'Token PLN Prabayar 24 Jam Nonstop & Cek Tagihan Pascabayar dengan biaya admin termurah.',
    tag: '💡 LAYANAN 24 JAM',
    tagColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    accentColor: 'text-emerald-200',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Beli Token Listrik',
    ctaCategory: 'PLN',
  },
  {
    id: 'promo-4',
    title: 'Deposit Mudah & Cepat via QRIS',
    subtitle: 'Isi saldo akun Ibad Store menggunakan QRIS, Virtual Account BRI/BNI/BCA dengan verifikasi otomatis 24 jam.',
    tag: '💳 DEPOSIT OTOMATIS',
    tagColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    bgGradient: 'from-indigo-600 via-violet-600 to-pink-500',
    accentColor: 'text-cyan-200',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Isi Saldo Akun',
    ctaCategory: 'DEPOSIT',
  },
];

interface PromoBannerSliderProps {
  onSelectCategory?: (category: string) => void;
  onOpenDeposit?: () => void;
}

export const PromoBannerSlider: React.FC<PromoBannerSliderProps> = ({
  onSelectCategory,
  onOpenDeposit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
  };

  const current = PROMO_SLIDES[currentIndex];

  const handleCtaClick = () => {
    if (current.ctaCategory === 'DEPOSIT') {
      onOpenDeposit?.();
    } else if (current.ctaCategory) {
      onSelectCategory?.(current.ctaCategory);
    }
  };

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradient & Pattern */}
      <div className={`relative min-h-[260px] sm:min-h-[300px] bg-gradient-to-r ${current.bgGradient} p-6 sm:p-10 flex flex-col justify-between transition-all duration-700 text-white`}>
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Backdrop Image Overlay for Game Atmosphere */}
        <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 opacity-30 sm:opacity-40 pointer-events-none overflow-hidden mix-blend-overlay">
          <img
            src={current.imageUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-xl space-y-3.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border tracking-wide shadow-md ${current.tagColor}`}>
              <Sparkles className="w-3.5 h-3.5" />
              {current.tag}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/90 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Gateway Resmi Atlantic H2H</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {current.title}
          </h2>

          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium drop-shadow-sm max-w-lg">
            {current.subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id={`promo-cta-${current.id}`}
              onClick={handleCtaClick}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-extrabold rounded-xl text-xs sm:text-sm shadow-xl shadow-black/10 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>

        {/* Bottom Pagination & Navigation Controls */}
        <div className="relative z-10 flex items-center justify-between pt-6">
          <div className="flex items-center gap-2">
            {PROMO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-8 bg-white shadow-sm'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              aria-label="Previous Promo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              aria-label="Next Promo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
