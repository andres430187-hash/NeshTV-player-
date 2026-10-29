import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRemoteNavigation } from '../context/RemoteNavigationContext.tsx';
import { ChannelItem, PlayerSettings } from '../types/index.ts';
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
  Maximize,
  Minimize,
  Tv,
  Clock,
  Sparkles,
  Search,
  Sliders,
  RotateCw,
  Shield,
  AlertTriangle,
  Check,
  Activity,
} from 'lucide-react';

interface LiveTvPlayerProps {
  channels: ChannelItem[];
  playerSettings: PlayerSettings;
  onBack: () => void;
  onOpenSettings: () => void;
}

export const LiveTvPlayer: React.FC<LiveTvPlayerProps> = ({
  channels,
  playerSettings,
  onBack,
  onOpenSettings,
}) => {
  const { registerBackHandler } = useRemoteNavigation();

  // 100% STRICT BLOCK FILTER: Filter out all blocked channels so no user can ever see or play them.
  const validChannels = useMemo(() => {
    return channels.filter((c) => !c.isBlocked);
  }, [channels]);

  const [selectedChannel, setSelectedChannel] = useState<ChannelItem>(validChannels[0] || null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | 'cover'>('16:9');
  const [showOsd, setShowOsd] = useState(true);

  // Universal Stream Player diagnostics and failover states
  const [playbackStatus, setPlaybackStatus] = useState<PlayerStatusType>('connecting');
  const [statusDetail, setStatusDetail] = useState<string>('Conectando señal...');
  const [activeEngine, setActiveEngine] = useState<PlayerEngineType>('hls');
  const [forceProxyMode, setForceProxyMode] = useState(false);

  // Adaptive Bitrate & Quality selection
  const [qualityLevels, setQualityLevels] = useState<StreamQualityLevel[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1); // -1 = Auto
  const [currentLevelName, setCurrentLevelName] = useState<string>('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showFullscreenChannelList, setShowFullscreenChannelList] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<PlaybackSession | null>(null);
  const osdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync selected channel if current channel became blocked or list changed
  useEffect(() => {
    if (validChannels.length > 0) {
      if (!selectedChannel || !validChannels.some((c) => c.id === selectedChannel.id)) {
        setSelectedChannel(validChannels[0]);
      }
    }
  }, [validChannels, selectedChannel]);

  // Extract categories from valid channels only
  const categories = useMemo(() => {
    return ['Todos', ...Array.from(new Set(validChannels.map((c) => c.category || 'General')))];
  }, [validChannels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    return validChannels.filter((c) => {
      const matchCat = activeCategory === 'Todos' || c.category === activeCategory;
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.number.toString().includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [validChannels, activeCategory, searchQuery]);

  // Load stream when selected channel, forceProxyMode, or bufferSize changes
  useEffect(() => {
    if (!selectedChannel || !videoRef.current) return;

    setPlaybackStatus('connecting');
    setStatusDetail('Conectando señal...');

    if (sessionRef.current) {
      sessionRef.current.destroy();
      sessionRef.current = null;
    }

    const session = playUniversalStream({
      url: selectedChannel.url,
      video: videoRef.current,
      bufferSize: playerSettings.bufferSize || 25,
      forceProxy: forceProxyMode,
      onStatusChange: (status, detail) => {
        setPlaybackStatus(status);
        if (detail) setStatusDetail(detail);
        if (status === 'playing') {
          setIsPlaying(true);
        }
      },
      onEngineChange: (engine) => {
        setActiveEngine(engine);
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
  }, [selectedChannel, forceProxyMode, playerSettings.bufferSize]);

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

  // Hierarchical Back navigation registered in the central RemoteNavigation stack:
  // 1. If Quality Menu is open -> close quality menu (priority 130)
  // 2. If Fullscreen Channel Drawer is open -> close drawer (priority 125)
  // 3. If in Fullscreen TV -> return to Split View channel list (priority 120, NEVER jumps straight to dashboard!)
  // 4. If in Split View -> return to Dashboard (priority 10)
  useEffect(() => {
    if (!showQualityMenu) return;
    const unregister = registerBackHandler({
      id: 'livetv-quality-menu',
      priority: 130,
      handleBack: () => {
        setShowQualityMenu(false);
        return true;
      },
    });
    return unregister;
  }, [showQualityMenu, registerBackHandler]);

  useEffect(() => {
    if (!showFullscreenChannelList) return;
    const unregister = registerBackHandler({
      id: 'livetv-fullscreen-channels',
      priority: 125,
      handleBack: () => {
        setShowFullscreenChannelList(false);
        return true;
      },
    });
    return unregister;
  }, [showFullscreenChannelList, registerBackHandler]);

  useEffect(() => {
    if (!isFullscreen) return;
    const unregister = registerBackHandler({
      id: 'livetv-fullscreen',
      priority: 120,
      handleBack: () => {
        setIsFullscreen(false);
        return true;
      },
    });
    return unregister;
  }, [isFullscreen, registerBackHandler]);

  useEffect(() => {
    const unregister = registerBackHandler({
      id: 'livetv-split-view',
      priority: 10,
      handleBack: () => {
        onBack();
        return true;
      },
    });
    return unregister;
  }, [onBack, registerBackHandler]);

  // Handle channel click:
  // If clicked channel is ALREADY selected -> go to FULLSCREEN
  // Else -> select channel and update preview
  const handleChannelSelect = (channel: ChannelItem) => {
    if (selectedChannel?.id === channel.id) {
      setIsFullscreen(true);
      triggerOsd();
    } else {
      setSelectedChannel(channel);
    }
  };

  const triggerOsd = () => {
    setShowOsd(true);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setShowOsd(false);
    }, 4500);
  };

  const handleNextChannel = () => {
    const idx = filteredChannels.findIndex((c) => c.id === selectedChannel?.id);
    if (idx !== -1 && idx < filteredChannels.length - 1) {
      setSelectedChannel(filteredChannels[idx + 1]);
      triggerOsd();
    }
  };

  const handlePrevChannel = () => {
    const idx = filteredChannels.findIndex((c) => c.id === selectedChannel?.id);
    if (idx > 0) {
      setSelectedChannel(filteredChannels[idx - 1]);
      triggerOsd();
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div
      className="relative w-full h-screen bg-black text-white flex flex-col overflow-hidden select-none p-3 md:p-6"
      onMouseMove={() => isFullscreen && triggerOsd()}
    >
      {/* Top Bar for Split View (Only shown when not fullscreen) */}
      {!isFullscreen && (
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              data-action="back"
              data-tv-focus="true"
              data-focus-id="btn-live-back"
              className="tv-focusable flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
              <span>Volver al Menú</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">TV en Vivo</span>
              <span className="text-xs bg-[#00F0FF]/15 text-[#00F0FF] px-2 py-0.5 rounded-md font-semibold">
                {filteredChannels.length} disponibles
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSettings}
              data-tv-focus="true"
              data-focus-id="btn-live-settings"
              className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] text-xs text-zinc-300 hover:text-[#00F0FF] cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ajustes Decodificador ({playerSettings.decoder.toUpperCase()})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout: LEFT SIDE = LISTA DE CANALES, RIGHT SIDE = EL MONITOR */}
      <div className={`flex-1 min-h-0 ${isFullscreen ? 'w-full h-full' : 'flex flex-col sm:flex-row gap-4 pt-3 overflow-hidden'}`}>
        {/* LEFT SIDE: Channels List & Categories (Always on the Left) */}
        {!isFullscreen && (
          <div className="w-full sm:w-[320px] md:w-[380px] lg:w-[420px] xl:w-[450px] shrink-0 flex flex-col h-full bg-[#101010] border border-zinc-800/90 rounded-2xl overflow-hidden p-3 shadow-xl">
            {/* Search input */}
            <div className="relative mb-2.5 shrink-0">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar canal o número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F0FF]"
              />
            </div>

            {/* Horizontal Category Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 border-b border-zinc-800/60 no-scrollbar shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  data-tv-focus="true"
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Vertical Channels List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
              {filteredChannels.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No se encontraron canales en esta categoría
                </div>
              ) : (
                filteredChannels.map((ch) => {
                  const isSelected = selectedChannel?.id === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleChannelSelect(ch)}
                      data-tv-focus="true"
                      data-focus-id={`channel-${ch.id}`}
                      tabIndex={0}
                      className={`tv-focusable w-full p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'bg-[#00F0FF]/15 border-2 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                          : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Channel number badge */}
                        <span
                          className={`font-mono text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${
                            isSelected ? 'bg-[#00F0FF] text-black' : 'bg-black text-zinc-400'
                          }`}
                        >
                          {ch.number}
                        </span>

                        {/* Channel logo */}
                        <img
                          src={ch.logo}
                          alt={ch.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover bg-black border border-zinc-800 shrink-0 p-0.5"
                        />

                        {/* Channel title and current program */}
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white truncate">{ch.name}</h4>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {ch.epgNow?.title || 'Programación en directo'}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 shrink-0 text-[#00F0FF] text-[11px] font-bold">
                          <span className="hidden sm:inline">PANTALLA COMPLETA</span>
                          <Maximize className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RIGHT SIDE: Monitor / Video Player Container & Channel Info */}
        <div className={isFullscreen ? 'w-full h-full' : 'flex-1 min-w-0 flex flex-col h-full bg-[#101010] border border-zinc-800/90 rounded-2xl overflow-hidden p-3 md:p-4 shadow-xl'}>
          {/* THE SINGLE STABLE VIDEO PLAYER CONTAINER (NEVER UNMOUNTS) */}
          <div
            className={
              isFullscreen
                ? 'fixed inset-0 z-50 w-screen h-screen bg-black flex items-center justify-center p-0'
                : 'relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl group shrink-0'
            }
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className={`w-full h-full ${
                isFullscreen
                  ? aspectRatio === '16:9'
                    ? 'object-contain aspect-video'
                    : aspectRatio === '4:3'
                    ? 'object-contain aspect-[4/3]'
                    : 'object-cover'
                  : 'object-contain'
              }`}
            />

            {/* Non-intrusive auto-connecting & adapting pill (no blocking cartel) */}
            {(playbackStatus === 'connecting' || playbackStatus === 'buffering') && (
              <div className="absolute top-4 right-4 z-30 pointer-events-none flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-700/70 shadow-xl text-xs">
                <div className="w-3.5 h-3.5 border-2 border-[#00F0FF]/30 border-t-[#00F0FF] rounded-full animate-spin" />
                <span className="text-zinc-200 font-semibold text-[11px]">
                  {statusDetail || 'Adaptando señal a tu conexión...'}
                </span>
                <span className="text-[10px] font-mono text-[#00F0FF] px-1.5 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30">
                  {currentLevelName}
                </span>
              </div>
            )}

            {playbackStatus === 'error' && (
              <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                <div className="p-3 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-400 mb-3">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Señal no disponible o error de conexión</h3>
                <p className="text-xs text-zinc-400 mb-4 max-w-sm">
                  {statusDetail || 'El servidor tardó demasiado en responder o el formato no es compatible.'}
                </p>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => {
                      if (selectedChannel) {
                        setSelectedChannel({ ...selectedChannel });
                      }
                    }}
                    className="px-4 py-2 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Reintentar Conexión</span>
                  </button>
                  <button
                    onClick={() => setForceProxyMode((p) => !p)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl border border-zinc-700 cursor-pointer"
                  >
                    {forceProxyMode ? 'Desactivar Proxy' : 'Activar Proxy CORS'}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedChannel) {
                        setSelectedChannel({
                          ...selectedChannel,
                          url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                        });
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.4)] cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡ Canal de Respaldo Garantizado (HD)</span>
                  </button>
                </div>
              </div>
            )}

            {/* FULLSCREEN OSD (Only when isFullscreen === true) */}
            {isFullscreen ? (
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 flex flex-col justify-between p-6 ${
                  showOsd ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Top OSD Bar */}
                <div className="pointer-events-auto flex items-center justify-between bg-black/80 backdrop-blur-md border border-zinc-800 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsFullscreen(false)}
                      data-action="back"
                      data-tv-focus="true"
                      data-focus-id="btn-fs-minimize"
                      className="tv-focusable p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center gap-2 text-xs font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#00F0FF]" />
                      <span>Minimizar</span>
                    </button>

                    <button
                      onClick={() => setShowFullscreenChannelList((prev) => !prev)}
                      data-tv-focus="true"
                      data-focus-id="btn-fs-channels-left"
                      className="tv-focusable px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 border border-zinc-700 cursor-pointer text-xs font-semibold"
                      title="Abrir lista de canales a la izquierda"
                    >
                      <Tv className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>Lista Canales (Izq)</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-black text-[#00F0FF]">
                        CH {selectedChannel?.number}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {selectedChannel?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative">
                    {/* Quality Selector Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowQualityMenu((prev) => !prev)}
                        className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 text-xs rounded-xl text-zinc-200 flex items-center gap-1.5 border border-zinc-700 cursor-pointer shadow-md"
                        title="Seleccionar calidad de transmisión"
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
                      onClick={() =>
                        setAspectRatio(
                          aspectRatio === '16:9' ? '4:3' : aspectRatio === '4:3' ? 'cover' : '16:9'
                        )
                      }
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-xl text-zinc-300 cursor-pointer border border-zinc-700"
                    >
                      Ratio: {aspectRatio.toUpperCase()}
                    </button>
                  </div>
                </div>

                {/* Bottom OSD Bar */}
                <div className="pointer-events-auto bg-black/85 backdrop-blur-lg border border-zinc-800/90 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {selectedChannel?.logo && (
                        <img
                          src={selectedChannel.logo}
                          alt={selectedChannel.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover bg-zinc-900 border border-zinc-700 p-1"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#00F0FF] font-semibold mb-1">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          <span>EN VIVO AHORA</span>
                          <span>·</span>
                          <span>
                            {selectedChannel?.epgNow?.startTime} - {selectedChannel?.epgNow?.endTime}
                          </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white">
                          {selectedChannel?.epgNow?.title || selectedChannel?.name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1 max-w-2xl">
                          {selectedChannel?.epgNow?.description || 'Transmisión de televisión en directo'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={handlePrevChannel}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-200 cursor-pointer"
                      >
                        ▲ Anterior
                      </button>
                      <button
                        onClick={handleNextChannel}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-200 cursor-pointer"
                      >
                        ▼ Siguiente
                      </button>
                      <button
                        onClick={() => setIsFullscreen(false)}
                        className="p-2 bg-[#00F0FF] text-black rounded-xl hover:bg-[#33f3ff] cursor-pointer"
                        title="Minimizar a Split-view"
                      >
                        <Minimize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fullscreen Left Channel Drawer */}
                {showFullscreenChannelList && (
                  <div className="pointer-events-auto absolute inset-y-0 left-0 z-50 w-72 sm:w-80 md:w-96 bg-black/95 backdrop-blur-xl border-r border-zinc-800 p-4 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-[#00F0FF]" />
                        <span className="font-bold text-sm text-white">Canales en Vivo</span>
                      </div>
                      <button
                        onClick={() => setShowFullscreenChannelList(false)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs cursor-pointer"
                      >
                        Cerrar ✕
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
                      {filteredChannels.map((ch) => {
                        const isSelected = selectedChannel?.id === ch.id;
                        return (
                          <div
                            key={ch.id}
                            onClick={() => {
                              setSelectedChannel(ch);
                              setShowFullscreenChannelList(false);
                              triggerOsd();
                            }}
                            data-tv-focus="true"
                            data-focus-id={`fs-channel-${ch.id}`}
                            tabIndex={0}
                            className={`tv-focusable w-full p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                              isSelected
                                ? 'bg-[#00F0FF]/20 border-2 border-[#00F0FF] text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                                : 'bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  isSelected ? 'bg-[#00F0FF] text-black' : 'bg-black text-zinc-400'
                                }`}
                              >
                                {ch.number}
                              </span>
                              <img
                                src={ch.logo}
                                alt={ch.name}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded object-cover bg-black p-0.5 shrink-0"
                              />
                              <span className="text-xs font-bold truncate">{ch.name}</span>
                            </div>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-ping" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SPLIT PREVIEW OVERLAYS (Only when isFullscreen === false) */
              <>
                {/* Clickable Overlay to enter Fullscreen */}
                <div
                  onClick={() => setIsFullscreen(true)}
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  title="Haz clic para ver en Pantalla Completa"
                >
                  <div className="bg-[#00F0FF] text-black font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                    <Maximize className="w-4 h-4" />
                    <span>PANTALLA COMPLETA</span>
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-red-500/40 text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>EN VIVO</span>
                  </div>
                  <span className="bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 font-mono">
                    CH {selectedChannel?.number}
                  </span>
                </div>

                {/* Live Engine & Status Pill */}
                <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border flex items-center gap-1.5 backdrop-blur-md ${
                      playbackStatus === 'playing'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                        : playbackStatus === 'buffering' || playbackStatus === 'connecting'
                        ? 'bg-amber-950/80 text-amber-400 border-amber-700 animate-pulse'
                        : 'bg-red-950/80 text-red-400 border-red-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        playbackStatus === 'playing'
                          ? 'bg-emerald-400 animate-ping'
                          : playbackStatus === 'buffering' || playbackStatus === 'connecting'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                    />
                    <span>
                      {playbackStatus === 'playing'
                        ? `SEÑAL ACTIVA (${activeEngine.toUpperCase()})`
                        : playbackStatus === 'buffering'
                        ? 'BÚFER...'
                        : playbackStatus === 'connecting'
                        ? 'CONECTANDO...'
                        : '⚠️ SEÑAL NO RESPONDE'}
                    </span>
                  </span>
                </div>

                {/* Bottom preview controls bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      data-tv-focus="true"
                      data-focus-id="btn-preview-play"
                      className="tv-focusable p-1.5 rounded-lg bg-zinc-800/80 text-white hover:text-[#00F0FF] cursor-pointer"
                      title={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      data-tv-focus="true"
                      data-focus-id="btn-preview-mute"
                      className="tv-focusable p-1.5 rounded-lg bg-zinc-800/80 text-white hover:text-[#00F0FF] cursor-pointer"
                      title={isMuted ? 'Activar sonido' : 'Silenciar'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="text-[11px] text-zinc-300 font-medium truncate max-w-[140px]">
                      {selectedChannel?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setForceProxyMode((p) => !p)}
                      data-tv-focus="true"
                      data-focus-id="btn-preview-proxy"
                      className={`tv-focusable text-[10px] px-2 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                        forceProxyMode
                          ? 'bg-[#00F0FF] text-black border-[#00F0FF]'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                      title="Activar/Desactivar Proxy Anti-CORS"
                    >
                      {forceProxyMode ? 'Proxy ON' : 'Proxy'}
                    </button>
                    <button
                      onClick={() => setIsFullscreen(true)}
                      data-tv-focus="true"
                      data-focus-id="btn-preview-fullscreen"
                      className="tv-focusable p-1.5 rounded-lg bg-[#00F0FF] text-black font-bold hover:scale-105 transition-transform cursor-pointer"
                      title="Pantalla Completa"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detailed EPG & Monitor Bar (Only in Split View) */}
          {!isFullscreen && selectedChannel && (
            <div className="mt-4 flex-1 flex flex-col justify-between overflow-y-auto space-y-3 min-h-0">
              {/* Channel Quick Header */}
              <div className="flex items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedChannel.logo && (
                    <img
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-black border border-zinc-700 p-0.5 shrink-0"
                    />
                  )}
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#00F0FF]">CH {selectedChannel.number}</span>
                      <span className="text-sm font-bold text-white truncate">{selectedChannel.name}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 truncate block">
                      {selectedChannel.category || 'General'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsFullscreen(true)}
                  data-tv-focus="true"
                  data-focus-id="btn-monitor-fullscreen"
                  className="tv-focusable px-3.5 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)] shrink-0"
                >
                  <Maximize className="w-4 h-4" />
                  <span>Pantalla Completa</span>
                </button>
              </div>

              {/* Current Program Box */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00F0FF]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      PROGRAMA ACTUAL ({selectedChannel.epgNow?.startTime || '10:00'} - {selectedChannel.epgNow?.endTime || '12:00'})
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">En emisión</span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  {selectedChannel.epgNow?.title || selectedChannel.name}
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {selectedChannel.epgNow?.description || 'Transmisión en alta definición.'}
                </p>

                <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-[#00F0FF] h-full rounded-full w-2/3 shadow-[0_0_8px_#00F0FF]" />
                </div>
              </div>

              {/* Next Program Box */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>
                    A CONTINUACIÓN ({selectedChannel.epgNext?.startTime || '12:00'} - {selectedChannel.epgNext?.endTime || '14:00'})
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  {selectedChannel.epgNext?.title || 'Continuación de programación'}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {selectedChannel.epgNext?.description || 'Emisión ininterrumpida.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
