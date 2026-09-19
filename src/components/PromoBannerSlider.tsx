import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Sparkles, ShieldCheck, Flame, ArrowRight, Gamepad2, Gift } from 'lucide-react';

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
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    bgGradient: 'from-blue-950/90 via-slate-900 to-indigo-950/90',
    accentColor: 'text-cyan-400',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Top Up MLBB Sekarang',
    ctaCategory: 'Mobile Legends',
  },
  {
    id: 'promo-2',
    title: 'Free Fire Booyah Pass & Diamond',
    subtitle: 'Diskon Spesial Member Mingguan & Bulanan. Murah, Aman, dan Resmi 100%.',
    tag: '🔥 DISKON TERBESAR',
    tagColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    bgGradient: 'from-rose-950/90 via-slate-900 to-slate-950',
    accentColor: 'text-rose-400',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Beli Diamond FF',
    ctaCategory: 'Free Fire',
  },
  {
    id: 'promo-3',
    title: 'Token PLN & Pascabayar Real-Time',
    subtitle: 'Token PLN Prabayar 24 Jam Nonstop & Cek Tagihan Pascabayar dengan biaya admin termurah.',
    tag: '💡 LAYANAN 24 JAM',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    bgGradient: 'from-emerald-950/90 via-slate-900 to-slate-950',
    accentColor: 'text-emerald-400',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
    ctaText: 'Beli Token Listrik',
    ctaCategory: 'PLN',
  },
  {
    id: 'promo-4',
    title: 'Deposit Mudah & Cepat via QRIS',
    subtitle: 'Isi saldo akun Ibad Store menggunakan QRIS, Virtual Account BRI/BNI/BCA dengan verifikasi otomatis 24 jam.',
    tag: '💳 DEPOSIT OTOMATIS',
    tagColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    bgGradient: 'from-cyan-950/90 via-slate-900 to-blue-950/90',
    accentColor: 'text-cyan-400',
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
      className="relative w-full rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradient & Pattern */}
      <div className={`relative min-h-[260px] sm:min-h-[300px] bg-gradient-to-r ${current.bgGradient} p-6 sm:p-10 flex flex-col justify-between transition-all duration-700`}>
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Backdrop Image Overlay for Game Atmosphere */}
        <div className="absolute top-0 right-0 h-full w-full sm:w-1/2 opacity-25 sm:opacity-35 pointer-events-none overflow-hidden mix-blend-luminosity">
          <img
            src={current.imageUrl}
            alt={current.title}
            className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-xl space-y-3.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide shadow-sm ${current.tagColor}`}>
              <Sparkles className="w-3.5 h-3.5" />
              {current.tag}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Gateway Resmi Atlantic H2H</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {current.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {current.subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              id={`promo-cta-${current.id}`}
              onClick={handleCtaClick}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Indicators & Controls */}
        <div className="relative z-10 flex items-center justify-between pt-4 mt-auto">
          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            {PROMO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                id={`slider-dot-${idx}`}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              id="slider-btn-prev"
              onClick={prevSlide}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
              aria-label="Slide Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="slider-btn-next"
              onClick={nextSlide}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
              aria-label="Slide Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
