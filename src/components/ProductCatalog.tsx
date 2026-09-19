import React, { useState, useMemo } from 'react';
import {
  Gamepad2,
  Zap,
  Smartphone,
  CreditCard,
  Flame,
  Search,
  CheckCircle,
  Tag,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Tv,
  Layers,
} from 'lucide-react';
import type { ProductItem } from '../types.js';

interface ProductCatalogProps {
  products: ProductItem[];
  onSelectProduct: (product: ProductItem) => void;
  onRefreshProducts: () => void;
  loading: boolean;
}

// Popular Game / Category Showcase with curated visual artworks
const POPULAR_GAMES_SHOWCASE = [
  {
    name: 'Mobile Legends',
    category: 'Games',
    providerKey: 'Mobile Legends',
    badge: '🔥 TERLARIS',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80',
    color: 'from-blue-600/30 to-indigo-950',
    accentBorder: 'border-blue-500/40',
    desc: 'Diamond & Weekly Pass Instan',
  },
  {
    name: 'Free Fire',
    category: 'Games',
    providerKey: 'Free Fire',
    badge: '⚡ FLASH SALE',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80',
    color: 'from-rose-600/30 to-slate-950',
    accentBorder: 'border-rose-500/40',
    desc: 'Booyah Pass & Diamond',
  },
  {
    name: 'Token PLN',
    category: 'PLN',
    providerKey: 'PLN',
    badge: '💡 24 JAM NONSTOP',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=500&auto=format&fit=crop&q=80',
    color: 'from-amber-600/30 to-slate-950',
    accentBorder: 'border-amber-500/40',
    desc: 'Token Prabayar Langsung Keluar',
  },
  {
    name: 'Pulsa & Data',
    category: 'Pulsa',
    providerKey: 'Telkomsel',
    badge: '📶 SERBA MURAH',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&auto=format&fit=crop&q=80',
    color: 'from-cyan-600/30 to-slate-950',
    accentBorder: 'border-cyan-500/40',
    desc: 'Telkomsel, Indosat, XL, Axis, Tri',
  },
  {
    name: 'Dompet Digital',
    category: 'E-Money',
    providerKey: 'DANA',
    badge: '💳 INSTAN OTOMATIS',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80',
    color: 'from-emerald-600/30 to-slate-950',
    accentBorder: 'border-emerald-500/40',
    desc: 'DANA, GoPay, OVO, ShopeePay',
  },
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onSelectProduct,
  onRefreshProducts,
  loading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'All', name: 'Semua Layanan', icon: Flame },
    { id: 'Games', name: 'Game Top Up', icon: Gamepad2 },
    { id: 'PLN', name: 'Token PLN', icon: Zap },
    { id: 'Pulsa', name: 'Pulsa & Data', icon: Smartphone },
    { id: 'E-Money', name: 'Dompet Digital', icon: CreditCard },
    { id: 'Streaming', name: 'Streaming & Akun', icon: Tv },
  ];

  // Filter out postpaid items from the prabayar catalog
  const prabayarProducts = useMemo(() => {
    return products.filter((p) => !p.isPostpaid);
  }, [products]);

  // Check category match helper
  const matchesCategory = (item: ProductItem, catId: string): boolean => {
    if (catId === 'All') return true;
    const cat = (item.category || '').toLowerCase();
    const prov = (item.provider || '').toLowerCase();
    const name = (item.name || '').toLowerCase();

    if (catId === 'Games') {
      return (
        cat.includes('game') ||
        ['mobile legends', 'free fire', 'pubg', 'genshin', 'valorant', 'roblox', 'point blank', 'garena', 'steam', 'honor of kings', 'arena of valor', 'call of duty', 'higgs domino', 'ragnarok'].some(
          (g) => prov.includes(g) || name.includes(g) || cat.includes(g)
        )
      );
    }

    if (catId === 'PLN') {
      return cat.includes('pln') || prov.includes('pln') || name.includes('pln') || name.includes('token listrik');
    }

    if (catId === 'Pulsa') {
      return (
        cat.includes('pulsa') ||
        cat.includes('data') ||
        cat.includes('paket') ||
        cat.includes('sms') ||
        cat.includes('telpon') ||
        cat.includes('masa aktif') ||
        cat.includes('perdana') ||
        cat.includes('esim') ||
        ['telkomsel', 'indosat', 'xl', 'axis', 'tri', 'smartfren', 'by.u'].some(
          (op) => prov.includes(op) || name.includes(op)
        )
      );
    }

    if (catId === 'E-Money') {
      return (
        cat.includes('money') ||
        cat.includes('emoney') ||
        cat.includes('dompet') ||
        ['dana', 'gopay', 'go pay', 'ovo', 'shopeepay', 'shopee pay', 'linkaja', 'grab', 'maxim', 'isaku', 'i.saku'].some(
          (w) => prov.includes(w) || name.includes(w)
        )
      );
    }

    if (catId === 'Streaming') {
      return (
        cat.includes('stream') ||
        cat.includes('premium') ||
        cat.includes('voucher') ||
        cat.includes('tv') ||
        ['netflix', 'spotify', 'vidio', 'youtube', 'disney', 'wetv', 'viu', 'canva', 'iqiyi'].some(
          (s) => prov.includes(s) || name.includes(s)
        )
      );
    }

    const targetCat = String(catId || '').toLowerCase();
    return cat.includes(targetCat) || prov.includes(targetCat);
  };

  // Extract available brands for the active category
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    for (const item of prabayarProducts) {
      if (matchesCategory(item, selectedCategory)) {
        if (item.provider && item.provider.trim()) {
          brandsSet.add(item.provider.trim());
        }
      }
    }
    return Array.from(brandsSet).sort();
  }, [prabayarProducts, selectedCategory]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return prabayarProducts.filter((p) => {
      if (!p) return false;
      const matchCat = matchesCategory(p, selectedCategory);

      const pProvider = String(p.provider || '').toLowerCase();
      const sBrand = String(selectedBrand || 'All').toLowerCase();
      const matchBrand =
        selectedBrand === 'All' ||
        pProvider === sBrand;

      const query = String(searchQuery || '').toLowerCase().trim();
      const pName = String(p.name || '').toLowerCase();
      const pCode = String(p.code || '').toLowerCase();
      const pCategory = String(p.category || '').toLowerCase();

      const matchSearch =
        !query ||
        pName.includes(query) ||
        pCode.includes(query) ||
        pProvider.includes(query) ||
        pCategory.includes(query);

      return matchCat && matchBrand && matchSearch;
    });
  }, [prabayarProducts, selectedCategory, selectedBrand, searchQuery]);

  // Group filtered products by provider
  const groupedByProvider = useMemo(() => {
    const map = new Map<string, ProductItem[]>();
    for (const item of filteredProducts) {
      const provName = item.provider || item.category || 'Lainnya';
      const list = map.get(provName) || [];
      list.push(item);
      map.set(provName, list);
    }
    return map;
  }, [filteredProducts]);

  return (
    <div className="space-y-8">
      {/* Visual Quick Showcase Cards (when on All and no search) */}
      {selectedCategory === 'All' && selectedBrand === 'All' && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Layanan Populer &amp; Paling Banyak Dipesan</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Pilihan terfavorit member Ibad Store
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {POPULAR_GAMES_SHOWCASE.map((showcase) => (
              <div
                key={showcase.name}
                id={`showcase-card-${String(showcase.name || 'item').toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  setSelectedCategory(showcase.category);
                  setSelectedBrand('All');
                  setSearchQuery(showcase.providerKey);
                }}
                className={`group relative overflow-hidden rounded-2xl border ${showcase.accentBorder} bg-gradient-to-b ${showcase.color} p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/40 flex flex-col justify-between min-h-[160px]`}
              >
                {/* Background Image Thumbnail */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                  <img
                    src={showcase.image}
                    alt={showcase.name}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-slate-950/70"></div>
                </div>

                {/* Top Badge */}
                <div className="relative z-10">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-cyan-300 tracking-wider">
                    {showcase.badge}
                  </span>
                </div>

                {/* Info Text */}
                <div className="relative z-10 space-y-1 pt-4">
                  <h4 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {showcase.name}
                  </h4>
                  <p className="text-[10px] text-slate-300 line-clamp-1">
                    {showcase.desc}
                  </p>
                  <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1 pt-1">
                    <span>Lihat Pilihan</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills & Search Controls */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Main Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`cat-filter-${String(cat.id || 'cat').toLowerCase()}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedBrand('All');
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Refresh Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="catalog-search-input"
                type="text"
                placeholder="Cari game, diamond, pulsa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <button
              id="btn-sync-catalog"
              onClick={onRefreshProducts}
              disabled={loading}
              title="Perbarui harga langsung dari Atlantic H2H Gateway"
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden md:inline text-[11px] font-semibold">Sync</span>
            </button>
          </div>
        </div>

        {/* Sub-Brand Chips (if multiple brands exist for category) */}
        {availableBrands.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Provider:</span>
            </span>
            <button
              onClick={() => setSelectedBrand('All')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedBrand === 'All'
                  ? 'bg-slate-700 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Semua ({prabayarProducts.filter((p) => matchesCategory(p, selectedCategory)).length})
            </button>
            {availableBrands.slice(0, 25).map((brand) => {
              const count = prabayarProducts.filter(
                (p) => matchesCategory(p, selectedCategory) && p.provider === brand
              ).length;
              return (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedBrand === brand
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {brand} <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Grid Grouped by Provider */}
      {loading && products.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 space-y-4">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-bold text-white">Memuat Katalog Layanan Atlantic H2H...</p>
          <p className="text-xs text-slate-400">Menghubungkan ke gateway resmi dan menyinkronkan daftar harga realtime.</p>
        </div>
      ) : groupedByProvider.size === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 space-y-3">
          <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Layanan Tidak Ditemukan</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedBrand !== 'All'
              ? 'Coba kata kunci pencarian lain atau klik "Semua" pada filter provider.'
              : 'Katalog layanan sedang diperbarui langsung dari Atlantic Gateway.'}
          </p>
          <button
            onClick={onRefreshProducts}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan Layanan Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {Array.from(groupedByProvider.entries()).map(([provider, items]) => (
            <div key={provider} className="space-y-4">
              {/* Provider Header Banner */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50"></div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">{provider}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                    {items.length} Paket Pilihan
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Proses Instan &amp; Otomatis 24 Jam</span>
                </div>
              </div>

              {/* Items Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {items.slice(0, 100).map((item) => {
                  const priceToDisplay = item.sellPrice || item.price;
                  const isAvailable = item.status === 'available';

                  return (
                    <div
                      key={item.code}
                      id={`product-card-${item.code}`}
                      onClick={() => onSelectProduct(item)}
                      className="group relative bg-slate-900/80 hover:bg-slate-850 border border-slate-800/90 hover:border-cyan-500/60 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/40 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Top tag & Code */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-mono">
                            {item.code}
                          </span>
                          {isAvailable ? (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Tersedia
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                              Gangguan
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-1">
                          {item.name}
                        </h4>

                        {/* Note / Subtext */}
                        {item.note && (
                          <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">
                            {item.note}
                          </p>
                        )}
                      </div>

                      {/* Pricing and Action */}
                      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between mt-2">
                        <div>
                          <p className="text-[10px] text-slate-400">Harga Member</p>
                          <p className="text-sm font-extrabold text-cyan-400 tracking-tight">
                            Rp {Number(priceToDisplay || 0).toLocaleString('id-ID')}
                          </p>
                        </div>

                        <span className="px-3 py-1.5 rounded-xl bg-cyan-500 group-hover:bg-cyan-400 text-slate-950 text-[11px] font-bold transition-all shadow-sm">
                          Pesan
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
