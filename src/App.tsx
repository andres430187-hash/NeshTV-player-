import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RemoteNavigationProvider,
  useRemoteNavigation,
} from './context/RemoteNavigationContext.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { LiveTvPlayer } from './components/LiveTvPlayer.tsx';
import { VodBrowser } from './components/VodBrowser.tsx';
import { PlayerSettingsModal } from './components/PlayerSettingsModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';

import {
  UserAccount,
  ChannelItem,
  VodItem,
  FloatingMessage,
  PlayerSettings,
  AppView,
} from './types/index.ts';

const DEFAULT_SETTINGS: PlayerSettings = {
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
};

function NeshTvApp() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) return 'dashboard';
      }
    } catch {}
    return 'login';
  });
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.user || null;
      }
    } catch {}
    return null;
  });
  const [channels, setChannels] = useState<ChannelItem[]>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.channels && Array.isArray(parsed.channels)) return parsed.channels;
      }
    } catch {}
    return [];
  });
  const [vod, setVod] = useState<VodItem[]>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vod && Array.isArray(parsed.vod)) return parsed.vod;
      }
    } catch {}
    return [];
  });
  const [listaProItems, setListaProItems] = useState<VodItem[]>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.listaProItems && Array.isArray(parsed.listaProItems)) return parsed.listaProItems;
      }
    } catch {}
    return [];
  });

  const [contactNote, setContactNote] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.contactNote) return parsed.contactNote;
      }
    } catch {}
    return '';
  });
  const [floatingMessage, setFloatingMessage] = useState<FloatingMessage | null>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.floatingMessage || null;
      }
    } catch {}
    return null;
  });
  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.playerSettings) return parsed.playerSettings;
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('neshtv_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.adminToken || null;
      }
    } catch {}
    return null;
  });

  const { deviceMode, setDeviceMode, setActiveScreen, registerBackHandler } = useRemoteNavigation();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Load public contact note on app launch
  const fetchPublicInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/public/info');
      if (res.ok) {
        const data = await res.json();
        if (data.contactNote) {
          setContactNote(data.contactNote);
        }
      }
    } catch (e) {
      console.warn('Could not load public info:', e);
    }
  }, []);

  useEffect(() => {
    fetchPublicInfo();
  }, [fetchPublicInfo]);

  useEffect(() => {
    setActiveScreen(currentView);
  }, [currentView, setActiveScreen]);

  // Hierarchical Back Navigation registrations in central stack:
  // Exit confirm dialog (priority 300)
  useEffect(() => {
    if (!showExitConfirm) return;
    const unregister = registerBackHandler({
      id: 'app-exit-dialog',
      priority: 300,
      handleBack: () => {
        setShowExitConfirm(false);
        return true;
      },
    });
    return unregister;
  }, [showExitConfirm, registerBackHandler]);

  // Admin Modal (priority 200)
  useEffect(() => {
    if (!isAdminOpen) return;
    const unregister = registerBackHandler({
      id: 'app-admin-modal',
      priority: 200,
      handleBack: () => {
        setIsAdminOpen(false);
        return true;
      },
    });
    return unregister;
  }, [isAdminOpen, registerBackHandler]);

  // Settings Modal (priority 200)
  useEffect(() => {
    if (!isSettingsOpen) return;
    const unregister = registerBackHandler({
      id: 'app-settings-modal',
      priority: 200,
      handleBack: () => {
        setIsSettingsOpen(false);
        return true;
      },
    });
    return unregister;
  }, [isSettingsOpen, registerBackHandler]);

  // Dashboard root exit prompt (priority 1) - ONLY on dashboard when no modals are open
  // This ensures pressing Back on Dashboard prompts before closing the app,
  // and NEVER interferes when inside Live TV, Movies, or Series!
  useEffect(() => {
    if (currentView !== 'dashboard' || isAdminOpen || isSettingsOpen || showExitConfirm) return;
    const unregister = registerBackHandler({
      id: 'dashboard-root-back',
      priority: 1,
      handleBack: () => {
        setShowExitConfirm(true);
        return true;
      },
    });
    return unregister;
  }, [currentView, isAdminOpen, isSettingsOpen, showExitConfirm, registerBackHandler]);

  // Home key handler
  useEffect(() => {
    const handleRemoteHome = () => {
      if (user) {
        setIsAdminOpen(false);
        setIsSettingsOpen(false);
        setShowExitConfirm(false);
        setCurrentView('dashboard');
      }
    };

    window.addEventListener('nesh:home', handleRemoteHome);
    return () => window.removeEventListener('nesh:home', handleRemoteHome);
  }, [user]);

  const handleRefreshData = async (): Promise<boolean> => {
    if (!user?.username) return false;
    try {
      const res = await fetch('/api/client/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setChannels(data.channels || []);
          setVod(data.vod || []);
          setContactNote(data.contactNote || '');
          setFloatingMessage(data.floatingMessage || null);
          if (data.playerSettings) setPlayerSettings(data.playerSettings);

          try {
            const saved = localStorage.getItem('neshtv_session');
            if (saved) {
              const parsed = JSON.parse(saved);
              parsed.channels = data.channels || [];
              parsed.vod = data.vod || [];
              parsed.contactNote = data.contactNote || '';
              parsed.floatingMessage = data.floatingMessage || null;
              parsed.playerSettings = data.playerSettings || playerSettings;
              localStorage.setItem('neshtv_session', JSON.stringify(parsed));
            }
          } catch {}
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn('Network error during data refresh, keeping local cache:', e);
      return false;
    }
  };

  // Auto-refresh data on mount if session exists
  useEffect(() => {
    if (user?.username) {
      handleRefreshData();
    }
  }, []);

  const handleLoginSuccess = (data: {
    user: UserAccount;
    channels: ChannelItem[];
    vod: VodItem[];
    contactNote: string;
    floatingMessage: FloatingMessage | null;
    playerSettings: PlayerSettings;
    isAdmin?: boolean;
    adminToken?: string | null;
  }) => {
    setUser(data.user);
    setChannels(data.channels || []);
    setVod(data.vod || []);
    setContactNote(data.contactNote || '');
    setFloatingMessage(data.floatingMessage || null);
    const token = data.adminToken || null;
    if (token) setAdminToken(token);
    if (data.playerSettings) setPlayerSettings(data.playerSettings);
    setCurrentView('dashboard');

    try {
      localStorage.setItem(
        'neshtv_session',
        JSON.stringify({
          user: data.user,
          channels: data.channels || [],
          vod: data.vod || [],
          contactNote: data.contactNote || '',
          floatingMessage: data.floatingMessage || null,
          playerSettings: data.playerSettings || playerSettings,
          adminToken: token,
        })
      );
    } catch (e) {
      console.warn('Could not save session to localStorage', e);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAdminToken(null);
    setCurrentView('login');
    try {
      localStorage.removeItem('neshtv_session');
    } catch {}
    fetchPublicInfo();
  };

  const handleSaveSettings = async (newSettings: PlayerSettings) => {
    setPlayerSettings(newSettings);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (e) {
      console.error('Error saving settings to backend:', e);
    }
  };

  // Strictly active (unblocked) channels and VOD for the client interface.
  // When an admin blocks channels or folders, they are completely excluded for all users,
  // making the entire client experience significantly faster and removing blocked signals.
  const activeChannels = useMemo(() => {
    return channels.filter((c) => !c.isBlocked);
  }, [channels]);

  const activeVod = useMemo(() => {
    return vod
      .filter((v) => !v.isBlocked)
      .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
  }, [vod]);

  return (
    <div className="relative min-h-screen w-full bg-black text-white antialiased">
      {/* Screen 1: Login */}
      {currentView === 'login' && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenAdmin={(token) => {
            if (token) setAdminToken(token);
            setIsAdminOpen(true);
          }}
          contactNote={contactNote}
        />
      )}

      {/* Screen 2: Dashboard (IPTV Smarters style) */}
      {currentView === 'dashboard' && user && (
        <Dashboard
          user={user}
          channels={activeChannels}
          vod={activeVod}
          floatingMessage={floatingMessage}
          onNavigate={(view) => {
            if (view === 'settings') {
              setIsSettingsOpen(true);
            } else if (view === 'admin') {
              if (!adminToken) {
                fetch('/api/auth/master-access', { method: 'POST' })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.token) setAdminToken(d.token);
                    setIsAdminOpen(true);
                  })
                  .catch(() => setIsAdminOpen(true));
              } else {
                setIsAdminOpen(true);
              }
            } else {
              setCurrentView(view);
            }
          }}
          onLogout={handleLogout}
          deviceMode={deviceMode}
          setDeviceMode={setDeviceMode}
          onRefreshData={handleRefreshData}
        />
      )}

      {/* Screen 3: Live TV Player (Split View & Fullscreen TV) */}
      {currentView === 'livetv' && (
        <LiveTvPlayer
          channels={activeChannels}
          playerSettings={playerSettings}
          onBack={() => setCurrentView('dashboard')}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Screen 4: Movies VOD Browser */}
      {currentView === 'movies' && (
        <VodBrowser
          type="movie"
          items={activeVod}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* Screen 5: Series VOD Browser */}
      {currentView === 'series' && (
        <VodBrowser
          type="series"
          items={activeVod}
          onBack={() => setCurrentView('dashboard')}
        />
      )}




      {/* Built-in Player Technical Configuration Modal (Requirement 6) */}
      <PlayerSettingsModal
        isOpen={isSettingsOpen}
        initialSettings={playerSettings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Private Web Admin Panel (Requirement 3) */}
      {isAdminOpen && (
        <AdminPanel
          initialAdminToken={adminToken || undefined}
          onClose={() => {
            setIsAdminOpen(false);
            fetchPublicInfo();
            // Re-fetch channels and VODs so any newly synced playlist immediately shows up in Live TV
            if (adminToken) {
              fetch('/api/admin/data', {
                headers: { Authorization: `Bearer ${adminToken}` },
              })
                .then((r) => r.json())
                .then((data) => {
                  if (data.channels) setChannels(data.channels);
                  if (data.vod) setVod(data.vod);
                })
                .catch(() => {});
            }
          }}
          onRefreshData={() => {
            if (adminToken) {
              fetch('/api/admin/data', {
                headers: { Authorization: `Bearer ${adminToken}` },
              })
                .then((r) => r.json())
                .then((data) => {
                  if (data.channels) setChannels(data.channels);
                  if (data.vod) setVod(data.vod);
                })
                .catch(() => {});
            }
          }}
        />
      )}

      {/* Exit App Confirmation Modal */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <span className="text-xl">📺</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">¿Deseas salir de NeshTV?</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Presiona Cancelar para seguir disfrutando del contenido o Salir para cerrar la app.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                autoFocus
                data-tv-focus="true"
                data-focus-id="btn-exit-cancel"
                onClick={() => setShowExitConfirm(false)}
                className="tv-focusable flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white transition-all cursor-pointer border border-zinc-700"
              >
                Cancelar
              </button>
              <button
                data-tv-focus="true"
                data-focus-id="btn-exit-confirm"
                onClick={() => {
                  try {
                    // Try closing Android/Electron/Browser window
                    (window as any).navigator?.app?.exitApp?.();
                    window.close();
                  } catch {}
                  setShowExitConfirm(false);
                }}
                className="tv-focusable flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-all cursor-pointer shadow-lg shadow-red-950/40"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <RemoteNavigationProvider>
      <NeshTvApp />
    </RemoteNavigationProvider>
  );
}
