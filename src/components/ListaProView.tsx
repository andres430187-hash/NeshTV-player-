import React, { useState } from 'react';
import { VodItem } from '../types/index.ts';
import { ArrowLeft, Play, Film, Search, Star, X, Sparkles, FolderPlus, ClipboardPaste } from 'lucide-react';

interface ListaProViewProps {
  items: VodItem[];
  onBack: () => void;
  isAdmin?: boolean;
  onAddCustomItem?: (item: Omit<VodItem, 'id'>) => void;
}

export const ListaProView: React.FC<ListaProViewProps> = ({ items, onBack, isAdmin = false, onAddCustomItem }) => {
  const [selectedItem, setSelectedItem] = useState<VodItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('Lista Pro VIP');

  const filteredItems = items.filter(i => {
    const query = searchQuery.toLowerCase();
    return !query || i.title.toLowerCase().includes(query) || i.category.toLowerCase().includes(query);
  });

  const handleAddPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customUrl) {
      alert('Por favor ingresa al menos un título y una URL de flujo.');
      return;
    }
    if (onAddCustomItem) {
      onAddCustomItem({
        title: customTitle,
        category: customCategory || 'Lista Pro VIP',
        type: customTitle.toLowerCase().includes('serie') ? 'series' : 'movie',
        year: 2026,
        rating: '9.5',
        poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
        synopsis: 'Contenido añadido a través de la Lista Pro / Portapapeles.',
        url: customUrl,
        isListaPro: true,
        language: 'latino',
      });
    }
    setCustomTitle('');
    setCustomUrl('');
    setShowPasteModal(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-black text-white p-4 md:p-8 flex flex-col select-none">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            data-action="back"
            data-tv-focus="true"
            data-focus-id="btn-listapro-back"
            className="tv-focusable flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
            <span>Volver al Menú</span>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00F0FF]" />
              <span>Lista Pro VIP (Contenido Personalizado)</span>
            </h1>
            <p className="text-xs text-zinc-400">
              {filteredItems.length} elementos exclusivos en tu lista seleccionada
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en Lista Pro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F0FF]"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-4 py-2 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] whitespace-nowrap cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Pegar / Agregar a Lista Pro</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-20 text-zinc-500 text-sm">
            No hay elementos en la Lista Pro. El administrador puede agregar enlaces o carpetas copiadas.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              data-tv-focus="true"
              data-focus-id={`listapro-${item.id}`}
              tabIndex={0}
              className="tv-focusable group relative bg-[#121212] border border-zinc-800 hover:border-[#00F0FF] rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all duration-200"
            >
              <div className="aspect-[2/3] w-full relative overflow-hidden bg-zinc-900">
                <img
                  src={item.poster}
                  alt={item.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-zinc-700 flex items-center gap-1 text-[10px] font-bold text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
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
                  <span>{item.category}</span>
                  <span className="text-[#00F0FF] font-mono">PRO</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Details / Play */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-[#121212] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            {isPlaying ? (
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video
                  src={selectedItem.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setIsPlaying(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white hover:text-red-400 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-56 shrink-0 aspect-[2/3] bg-zinc-900 relative">
                  <img
                    src={selectedItem.poster}
                    alt={selectedItem.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider">
                        {selectedItem.category} (Lista Pro)
                      </span>
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <h2 className="text-2xl font-black text-white mt-1">
                      {selectedItem.title}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-zinc-400 my-3">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" /> {selectedItem.rating}
                      </span>
                      <span>Año: {selectedItem.year}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed mb-6 font-mono bg-black/60 p-3 rounded-xl border border-zinc-800">
                      URL: {selectedItem.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>REPRODUCIR FLUJO PRO</span>
                    </button>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste / Add Custom Item Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-[#00F0FF]" />
                <span>Agregar a Lista Pro (Pegar enlace o carpeta)</span>
              </h3>
              <button onClick={() => setShowPasteModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPaste} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Título de la Película / Serie:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ej: Estreno Exclusivo Latino 2026"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">URL del Flujo / Video (.mp4 / .m3u8 / .ts):</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://myultratv.com:8080/movie/..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Categoría / Carpeta:</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ej: Estrenos Latino / Carpetas Monitor"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00F0FF] text-black font-bold hover:bg-[#33f3ff] shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
                >
                  Guardar en Lista Pro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
