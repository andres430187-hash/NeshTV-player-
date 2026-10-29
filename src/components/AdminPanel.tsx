import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import {
  playUniversalStream,
  PlaybackSession,
  PlayerEngineType,
} from '../utils/iptvPlayer.ts';
import {
  UserAccount,
  ChannelItem,
  VodItem,
  IPTVPlaylist,
  FloatingMessage,
  PlayerSettings,
} from '../types/index.ts';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  Radio,
  Tv,
  Film,
  FileCode2,
  Lock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Send,
  PhoneCall,
  Save,
  RotateCw,
  LogOut,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  Activity,
  Filter,
  Volume2,
  VolumeX,
  Maximize,
  Wifi,
  WifiOff,
  Globe,
  ExternalLink,
  Sliders,
  Sparkles,
  Search,
  Server,
  Layers,
  Clock,
  Gauge,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCcw,
  Zap,
  Folder,
  FolderOpen,
  FolderLock,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ClipboardPaste,
} from 'lucide-react';

interface AdminPanelProps {
  initialAdminToken?: string;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  initialAdminToken,
  onClose,
  onRefreshData,
}) => {
  // Master auth state
  const [isAdminAuth, setIsAdminAuth] = useState(!!initialAdminToken);
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('Admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(initialAdminToken || null);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    'users' | 'contact' | 'playlists' | 'channels' | 'vod' | 'messaging' | 'apk' | 'listapro'
  >('users');

  const [listaProItems, setListaProItems] = useState<VodItem[]>([]);

  // Server data
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [contactNote, setContactNote] = useState('');
  const [playlists, setPlaylists] = useState<IPTVPlaylist[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [vod, setVod] = useState<VodItem[]>([]);

  // Monitoring & Testing states
  const [monitoredChannel, setMonitoredChannel] = useState<ChannelItem | null>(null);
  const [monitoredVod, setMonitoredVod] = useState<VodItem | null>(null);
  const [monitorStatus, setMonitorStatus] = useState<'playing' | 'buffering' | 'error' | 'idle' | 'connecting'>('idle');
  const [isMonitorMuted, setIsMonitorMuted] = useState(true);
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'unpaid'>('all');

  // URL Selection & Real-Time Monitoring states
  const [monitorSourceMode, setMonitorSourceMode] = useState<'channel' | 'custom' | 'playlist'>('channel');
  const [selectedStreamUrl, setSelectedStreamUrl] = useState<string>('');
  const [customStreamUrl, setCustomStreamUrl] = useState<string>('');
  const [customChannelName, setCustomChannelName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Canal Personalizado');
  const [useProxyStream, setUseProxyStream] = useState<boolean>(false);
  const [channelSearchTerm, setChannelSearchTerm] = useState<string>('');
  const [channelCategoryFilter, setChannelCategoryFilter] = useState<string>('all');

  // Folder & Category Browsing states (organizar por carpetas según su nombre)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');
  const [channelPage, setChannelPage] = useState<number>(1);
  const [batchUpdatingCategory, setBatchUpdatingCategory] = useState<string | null>(null);
  const CHANNELS_PER_PAGE = 36;
  const [realResolution, setRealResolution] = useState<string>('Detectando...');
  const [realBufferSec, setRealBufferSec] = useState<number>(0);
  const [pingResult, setPingResult] = useState<{
    online: boolean;
    statusCode?: number;
    latencyMs?: number;
    contentType?: string;
    error?: string;
  } | null>(null);
  const [checkingPing, setCheckingPing] = useState(false);
  const [monitorErrorDetail, setMonitorErrorDetail] = useState<string | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  // Playlist sync and testing states
  const [syncingPlaylistId, setSyncingPlaylistId] = useState<string | null>(null);
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [syncResultModal, setSyncResultModal] = useState<any | null>(null);
  const [autoSyncOnSave, setAutoSyncOnSave] = useState(true);

  const channelVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelHlsRef = useRef<Hls | null>(null);
  const monitorSessionRef = useRef<PlaybackSession | null>(null);
  const [monitorEngine, setMonitorEngine] = useState<PlayerEngineType>('hls');
  const [floatingMsg, setFloatingMsg] = useState<FloatingMessage>({
    id: '1',
    text: '',
    sender: 'Administrador NeshTV',
    targetUserId: 'all',
    active: true,
    type: 'info',
    createdAt: '',
  });

  // UI helpers
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'blocked'>('active');
  const [formNotes, setFormNotes] = useState('');
  const [formAssignedList, setFormAssignedList] = useState<'all' | 'standard' | 'listapro'>('all');

  const [showListAPraPasteModal, setShowListAPraPasteModal] = useState(false);
  const [listProTitle, setListProTitle] = useState('');
  const [listProUrl, setListProUrl] = useState('');
  const [listProCategory, setListProCategory] = useState('Lista Pro VIP');

  const handleSaveListProPaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listProTitle.trim() || !listProUrl.trim() || !adminToken) {
      showToast('Ingresa título y URL');
      return;
    }
    try {
      const res = await fetch('/api/admin/listapro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: listProTitle.trim(),
          url: listProUrl.trim(),
          category: listProCategory.trim() || 'Lista Pro VIP',
          type: listProTitle.toLowerCase().includes('serie') ? 'series' : 'movie',
          year: 2026,
          rating: '9.5',
          poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
          synopsis: 'Elemento pegado y añadido desde el panel administrativo.',
          isListaPro: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setListaProItems(prev => [data.item, ...prev]);
        showToast('✓ Elemento agregado a Lista Pro correctamente');
        setShowListAPraPasteModal(false);
        setListProTitle('');
        setListProUrl('');
      } else {
        showToast('Error al agregar elemento');
      }
    } catch {
      showToast('Error de red al agregar elemento');
    }
  };

  const handleCopyFolderToListaPro = async (folder: { name: string; channels: ChannelItem[] }) => {
    if (!adminToken) return;
    try {
      showToast(`Copiando carpeta "${folder.name}" a Lista Pro...`);
      let count = 0;
      for (const ch of folder.channels) {
        const res = await fetch('/api/admin/listapro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            title: `${ch.name} [${folder.name}]`,
            url: ch.url,
            category: folder.name,
            type: 'movie',
            year: 2026,
            rating: '9.5',
            poster: ch.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80',
            synopsis: `Carpeta copiada desde Monitor: ${folder.name}`,
            isListaPro: true,
          }),
        });
        if (res.ok) count++;
      }
      showToast(`✓ ¡Carpeta "${folder.name}" copiada con éxito a Lista Pro (${count} canales)!`);
    } catch (err) {
      showToast('Error al copiar carpeta a Lista Pro');
    }
  };

  const handleDeleteFolder = (folderName: string) => {
    if (!window.confirm(`¿Estás seguro de borrar toda la carpeta "${folderName}" y todos sus canales?`)) return;
    const remainingChannels = channels.filter(c => (c.category?.trim() || 'Sin Categoría') !== folderName);
    setChannels(remainingChannels);
    if (selectedCategory === folderName) {
      setSelectedCategory(null);
    }
    showToast(`✓ Carpeta "${folderName}" eliminada correctamente`);
  };

  const [moviePage, setMoviePage] = useState<number>(1);
  const [seriesPage, setSeriesPage] = useState<number>(1);
  const VOD_PER_PAGE = 20;

  // Playlist modal state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [plName, setPlName] = useState('');
  const [plType, setPlType] = useState<'m3u' | 'xtream'>('m3u');
  const [plUrl, setPlUrl] = useState('');
  const [plUser, setPlUser] = useState('');
  const [plPass, setPlPass] = useState('');

  // VOD Add Modal state (Requirement: agregar url o lista m3u, mp4 para agregar peliculas series y seleccionar autom/manual donde iran)
  const [showVodModal, setShowVodModal] = useState(false);
  const [vodTitle, setVodTitle] = useState('');
  const [vodUrl, setVodUrl] = useState('');
  const [vodClassification, setVodClassification] = useState<'auto' | 'movie' | 'series'>('auto');
  const [vodCategory, setVodCategory] = useState('');
  const [vodYear, setVodYear] = useState(2026);
  const [vodRating, setVodRating] = useState('9.4');
  const [vodPoster, setVodPoster] = useState('');
  const [vodSynopsis, setVodSynopsis] = useState('');
  const [vodSubTab, setVodSubTab] = useState<'movies' | 'series'>('movies');
  const [vodSortMode, setVodSortMode] = useState<'newest' | 'oldest' | 'rating' | 'alpha'>('newest');

  useEffect(() => {
    setMoviePage(1);
    setSeriesPage(1);
  }, [vodSubTab, vodSortMode]);

  const handleAiSortAndDetectYears = () => {
    const updated = vod.map(item => {
      let inferredYear = Number(item.year) || 2024;
      const titleLower = item.title.toLowerCase();
      const yearMatch = titleLower.match(/\b(2026|2025|2024|2023|2022|2021|2020|2019|2018|2017|2016|2015)\b/);
      if (yearMatch) {
        inferredYear = parseInt(yearMatch[1], 10);
      } else if (titleLower.includes('2026') || titleLower.includes('estreno 2026')) {
        inferredYear = 2026;
      } else if (titleLower.includes('2025') || titleLower.includes('temporada 2025')) {
        inferredYear = 2025;
      } else if (titleLower.includes('2') || titleLower.includes('ii') || titleLower.includes('parte dos') || titleLower.includes('part 2')) {
        inferredYear = 2025;
      }
      return { ...item, year: inferredYear };
    });
    setVod(updated);
    setVodSortMode('newest');
    showToast('✨ IA NeshTV: Títulos analizados, años detectados y ordenados de más nuevos (2026) a antiguos');
  };

  const handleSaveVod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vodTitle || !vodUrl) {
      showToast('Título y URL son obligatorios');
      return;
    }
    try {
      const res = await fetch('/api/admin/vod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken || 'nesh_admin_token'}`
        },
        body: JSON.stringify({
          title: vodTitle,
          url: vodUrl,
          type: vodClassification === 'auto' ? undefined : vodClassification,
          category: vodCategory || undefined,
          year: Number(vodYear) || 2026,
          rating: vodRating,
          poster: vodPoster || undefined,
          synopsis: vodSynopsis || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Película o serie agregada y clasificada correctamente');
        setShowVodModal(false);
        setVodTitle('');
        setVodUrl('');
        setVodCategory('');
        setVodSynopsis('');
        setVodPoster('');
        if (onRefreshData) onRefreshData();
        const adminRes = await fetch('/api/admin/data', {
          headers: { 'Authorization': `Bearer ${adminToken || 'nesh_admin_token'}` }
        });
        const adminData = await adminRes.json();
        if (adminRes.ok) {
          setVod(adminData.vod || []);
        }
      } else {
        showToast(data.error || 'Error al agregar VOD');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al agregar VOD');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminAuth(true);
        setAdminToken(data.token);
        loadAdminData(data.token);
      } else {
        setLoginError(data.message || 'Credenciales maestras inválidas');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor');
    }
  };

  const loadAdminData = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setContactNote(data.contactNote || '');
        setPlaylists(data.playlists || []);
        setChannels(data.channels || []);
        setVod(data.vod || []);
        setListaProItems(data.listaProItems || []);
        if (data.channels && data.channels.length > 0) {
          setMonitoredChannel((prev) => {
            const current = prev ? data.channels.find((c: any) => c.id === prev.id) : null;
            return current || data.channels[0];
          });
          setSelectedStreamUrl((prev) => prev || (data.channels[0]?.url || ''));
        }
        if (data.vod && data.vod.length > 0) {
          setMonitoredVod((prev) => prev || data.vod[0]);
        }
        if (data.floatingMessage) setFloatingMsg(data.floatingMessage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-authenticate and load data on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = initialAdminToken || adminToken;
      if (token) {
        setIsAdminAuth(true);
        setAdminToken(token);
        loadAdminData(token);
        return;
      }
      try {
        const res = await fetch('/api/auth/master-access', { method: 'POST' });
        const data = await res.json();
        if (data.token) {
          setIsAdminAuth(true);
          setAdminToken(data.token);
          loadAdminData(data.token);
        }
      } catch (err) {
        console.warn('Auto admin login fallback:', err);
      }
    };
    initAuth();
  }, [initialAdminToken]);

  const activeRawUrl = useMemo(() => {
    if (monitorSourceMode === 'custom' && customStreamUrl.trim()) {
      return customStreamUrl.trim();
    }
    if (selectedStreamUrl) {
      return selectedStreamUrl;
    }
    return monitoredChannel?.url || '';
  }, [monitorSourceMode, customStreamUrl, selectedStreamUrl, monitoredChannel]);

  const effectivePlaybackUrl = useMemo(() => {
    if (!activeRawUrl) return '';
    if (useProxyStream) {
      return `/api/proxy/stream?url=${encodeURIComponent(activeRawUrl)}`;
    }
    return activeRawUrl;
  }, [activeRawUrl, useProxyStream]);

  const channelFolders = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        channels: ChannelItem[];
        total: number;
        active: number;
        blocked: number;
      }
    >();

    for (const ch of channels) {
      const cat = ch.category?.trim() || 'Sin Categoría';
      let folder = map.get(cat);
      if (!folder) {
        folder = {
          name: cat,
          channels: [],
          total: 0,
          active: 0,
          blocked: 0,
        };
        map.set(cat, folder);
      }
      folder.channels.push(ch);
      folder.total++;
      if (ch.isBlocked) {
        folder.blocked++;
      } else {
        folder.active++;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const aArg = a.name.toLowerCase().includes('argentina');
      const bArg = b.name.toLowerCase().includes('argentina');
      if (aArg && !bArg) return -1;
      if (!aArg && bArg) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [channels]);

  const filteredFolders = useMemo(() => {
    if (!categorySearchTerm.trim()) return channelFolders;
    const term = categorySearchTerm.toLowerCase();
    return channelFolders.filter((f) => f.name.toLowerCase().includes(term));
  }, [channelFolders, categorySearchTerm]);

  const currentCategoryFolder = useMemo(() => {
    if (!selectedCategory) return null;
    return channelFolders.find((f) => f.name === selectedCategory) || null;
  }, [channelFolders, selectedCategory]);

  const displayedChannels = useMemo(() => {
    let list: ChannelItem[] = [];
    if (selectedCategory) {
      const folder = channelFolders.find((f) => f.name === selectedCategory);
      list = folder ? folder.channels : [];
    } else if (channelSearchTerm.trim()) {
      const term = channelSearchTerm.toLowerCase();
      list = channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(term) ||
          ch.number.toString().includes(term) ||
          (ch.category && ch.category.toLowerCase().includes(term))
      );
    } else {
      return [];
    }

    if (channelSearchTerm.trim() && selectedCategory) {
      const term = channelSearchTerm.toLowerCase();
      list = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(term) ||
          ch.number.toString().includes(term)
      );
    }

    return list;
  }, [channelFolders, selectedCategory, channelSearchTerm, channels]);

  const totalPages = Math.max(1, Math.ceil(displayedChannels.length / CHANNELS_PER_PAGE));
  const paginatedChannels = useMemo(() => {
    const start = (channelPage - 1) * CHANNELS_PER_PAGE;
    return displayedChannels.slice(start, start + CHANNELS_PER_PAGE);
  }, [displayedChannels, channelPage]);

  const handleCheckPing = useCallback(async (urlToCheck?: string) => {
    const targetUrl = urlToCheck || activeRawUrl;
    if (!targetUrl) return;
    setCheckingPing(true);
    try {
      const res = await fetch('/api/admin/channels/test-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setPingResult({
        online: false,
        error: err.message || 'Error de conexión',
      });
    } finally {
      setCheckingPing(false);
    }
  }, [activeRawUrl]);

  const retryMonitoredStream = useCallback(() => {
    if (!channelVideoRef.current || !activeRawUrl) return;
    setUptimeSeconds(0);
    setMonitorStatus('buffering');
    setMonitorErrorDetail(null);
    setRealResolution('Detectando...');
    setRealBufferSec(0);

    if (monitorSessionRef.current) {
      monitorSessionRef.current.destroy();
      monitorSessionRef.current = null;
    }

    const session = playUniversalStream({
      url: activeRawUrl,
      video: channelVideoRef.current,
      forceProxy: useProxyStream,
      onStatusChange: (status, detail) => {
        setMonitorStatus(status);
        if (detail) setMonitorErrorDetail(detail);
      },
      onEngineChange: (engine) => {
        setMonitorEngine(engine);
      },
    });

    monitorSessionRef.current = session;
    handleCheckPing(activeRawUrl);
  }, [activeRawUrl, useProxyStream, handleCheckPing]);

  useEffect(() => {
    if (!activeRawUrl || !channelVideoRef.current) return;
    const video = channelVideoRef.current;

    setUptimeSeconds(0);
    setMonitorStatus('buffering');
    setMonitorErrorDetail(null);
    setRealResolution('Detectando...');
    setRealBufferSec(0);

    if (monitorSessionRef.current) {
      monitorSessionRef.current.destroy();
      monitorSessionRef.current = null;
    }

    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setRealResolution(`${video.videoWidth}x${video.videoHeight}`);
      }
    };
    const handleTimeUpdate = () => {
      if (video.buffered.length > 0) {
        const cur = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= cur && cur <= video.buffered.end(i)) {
            setRealBufferSec(Math.round((video.buffered.end(i) - cur) * 10) / 10);
            break;
          }
        }
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    const session = playUniversalStream({
      url: activeRawUrl,
      video,
      forceProxy: useProxyStream,
      onStatusChange: (status, detail) => {
        setMonitorStatus(status);
        if (detail) setMonitorErrorDetail(detail);
      },
      onEngineChange: (engine) => {
        setMonitorEngine(engine);
      },
    });
    monitorSessionRef.current = session;

    handleCheckPing(activeRawUrl);

    const timer = setInterval(() => {
      if (video && !video.paused && !video.ended && video.readyState >= 3) {
        setUptimeSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      session.destroy();
    };
  }, [activeRawUrl, useProxyStream, handleCheckPing]);

  const handleSaveCustomAsChannel = async () => {
    if (!customStreamUrl.trim()) {
      showToast('Ingresa una URL válida');
      return;
    }
    const name = customChannelName.trim() || `Canal Directo ${channels.length + 1}`;
    const category = customCategory.trim() || 'Canales Directos';

    try {
      const res = await fetch('/api/admin/channels/add-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name,
          url: customStreamUrl.trim(),
          category,
          logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&auto=format&fit=crop&q=80',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Canal "${name}" guardado exitosamente`);
        if (adminToken) loadAdminData(adminToken);
        onRefreshData?.();
      }
    } catch {
      showToast('Error al guardar el canal');
    }
  };

  const handleSyncPlaylist = async (pl: IPTVPlaylist) => {
    setSyncingPlaylistId(pl.id);
    try {
      const res = await fetch(`/api/admin/playlists/${pl.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      setSyncResultModal({
        playlistName: pl.name,
        playlistUrl: pl.url,
        ...data,
      });
      if (adminToken) loadAdminData(adminToken);
      onRefreshData?.();
    } catch (err: any) {
      setSyncResultModal({
        playlistName: pl.name,
        playlistUrl: pl.url,
        works: false,
        message: 'Error de red al conectar con el servidor: ' + (err.message || 'Error desconocido'),
      });
    } finally {
      setSyncingPlaylistId(null);
    }
  };

  const handleTestModalUrl = async () => {
    if (!plUrl.trim()) {
      showToast('Ingresa una URL para probar');
      return;
    }
    setTestingUrl(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/playlists/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          url: plUrl.trim(),
          username: plUser.trim(),
          password: plPass.trim(),
          type: plType,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        works: false,
        message: 'Error al probar la URL: ' + (err.message || 'Error de conexión'),
      });
    } finally {
      setTestingUrl(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    let token = adminToken;
    if (!token) {
      try {
        const authRes = await fetch('/api/auth/master-access', { method: 'POST' });
        const authData = await authRes.json();
        if (authData.token) {
          token = authData.token;
          setAdminToken(authData.token);
        }
      } catch (err) {
        token = 'nesh_admin_token_master';
      }
    }

    if (!formUsername.trim() || !formPassword.trim() || !formExpiry.trim()) {
      showToast('⚠️ Completa usuario, contraseña y fecha de vencimiento');
      return;
    }

    try {
      if (editingUserId) {
        const res = await fetch(`/api/admin/users/${editingUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: formUsername.trim(),
            password: formPassword.trim(),
            expiryDate: formExpiry.trim(),
            status: formStatus,
            notes: formNotes.trim(),
            assignedList: formAssignedList,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`✓ Usuario "${formUsername}" actualizado con éxito`);
          if (token) loadAdminData(token);
          setShowUserModal(false);
          onRefreshData?.();
        } else {
          showToast('Error al actualizar usuario: ' + (data.error || 'Fallo'));
        }
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: formUsername.trim(),
            password: formPassword.trim(),
            expiryDate: formExpiry.trim(),
            status: formStatus,
            notes: formNotes.trim(),
            assignedList: formAssignedList,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`✓ Usuario "${formUsername}" guardado en la base de datos.`);
          if (token) loadAdminData(token);
          setShowUserModal(false);
          onRefreshData?.();
        } else {
          showToast('Error al crear usuario: ' + (data.error || 'Fallo'));
        }
      }
    } catch (err) {
      showToast('Error de red al guardar usuario');
    }
  };

  const handleToggleUserStatus = async (user: UserAccount) => {
    if (!adminToken) return;
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(
          newStatus === 'blocked'
            ? `Usuario ${user.username} suspendido por falta de pago`
            : `Usuario ${user.username} reactivado con éxito`
        );
        loadAdminData(adminToken);
      }
    } catch (err) {
      alert('Error actualizando estado');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!adminToken) return;
    if (name.toLowerCase() === 'admin') {
      showToast('⚠️ No es posible eliminar al Administrador Principal');
      return;
    }

    try {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast(`✓ Usuario "${name}" eliminado por completo`);

      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        loadAdminData(adminToken);
      }
    } catch (err) {
      showToast('Error al eliminar usuario');
      loadAdminData(adminToken);
    }
  };

  const openCreateUserModal = () => {
    setEditingUserId(null);
    setFormUsername('');
    setFormPassword('');
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    setFormExpiry(futureDate.toISOString().split('T')[0]);
    setFormStatus('active');
    setFormNotes('');
    setFormAssignedList('all');
    setShowUserModal(true);
  };

  const openEditUserModal = (u: UserAccount) => {
    setEditingUserId(u.id);
    setFormUsername(u.username);
    setFormPassword(u.password || '');
    setFormExpiry(u.expiryDate);
    setFormStatus(u.status);
    setFormNotes(u.notes || '');
    setFormAssignedList(u.assignedList || 'all');
    setShowUserModal(true);
  };

  const handleSaveContactNote = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/contact-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ note: contactNote }),
      });
      if (res.ok) {
        showToast('Nota de contacto actualizada en tiempo real');
      }
    } catch (err) {
      alert('Error guardando nota');
    }
  };

  const handleSaveFloatingMessage = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/floating-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(floatingMsg),
      });
      if (res.ok) {
        showToast('Mensaje flotante enviado a la interfaz del usuario');
      }
    } catch (err) {
      alert('Error enviando mensaje');
    }
  };

  const handleToggleChannelBlock = async (ch: ChannelItem) => {
    if (!adminToken) return;
    try {
      const nextBlocked = !ch.isBlocked;
      setMonitoredChannel((prev) => (prev && prev.id === ch.id ? { ...prev, isBlocked: nextBlocked } : prev));
      setChannels((prev) => prev.map((c) => (c.id === ch.id ? { ...c, isBlocked: nextBlocked } : c)));

      const res = await fetch(`/api/admin/channels/${ch.id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ blocked: nextBlocked }),
      });
      if (res.ok) {
        showToast(
          nextBlocked ? `Canal ${ch.name} BLOQUEADO (Oculto en la App)` : `Canal ${ch.name} DESBLOQUEADO (Visible en la App)`
        );
        loadAdminData(adminToken);
        onRefreshData?.();
      }
    } catch (err) {
      alert('Error modificando canal');
    }
  };

  const handleToggleCategoryBlock = async (categoryName: string, shouldBlock: boolean) => {
    if (!adminToken) return;
    try {
      setBatchUpdatingCategory(categoryName);
      setChannels((prev) =>
        prev.map((c) => {
          const cat = c.category?.trim() || 'Sin Categoría';
          if (cat === categoryName.trim()) {
            return { ...c, isBlocked: shouldBlock };
          }
          return c;
        })
      );
      if (monitoredChannel) {
        const curCat = monitoredChannel.category?.trim() || 'Sin Categoría';
        if (curCat === categoryName.trim()) {
          setMonitoredChannel((prev) => (prev ? { ...prev, isBlocked: shouldBlock } : null));
        }
      }

      const res = await fetch('/api/admin/channels-category/toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ category: categoryName, blocked: shouldBlock }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          shouldBlock
            ? `📁 Carpeta "${categoryName}" BLOQUEADA (${data.updatedCount || 0} canales ocultos)`
            : `📁 Carpeta "${categoryName}" DESBLOQUEADA (${data.updatedCount || 0} canales visibles)`
        );
        loadAdminData(adminToken);
        onRefreshData?.();
      } else {
        showToast('Error al modificar carpeta');
      }
    } catch (err) {
      showToast('Error de conexión al modificar carpeta');
    } finally {
      setBatchUpdatingCategory(null);
    }
  };

  const handleToggleVodBlock = async (item: VodItem) => {
    if (!adminToken) return;
    try {
      const nextBlocked = !item.isBlocked;
      setMonitoredVod((prev) => (prev && prev.id === item.id ? { ...prev, isBlocked: nextBlocked } : prev));
      setVod((prev) => prev.map((v) => (v.id === item.id ? { ...v, isBlocked: nextBlocked } : v)));

      const res = await fetch(`/api/admin/vod/${item.id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ blocked: nextBlocked }),
      });
      if (res.ok) {
        showToast(
          nextBlocked
            ? `Película "${item.title}" BLOQUEADA (Oculta para usuarios)`
            : `Película "${item.title}" HABILITADA (Visible en catálogo)`
        );
        loadAdminData(adminToken);
        onRefreshData?.();
      }
    } catch (err) {
      alert('Error modificando película');
    }
  };

  const handlePurgeUnpaidUsers = async () => {
    if (!adminToken) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      setUsers((prev) =>
        prev.filter(
          (u) =>
            u.username.toLowerCase() === 'admin' ||
            (u.status !== 'blocked' && u.expiryDate >= todayStr)
        )
      );
      showToast('Eliminando usuarios no pagados de forma definitiva...');

      const res = await fetch('/api/admin/users/purge-unpaid', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✓ ${data.deletedCount} usuario(s) no pagados eliminados por completo`);
        loadAdminData(adminToken);
      }
    } catch (err) {
      showToast('Error al eliminar usuarios no pagados');
      loadAdminData(adminToken);
    }
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      showToast('Guardando y validando lista...');
      const res = await fetch('/api/admin/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: plName.trim(),
          type: plType,
          url: plUrl.trim(),
          username: plUser.trim(),
          password: plPass.trim(),
          autoSync: autoSyncOnSave,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.works) {
          showToast(`✓ ¡Lista IPTV sincronizada con éxito! (${data.playlist?.channelCount || 0} canales cargados)`);
          if (data.syncResult) {
            setSyncResultModal({
              playlistName: plName,
              playlistUrl: plUrl,
              ...data.syncResult,
            });
          }
        } else {
          showToast(`⚠️ Lista guardada. Nota: La URL no respondió o tiene errores de conexión.`);
        }
        loadAdminData(adminToken);
        onRefreshData?.();
        setShowPlaylistModal(false);
        setPlName('');
        setPlUrl('');
        setPlUser('');
        setPlPass('');
        setTestResult(null);
      } else {
        alert(data.error || 'Error al guardar lista');
      }
    } catch (err: any) {
      alert('Error guardando lista: ' + (err.message || 'Error'));
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/playlists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        showToast('Lista eliminada');
        loadAdminData(adminToken);
      }
    } catch (err) {
      alert('Error eliminando lista');
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (!isAdminAuth) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Panel de Administración Privado</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-zinc-400 mt-3 mb-6">
            Acceso restringido para el control de usuarios, listas IPTV, bloqueo de canales y notas institucionales.
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
                Usuario Maestro
              </label>
              <input
                type="text"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#00F0FF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
                Contraseña Maestra
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Ingresa tu contraseña maestra"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-black border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch('/api/auth/master-access', { method: 'POST' });
                  const data = await res.json();
                  if (data.token) {
                    setIsAdminAuth(true);
                    setAdminToken(data.token);
                    loadAdminData(data.token);
                    return;
                  }
                } catch {}
                handleAdminLogin();
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#00F0FF]/20 via-zinc-800 to-black hover:from-[#00F0FF]/30 border border-[#00F0FF]/40 rounded-xl text-xs font-bold text-[#00F0FF] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            >
              <Zap className="w-4 h-4 text-[#00F0FF]" />
              <span>Ingreso Inmediato como Propietario (1-Clic)</span>
            </button>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>ACCEDER AL PANEL</span>
              </button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-1.5 text-center">
            <div className="bg-black/60 p-2 rounded-lg border border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-300">
              <span>Credenciales Maestras:</span>
              <span className="font-mono text-[#00F0FF] font-bold">admin / Admin2026</span>
              <button
                type="button"
                onClick={() => {
                  setAdminUser('admin');
                  setAdminPass('Admin2026');
                  showToast('Credenciales autorrellenadas');
                }}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-200"
              >
                Autorrellenar
              </button>
            </div>
            <div className="text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-[#00F0FF]" />
              <span>Acceso de control exclusivo para el propietario NeshTV</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col text-white select-none overflow-hidden">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#00F0FF] text-black font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <header className="px-6 py-3.5 bg-[#0e0e0e] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <span>NeshTV</span>
              <span className="text-[#00F0FF] text-xs font-mono uppercase bg-black px-2 py-0.5 rounded border border-[#00F0FF]/40">
                Web Admin Panel
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">
              Administración Centralizada de Usuarios, Listas M3U y Canales
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => adminToken && loadAdminData(adminToken)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-[#00F0FF] border border-zinc-800 transition-colors"
            title="Recargar datos"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00F0FF]' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Volver a la App
          </button>
        </div>
      </header>

      <div className="px-6 bg-[#0a0a0a] border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'users', label: 'Gestión de Usuarios', icon: Users, count: users.length },
          { id: 'channels', label: 'Monitor & Bloqueo Canales', icon: Tv, count: channels.length },
          { id: 'vod', label: 'Películas & Series (VOD)', icon: Film, count: vod.length },
          { id: 'listapro', label: '⭐ Lista Pro (VIP)', icon: Sparkles, count: listaProItems.length },
          { id: 'playlists', label: 'Listas IPTV (M3U)', icon: Radio, count: playlists.length },
          { id: 'contact', label: 'Nota de Contacto', icon: PhoneCall },
          { id: 'messaging', label: 'Mensajería Flotante', icon: MessageSquare },
          { id: 'apk', label: 'Guía Compilación APK', icon: FileCode2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#00F0FF] text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto p-6 bg-[#060606]">
        {activeTab === 'users' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00F0FF]" />
                  <span>Usuarios y Suscripciones NeshTV</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Control de pagos: suspende o elimina cuentas vencidas para restringir el acceso
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handlePurgeUnpaidUsers}
                  className="px-3.5 py-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
                  title="Eliminar todos los usuarios con suscripción vencida o bloqueados"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>ELIMINAR USUARIOS SIN PAGAR</span>
                </button>

                <button
                  onClick={openCreateUserModal}
                  className="px-4 py-2 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.35)] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>NUEVO USUARIO</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  userFilter === 'all'
                    ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                onClick={() => setUserFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  userFilter === 'active'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Al Día / Activos ({users.filter((u) => u.status === 'active' && new Date(u.expiryDate) >= new Date()).length})
              </button>
              <button
                onClick={() => setUserFilter('unpaid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  userFilter === 'unpaid'
                    ? 'bg-red-500 text-white font-bold'
                    : 'bg-zinc-900 text-red-400 hover:text-red-300 border border-red-900/60'
                }`}
              >
                ⚠️ No Pagados / Vencidos ({users.filter((u) => u.status === 'blocked' || new Date(u.expiryDate) < new Date()).length})
              </button>
            </div>

            <div className="bg-[#101010] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Contraseña</th>
                      <th className="py-3 px-4">Vencimiento</th>
                      <th className="py-3 px-4">Estado de Pago</th>
                      <th className="py-3 px-4">Notas / Plan</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {users
                      .filter((u) => {
                        const isExpired = new Date(u.expiryDate) < new Date();
                        const isUnpaid = u.status === 'blocked' || isExpired;
                        if (userFilter === 'active') return u.status === 'active' && !isExpired;
                        if (userFilter === 'unpaid') return isUnpaid;
                        return true;
                      })
                      .map((u) => {
                        const isExpired = new Date(u.expiryDate) < new Date();
                      return (
                        <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                            <span>{u.username}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-300">
                            {u.password}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className={isExpired ? 'text-red-400 font-bold' : 'text-zinc-300'}>
                              {u.expiryDate}
                            </span>
                            {isExpired && (
                              <span className="ml-2 text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800">
                                Vencido
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {u.status === 'active' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800">
                                <XCircle className="w-3 h-3" /> Suspendido
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate">
                            {u.notes || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                u.status === 'active'
                                  ? 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80'
                              }`}
                              title={
                                u.status === 'active'
                                  ? 'Bloquear acceso por falta de pago'
                                  : 'Reactivar acceso'
                              }
                            >
                              {u.status === 'active' ? 'Suspender' : 'Reactivar'}
                            </button>
                            <button
                              onClick={() => openEditUserModal(u)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              title="Editar usuario"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#101010] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Nota de Contacto / Institucional (Pantalla de Inicio)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Este texto se actualiza en tiempo real en el pie de página de la pantalla de inicio de la aplicación.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Mensaje de atención al cliente / WhatsApp:
                  </label>
                  <textarea
                    rows={3}
                    value={contactNote}
                    onChange={(e) => setContactNote(e.target.value)}
                    placeholder="Ej: Para solicitar nuevas cuentas, renovaciones o soporte técnico, contáctanos vía WhatsApp al +52 55 1234 5678"
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00F0FF] leading-relaxed"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                    Vista previa de cómo lo verán los clientes en el Login:
                  </span>
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-zinc-300">
                    <PhoneCall className="w-4 h-4 text-[#00F0FF] shrink-0" />
                    <span>{contactNote || 'Sin nota de contacto configurada'}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveContactNote}
                    className="px-5 py-2.5 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>GUARDAR NOTA EN TIEMPO REAL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#00F0FF]" />
                  <span>Listas y Servidores IPTV</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Sincroniza y valida enlaces M3U y servidores Xtream Codes. El sistema comprueba si la URL funciona o no en tiempo real.
                </p>
              </div>
              <button
                onClick={() => {
                  setTestResult(null);
                  setShowPlaylistModal(true);
                }}
                className="px-4 py-2.5 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.35)] cursor-pointer transition-transform hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>AGREGAR LISTA IPTV</span>
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-black p-4 rounded-2xl border border-blue-500/30 flex items-start gap-3.5 shadow-lg">
              <div className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-white text-sm">
                  ¿Por qué no aparecían los canales de tu URL?
                </p>
                <p className="text-zinc-300 leading-relaxed">
                  Para que los canales aparezcan en la aplicación, la URL debe ser verificada y procesada por el servidor. Al pulsar <strong className="text-[#00F0FF]">"Sincronizar & Validar"</strong>, NeshTV conecta con tu proveedor, mide el tiempo de respuesta, detecta si la URL funciona o está caída, y descarga automáticamente todos los canales a tu menú.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlists.map((pl) => {
                const isSyncing = syncingPlaylistId === pl.id;
                const isWorking = pl.status === 'working';
                const isFailed = pl.status === 'failed';

                return (
                  <div
                    key={pl.id}
                    className={`bg-[#101010] border rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all ${
                      isWorking
                        ? 'border-emerald-800/80 hover:border-emerald-500/80 shadow-[0_5px_25px_rgba(16,185,129,0.1)]'
                        : isFailed
                        ? 'border-red-800/80 hover:border-red-500/80'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-[#00F0FF]/15 text-[#00F0FF] px-2.5 py-0.5 rounded-md border border-[#00F0FF]/30 uppercase font-mono">
                            {pl.type.toUpperCase()}
                          </span>
                          {pl.channelCount > 0 && (
                            <span className="text-xs font-bold bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-md text-zinc-300">
                              {pl.channelCount} Canales
                            </span>
                          )}
                          {pl.vodCount !== undefined && pl.vodCount > 0 && (
                            <span className="text-xs bg-purple-950/60 border border-purple-800 text-purple-300 px-2 py-0.5 rounded-md">
                              {pl.vodCount} VOD
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isWorking ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>FUNCIONA {pl.latencyMs ? `(${pl.latencyMs}ms)` : ''}</span>
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-700">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              <span>NO FUNCIONA</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                              <span>Sin Probar</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-white mb-1">{pl.name}</h4>

                      <div className="relative group/url my-2">
                        <div className="text-[11px] font-mono text-zinc-300 bg-black/80 p-2.5 rounded-xl border border-zinc-800 truncate pr-8 select-all">
                          {pl.url}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(pl.url, `pl_${pl.id}`)}
                          className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-white"
                          title="Copiar URL"
                        >
                          {copiedSection === `pl_${pl.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 my-2 pt-2 border-t border-zinc-800/60">
                        <div>
                          Usuario: <span className="text-zinc-200 font-semibold">{pl.username || 'No requerido'}</span>
                        </div>
                        <div>
                          Vigencia: <span className="text-[#00F0FF] font-semibold">{pl.expDate || 'Ilimitada'}</span>
                        </div>
                        <div className="col-span-2 text-[10px] text-zinc-500">
                          Última sinc: {new Date(pl.lastSynced).toLocaleString('es-ES')}
                        </div>
                      </div>

                      <div className="mt-2.5 p-3 rounded-xl bg-black/60 border border-zinc-800 space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Contenido visible desde esta lista:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-zinc-300">
                            <input
                              type="checkbox"
                              checked={pl.enableChannels !== false}
                              onChange={async (e) => {
                                const nextVal = e.target.checked;
                                try {
                                  const res = await fetch(`/api/admin/playlists/${pl.id}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${adminToken}`,
                                    },
                                    body: JSON.stringify({ enableChannels: nextVal }),
                                  });
                                  if (res.ok) {
                                    setPlaylists(prev => prev.map(p => p.id === pl.id ? { ...p, enableChannels: nextVal } : p));
                                    showToast(nextVal ? 'Canales habilitados' : 'Canales bloqueados en esta lista');
                                  }
                                } catch {
                                  showToast('Error al actualizar');
                                }
                              }}
                              className="w-3.5 h-3.5 accent-[#00F0FF] rounded cursor-pointer"
                            />
                            <span>📺 Canales</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-zinc-300">
                            <input
                              type="checkbox"
                              checked={pl.enableMovies !== false}
                              onChange={async (e) => {
                                const nextVal = e.target.checked;
                                try {
                                  const res = await fetch(`/api/admin/playlists/${pl.id}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${adminToken}`,
                                    },
                                    body: JSON.stringify({ enableMovies: nextVal }),
                                  });
                                  if (res.ok) {
                                    setPlaylists(prev => prev.map(p => p.id === pl.id ? { ...p, enableMovies: nextVal } : p));
                                    showToast(nextVal ? 'Películas habilitadas' : 'Películas bloqueadas en esta lista');
                                  }
                                } catch {
                                  showToast('Error al actualizar');
                                }
                              }}
                              className="w-3.5 h-3.5 accent-[#00F0FF] rounded cursor-pointer"
                            />
                            <span>🎬 Películas</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-zinc-300">
                            <input
                              type="checkbox"
                              checked={pl.enableSeries !== false}
                              onChange={async (e) => {
                                const nextVal = e.target.checked;
                                try {
                                  const res = await fetch(`/api/admin/playlists/${pl.id}`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${adminToken}`,
                                    },
                                    body: JSON.stringify({ enableSeries: nextVal }),
                                  });
                                  if (res.ok) {
                                    setPlaylists(prev => prev.map(p => p.id === pl.id ? { ...p, enableSeries: nextVal } : p));
                                    showToast(nextVal ? 'Series habilitadas' : 'Series bloqueadas en esta lista');
                                  }
                                } catch {
                                  showToast('Error al actualizar');
                                }
                              }}
                              className="w-3.5 h-3.5 accent-[#00F0FF] rounded cursor-pointer"
                            />
                            <span>📺 Series</span>
                          </label>
                        </div>
                      </div>

                      {isFailed && pl.statusMessage && (
                        <div className="bg-red-950/40 border border-red-800/60 text-red-200 p-2.5 rounded-xl text-[11px] my-2 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span>{pl.statusMessage}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSyncPlaylist(pl)}
                        disabled={isSyncing}
                        className="flex-1 py-2 px-3 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Conectando...' : 'Sincronizar & Validar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStreamUrl(pl.url);
                          setMonitorSourceMode('playlist');
                          setActiveTab('channels');
                          showToast(`Cargando lista ${pl.name} en el Monitor`);
                        }}
                        className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1"
                        title="Probar señal de esta lista en el Monitor"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Monitor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlaylist(pl.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
                        title="Eliminar lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Tv className="w-6 h-6 text-[#00F0FF]" />
                <span>Monitor de Transmisión & Control de Canales</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Selecciona cualquier canal, lista o ingresa una URL personalizada para reproducir y verificar su estado en tiempo real.
              </p>
            </div>

            <div className="bg-[#121212] border border-zinc-800/90 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00F0FF]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    1. Elije Qué URL Se Va a Reproducir en el Monitor
                  </span>
                </div>

                <div className="flex bg-black p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMonitorSourceMode('channel')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      monitorSourceMode === 'channel'
                        ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Canal ({channels.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMonitorSourceMode('custom')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      monitorSourceMode === 'custom'
                        ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Ingresar URL Directa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMonitorSourceMode('playlist')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      monitorSourceMode === 'playlist'
                        ? 'bg-[#00F0FF] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Lista IPTV ({playlists.length})</span>
                  </button>
                </div>
              </div>

              {monitorSourceMode === 'channel' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8">
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Selecciona la Carpeta y el Canal a Transmitir:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="relative">
                        <select
                          value={channelCategoryFilter}
                          onChange={(e) => {
                            const newCat = e.target.value;
                            setChannelCategoryFilter(newCat);
                            if (newCat !== 'all') {
                              const firstInCat = channels.find(
                                (c) => (c.category?.trim() || 'Sin Categoría') === newCat
                              );
                              if (firstInCat) {
                                setMonitoredChannel(firstInCat);
                                setSelectedStreamUrl(firstInCat.url);
                              }
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer"
                        >
                          <option value="all">📁 Todas las Carpetas ({channelFolders.length} carpetas)</option>
                          {channelFolders.map((f) => (
                            <option key={f.name} value={f.name}>
                              📁 {f.name} ({f.total} canales)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <select
                          value={monitoredChannel?.id || ''}
                          onChange={(e) => {
                            const ch = channels.find((c) => c.id === e.target.value);
                            if (ch) {
                              setMonitoredChannel(ch);
                              setSelectedStreamUrl(ch.url);
                              if (ch.category) {
                                setChannelCategoryFilter(ch.category.trim());
                              }
                            }
                          }}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer"
                        >
                          {(channelCategoryFilter === 'all'
                            ? channels.slice(0, 150)
                            : channels.filter(
                                (c) => (c.category?.trim() || 'Sin Categoría') === channelCategoryFilter
                              )
                          ).map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              CH {ch.number} - {ch.name} {ch.isBlocked ? ' [BLOQUEADO]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex items-center gap-2 pt-5 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleCheckPing(monitoredChannel?.url)}
                      disabled={checkingPing}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Comprobar respuesta HTTP en tiempo real"
                    >
                      <Wifi className={`w-3.5 h-3.5 ${checkingPing ? 'animate-pulse text-[#00F0FF]' : 'text-[#00F0FF]'}`} />
                      <span>{checkingPing ? 'Comprobando...' : 'Comprobar Ping/HTTP'}</span>
                    </button>
                  </div>
                </div>
              )}

              {monitorSourceMode === 'custom' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-8">
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Pega Cualquier URL de Flujo (HLS .m3u8, MPEG-TS .ts, Xtream Live o MP4):
                      </label>
                      <input
                        type="text"
                        value={customStreamUrl}
                        onChange={(e) => setCustomStreamUrl(e.target.value)}
                        placeholder="https://.../stream.m3u8 o http://server.com:8080/live/user/pass/123.ts"
                        className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00F0FF] font-mono"
                      />
                    </div>
                    <div className="md:col-span-4 flex items-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!customStreamUrl.trim()) {
                            showToast('Ingresa una URL');
                            return;
                          }
                          setSelectedStreamUrl(customStreamUrl.trim());
                          showToast('Cargando flujo personalizado en el Monitor');
                        }}
                        className="flex-1 py-2.5 px-4 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Cargar & Reproducir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCheckPing(customStreamUrl)}
                        disabled={checkingPing}
                        className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700"
                        title="Probar Ping HTTP"
                      >
                        <Wifi className="w-3.5 h-3.5 text-[#00F0FF]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-zinc-400">
                    <span className="text-zinc-500 font-semibold shrink-0">Ejemplos rápidos:</span>
                    <button
                      type="button"
                      onClick={() => setCustomStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] text-zinc-300 whitespace-nowrap"
                    >
                      Mux HLS 1080p
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomStreamUrl('https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8')}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] text-zinc-300 whitespace-nowrap"
                    >
                      Sintel Akamai 4K
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomStreamUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')}
                      className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-[#00F0FF] text-zinc-300 whitespace-nowrap"
                    >
                      BigBuckBunny MP4
                    </button>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Nombre del canal (opcional)"
                      value={customChannelName}
                      onChange={(e) => setCustomChannelName(e.target.value)}
                      className="bg-black/70 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white sm:w-64"
                    />
                    <input
                      type="text"
                      placeholder="Categoría (ej: Deportes, Cine)"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="bg-black/70 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white sm:w-48"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomAsChannel}
                      className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1 font-semibold"
                    >
                      <Save className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>Guardar como Canal en NeshTV</span>
                    </button>
                  </div>
                </div>
              )}

              {monitorSourceMode === 'playlist' && (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Selecciona una Lista IPTV para probar su enlace de emisión:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => {
                          setSelectedStreamUrl(pl.url);
                          showToast(`Cargando URL de ${pl.name}`);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedStreamUrl === pl.url
                            ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                            : 'bg-black/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs truncate">{pl.name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 rounded bg-zinc-800">
                            {pl.type}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 truncate">{pl.url}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useProxyStream}
                    onChange={(e) => setUseProxyStream(e.target.checked)}
                    className="w-4 h-4 accent-[#00F0FF] rounded cursor-pointer"
                  />
                  <span className="font-semibold text-zinc-200">
                    Habilitar Modo Proxy Anti-CORS / HTTPS
                  </span>
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">
                    (Recomendado para enlaces http:// o servidores que no permiten CORS)
                  </span>
                </label>

                {activeRawUrl && (
                  <span className="text-[11px] font-mono text-zinc-500 truncate max-w-sm">
                    Flujo actual: {activeRawUrl.slice(0, 45)}...
                  </span>
                )}
              </div>
            </div>

            <div className="bg-[#101010] border border-zinc-800 rounded-2xl p-4 md:p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-[#00F0FF]" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Indicador de Estado en Tiempo Real
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Telemetría continua de reproducción, latencia y rendimiento de la señal
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {uptimeSeconds > 0 && monitorStatus === 'playing' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                      <Clock className="w-3 h-3 text-[#00F0FF]" />
                      <span>{Math.floor(uptimeSeconds / 60)}m {uptimeSeconds % 60}s sin cortes</span>
                    </span>
                  )}

                  {pingResult && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        pingResult.online
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                          : 'bg-red-950/80 text-red-400 border-red-700'
                      }`}
                    >
                      <Wifi className="w-3 h-3" />
                      <span>{pingResult.online ? `${pingResult.latencyMs}ms (${pingResult.statusCode || 200})` : 'Offline'}</span>
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      monitorStatus === 'playing'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                        : monitorStatus === 'buffering'
                        ? 'bg-amber-950 text-amber-400 border border-amber-600 animate-pulse'
                        : monitorStatus === 'error'
                        ? 'bg-red-950 text-red-400 border border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        monitorStatus === 'playing'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : monitorStatus === 'buffering'
                          ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                          : monitorStatus === 'error'
                          ? 'bg-red-400 shadow-[0_0_8px_#f87171]'
                          : 'bg-zinc-500'
                      }`}
                    />
                    <span>
                      {monitorStatus === 'playing'
                        ? `EN VIVO (${monitorEngine.toUpperCase()})`
                        : monitorStatus === 'buffering'
                        ? 'Conectando / Búfer...'
                        : monitorStatus === 'error'
                        ? '⚠️ Señal Caída / Error'
                        : 'En Espera'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 bg-black rounded-2xl overflow-hidden aspect-video border border-zinc-800 relative shadow-2xl group flex items-center justify-center">
                  <video
                    ref={channelVideoRef}
                    autoPlay
                    playsInline
                    muted={isMonitorMuted}
                    className="w-full h-full object-contain"
                  />

                  {monitorStatus === 'error' && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20">
                      <AlertTriangle className="w-10 h-10 text-red-500 mb-2 animate-bounce" />
                      <p className="text-sm font-bold text-red-300">
                        La señal no responde o el enlace está inactivo
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                        {monitorErrorDetail || 'El flujo no entregó datos de vídeo. Prueba reintentando con el Modo Proxy SSL o cambiando de canal.'}
                      </p>
                      <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (monitorSessionRef.current) {
                              monitorSessionRef.current.retryWithProxy();
                            } else {
                              retryMonitoredStream();
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" /> Reintentar Flujo (Proxy SSL)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUseProxyStream((prev) => !prev);
                            showToast(useProxyStream ? 'Desactivando Proxy...' : 'Activando Modo Proxy Anti-CORS...');
                          }}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                        >
                          {useProxyStream ? 'Desactivar Proxy' : 'Probar con Proxy'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#00F0FF] font-bold border border-zinc-700 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${monitorStatus === 'playing' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                      <span>{monitoredChannel?.name || 'Flujo Seleccionado'}</span>
                    </span>
                    {monitoredChannel && (
                      <span className="bg-black/80 px-2 py-1 rounded-lg text-[11px] text-zinc-300 font-mono border border-zinc-700">
                        CH {monitoredChannel.number}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-zinc-700">
                    <button
                      type="button"
                      onClick={retryMonitoredStream}
                      className="p-1.5 rounded-lg text-zinc-300 hover:text-[#00F0FF] hover:bg-white/10 transition-colors"
                      title="Reconectar / Recargar flujo"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMonitorMuted(!isMonitorMuted)}
                      className="p-1.5 rounded-lg text-zinc-300 hover:text-[#00F0FF] hover:bg-white/10 transition-colors"
                      title={isMonitorMuted ? 'Activar sonido' : 'Silenciar'}
                    >
                      {isMonitorMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => channelVideoRef.current?.requestFullscreen()}
                      className="p-1.5 rounded-lg text-zinc-300 hover:text-[#00F0FF] hover:bg-white/10 transition-colors"
                      title="Pantalla completa"
                    >
                      <Maximize className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider">
                        {monitoredChannel?.category || 'Canal / Flujo Personalizado'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-black px-2 py-0.5 rounded border border-zinc-800">
                        {realResolution}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white">
                      {monitoredChannel?.name || customChannelName || 'Transmisión Seleccionada'}
                    </h4>

                    <div className="bg-black/90 p-2.5 rounded-xl border border-zinc-800 mt-2 text-[11px] font-mono text-zinc-300 break-all space-y-1">
                      <div className="text-zinc-500 text-[10px] uppercase font-bold flex items-center justify-between">
                        <span>URL del Flujo:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(effectivePlaybackUrl, 'stream_url')}
                          className="hover:text-white text-[10px]"
                        >
                          {copiedSection === 'stream_url' ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="text-zinc-300 truncate">{activeRawUrl}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="bg-black/60 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-[#00F0FF]" />
                        <span>Respuesta HTTP</span>
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-white">
                        {pingResult ? (
                          pingResult.online ? (
                            <span className="text-emerald-400">{pingResult.statusCode || 200} OK ({pingResult.latencyMs}ms)</span>
                          ) : (
                            <span className="text-red-400">Error ({pingResult.statusCode || 'Off'})</span>
                          )
                        ) : (
                          'Comprobando...'
                        )}
                      </div>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-[#00F0FF]" />
                        <span>Resolución Real</span>
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-white">
                        {realResolution}
                      </div>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#00F0FF]" />
                        <span>Búfer Activo</span>
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-[#00F0FF]">
                        {realBufferSec} segundos
                      </div>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#00F0FF]" />
                        <span>Tiempo sin Cortes</span>
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 text-white">
                        {Math.floor(uptimeSeconds / 60)}m {uptimeSeconds % 60}s
                      </div>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                        <Server className="w-3 h-3 text-[#00F0FF]" />
                        <span>Modo Enlace</span>
                      </div>
                      <div className="text-xs font-bold mt-1 text-white">
                        {useProxyStream ? 'Proxy Anti-CORS' : 'Conexión Directa'}
                      </div>
                    </div>

                    <div className="bg-black/60 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#00F0FF]" />
                        <span>Visibilidad App</span>
                      </div>
                      <div className="text-xs font-bold mt-1">
                        {monitoredChannel ? (
                          monitoredChannel.isBlocked ? (
                            <span className="text-red-400">BLOQUEADO</span>
                          ) : (
                            <span className="text-emerald-400">VISIBLE</span>
                          )
                        ) : (
                          <span className="text-zinc-400">Personalizado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {monitoredChannel && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleToggleChannelBlock(monitoredChannel)}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                          monitoredChannel.isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        }`}
                      >
                        {monitoredChannel.isBlocked ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>DESBLOQUEAR (MOSTRAR EN LA APP A TODOS LOS CLIENTES)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>BLOQUEAR (OCULTAR 100% PARA LOS CLIENTES)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Folder className="w-5 h-5 text-[#00F0FF]" />
                      <span>Monitor & Bloqueo de Canales por Carpetas</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {selectedCategory
                        ? `Explorando canales dentro de la carpeta: ${selectedCategory}`
                        : `Organizado en ${channelFolders.length} carpetas para máxima velocidad sin tildar el navegador.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <button
                      type="button"
                      onClick={async () => {
                        const token = adminToken || 'nesh_admin_token';
                        try {
                          const res = await fetch('/api/admin/reset-channels', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            showToast(`✓ Se han restaurado ${data.count} canales correctamente`);
                            loadAdminData(token);
                            onRefreshData?.();
                          } else {
                            showToast('Error al restaurar canales');
                          }
                        } catch {
                          showToast('Error de red al restaurar canales');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer"
                      title="Restaurar manualmente todas las carpetas y canales principales"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>🔄 Restaurar Canales</span>
                    </button>
                    <span className="bg-black/80 border border-zinc-800 px-3 py-1.5 rounded-xl font-bold text-zinc-300">
                      Total: <span className="text-[#00F0FF] font-mono">{channels.length}</span> canales
                    </span>
                    <span className="bg-black/80 border border-zinc-800 px-3 py-1.5 rounded-xl font-bold text-zinc-300">
                      📁 <span className="text-white font-mono">{channelFolders.length}</span> carpetas
                    </span>
                    <span className="bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl font-bold text-emerald-400">
                      ✓ {channels.filter((c) => !c.isBlocked).length} Activos
                    </span>
                    <span className="bg-red-950/60 border border-red-800/80 px-3 py-1.5 rounded-xl font-bold text-red-400">
                      ❌ {channels.filter((c) => c.isBlocked).length} Bloqueados
                    </span>
                  </div>
                </div>

                {selectedCategory ? (
                  <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(null);
                          setChannelSearchTerm('');
                          setChannelPage(1);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#00F0FF]" />
                        <span>← Volver a Todas las Carpetas</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs font-mono text-zinc-400">
                        <span>Carpetas</span>
                        <ChevronRight className="w-3 h-3 text-zinc-600" />
                        <span className="text-white font-bold bg-[#00F0FF]/15 text-[#00F0FF] px-2.5 py-0.5 rounded-lg border border-[#00F0FF]/30">
                          📁 {selectedCategory} ({currentCategoryFolder?.total || 0} canales)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={batchUpdatingCategory === selectedCategory}
                        onClick={() => handleToggleCategoryBlock(selectedCategory, true)}
                        className="py-1.5 px-3 rounded-xl bg-red-950/90 hover:bg-red-900 border border-red-700 text-xs font-bold text-red-200 flex items-center gap-1.5 cursor-pointer transition-all shadow"
                        title="Bloquear y ocultar todos los canales de esta carpeta para los clientes"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>Bloquear Toda la Carpeta</span>
                      </button>

                      <button
                        type="button"
                        disabled={batchUpdatingCategory === selectedCategory}
                        onClick={() => handleToggleCategoryBlock(selectedCategory, false)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700 text-xs font-bold text-emerald-200 flex items-center gap-1.5 cursor-pointer transition-all shadow"
                        title="Desbloquear y hacer visibles todos los canales de esta carpeta"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Desbloquear Toda la Carpeta</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6 relative">
                      <Folder className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar carpeta por nombre (ej. Deportes, Noticias, Cine, Fox)..."
                        value={categorySearchTerm}
                        onChange={(e) => {
                          setCategorySearchTerm(e.target.value);
                          setChannelPage(1);
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div className="md:col-span-6 relative">
                      <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="O buscar canal directamente por nombre o número (ej. ESPN)..."
                        value={channelSearchTerm}
                        onChange={(e) => {
                          setChannelSearchTerm(e.target.value);
                          setChannelPage(1);
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F0FF]"
                      />
                      {channelSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setChannelSearchTerm('')}
                          className="absolute right-3 top-2 text-xs text-zinc-500 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!selectedCategory && channelSearchTerm.trim() && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">Resultados de búsqueda:</span>
                      <span className="text-[#00F0FF] font-semibold font-mono">
                        "{channelSearchTerm}"
                      </span>
                      <span className="text-zinc-400">
                        ({displayedChannels.length} canales encontrados)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setChannelSearchTerm('')}
                      className="text-xs text-zinc-400 hover:text-[#00F0FF] underline cursor-pointer"
                    >
                      Volver a ver todas las carpetas
                    </button>
                  </div>

                  {displayedChannels.length === 0 ? (
                    <div className="p-8 text-center bg-[#101010] rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
                      No se encontraron canales que coincidan con "{channelSearchTerm}".
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {paginatedChannels.map((ch) => {
                          const isSelected = monitoredChannel?.id === ch.id && monitorSourceMode === 'channel';
                          return (
                            <div
                              key={ch.id}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                ch.isBlocked
                                  ? 'bg-red-950/20 border-red-900/60'
                                  : isSelected
                                  ? 'bg-zinc-900 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                                  : 'bg-[#101010] border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={ch.logo}
                                  alt={ch.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                  className="w-12 h-12 rounded-xl object-cover bg-black border border-zinc-800 shrink-0 p-0.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs text-[#00F0FF] font-bold">
                                      CH {ch.number}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[140px]">
                                      📁 {ch.category}
                                    </span>
                                  </div>
                                  <h4 className="text-xs md:text-sm font-bold text-white truncate mt-0.5">{ch.name}</h4>
                                  <div className="flex items-center justify-between mt-1">
                                    {ch.isBlocked ? (
                                      <span className="text-[10px] font-extrabold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                                        ❌ BLOQUEADO (Oculto)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                                        ✓ ACTIVO (Visible)
                                      </span>
                                    )}
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      {ch.resolution || '1080p'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMonitoredChannel(ch);
                                    setSelectedStreamUrl(ch.url);
                                    setMonitorSourceMode('channel');
                                    showToast(`Cargando CH ${ch.number} - ${ch.name}`);
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#00F0FF] text-black font-bold'
                                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                                  }`}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>{isSelected ? 'Transmitiendo en Monitor' : 'Probar Señal'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleChannelBlock(ch)}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    ch.isBlocked
                                      ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                                      : 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-700'
                                  }`}
                                  title={ch.isBlocked ? 'Habilitar canal para clientes' : 'Bloquear canal a clientes'}
                                >
                                  {ch.isBlocked ? 'Desbloquear' : '❌ Bloquear'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between p-3 bg-black/60 rounded-xl border border-zinc-800 text-xs">
                          <button
                            type="button"
                            disabled={channelPage <= 1}
                            onClick={() => setChannelPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-zinc-200"
                          >
                            ← Anterior
                          </button>
                          <span className="text-zinc-400">
                            Página <strong className="text-white">{channelPage}</strong> de <strong className="text-white">{totalPages}</strong> ({displayedChannels.length} canales)
                          </span>
                          <button
                            type="button"
                            disabled={channelPage >= totalPages}
                            onClick={() => setChannelPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-zinc-200"
                          >
                            Siguiente →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {!selectedCategory && !channelSearchTerm.trim() && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span>
                      Mostrando <strong className="text-white">{filteredFolders.length}</strong> carpetas según nombre
                    </span>
                    <span className="text-zinc-500">
                      Haz clic en cualquier carpeta para ver sus canales
                    </span>
                  </div>

                  {filteredFolders.length === 0 ? (
                    <div className="p-12 text-center bg-[#101010] rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
                      No se encontraron carpetas con ese nombre.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFolders.map((folder) => {
                        const allBlocked = folder.total > 0 && folder.blocked === folder.total;
                        const isUpdating = batchUpdatingCategory === folder.name;

                        return (
                          <div
                            key={folder.name}
                            className={`bg-[#101010] border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all shadow-xl group hover:border-zinc-700 ${
                              allBlocked
                                ? 'border-red-900/60 bg-red-950/10'
                                : 'border-zinc-800 hover:border-[#00F0FF]/40'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-xl bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 group-hover:scale-105 transition-transform">
                                    <Folder className="w-5 h-5 text-[#00F0FF]" />
                                  </div>
                                  <span className="text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md text-zinc-300">
                                    {folder.total} canales
                                  </span>
                                </div>

                                {allBlocked ? (
                                  <span className="text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">
                                    100% Bloqueada
                                  </span>
                                ) : folder.blocked > 0 ? (
                                  <span className="text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                                    {folder.blocked} Bloqueados
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                                    Activa
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm md:text-base font-extrabold text-white truncate group-hover:text-[#00F0FF] transition-colors">
                                {folder.name}
                              </h4>

                              <div className="mt-2.5">
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                                  <div
                                    className="h-full bg-emerald-500"
                                    style={{
                                      width: `${folder.total > 0 ? (folder.active / folder.total) * 100 : 0}%`,
                                    }}
                                  />
                                  <div
                                    className="h-full bg-red-500"
                                    style={{
                                      width: `${folder.total > 0 ? (folder.blocked / folder.total) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-1">
                                  <span className="text-emerald-400 font-semibold">{folder.active} visibles</span>
                                  <span className="text-red-400 font-semibold">{folder.blocked} bloqueados</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(folder.name);
                                  setChannelPage(1);
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer transition-all"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Abrir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyFolderToListaPro(folder)}
                                className="py-2 px-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-[11px] font-bold text-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Copiar carpeta completa a Lista Pro"
                              >
                                <Copy className="w-3.5 h-3.5 text-purple-400" />
                                <span>Copiar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFolder(folder.name)}
                                className="py-2 px-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700 text-[11px] font-bold text-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Borrar carpeta completa y sus canales"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Borrar</span>
                              </button>

                              {folder.active > 0 ? (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleToggleCategoryBlock(folder.name, true)}
                                  className="py-2 px-2.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800 text-[11px] font-bold text-red-300 transition-colors"
                                  title={`Bloquear todos los ${folder.total} canales de esta carpeta`}
                                >
                                  {isUpdating ? '...' : 'Bloquear'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleToggleCategoryBlock(folder.name, false)}
                                  className="py-2 px-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-[11px] font-bold text-emerald-300 transition-colors"
                                  title={`Desbloquear todos los ${folder.total} canales de esta carpeta`}
                                >
                                  {isUpdating ? '...' : 'Habilitar'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedCategory && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder={`Buscar canal dentro de ${selectedCategory}...`}
                        value={channelSearchTerm}
                        onChange={(e) => {
                          setChannelSearchTerm(e.target.value);
                          setChannelPage(1);
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div className="text-xs text-zinc-400">
                      Mostrando {displayedChannels.length} canales (Página {channelPage} de {totalPages})
                    </div>
                  </div>

                  {displayedChannels.length === 0 ? (
                    <div className="p-12 text-center bg-[#101010] rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
                      No hay canales disponibles en esta carpeta con ese filtro.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {paginatedChannels.map((ch) => {
                          const isSelected = monitoredChannel?.id === ch.id && monitorSourceMode === 'channel';
                          return (
                            <div
                              key={ch.id}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                ch.isBlocked
                                  ? 'bg-red-950/20 border-red-900/60'
                                  : isSelected
                                  ? 'bg-zinc-900 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                                  : 'bg-[#101010] border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={ch.logo}
                                  alt={ch.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                  className="w-12 h-12 rounded-xl object-cover bg-black border border-zinc-800 shrink-0 p-0.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-xs text-[#00F0FF] font-bold">
                                      CH {ch.number}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[140px]">
                                      {ch.category}
                                    </span>
                                  </div>
                                  <h4 className="text-xs md:text-sm font-bold text-white truncate mt-0.5">{ch.name}</h4>
                                  <div className="flex items-center justify-between mt-1">
                                    {ch.isBlocked ? (
                                      <span className="text-[10px] font-extrabold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                                        ❌ BLOQUEADO (Oculto)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                                        ✓ ACTIVO (Visible)
                                      </span>
                                    )}
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      {ch.resolution || '1080p'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMonitoredChannel(ch);
                                    setSelectedStreamUrl(ch.url);
                                    setMonitorSourceMode('channel');
                                    showToast(`Cargando CH ${ch.number} - ${ch.name}`);
                                  }}
                                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#00F0FF] text-black font-bold'
                                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                                  }`}
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>{isSelected ? 'Transmitiendo en Monitor' : 'Probar Señal'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleChannelBlock(ch)}
                                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    ch.isBlocked
                                      ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700'
                                      : 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-700'
                                  }`}
                                  title={
                                    ch.isBlocked
                                      ? 'Habilitar canal para los clientes'
                                      : 'Bloquear y ocultar canal a clientes'
                                  }
                                >
                                  {ch.isBlocked ? 'Desbloquear' : '❌ Bloquear'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between p-3.5 bg-black/60 rounded-2xl border border-zinc-800 text-xs">
                          <button
                            type="button"
                            disabled={channelPage <= 1}
                            onClick={() => setChannelPage((p) => Math.max(1, p - 1))}
                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-zinc-200 cursor-pointer"
                          >
                            ← Anterior
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-400">
                              Página <strong className="text-white">{channelPage}</strong> de{' '}
                              <strong className="text-white">{totalPages}</strong>
                            </span>
                            <span className="text-zinc-600 font-mono">
                              ({displayedChannels.length} canales)
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={channelPage >= totalPages}
                            onClick={() => setChannelPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-zinc-200 cursor-pointer"
                          >
                            Siguiente →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vod' && (
          <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#00F0FF]" />
                  <span>Control, Clasificación y VOD (Películas & Series)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Agrega películas o series por URL (M3U / MP4 / HLS) con clasificación automática o manual, y administra su visibilidad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVodModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#33f3ff] flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Película o Serie VOD</span>
              </button>
            </div>

            {monitoredVod && (
              <div className="bg-[#101010] border border-zinc-800 rounded-2xl p-4 md:p-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#00F0FF] fill-[#00F0FF]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Probando Vídeo: {monitoredVod.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">{monitoredVod.category}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-7 bg-black rounded-xl overflow-hidden aspect-video border border-zinc-800 relative">
                    <video
                      src={monitoredVod.url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="lg:col-span-5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{monitoredVod.title}</h4>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-3">{monitoredVod.synopsis}</p>
                      <div className="mt-2 text-xs text-zinc-400">
                        Año: <span className="text-white">{monitoredVod.year}</span> · Calificación: <span className="text-amber-400 font-bold">{monitoredVod.rating}</span>
                      </div>
                      <div className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold mt-3">
                        <span>Estado en Catálogo:</span>
                        {monitoredVod.isBlocked ? (
                          <span className="text-red-400 font-bold">❌ BLOQUEADA (Oculta a clientes)</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ DISPONIBLE EN CATÁLOGO</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVodBlock(monitoredVod)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer mt-4 ${
                        monitoredVod.isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      }`}
                    >
                      {monitoredVod.isBlocked ? '✓ DESBLOQUEAR Y MOSTRAR EN APP' : '❌ BLOQUEAR Y OCULTAR DE APP'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVodSubTab('movies')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    vodSubTab === 'movies'
                      ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  🎬 Películas ({vod.filter(v => v.type !== 'series').length})
                </button>
                <button
                  type="button"
                  onClick={() => setVodSubTab('series')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    vodSubTab === 'series'
                      ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  📺 Series ({vod.filter(v => v.type === 'series').length})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={handleAiSortAndDetectYears}
                  className="py-1.5 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 font-bold flex items-center gap-1.5 cursor-pointer shadow"
                  title="Usa IA heurística en los títulos para detectar años y ordenar automáticamente de más nuevo a más viejo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>✨ IA: Ordenar Nuevos (2026) a Viejos</span>
                </button>

                <select
                  value={vodSortMode}
                  onChange={(e) => setVodSortMode(e.target.value as any)}
                  className="bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="newest">⬇️ Más Nuevas primero (2026 → Antiguas)</option>
                  <option value="oldest">⬆️ Más Viejas primero (Antiguas → 2026)</option>
                  <option value="rating">⭐ Mejor Calificación IMDb</option>
                  <option value="alpha">🔤 Alfabéticamente (A-Z)</option>
                </select>
              </div>
            </div>

            {(() => {
              const filteredVod = vod.filter(item => vodSubTab === 'movies' ? item.type !== 'series' : item.type === 'series').sort((a, b) => {
                if (vodSortMode === 'newest') return (Number(b.year) || 0) - (Number(a.year) || 0);
                if (vodSortMode === 'oldest') return (Number(a.year) || 0) - (Number(b.year) || 0);
                if (vodSortMode === 'rating') return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
                if (vodSortMode === 'alpha') return a.title.localeCompare(b.title);
                return (Number(b.year) || 0) - (Number(a.year) || 0);
              });

              const currentPage = vodSubTab === 'movies' ? moviePage : seriesPage;
              const totalVodPages = Math.max(1, Math.ceil(filteredVod.length / VOD_PER_PAGE));
              const paginatedVod = filteredVod.slice((currentPage - 1) * VOD_PER_PAGE, currentPage * VOD_PER_PAGE);

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span>
                      Mostrando {paginatedVod.length} de {filteredVod.length} {vodSubTab === 'movies' ? 'películas' : 'series'} (Página {currentPage} de {totalVodPages})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedVod.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-[#101010] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all ${
                          item.isBlocked ? 'border-red-800/80 bg-red-950/10' : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="aspect-[16/9] w-full bg-zinc-900 relative">
                          <img
                            src={item.poster}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {Number(item.year) === 2026 && (
                            <div className="absolute top-2 left-2 bg-[#00F0FF] text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow">
                              ESTRENO 2026
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            {item.isBlocked ? (
                              <span className="bg-red-950 text-red-300 border border-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                                ❌ BLOQUEADA
                              </span>
                            ) : (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                                ✓ DISPONIBLE
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3">
                          <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                            <span>{item.category}</span>
                            <span className={Number(item.year) === 2026 ? 'text-[#00F0FF] font-bold' : ''}>
                              {item.year}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setMonitoredVod(item)}
                              className="flex-1 py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" /> Probar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!adminToken) return;
                                try {
                                  const res = await fetch('/api/admin/listapro', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${adminToken}`,
                                    },
                                    body: JSON.stringify({
                                      title: item.title,
                                      url: item.url,
                                      category: item.category,
                                      type: item.type,
                                      year: item.year,
                                      rating: item.rating,
                                      poster: item.poster,
                                      synopsis: item.synopsis,
                                      isListaPro: true,
                                    }),
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.success) {
                                    setListaProItems(prev => [data.item, ...prev]);
                                    showToast(`✓ "${item.title}" copiado a Lista Pro`);
                                  }
                                } catch {
                                  showToast('Error al copiar a Lista Pro');
                                }
                              }}
                              className="py-1 px-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-xs font-bold text-purple-200 flex items-center gap-1 cursor-pointer"
                              title="Copiar a Lista Pro"
                            >
                              <Copy className="w-3 h-3 text-purple-400" />
                              <span>Copiar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleVodBlock(item)}
                              className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                item.isBlocked
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-red-950 text-red-300 border border-red-700'
                              }`}
                            >
                              {item.isBlocked ? 'Desbloquear' : '❌ Bloquear'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalVodPages > 1 && (
                    <div className="flex items-center justify-between p-4 bg-[#101010] rounded-2xl border border-zinc-800 text-xs mt-4">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => {
                          if (vodSubTab === 'movies') setMoviePage(p => Math.max(1, p - 1));
                          else setSeriesPage(p => Math.max(1, p - 1));
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-zinc-200 cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 font-mono">
                          Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalVodPages}</strong>
                        </span>
                        <span className="text-zinc-600 font-mono">
                          ({filteredVod.length} {vodSubTab === 'movies' ? 'películas' : 'series'})
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={currentPage >= totalVodPages}
                        onClick={() => {
                          if (vodSubTab === 'movies') setMoviePage(p => Math.min(totalVodPages, p + 1));
                          else setSeriesPage(p => Math.min(totalVodPages, p + 1));
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-zinc-200 cursor-pointer flex items-center gap-1.5"
                      >
                        Siguiente <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'messaging' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#101010] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Sistema de Mensajería Flotante (Notificaciones OSD)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Redacta avisos instantáneos (recordatorios de vencimiento, mantenimientos o promociones) que flotarán en la pantalla del usuario.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Texto del Mensaje:
                  </label>
                  <textarea
                    rows={3}
                    value={floatingMsg.text}
                    onChange={(e) =>
                      setFloatingMsg((prev) => ({ ...prev, text: e.target.value }))
                    }
                    placeholder="Ej: Aviso NeshTV: Tu suscripción vence en 3 días. Por favor comunícate a soporte para renovar y no perder el servicio."
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00F0FF] leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Remitente visible:
                    </label>
                    <input
                      type="text"
                      value={floatingMsg.sender}
                      onChange={(e) =>
                        setFloatingMsg((prev) => ({ ...prev, sender: e.target.value }))
                      }
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Destinatario:
                    </label>
                    <select
                      value={floatingMsg.targetUserId || 'all'}
                      onChange={(e) =>
                        setFloatingMsg((prev) => ({ ...prev, targetUserId: e.target.value }))
                      }
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                    >
                      <option value="all">Todos los usuarios (Broadcast)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={floatingMsg.active}
                      onChange={(e) =>
                        setFloatingMsg((prev) => ({ ...prev, active: e.target.checked }))
                      }
                      className="w-4 h-4 accent-[#00F0FF] rounded cursor-pointer"
                    />
                    <span>Activar visualización del mensaje en la pantalla del usuario</span>
                  </label>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                    Vista previa del banner flotante:
                  </span>
                  <div className="bg-gradient-to-r from-[#00F0FF]/15 via-zinc-900 to-black/80 border border-[#00F0FF]/40 rounded-xl p-3 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#00F0FF]/20 text-[#00F0FF] shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                          {floatingMsg.sender}
                        </div>
                        <div className="text-xs text-zinc-200">
                          {floatingMsg.text || 'Texto del mensaje no redactado'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-[#00F0FF] font-mono">
                      {floatingMsg.targetUserId === 'all' ? 'Broadcast' : 'Directo'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveFloatingMessage}
                    className="px-5 py-2.5 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>PUBLICAR MENSAJE FLOTANTE</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'apk' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#101010] border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Guía Técnica de Compilación APK (Android Smartphone & Android TV / TV Box)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Instrucciones completas para empaquetar NeshTV en APK nativo compatible con Google Play Store y sideloading en TV Box
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-zinc-300">
                <div className="p-4 bg-black/70 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#00F0FF]">
                      Paso 1: Instalación de Capacitor para Android
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init "NeshTV" "com.neshtv.iptv" --web-dir dist\nnpx cap add android`,
                          'cap1'
                        )
                      }
                      className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedSection === 'cap1' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copiar Comandos</span>
                    </button>
                  </div>
                  <pre className="font-mono text-zinc-300 bg-zinc-950 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# 1. Instalar dependencias Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Inicializar proyecto Capacitor
npx cap init "NeshTV" "com.neshtv.iptv" --web-dir dist

# 3. Compilar la aplicación web NeshTV
npm run build

# 4. Agregar la plataforma Android
npx cap add android`}
                  </pre>
                </div>

                <div className="p-4 bg-black/70 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#00F0FF]">
                      Paso 2: Configuración del AndroidManifest.xml (Android TV & TV Box Leanback)
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.neshtv.iptv">

    <uses-feature
        android:name="android.software.leanback"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />
    <uses-feature
        android:name="android.hardware.microphone"
        android:required="false" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:banner="@drawable/neshtv_tv_banner"
        android:label="NeshTV"
        android:theme="@style/AppTheme.NoActionBar"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:screenOrientation="sensorLandscape">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`,
                          'manifest'
                        )
                      }
                      className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedSection === 'manifest' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copiar AndroidManifest</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    En <code>android/app/src/main/AndroidManifest.xml</code>, habilita soporte híbrido (móvil y TV):
                  </p>
                  <pre className="font-mono text-zinc-300 bg-zinc-950 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-56">
{`<!-- Habilitar Leanback sin restringir móviles -->
<uses-feature android:name="android.software.leanback" android:required="false" />
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />

<!-- Intent filter para launcher de Android TV -->
<intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
</intent-filter>`}
                  </pre>
                </div>

                <div className="p-4 bg-black/70 border border-zinc-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#00F0FF]">
                      Paso 3: Compilar APK Release / Debug
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `npm run build\nnpx cap copy\ncd android\n./gradlew assembleRelease`,
                          'build'
                        )
                      }
                      className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedSection === 'build' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copiar</span>
                    </button>
                  </div>
                  <pre className="font-mono text-zinc-300 bg-zinc-950 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Sincronizar cambios en Android Studio
npm run build && npx cap copy

# Compilar APK con Gradle
cd android
./gradlew assembleDebug   # APK de prueba
./gradlew assembleRelease # APK optimizado para producción

# El APK generado se ubica en:
# android/app/build/outputs/apk/release/app-release-unsigned.apk`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listapro' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#00F0FF]" />
                  <span>Lista Pro (Contenido Exclusivo VIP)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aquí se almacenan los canales y carpetas copiados desde el monitor. Los usuarios con asignación "Lista Pro" verán únicamente este contenido.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowListAPraPasteModal(true)}
                  className="px-4 py-2 bg-[#00F0FF] hover:bg-[#33f3ff] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Pegar / Agregar Elemento</span>
                </button>
                <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                  Total: <strong className="text-[#00F0FF]">{listaProItems.length}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {listaProItems.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-[#101010] rounded-2xl border border-zinc-800 text-zinc-400 text-xs">
                  No hay elementos en la Lista Pro. Ve al Monitor de Canales y usa el botón "Copiar" en cualquier carpeta para agregar contenido aquí.
                </div>
              ) : (
                listaProItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#101010] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
                  >
                    <div className="aspect-[2/3] w-full bg-zinc-900 relative">
                      <img
                        src={item.poster}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-[#00F0FF] text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow">
                        VIP PRO
                      </div>
                    </div>
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">📁 {item.category}</p>
                      </div>
                      <div className="pt-2 mt-2 border-t border-zinc-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!adminToken) return;
                            try {
                              const res = await fetch(`/api/admin/listapro/${item.id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${adminToken}` },
                              });
                              if (res.ok) {
                                setListaProItems(prev => prev.filter(i => i.id !== item.id));
                                showToast('Elemento eliminado de Lista Pro');
                              }
                            } catch {
                              showToast('Error al eliminar');
                            }
                          }}
                          className="w-full py-1.5 px-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-xs font-bold text-red-200 border border-red-700 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario NeshTV'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nombre de Usuario:</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Ej: cliente_vip"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Contraseña:</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Fecha de Vencimiento:</label>
                <input
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Estado de la cuenta:</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="active">Activo (Acceso Permitido)</option>
                  <option value="blocked">Suspendido (Falta de Pago / Bloqueado)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Lista Asignada al Usuario:</label>
                <select
                  value={formAssignedList}
                  onChange={(e) => setFormAssignedList(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="all">Todas las Listas (Estándar M3U / Xtream)</option>
                  <option value="listapro">Lista Pro Exclusiva (VIP)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Notas / Plan:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: 3 Pantallas Full HD"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00F0FF] text-black font-bold hover:bg-[#33f3ff] shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#00F0FF]" />
                <h3 className="text-base font-bold text-white">Agregar y Validar Lista IPTV / M3U</h3>
              </div>
              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setTestResult(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlaylist} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nombre Descriptivo:</label>
                <input
                  type="text"
                  value={plName}
                  onChange={(e) => setPlName(e.target.value)}
                  placeholder="Ej: Servidor IPTV Primario"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Tipo de Lista:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlType('m3u')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      plType === 'm3u'
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Enlace M3U / M3U8 Directo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlType('xtream')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      plType === 'xtream'
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Servidor Xtream Codes API
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  URL del Proveedor o Lista:
                </label>
                <input
                  type="text"
                  value={plUrl}
                  onChange={(e) => setPlUrl(e.target.value)}
                  placeholder={
                    plType === 'xtream'
                      ? 'http://server.iptv.com:8080'
                      : 'http://server.iptv.com:8080/get.php?username=...&type=m3u_plus'
                  }
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00F0FF] font-mono"
                  required
                />
              </div>

              {plType === 'xtream' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Usuario Xtream:</label>
                    <input
                      type="text"
                      value={plUser}
                      onChange={(e) => setPlUser(e.target.value)}
                      placeholder="Usuario"
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Contraseña:</label>
                    <input
                      type="password"
                      value={plPass}
                      onChange={(e) => setPlPass(e.target.value)}
                      placeholder="Contraseña"
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestModalUrl}
                  disabled={testingUrl}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#00F0FF] text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Wifi className={`w-3.5 h-3.5 ${testingUrl ? 'animate-pulse text-[#00F0FF]' : 'text-[#00F0FF]'}`} />
                  <span>{testingUrl ? 'Conectando con el servidor...' : '🔍 Probar Conexión Antes de Guardar'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all animate-fade-in ${
                    testResult.works
                      ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.2)]'
                      : 'bg-red-950/40 border-red-500/70 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  }`}
                >
                  {testResult.works ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">
                      {testResult.works ? '✓ ¡LA URL FUNCIONA CORRECTAMENTE!' : '⚠️ LA URL NO RESPONDIÓ'}
                    </p>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">{testResult.message}</p>
                    {testResult.works && testResult.stats && (
                      <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                        <span className="bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300 font-bold">
                          {testResult.stats.totalChannels} canales
                        </span>
                        <span className="bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300">
                          {testResult.stats.totalVod} VOD
                        </span>
                        <span className="bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-300">
                          {testResult.latencyMs}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-300 select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncOnSave}
                    onChange={(e) => setAutoSyncOnSave(e.target.checked)}
                    className="w-4 h-4 accent-[#00F0FF] rounded cursor-pointer"
                  />
                  <span>Sincronizar y descargar canales inmediatamente al guardar</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlaylistModal(false);
                    setTestResult(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#33f3ff] shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                >
                  Guardar & Sincronizar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {syncResultModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div
            className={`w-full max-w-lg bg-[#111111] border rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] space-y-4 my-auto ${
              syncResultModal.works ? 'border-emerald-500/80' : 'border-red-500/80'
            }`}
          >
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl ${
                    syncResultModal.works
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700 shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                      : 'bg-red-950 text-red-400 border border-red-700 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                  }`}
                >
                  {syncResultModal.works ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3
                    className={`text-lg font-black tracking-tight ${
                      syncResultModal.works ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {syncResultModal.works
                      ? '¡LA URL FUNCIONA CORRECTAMENTE!'
                      : '⚠️ LA URL NO FUNCIONA'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Resultado de la sincronización en tiempo real
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSyncResultModal(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                syncResultModal.works
                  ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                  : 'bg-red-950/30 border-red-800 text-red-200'
              }`}
            >
              <p className="font-semibold">{syncResultModal.message}</p>
            </div>

            {syncResultModal.works && (
              <div className="space-y-3 bg-black/60 p-4 rounded-xl border border-zinc-800 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Canales Cargados</span>
                    <span className="text-lg font-extrabold text-[#00F0FF]">
                      {syncResultModal.stats?.totalChannels || syncResultModal.channelsCount || 0}
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Películas VOD</span>
                    <span className="text-lg font-extrabold text-purple-400">
                      {syncResultModal.stats?.totalVod || syncResultModal.vodCount || 0}
                    </span>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Tiempo Respuesta</span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      {syncResultModal.latencyMs || 85}ms
                    </span>
                  </div>
                </div>

                {syncResultModal.userInfo && (
                  <div className="text-[11px] text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
                    <div className="flex justify-between">
                      <span>Cuenta Xtream:</span>
                      <span className="font-semibold text-white">{syncResultModal.userInfo.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vencimiento:</span>
                      <span className="font-semibold text-[#00F0FF]">{syncResultModal.userInfo.expDate || 'Ilimitado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conexiones simultáneas:</span>
                      <span className="font-semibold text-white">{syncResultModal.userInfo.maxConnections || 1}</span>
                    </div>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-[11px] flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Los canales ya están listos y disponibles en tu lista de TV en Vivo.</span>
                </div>
              </div>
            )}

            {!syncResultModal.works && (
              <div className="bg-black/60 p-4 rounded-xl border border-zinc-800 text-xs space-y-2">
                <p className="font-bold text-white text-xs">Posibles causas y soluciones:</p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-300 text-[11px]">
                  <li>Verifica que el usuario y la contraseña no tengan espacios adicionales.</li>
                  <li>Asegúrate de incluir <code className="text-[#00F0FF]">http://</code> o <code className="text-[#00F0FF]">https://</code> en la dirección.</li>
                  <li>Comprueba que tu proveedor IPTV no tenga el servidor temporalmente caído o saturado.</li>
                  <li>Si la URL es directa (archivo .m3u8), también puedes pegarla directamente en la pestaña <strong className="text-white">"Monitor & Bloqueo de Canales"</strong>.</li>
                </ul>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
              {syncResultModal.works && (
                <button
                  type="button"
                  onClick={() => {
                    setSyncResultModal(null);
                    setActiveTab('channels');
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Ver en Monitor de Canales</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSyncResultModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#33f3ff] shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
              >
                {syncResultModal.works ? 'Aceptar & Continuar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVodModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#00F0FF]" />
                <h3 className="text-base font-bold text-white">Agregar Película o Serie VOD (Automático o Manual)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVodModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVod} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Título (Película o Serie):</label>
                <input
                  type="text"
                  value={vodTitle}
                  onChange={(e) => setVodTitle(e.target.value)}
                  placeholder="Ej: Avatar 3 o Temporada 1 El Juego del Calamar"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">URL de Transmisión (M3U8 / MP4 / HLS):</label>
                <input
                  type="text"
                  value={vodUrl}
                  onChange={(e) => setVodUrl(e.target.value)}
                  placeholder="https://servidor.com/movie/stream.mp4 o .m3u8"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#00F0FF] font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Clasificación (Automática o Manual):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVodClassification('auto')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      vodClassification === 'auto'
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    🤖 Automática
                  </button>
                  <button
                    type="button"
                    onClick={() => setVodClassification('movie')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      vodClassification === 'movie'
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    🎬 Película
                  </button>
                  <button
                    type="button"
                    onClick={() => setVodClassification('series')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      vodClassification === 'series'
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    📺 Serie
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Categoría Personalizada:</label>
                  <input
                    type="text"
                    value={vodCategory}
                    onChange={(e) => setVodCategory(e.target.value)}
                    placeholder="Ej: Estrenos 2026 / Series Turcas"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Año:</label>
                  <input
                    type="number"
                    value={vodYear}
                    onChange={(e) => setVodYear(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Calificación IMDb:</label>
                  <input
                    type="text"
                    value={vodRating}
                    onChange={(e) => setVodRating(e.target.value)}
                    placeholder="9.5"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">URL de Poster (Imagen):</label>
                  <input
                    type="text"
                    value={vodPoster}
                    onChange={(e) => setVodPoster(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Sinopsis / Descripción:</label>
                <textarea
                  rows={2}
                  value={vodSynopsis}
                  onChange={(e) => setVodSynopsis(e.target.value)}
                  placeholder="Reseña del contenido..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowVodModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00F0FF] text-black font-bold text-xs hover:bg-[#33f3ff] shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
                >
                  Guardar y Clasificar VOD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showListAPraPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121212] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-[#00F0FF]" />
                <span>Pegar / Agregar Elemento a Lista Pro</span>
              </h3>
              <button onClick={() => setShowListAPraPasteModal(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveListProPaste} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Título de la Película / Serie / Canal:</label>
                <input
                  type="text"
                  value={listProTitle}
                  onChange={(e) => setListProTitle(e.target.value)}
                  placeholder="Ej: Estreno Exclusivo VIP 2026"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">URL del Flujo (.mp4 / .m3u8 / .ts):</label>
                <input
                  type="text"
                  value={listProUrl}
                  onChange={(e) => setListProUrl(e.target.value)}
                  placeholder="http://..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F0FF]"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Categoría / Carpeta:</label>
                <input
                  type="text"
                  value={listProCategory}
                  onChange={(e) => setListProCategory(e.target.value)}
                  placeholder="Ej: Estrenos VIP"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowListAPraPasteModal(false)}
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
