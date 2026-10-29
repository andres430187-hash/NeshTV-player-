import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRemoteNavigation } from '../context/RemoteNavigationContext.tsx';
import { VodItem } from '../types/index.ts';
import {
  playUniversalStream,
  PlaybackSession,
  PlayerEngineType,
  PlayerStatusType,
  StreamQualityLevel,
} from '../utils/iptvPlayer.ts';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Star,
  Clock,
  Film,
  Clapperboard,
  Search,
  Maximize2,
  X,
  Sparkles,
  ArrowUpDown,
  Calendar,
  Filter,
  RotateCw,
  Shield,
  AlertTriangle,
  Check,
  Sliders,
} from 'lucide-react';

interface VodBrowserProps {
  type: 'movie' | 'series';
  items: VodItem[];
  onBack: () => void;
}

export const VodBrowser: React.FC<VodBrowserProps> = ({ type, items, onBack }) => {
  const { registerBackHandler } = useRemoteNavigation();
  const [selectedItem, setSelectedItem] = useState<VodItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentType = type;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'title'>('newest');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'latino' | 'subtitulado'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Extract all unique release years present in the catalogue, sorted descending
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        items
          .filter((i) => i.type === currentType && i.year)
          .map((i) => Number(i.year))
      )
    ).sort((a, b) => b - a);
    return years;
  }, [items, currentType]);

  // Filter and sort items: Default is newest first (2026 -> oldest)
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const isCorrectType = item.type === currentType;
        const matchCategory = activeCategory === 'Todos' || item.category.includes(activeCategory);
        const matchYear = selectedYear === 'all' || String(item.year) === selectedYear;
        const query = searchQuery.trim().toLowerCase();
        const matchSearch =
          !query ||
          item.title.toLowerCase().includes(query) ||
          item.synopsis.toLowerCase().includes(query) ||
          String(item.year).includes(query);

        return isCorrectType && matchCategory && matchYear && matchSearch;
      })
      .sort((a, b) => {
        const yearA = Number(a.year) || 0;
        const yearB = Number(b.year) || 0;

        if (sortBy === 'newest') {
          if (yearB !== yearA) return yearB - yearA;
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        }
        if (sortBy === 'oldest') {
          if (yearA !== yearB) return yearA - yearB;
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        }
        if (sortBy === 'rating') {
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return yearB - yearA;
      });
  }, [items, currentType, activeCategory, selectedYear, searchQuery, sortBy]);

  // Language filtering
  const langFilteredItems = useMemo(() => {
    return filteredItems.filter((item) => {
      if (languageFilter === 'all') return true;
      const text = `${item.title} ${item.category} ${item.synopsis}`.toLowerCase();
      if (languageFilter === 'latino') {
        return (
          text.includes('lat') ||
          text.includes('latino') ||
          text.includes('esp') ||
          text.includes('español') ||
          text.includes('castellano') ||
          text.includes('doblado')
        );
      }
      if (languageFilter === 'subtitulado') {
        return (
          text.includes('sub') ||
          text.includes('subtitulada') ||
          text.includes('vose') ||
          text.includes('subt') ||
          text.includes('inglés') ||
          text.includes('eng')
        );
      }
      return true;
    });
  }, [filteredItems, languageFilter]);

  const categories = useMemo(() => {
    return [
      'Todos',
      ...Array.from(new Set(items.filter((i) => i.type === currentType).map((i) => i.category))),
    ];
  }, [items, currentType]);

  const count2026 = useMemo(() => {
    return items.filter((i) => i.type === currentType && Number(i.year) === 2026).length;
  }, [items, currentType]);

  const totalPages = Math.ceil(langFilteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return langFilteredItems.slice(start, start + itemsPerPage);
  }, [langFilteredItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, selectedYear, sortBy, languageFilter, currentType]);

  // Lock body scroll on mobile when modal is open so swiping doesn't move background films
  useEffect(() => {
    if (selectedItem) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedItem]);

  // Hierarchical Back navigation registered in the central RemoteNavigation stack:
  // 1. If playing video -> close player to return to movie description modal (priority 150)
  // 2. If viewing movie description modal -> close modal to return to catalog (priority 100)
  // 3. If in catalog -> return to main menu dashboard (priority 10)
  useEffect(() => {
    if (!isPlaying) return;
    const unregister = registerBackHandler({
      id: 'vod-player-modal',
      priority: 150,
      handleBack: () => {
        setIsPlaying(false);
        return true;
      },
    });
    return unregister;
  }, [isPlaying, registerBackHandler]);

  useEffect(() => {
    if (!selectedItem) return;
    const unregister = registerBackHandler({
      id: 'vod-details-modal',
      priority: 100,
      handleBack: () => {
        setSelectedItem(null);
        return true;
      },
    });
    return unregister;
  }, [selectedItem, registerBackHandler]);

  useEffect(() => {
    const unregister = registerBackHandler({
      id: 'vod-catalog-view',
      priority: 10,
      handleBack: () => {
        onBack();
        return true;
      },
    });
    return unregister;
  }, [onBack, registerBackHandler]);

  return (
    <div className="relative min-h-screen w-full bg-black text-white p-4 md:p-8 flex flex-col select-none">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            data-action="back"
            data-tv-focus="true"
            data-focus-id="btn-vod-back"
            className="tv-focusable flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
            <span>Volver al Menú</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {type === 'movie' ? (
                <>
                  <Film className="w-5 h-5 text-[#00F0FF]" />
                  <span>Catálogo de Películas (VOD)</span>
                </>
              ) : (
                <>
                  <Clapperboard className="w-5 h-5 text-[#00F0FF]" />
                  <span>Catálogo de Series (VOD)</span>
                </>
              )}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span>{filteredItems.length} {type === 'movie' ? 'películas' : 'series'} disponibles</span>
              <span>•</span>
              <span className="text-[#00F0FF] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00F0FF]" />
                {count2026} Estrenos 2026
              </span>
            </div>
          </div>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Sort Selector Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#00F0FF] absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              data-tv-focus="true"
              className="tv-focusable bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#00F0FF] font-medium appearance-none cursor-pointer"
            >
              <option value="newest">🔥 Más Nuevas (2026 → Antiguas)</option>
              <option value="oldest">⏳ Más Antiguas (Histórico)</option>
              <option value="rating">⭐ Mejor Valoradas (Rating)</option>
              <option value="title">🔤 Nombre (A - Z)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Buscar ${type === 'movie' ? 'película' : 'serie'} o año...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F0FF]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Year Filter Pills (Highlighting 2026 at the top) */}
      <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar border-b border-zinc-900">
        <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1 shrink-0 pl-1">
          <Calendar className="w-3 h-3 text-[#00F0FF]" />
          <span>Año:</span>
        </span>

        <button
          onClick={() => setSelectedYear('all')}
          data-tv-focus="true"
          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedYear === 'all'
              ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Todos los Años
        </button>

        {availableYears.map((yr) => {
          const is2026 = yr === 2026;
          const isSelected = selectedYear === String(yr);

          return (
            <button
              key={yr}
              onClick={() => setSelectedYear(String(yr))}
              data-tv-focus="true"
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                isSelected
                  ? is2026
                    ? 'bg-[#00F0FF] text-black font-extrabold shadow-[0_0_15px_rgba(0,240,255,0.5)] ring-2 ring-[#00F0FF]'
                    : 'bg-white text-black font-bold shadow'
                  : is2026
                  ? 'bg-zinc-900 border border-[#00F0FF]/50 text-[#00F0FF] hover:bg-[#00F0FF]/10 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {is2026 && <Sparkles className="w-3 h-3 text-[#00F0FF] animate-pulse" />}
              <span>{yr}</span>
              {is2026 && <span className="text-[10px] uppercase tracking-wider">(Estrenos)</span>}
            </button>
          );
        })}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            data-tv-focus="true"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-zinc-100 text-black font-bold shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Language Filter Pills (Latino vs Subtitulado / Inglés) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar border-b border-zinc-900">
        <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1 shrink-0 pl-1">
          <Filter className="w-3 h-3 text-[#00F0FF]" />
          <span>Idioma:</span>
        </span>
        {[
          { id: 'all', label: 'Todos los Idiomas' },
          { id: 'latino', label: '🇲🇽 Latino / Español' },
          { id: 'subtitulado', label: '🔤 Subtitulado / Inglés' },
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguageFilter(lang.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              languageFilter === lang.id
                ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Sort Status Banner */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 py-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
          Ordenado de: <strong className="text-zinc-300">Más Nuevas (2026) a la última del año</strong>
        </span>
        <span>
          Mostrando {langFilteredItems.length} resultado{langFilteredItems.length === 1 ? '' : 's'} (Página {currentPage} de {totalPages})
        </span>
      </div>

      {/* Grid of Posters */}
      {paginatedItems.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          <p className="text-sm">No se encontraron títulos con los filtros seleccionados.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('Todos');
              setSelectedYear('all');
              setLanguageFilter('all');
            }}
            className="mt-3 px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-white"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 py-2">
            {paginatedItems.map((item) => {
              const is2026 = Number(item.year) === 2026;
              const is2025 = Number(item.year) === 2025;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  data-tv-focus="true"
                  data-focus-id={`vod-${item.id}`}
                  tabIndex={0}
                  className={`tv-focusable group relative bg-[#121212] border rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all duration-200 ${
                    is2026
                      ? 'border-[#00F0FF]/40 hover:border-[#00F0FF] hover:shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                      : 'border-zinc-800 hover:border-zinc-500'
                  }`}
                >
                  <div className="aspect-[2/3] w-full relative overflow-hidden bg-zinc-900">
                    <img
                      src={item.poster}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-85" />

                    {/* Year Tag Badge (Top Left) */}
                    <div className="absolute top-2 left-2">
                      {is2026 ? (
                        <span className="bg-[#00F0FF] text-black font-black text-[10px] px-2 py-0.5 rounded shadow-[0_0_12px_rgba(0,240,255,0.6)] flex items-center gap-1 tracking-wider uppercase">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          2026
                        </span>
                      ) : is2025 ? (
                        <span className="bg-purple-600/90 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded shadow">
                          2025
                        </span>
                      ) : (
                        <span className="bg-black/75 backdrop-blur-md text-zinc-300 border border-zinc-700 font-semibold text-[10px] px-1.5 py-0.5 rounded">
                          {item.year}
                        </span>
                      )}
                    </div>

                    {/* Rating badge (Top Right) */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-zinc-700 flex items-center gap-1 text-[10px] font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{item.rating}</span>
                    </div>

                    {/* Play hover button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-10 h-10 rounded-full bg-[#00F0FF] text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>


                <div className="p-2.5">
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-[#00F0FF] transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                    <span
                      className={`font-semibold ${
                        is2026 ? 'text-[#00F0FF] font-bold' : is2025 ? 'text-purple-300' : 'text-zinc-400'
                      }`}
                    >
                      {item.year}
                    </span>
                    <span className="truncate max-w-[100px]">
                      {item.duration || `${item.seasons} Temporadas`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 disabled:opacity-40 hover:border-[#00F0FF] cursor-pointer"
            >
              ← Anterior
            </button>
            <span className="text-xs text-zinc-300 font-mono">
              Página <strong className="text-[#00F0FF]">{currentPage}</strong> de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 disabled:opacity-40 hover:border-[#00F0FF] cursor-pointer"
            >
              Siguiente →
            </button>
          </div>
        )}
      </>
      )}


      {/* Details & Playback Modal (Optimized for Mobile Touch & TV Remote) */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          style={{ touchAction: 'none' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPlaying) {
              setSelectedItem(null);
            }
          }}
        >
          <div
            className="relative w-full max-w-3xl bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            style={{ touchAction: 'pan-y' }}
            onClick={(e) => e.stopPropagation()}
          >
            {isPlaying ? (
              <VodPlayerModal
                item={selectedItem}
                onClose={() => setIsPlaying(false)}
              />
            ) : (
              /* Info Preview with responsive mobile layout and sticky footer */
              <div className="flex flex-col max-h-[90vh]">
                {/* Scrollable Content Area */}
                <div
                  className="overflow-y-auto overscroll-contain p-4 sm:p-6 flex-1"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Poster Thumbnail */}
                    <div className="w-28 sm:w-56 shrink-0 aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-800 mx-auto sm:mx-0 shadow-lg">
                      <img
                        src={selectedItem.poster}
                        alt={selectedItem.title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {Number(selectedItem.year) === 2026 && (
                        <div className="absolute top-2 left-2 bg-[#00F0FF] text-black font-black text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1">
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>2026</span>
                        </div>
                      )}
                    </div>

                    {/* Meta & Synopsis */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-2 py-0.5 rounded-md">
                          {selectedItem.category}
                        </span>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white mt-2 leading-tight">
                        {selectedItem.title}
                      </h2>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 my-2.5 flex-wrap">
                        <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          <Star className="w-3.5 h-3.5 fill-current" /> {selectedItem.rating}
                        </span>
                        <span
                          className={`font-semibold ${
                            Number(selectedItem.year) === 2026
                              ? 'text-[#00F0FF] font-bold'
                              : 'text-zinc-300'
                          }`}
                        >
                          Año: {selectedItem.year}
                        </span>
                        <span>
                          {selectedItem.duration ||
                            `${selectedItem.seasons || 1} Temporadas`}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
                        <p>{selectedItem.synopsis || 'Sin descripción disponible.'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Always-visible Sticky Footer with Big Play Button */}
                <div className="sticky bottom-0 bg-[#141414] border-t border-zinc-800/90 p-4 flex items-center gap-3 shrink-0 shadow-2xl z-20">
                  <button
                    onClick={() => setIsPlaying(true)}
                    data-tv-focus="true"
                    data-focus-id="btn-vod-play"
                    className="tv-focusable flex-1 py-3 px-5 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer active:scale-95 transition-transform"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>REPRODUCIR AHORA</span>
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    data-action="back"
                    className="py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 cursor-pointer"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface VodPlayerModalProps {
  item: VodItem;
  onClose: () => void;
}

const VodPlayerModal: React.FC<VodPlayerModalProps> = ({ item, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sessionRef = useRef<PlaybackSession | null>(null);

  const [status, setStatus] = useState<PlayerStatusType>('connecting');
  const [statusDetail, setStatusDetail] = useState('Iniciando reproductor...');
  const [engine, setEngine] = useState<PlayerEngineType>('native');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [forceProxy, setForceProxy] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quality selection state
  const [qualityLevels, setQualityLevels] = useState<StreamQualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [currentLevelName, setCurrentLevelName] = useState<string>('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Initialize playback session
  useEffect(() => {
    if (!videoRef.current || !item.url) return;

    setStatus('connecting');
    setStatusDetail('Conectando señal de video...');

    if (sessionRef.current) {
      sessionRef.current.destroy();
      sessionRef.current = null;
    }

    const session = playUniversalStream({
      url: item.url,
      video: videoRef.current,
      bufferSize: 30,
      forceProxy,
      onStatusChange: (newStatus, detail) => {
        setStatus(newStatus);
        if (detail) setStatusDetail(detail);
        if (newStatus === 'playing') {
          setIsPlaying(true);
        }
      },
      onEngineChange: (eng) => {
        setEngine(eng);
      },
      onLevelsLoaded: (levels) => {
        setQualityLevels(levels);
      },
      onLevelChange: (lvlIdx, lvlName) => {
        setCurrentLevelName(lvlIdx === -1 ? `Auto (${lvlName})` : lvlName);
      },
    });

    sessionRef.current = session;

    return () => {
      session.destroy();
    };
  }, [item.url, forceProxy]);

  // Video time and duration listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTime = () => setCurrentTime(video.currentTime || 0);
    const handleDuration = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTime);
    video.addEventListener('durationchange', handleDuration);
    video.addEventListener('loadedmetadata', handleDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTime);
      video.removeEventListener('durationchange', handleDuration);
      video.removeEventListener('loadedmetadata', handleDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Controls auto-hide
  const triggerActivity = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (status === 'playing') {
        setShowControls(false);
      }
    }, 4500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
    triggerActivity();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    triggerActivity();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    triggerActivity();
  };

  const handleSelectQuality = (lvlIndex: number) => {
    setSelectedQuality(lvlIndex);
    sessionRef.current?.setLevel(lvlIndex);
    setShowQualityMenu(false);
    if (lvlIndex === -1) {
      setCurrentLevelName('Auto');
    } else {
      const match = qualityLevels.find((l) => l.index === lvlIndex);
      setCurrentLevelName(match ? match.name : `${lvlIndex}p`);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerActivity}
      className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none"
    >
      {/* Video Element: download disabled completely */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controlsList="nodownload noplaybackrate"
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
      />

      {/* Subtle Non-Intrusive Connection / Buffer Pill */}
      {(status === 'connecting' || status === 'buffering') && (
        <div className="absolute top-4 right-16 z-30 pointer-events-none flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-700/80 shadow-xl text-xs">
          <div className="w-3.5 h-3.5 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin" />
          <span className="text-zinc-200 font-semibold text-[11px]">
            {statusDetail || 'Adaptando calidad a tu conexión...'}
          </span>
          <span className="text-[10px] font-mono text-[#00F0FF] px-1.5 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30">
            {currentLevelName}
          </span>
        </div>
      )}

      {/* Top Header Bar (Title, Quality Selector, Engine badge, Proxy toggle, Close) */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
            {item.title}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
            {item.year}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
            {engine}
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Quality Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQualityMenu((prev) => !prev)}
              className="px-2.5 py-1 bg-zinc-800/90 hover:bg-zinc-700 text-xs rounded-lg text-zinc-200 flex items-center gap-1.5 border border-zinc-700 cursor-pointer shadow-md"
              title="Seleccionar calidad de reproducción"
            >
              <Sliders className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Calidad: <strong className="text-[#00F0FF]">{currentLevelName}</strong></span>
            </button>

            {showQualityMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#121212] border border-zinc-700 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  Calidad de video
                </div>
                <button
                  onClick={() => handleSelectQuality(-1)}
                  className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between cursor-pointer ${
                    selectedQuality === -1
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div>
                    <div>Auto (Adaptable)</div>
                    <div className="text-[10px] text-zinc-400 font-normal">Ajusta según tu internet</div>
                  </div>
                  {selectedQuality === -1 && <Check className="w-4 h-4 text-[#00F0FF]" />}
                </button>

                {qualityLevels.length > 0 ? (
                  qualityLevels.map((lvl) => (
                    <button
                      key={lvl.index}
                      onClick={() => handleSelectQuality(lvl.index)}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer ${
                        selectedQuality === lvl.index
                          ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span>{lvl.name}</span>
                      {selectedQuality === lvl.index && <Check className="w-4 h-4 text-[#00F0FF]" />}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => handleSelectQuality(0)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                    >
                      Alta Definición (HD)
                    </button>
                    <button
                      onClick={() => handleSelectQuality(1)}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                    >
                      Ahorro de Datos (SD)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setForceProxy((prev) => !prev)}
            title="Alternar Túnel Proxy Anti-Bloqueo"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              forceProxy
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                : 'bg-black/60 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proxy</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/60 text-white hover:text-red-400 hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2 transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar */}
        {duration > 0 && (
          <div className="flex items-center gap-3 w-full group/bar">
            <div className="relative flex-1 h-1.5 bg-zinc-700/60 rounded-full cursor-pointer flex items-center">
              <div
                className="h-full bg-[#00F0FF] rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/bar:scale-100 transition-transform" />
              </div>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Buttons and Time */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-[#00F0FF] text-black hover:bg-[#33f3ff] transition-transform active:scale-95 cursor-pointer shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00F0FF]" />}
            </button>

            <div className="text-xs font-mono text-zinc-300">
              <span className="text-white font-semibold">{formatSecs(currentTime)}</span>
              {duration > 0 && (
                <>
                  <span className="text-zinc-500 mx-1">/</span>
                  <span className="text-zinc-400">{formatSecs(duration)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
