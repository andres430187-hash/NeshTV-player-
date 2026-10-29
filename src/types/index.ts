export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  expiryDate: string;
  status: 'active' | 'blocked';
  notes?: string;
  blockedChannels?: string[];
  assignedList?: 'all' | 'standard' | 'listapro';
  createdAt?: string;
}

export interface ChannelItem {
  id: string;
  number: number;
  name: string;
  category: string;
  logo: string;
  url: string;
  resolution?: string;
  isBlocked?: boolean;
  playlistId?: string;
  epgNow: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  };
  epgNext: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  };
}

export interface VodItem {
  id: string;
  title: string;
  category: string;
  type: 'movie' | 'series';
  year: number;
  rating: string;
  poster: string;
  backdrop?: string;
  synopsis: string;
  duration?: string;
  seasons?: number;
  episodesCount?: number;
  url: string;
  isBlocked?: boolean;
  playlistId?: string;
  language?: 'latino' | 'subtitulado' | 'ingles';
  isListaPro?: boolean;
}

export interface IPTVPlaylist {
  id: string;
  name: string;
  type: 'm3u' | 'xtream';
  url: string;
  username?: string;
  password?: string;
  lastSynced: string;
  channelCount: number;
  active: boolean;
  status?: 'working' | 'failed' | 'untested';
  statusMessage?: string;
  latencyMs?: number;
  vodCount?: number;
  expDate?: string;
  enableChannels?: boolean;
  enableMovies?: boolean;
  enableSeries?: boolean;
}

export interface FloatingMessage {
  id: string;
  text: string;
  sender: string;
  targetUserId?: string;
  active: boolean;
  type: 'info' | 'warning' | 'urgent';
  createdAt: string;
}

export interface PlayerSettings {
  decoder: 'hardware' | 'software';
  bufferSize: number;
  enableOpenSLES: boolean;
  enableOpenGL: boolean;
  playbackFormat: 'default' | 'mpegts' | 'hls';
  categoryEngines: {
    live: string;
    movies: string;
    series: string;
    catchup: string;
    recording: string;
    liveWithGuide: string;
  };
}

export type AppView = 'login' | 'dashboard' | 'livetv' | 'movies' | 'series' | 'listapro' | 'settings' | 'admin';

