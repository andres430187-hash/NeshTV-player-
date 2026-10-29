import React, { useState } from 'react';
import { PlayerSettings } from '../types/index.ts';
import {
  Cpu,
  Layers,
  Radio,
  Sliders,
  Volume2,
  Tv,
  Film,
  Clapperboard,
  History,
  Disc,
  Calendar,
  Check,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';

interface PlayerSettingsModalProps {
  initialSettings: PlayerSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PlayerSettings) => Promise<void>;
}

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  initialSettings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [settings, setSettings] = useState<PlayerSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDecoderChange = (dec: 'hardware' | 'software') => {
    setSettings((prev) => ({ ...prev, decoder: dec }));
  };

  const handleBufferSizeChange = (val: number) => {
    setSettings((prev) => ({ ...prev, bufferSize: val }));
  };

  const handleFormatChange = (fmt: 'default' | 'mpegts' | 'hls') => {
    setSettings((prev) => ({ ...prev, playbackFormat: fmt }));
  };

  const handleCategoryEngineChange = (categoryKey: keyof PlayerSettings['categoryEngines'], engine: string) => {
    setSettings((prev) => ({
      ...prev,
      categoryEngines: {
        ...prev.categoryEngines,
        [categoryKey]: engine,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settings);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({
      decoder: 'hardware',
      bufferSize: 20,
      enableOpenSLES: true,
      enableOpenGL: true,
      playbackFormat: 'hls',
      categoryEngines: {
        live: 'ExoPlayer Built-in (Recomendado)',
        movies: 'VLC Hardware Engine',
        series: 'VLC Hardware Engine',
        catchup: 'IjkPlayer Fast-Seek',
        recording: 'Standard MediaCodec',
        liveWithGuide: 'ExoPlayer Low-Latency',
      },
    });
  };

  const playerEngineOptions = [
    'ExoPlayer Built-in (Recomendado)',
    'VLC Hardware Engine',
    'IjkPlayer Fast-Seek',
    'Standard MediaCodec',
    'ExoPlayer Low-Latency',
    'Native System Player',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#101010] border border-zinc-800 hover:border-[#00F0FF]/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-5 md:p-7 text-white select-none my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Configuración Técnica Avanzada del Reproductor
              </h2>
              <p className="text-xs text-zinc-400">
                Ajustes de motor de renderizado, códecs de aceleración y búfer IPTV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            data-tv-focus="true"
            data-focus-id="btn-close-settings"
            className="tv-focusable p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* SECCIÓN 1: Configuración Incorporada del Reproductor */}
          <div className="bg-[#141414] border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#00F0FF] mb-3">
              <Cpu className="w-4 h-4" />
              <span>1. Configuración Incorporada del Reproductor</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Decoder Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Decodificador de Vídeo:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecoderChange('hardware')}
                    data-tv-focus="true"
                    data-focus-id="btn-dec-hw"
                    className={`tv-focusable py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      settings.decoder === 'hardware'
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hardware Decoder (HW)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecoderChange('software')}
                    data-tv-focus="true"
                    data-focus-id="btn-dec-sw"
                    className={`tv-focusable py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      settings.decoder === 'software'
                        ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Software Decoder (SW)
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  Recomendado: Hardware Decoder para Smart TV / TV Box con aceleración GPU.
                </p>
              </div>

              {/* Límite de tamaño de búfer (selector numérico, ej. 20) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Límite de tamaño de búfer:
                  </label>
                  <span className="font-mono text-xs font-bold text-[#00F0FF] bg-black px-2 py-0.5 rounded border border-[#00F0FF]/30">
                    {settings.bufferSize} segundos
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={settings.bufferSize}
                  onChange={(e) => handleBufferSizeChange(Number(e.target.value))}
                  data-tv-focus="true"
                  className="w-full accent-[#00F0FF] cursor-pointer bg-zinc-800 h-2 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
                  <span>5s (Baja latencia)</span>
                  <span className="text-[#00F0FF] font-bold">20s (Recomendado)</span>
                  <span>60s (Anticortes)</span>
                </div>
              </div>
            </div>

            {/* Checkboxes: OpenSL ES & OpenGL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800/80">
              <label
                onClick={() => setSettings((p) => ({ ...p, enableOpenSLES: !p.enableOpenSLES }))}
                data-tv-focus="true"
                data-focus-id="chk-opensles"
                className="tv-focusable flex items-start gap-3 p-3 bg-black/50 border border-zinc-800 hover:border-[#00F0FF]/50 rounded-xl cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings.enableOpenSLES}
                  onChange={() => {}}
                  className="mt-0.5 accent-[#00F0FF] w-4 h-4 rounded cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>Habilitar OpenSL ES</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Audio acelerado por hardware para menor retardo de salida en TV.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setSettings((p) => ({ ...p, enableOpenGL: !p.enableOpenGL }))}
                data-tv-focus="true"
                data-focus-id="chk-opengl"
                className="tv-focusable flex items-start gap-3 p-3 bg-black/50 border border-zinc-800 hover:border-[#00F0FF]/50 rounded-xl cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={settings.enableOpenGL}
                  onChange={() => {}}
                  className="mt-0.5 accent-[#00F0FF] w-4 h-4 rounded cursor-pointer"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>Habilitar OpenGL</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Formato de píxel OpenGL para renderizado de color directo en GPU.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* SECCIÓN 2: Formato de Reproducción (Radio buttons) */}
          <div className="bg-[#141414] border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#00F0FF] mb-3">
              <Radio className="w-4 h-4" />
              <span>2. Formato de Reproducción (Streaming Format)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'default', label: 'Default', desc: 'Detección automática del flujo M3U' },
                { id: 'mpegts', label: 'MPEGTS (.ts)', desc: 'Transport stream tradicional sin pérdida' },
                { id: 'hls', label: 'HLS (.m3u8)', desc: 'HTTP Live Streaming adaptativo (Recomendado)' },
              ].map((fmt) => (
                <div
                  key={fmt.id}
                  onClick={() => handleFormatChange(fmt.id as any)}
                  data-tv-focus="true"
                  data-focus-id={`fmt-${fmt.id}`}
                  className={`tv-focusable p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    settings.playbackFormat === fmt.id
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-black/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">{fmt.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        settings.playbackFormat === fmt.id
                          ? 'border-[#00F0FF] bg-[#00F0FF]'
                          : 'border-zinc-600'
                      }`}
                    >
                      {settings.playbackFormat === fmt.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">{fmt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 3: Selección de Reproductor por Categoría */}
          <div className="bg-[#141414] border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#00F0FF] mb-3">
              <Sliders className="w-4 h-4" />
              <span>3. Selección de Reproductor por Categoría</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Configuración independiente de motores integrados para cada tipo de contenido:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Directo (Live) */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                  <Tv className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Directo (Live TV):</span>
                </label>
                <select
                  value={settings.categoryEngines.live}
                  onChange={(e) => handleCategoryEngineChange('live', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  {playerEngineOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cine */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                  <Film className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Cine (Movies):</span>
                </label>
                <select
                  value={settings.categoryEngines.movies}
                  onChange={(e) => handleCategoryEngineChange('movies', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  {playerEngineOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Series */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Series:</span>
                </label>
                <select
                  value={settings.categoryEngines.series}
                  onChange={(e) => handleCategoryEngineChange('series', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  {playerEngineOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Catch Up */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                  <History className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Catch Up (Rebobinado):</span>
                </label>
                <select
                  value={settings.categoryEngines.catchup}
                  onChange={(e) => handleCategoryEngineChange('catchup', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  {playerEngineOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grabación */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                  <Disc className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Grabación (DVR/PVR):</span>
                </label>
                <select
                  value={settings.categoryEngines.recording}
                  onChange={(e) => handleCategoryEngineChange('recording', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  {playerEngineOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* TV en directo con guía */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>TV en directo con guía (EPG Overlay):</span>
                </label>
                <select
                  value={settings.categoryEngines.liveWithGuide}
                  onChange={(e) => handleCategoryEngineChange('liveWithGuide', e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  {playerEngineOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-zinc-800">
          <button
            type="button"
            onClick={handleResetDefaults}
            data-tv-focus="true"
            data-focus-id="btn-settings-reset"
            className="tv-focusable flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Valores Predeterminados</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              data-tv-focus="true"
              data-focus-id="btn-settings-cancel"
              className="tv-focusable px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              data-tv-focus="true"
              data-focus-id="btn-settings-save"
              className="tv-focusable px-5 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡GUARDADO!</span>
                </>
              ) : saving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>APLICAR AJUSTES</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
