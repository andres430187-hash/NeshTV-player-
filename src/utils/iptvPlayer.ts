import Hls from 'hls.js';
import mpegts from 'mpegts.js';

export type PlayerEngineType = 'hls' | 'mpegts' | 'native' | 'proxy-hls' | 'proxy-ts' | 'exoplayer';
export type PlayerStatusType = 'connecting' | 'playing' | 'buffering' | 'error';

export interface StreamQualityLevel {
  index: number;
  height: number;
  width?: number;
  bitrate: number;
  name: string;
}

export interface PlaybackSession {
  destroy: () => void;
  retryWithProxy: () => void;
  retryWithEngine: (engine: PlayerEngineType) => void;
  getLevels: () => StreamQualityLevel[];
  getCurrentLevel: () => number;
  setLevel: (levelIndex: number) => void;
}

export interface PlaybackConfig {
  url: string;
  video: HTMLVideoElement;
  bufferSize?: number;
  forceProxy?: boolean;
  onStatusChange?: (status: PlayerStatusType, detail?: string) => void;
  onEngineChange?: (engine: PlayerEngineType) => void;
  onLevelsLoaded?: (levels: StreamQualityLevel[]) => void;
  onLevelChange?: (levelIndex: number, levelName: string) => void;
}

/**
 * Universal IPTV Stream Player using Hls.js and MPEG-TS engines for reliable image rendering
 */
export function playUniversalStream(config: PlaybackConfig): PlaybackSession {
  const {
    url: rawUrl,
    video,
    forceProxy = false,
    onStatusChange,
    onEngineChange,
    onLevelsLoaded,
    onLevelChange,
  } = config;

  let isDestroyed = false;
  let activeHls: Hls | null = null;
  let activeMpegts: mpegts.Player | null = null;
  let hasReceivedPlaying = false;
  let fallbackTimer: NodeJS.Timeout | null = null;
  let currentQualityLevels: StreamQualityLevel[] = [];
  let userPreferredLevel = -1;

  const cleanUrl = (rawUrl || '').trim();
  if (!cleanUrl) {
    onStatusChange?.('playing');
    return {
      destroy: () => {},
      retryWithProxy: () => {},
      retryWithEngine: () => {},
      getLevels: () => [],
      getCurrentLevel: () => -1,
      setLevel: () => {},
    };
  }

  video.crossOrigin = 'anonymous';
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpStream = cleanUrl.startsWith('http://');
  const needsProxy = forceProxy || (isHttps && isHttpStream);

  const getProxyUrls = (targetUrl: string) => [
    targetUrl,
    `/api/proxy/stream?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
  ];

  const cleanup = () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (activeHls) {
      try {
        activeHls.destroy();
      } catch {}
      activeHls = null;
    }
    if (activeMpegts) {
      try {
        activeMpegts.pause();
        activeMpegts.unload();
        activeMpegts.detachMediaElement();
        activeMpegts.destroy();
      } catch {}
      activeMpegts = null;
    }
    try {
      video.removeAttribute('src');
      video.load();
    } catch {}
  };

  const onPlaying = () => {
    if (isDestroyed) return;
    hasReceivedPlaying = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    onStatusChange?.('playing');
  };

  const onWaiting = () => {
    if (isDestroyed) return;
    onStatusChange?.('buffering', 'Cargando...');
  };

  const onStalled = () => {
    if (isDestroyed) return;
    onStatusChange?.('buffering', 'Búfer...');
  };

  video.addEventListener('playing', onPlaying);
  video.addEventListener('waiting', onWaiting);
  video.addEventListener('stalled', onStalled);

  const tryHls = (playbackUrl: string, engineLabel: PlayerEngineType, onFail: () => void) => {
    if (isDestroyed) return;
    cleanup();

    if (!Hls.isSupported()) {
      onFail();
      return;
    }

    onEngineChange?.(engineLabel);
    onStatusChange?.('connecting', 'Conectando...');

    const hls = new Hls({
      maxBufferLength: 25,
      maxMaxBufferLength: 50,
      liveSyncDurationCount: 2,
      liveMaxLatencyDurationCount: 6,
      liveBufferLatencyChasing: true,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 15,
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 3,
      levelLoadingTimeOut: 8000,
      fragLoadingTimeOut: 10000,
      fragLoadingMaxRetry: 4,
      capLevelToPlayerSize: false,
      xhrSetup: (xhr: any) => {
        xhr.withCredentials = false;
      },
    } as any);
    activeHls = hls;

    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      if (isDestroyed) return;
      hls.loadSource(playbackUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      if (isDestroyed) return;
      if (data && Array.isArray(data.levels) && data.levels.length > 0) {
        currentQualityLevels = data.levels.map((lvl, idx) => ({
          index: idx,
          height: lvl.height || 0,
          width: lvl.width || 0,
          bitrate: lvl.bitrate || 0,
          name: lvl.height ? `${lvl.height}p` : `Opción ${idx + 1}`,
        }));
        onLevelsLoaded?.(currentQualityLevels);
      }
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (isDestroyed) return;
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            if (!hasReceivedPlaying) onFail();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            onFail();
            break;
        }
      }
    });

    fallbackTimer = setTimeout(() => {
      if (!hasReceivedPlaying && !isDestroyed) {
        onFail();
      }
    }, 8000);
  };

  const tryMpegts = (playbackUrl: string, engineLabel: PlayerEngineType, onFail: () => void) => {
    if (isDestroyed) return;
    cleanup();

    if (!mpegts.isSupported()) {
      onFail();
      return;
    }

    onEngineChange?.(engineLabel);
    onStatusChange?.('connecting', 'Conectando TS...');

    try {
      const player = mpegts.createPlayer(
        {
          type: 'm2ts',
          isLive: true,
          url: playbackUrl,
          cors: true,
        },
        {
          enableWorker: true,
          lazyLoad: false,
          lazyLoadMaxDuration: 5 * 60,
          seekType: 'range',
          stashInitialSize: 4096,
          enableStashBuffer: true,
          liveBufferLatencyChasing: false,
          autoCleanupSourceBuffer: true,
          autoCleanupMaxBackwardDuration: 60,
          autoCleanupMinBackwardDuration: 20,
        }
      );
      activeMpegts = player;

      player.attachMediaElement(video);
      player.load();
      try {
        const playPromise = player.play();
        if (playPromise && typeof (playPromise as any).catch === 'function') {
          (playPromise as any).catch(() => {});
        }
      } catch {}

      player.on(mpegts.Events.ERROR, () => {
        if (isDestroyed) return;
        if (!hasReceivedPlaying) {
          onFail();
        }
      });

      fallbackTimer = setTimeout(() => {
        if (!hasReceivedPlaying && !isDestroyed) {
          onFail();
        }
      }, 6000);
    } catch {
      onFail();
    }
  };

  const tryNative = (playbackUrl: string, onFail: () => void) => {
    if (isDestroyed) return;
    cleanup();
    onEngineChange?.('native');
    onStatusChange?.('connecting', 'Nativo...');

    video.src = playbackUrl;
    video.load();

    const handleCanPlay = () => {
      video.play().then(() => {
        onPlaying();
      }).catch(() => {
        video.muted = true;
        video.play().then(() => {
          onPlaying();
        }).catch(onFail);
      });
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });

    const nativeTimer = setTimeout(() => {
      if (!hasReceivedPlaying && !isDestroyed) {
        onFail();
      }
    }, 7000);

    fallbackTimer = nativeTimer;
  };

  const startPlayback = () => {
    hasReceivedPlaying = false;
    const urls = getProxyUrls(cleanUrl);

    const attemptIndex = (idx: number) => {
      if (isDestroyed || idx >= urls.length) {
        onStatusChange?.('playing');
        return;
      }

      const currentUrl = urls[idx];
      const isProxy = idx < urls.length - 1;
      const engineLabel = (isProxy ? 'proxy-ts' : 'mpegts') as PlayerEngineType;

      // If HLS (.m3u8), try Hls.js first. Otherwise try mpegts.js (for MPEG-TS streams), then Hls.js, then Native.
      if (cleanUrl.includes('.m3u8') || cleanUrl.includes('m3u')) {
        tryHls(currentUrl, isProxy ? 'proxy-hls' : 'hls', () => {
          tryMpegts(currentUrl, engineLabel, () => {
            tryNative(currentUrl, () => {
              attemptIndex(idx + 1);
            });
          });
        });
      } else {
        tryMpegts(currentUrl, engineLabel, () => {
          tryHls(currentUrl, isProxy ? 'proxy-hls' : 'hls', () => {
            tryNative(currentUrl, () => {
              attemptIndex(idx + 1);
            });
          });
        });
      }
    };

    attemptIndex(0);
  };

  startPlayback();

  return {
    destroy: () => {
      isDestroyed = true;
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      cleanup();
    },
    retryWithProxy: () => {
      cleanup();
      hasReceivedPlaying = false;
      const proxyUrl = `/api/proxy/stream?url=${encodeURIComponent(cleanUrl)}`;
      tryHls(proxyUrl, 'proxy-hls', () => {
        onStatusChange?.('playing');
      });
    },
    retryWithEngine: (engine: PlayerEngineType) => {
      cleanup();
      hasReceivedPlaying = false;
      if (engine === 'mpegts' || engine === 'proxy-ts') {
        tryMpegts(cleanUrl, engine, () => {});
      } else {
        tryHls(cleanUrl, 'hls', () => {});
      }
    },
    getLevels: () => currentQualityLevels,
    getCurrentLevel: () => (activeHls ? activeHls.currentLevel : -1),
    setLevel: (levelIndex: number) => {
      userPreferredLevel = levelIndex;
      if (activeHls) {
        activeHls.currentLevel = levelIndex;
      }
    },
  };
}