import React, { useState, useEffect } from 'react';
import { NeshLogo } from './NeshLogo.tsx';
import { UserAccount, ChannelItem, VodItem, FloatingMessage } from '../types/index.ts';
import {
  Tv,
  Film,
  Clapperboard,
  Settings,
  LogOut,
  Calendar,
  Clock,
  Bell,
  Radio,
  FileCode2,
  Shield,
  Smartphone,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

interface DashboardProps {
  user: UserAccount;
  channels: ChannelItem[];
  vod: VodItem[];
  floatingMessage: FloatingMessage | null;
  onNavigate: (view: 'livetv' | 'movies' | 'series' | 'settings' | 'admin') => void;
  onLogout: () => void;
  deviceMode: 'tv' | 'mobile';
  setDeviceMode: (mode: 'tv' | 'mobile') => void;
  onRefreshData?: () => Promise<boolean>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  channels,
  vod,
  floatingMessage,
  onNavigate,
  onLogout,
  deviceMode,
  setDeviceMode,
  onRefreshData,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    setRefreshMessage('Actualizando canales y listas desde el servidor...');
    try {
      const success = await onRefreshData();
      if (success) {
        setRefreshMessage('¡Listas, canales y datos actualizados correctamente!');
      } else {
        setRefreshMessage('Sin conexión con el servidor. Mostrando datos guardados.');
      }
    } catch {
      setRefreshMessage('Error al actualizar. Comprueba tu conexión.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshMessage(null), 4000);
    }
  };

  // Intercept physical Back button on Dashboard to show Exit Confirmation instead of abrupt close
  useEffect(() => {
    const handleBackOnDashboard = (e: Event) => {
      e.preventDefault();
      setShowExitConfirm((prev) => !prev);
    };

    window.addEventListener('nesh:back', handleBackOnDashboard);
    return () => window.removeEventListener('nesh:back', handleBackOnDashboard);
  }, []);

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const movieCount = vod.filter((v) => v.type === 'movie').length;
  const seriesCount = vod.filter((v) => v.type === 'series').length;

  return (
    <div className="relative min-h-screen w-full bg-[#000000] text-white flex flex-col justify-between overflow-x-hidden p-4 md:p-8 select-none">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-1/4 w-[600px] h-[300px] bg-[#00F0FF]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[350px] bg-[#00F0FF]/5 rounded-full blur-[140px]" />
      </div>

      {/* Top Header: Logo, Time/Date, User status & Quick Actions */}
      <header className="w-full z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-6">
          <NeshLogo size="lg" showSubtitle />

          {/* Device mode toggle badge */}
          <div className="hidden sm:flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setDeviceMode('tv')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                deviceMode === 'tv'
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-semibold border border-[#00F0FF]/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Smart TV D-Pad</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-semibold border border-[#00F0FF]/50'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Móvil Touch</span>
            </button>
          </div>
        </div>

        {/* Center: Live Clock and Date */}
        <div className="flex flex-col items-start md:items-center text-left md:text-center">
          <div className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold tracking-wider font-mono text-white">
            <Clock className="w-5 h-5 text-[#00F0FF]" />
            <span className="drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">{currentTime || '00:00:00'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 capitalize mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>{currentDate}</span>
          </div>
        </div>

        {/* Right side: User expiration info & Action buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* User Account Expiry Pill */}
          <div className="bg-[#121212] border border-zinc-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>{user.username}</span>
              </div>
              <div className="text-[10px] text-zinc-400">
                Vence: <span className="text-[#00F0FF] font-semibold">{user.expiryDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Settings */}
          <button
            onClick={() => onNavigate('settings')}
            data-tv-focus="true"
            data-focus-id="btn-nav-settings"
            className="tv-focusable p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-[#00F0FF] text-zinc-300 hover:text-[#00F0FF] transition-all cursor-pointer"
            title="Ajustes del Reproductor"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            data-tv-focus="true"
            data-focus-id="btn-nav-refresh"
            className="tv-focusable p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-[#00F0FF] text-zinc-300 hover:text-[#00F0FF] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualizar Canales y Listas"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#00F0FF]' : ''}`} />
          </button>

          {/* Admin Panel button - Visible ONLY for master admin */}
          {user.id === 'usr_admin' && (
            <button
              onClick={() => onNavigate('admin')}
              data-tv-focus="true"
              data-focus-id="btn-nav-admin"
              className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 hover:border-[#00F0FF] text-[#00F0FF] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] cursor-pointer"
              title="Panel de Administración"
            >
              <Shield className="w-4 h-4 text-[#00F0FF]" />
              <span className="hidden sm:inline">Panel Admin</span>
            </button>
          )}

          {/* Download M3U Playlist */}
          <a
            href="/neshtv_channels.m3u"
            download="neshtv_channels.m3u"
            data-tv-focus="true"
            data-focus-id="btn-download-m3u"
            className="tv-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 hover:border-[#00F0FF] text-[#00F0FF] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.2)] cursor-pointer"
            title="Descargar lista M3U con los canales"
          >
            <FileCode2 className="w-4 h-4 text-[#00F0FF]" />
            <span className="hidden sm:inline">M3U</span>
          </a>

          {/* Logout */}
          <button
            onClick={onLogout}
            data-tv-focus="true"
            data-focus-id="btn-nav-logout"
            className="tv-focusable p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-red-500 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Refresh Status Toast */}
      {refreshMessage && (
        <div className="z-30 my-2 w-full bg-zinc-900 border border-[#00F0FF]/60 text-white rounded-xl p-3 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-3 animate-fade-in text-xs">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#00F0FF]' : 'text-emerald-400'} shrink-0`} />
          <span className="font-medium">{refreshMessage}</span>
        </div>
      )}

      {/* Floating Notice / Announcement Bar */}
      {floatingMessage && floatingMessage.active && (
        <aside
          role="complementary"
          aria-label="Aviso del sistema"
          className="z-20 my-3 w-full bg-gradient-to-r from-[#00F0FF]/15 via-zinc-900 to-black/80 border border-[#00F0FF]/40 rounded-xl p-3 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00F0FF]/20 text-[#00F0FF] shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.4)]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#00F0FF]">
                {floatingMessage.sender || 'Notificación del Administrador'}
              </div>
              <div className="text-xs md:text-sm text-zinc-200 font-medium">
                {floatingMessage.text}
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#00F0FF] font-semibold bg-black/40 px-2.5 py-1 rounded-md border border-[#00F0FF]/20">
            <Radio className="w-3 h-3 animate-pulse text-[#00F0FF]" />
            <span>En vivo</span>
          </div>
        </aside>
      )}

      {/* Main Big Interactive Cards (Ultra Lightweight for Android 6/7 TV Boxes - Vector Logos Only, Zero Heavy Raster Textures) */}
      <main className="z-10 my-auto py-6">
        <div className={`grid grid-cols-1 md:grid-cols-3 ${user.username.toLowerCase() === 'admin' ? 'lg:grid-cols-4' : ''} gap-5 md:gap-7`}>
          {/* Card 1: LIVE TV (TV en Vivo) */}
          <div
            onClick={() => onNavigate('livetv')}
            data-tv-focus="true"
            data-focus-id="card-live-tv"
            tabIndex={0}
            className="tv-focusable group relative h-60 md:h-72 rounded-2xl overflow-hidden cursor-pointer border-2 border-zinc-800 bg-gradient-to-br from-[#0c222b] via-[#09151b] to-black hover:border-[#00F0FF] shadow-[0_15px_35px_rgba(0,0,0,0.8)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-300 flex flex-col justify-between p-6"
          >
            {/* Top header row */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-red-500/40 text-xs font-bold text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>EN VIVO</span>
              </div>
              <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300">
                <span className="text-[#00F0FF] font-bold">{channels.length}</span> Canales
              </div>
            </div>

            {/* Center Logo Icon */}
            <div className="my-auto flex flex-col items-center justify-center text-center z-10">
              <div className="w-20 h-20 rounded-2xl bg-[#00F0FF]/15 border-2 border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.25)] group-hover:scale-110 group-hover:border-[#00F0FF] transition-transform">
                <Tv className="w-10 h-10" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-4 group-hover:text-[#00F0FF] transition-colors">
                Live TV
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Señales en directo, deportes y guía interactiva
              </p>
            </div>

            {/* Bottom action bar */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-[#00F0FF] z-10">
              <span>SINTONIZAR</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 2: MOVIES (Películas) */}
          <div
            onClick={() => onNavigate('movies')}
            data-tv-focus="true"
            data-focus-id="card-movies"
            tabIndex={0}
            className="tv-focusable group relative h-60 md:h-72 rounded-2xl overflow-hidden cursor-pointer border-2 border-zinc-800 bg-gradient-to-br from-[#1b122c] via-[#110d1c] to-black hover:border-[#00F0FF] shadow-[0_15px_35px_rgba(0,0,0,0.8)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-300 flex flex-col justify-between p-6"
          >
            <div className="flex items-center justify-between z-10">
              <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#00F0FF]/40 text-xs font-bold text-[#00F0FF]">
                <span>VOD CINE</span>
              </div>
              <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300">
                <span className="text-[#00F0FF] font-bold">{movieCount}</span> Películas
              </div>
            </div>

            <div className="my-auto flex flex-col items-center justify-center text-center z-10">
              <div className="w-20 h-20 rounded-2xl bg-[#00F0FF]/15 border-2 border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.25)] group-hover:scale-110 group-hover:border-[#00F0FF] transition-transform">
                <Film className="w-10 h-10" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-4 group-hover:text-[#00F0FF] transition-colors">
                Movies
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Catálogo de estrenos y películas bajo demanda
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-[#00F0FF] z-10">
              <span>VER CATÁLOGO</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 3: SERIES (Series) */}
          <div
            onClick={() => onNavigate('series')}
            data-tv-focus="true"
            data-focus-id="card-series"
            tabIndex={0}
            className="tv-focusable group relative h-60 md:h-72 rounded-2xl overflow-hidden cursor-pointer border-2 border-zinc-800 bg-gradient-to-br from-[#0c182b] via-[#09111f] to-black hover:border-[#00F0FF] shadow-[0_15px_35px_rgba(0,0,0,0.8)] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all duration-300 flex flex-col justify-between p-6"
          >
            <div className="flex items-center justify-between z-10">
              <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-purple-500/40 text-xs font-bold text-purple-400">
                <span>SERIES TV</span>
              </div>
              <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300">
                <span className="text-[#00F0FF] font-bold">{seriesCount}</span> Series
              </div>
            </div>

            <div className="my-auto flex flex-col items-center justify-center text-center z-10">
              <div className="w-20 h-20 rounded-2xl bg-[#00F0FF]/15 border-2 border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.25)] group-hover:scale-110 group-hover:border-[#00F0FF] transition-transform">
                <Clapperboard className="w-10 h-10" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-4 group-hover:text-[#00F0FF] transition-colors">
                Series
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Temporadas completas y episodios organizados
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-[#00F0FF] z-10">
              <span>EXPLORAR SERIES</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </main>

      {/* Exit Confirmation Dialog when user presses Back on Dashboard */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">¿Deseas salir de NeshTV?</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Puedes permanecer en el menú principal o cerrar la sesión.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                data-tv-focus="true"
                data-focus-id="btn-cancel-exit"
                className="tv-focusable flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={onLogout}
                data-tv-focus="true"
                data-focus-id="btn-confirm-exit"
                className="tv-focusable flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation Strip */}
      <footer className="w-full z-10 flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => onNavigate('settings')}
            className="hover:text-[#00F0FF] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Configuración del Reproductor</span>
          </button>
          {user.username === 'admin' && (
            <>
              <span>·</span>
              <button
                onClick={() => onNavigate('admin')}
                className="hover:text-[#00F0FF] transition-colors flex items-center gap-1.5 text-[#00F0FF] cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Panel de Administración</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-500">NeshTV v3.0 Pro IPTV</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00F0FF]" /> Control Remoto TV Box & D-Pad
          </span>
        </div>
      </footer>
    </div>
  );
};
