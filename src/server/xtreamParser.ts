import { ChannelItem, VodItem } from '../types/index.ts';

export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
  outputFormat?: 'm3u8' | 'ts';
}

export interface XtreamReadResult {
  success: boolean;
  works: boolean;
  statusCode?: number;
  latencyMs?: number;
  message: string;
  errorDetail?: string;
  serverInfo?: {
    url: string;
    port?: string;
    serverProtocol?: string;
    timezone?: string;
    rtmpPort?: string;
  };
  userInfo?: {
    username: string;
    status: string;
    expDate?: string;
    maxConnections?: string | number;
    activeCons?: string | number;
    isTrial?: string | boolean;
  };
  channels: ChannelItem[];
  vod: VodItem[];
  stats: {
    totalChannels: number;
    totalVod: number;
    categories: string[];
  };
  sourceUrl: string;
}

/**
 * Parsea cualquier URL de Xtream o get.php en servidor, usuario y contraseña.
 */
export function parseXtreamUrl(inputUrl: string, fallbackUser = '', fallbackPass = ''): XtreamCredentials {
  let cleanUrl = inputUrl.trim();
  let username = fallbackUser.trim();
  let password = fallbackPass.trim();
  let outputFormat: 'm3u8' | 'ts' = 'm3u8';

  try {
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'http://' + cleanUrl;
    }
    const parsed = new URL(cleanUrl);

    const qUser = parsed.searchParams.get('username') || parsed.searchParams.get('user');
    const qPass = parsed.searchParams.get('password') || parsed.searchParams.get('pass');
    const qOutput = parsed.searchParams.get('output');

    if (qUser) username = qUser;
    if (qPass) password = qPass;
    if (qOutput === 'ts' || qOutput === 'm3u8') outputFormat = qOutput;

    const parts = parsed.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'live' || parts[0] === 'movie' || parts[0] === 'series') && parts.length >= 3) {
      if (!username) username = parts[1];
      if (!password) password = parts[2];
    }

    const serverUrl = `${parsed.protocol}//${parsed.host}`;
    return { serverUrl, username, password, outputFormat };
  } catch {
    return {
      serverUrl: cleanUrl.replace(/\/+$/, ''),
      username,
      password,
      outputFormat,
    };
  }
}

/**
 * Lee el contenido de la API de Xtream Codes o de la lista M3U
 */
export async function readXtreamContent(
  rawUrl: string,
  user = '',
  pass = ''
): Promise<XtreamReadResult> {
  const startTime = Date.now();
  const { serverUrl, username, password, outputFormat } = parseXtreamUrl(rawUrl, user, pass);

  const headers = {
    'User-Agent': 'IPTVSmartersPro/3.1.5 (Linux; Android 12) VLC/3.0.18',
    Accept: '*/*',
  };

  const fetchWithTimeout = async (url: string, timeoutMs = 9000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  };

  let lastStatusCode = 0;

  // ESTRATEGIA 1: Xtream Codes JSON API
  if (username && password && serverUrl) {
    try {
      const authApiUrl = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const authRes = await fetchWithTimeout(authApiUrl, 7000);
      lastStatusCode = authRes.status;

      if (authRes.ok) {
        const authData: any = await authRes.json();
        const userInfo = authData?.user_info;
        const serverInfo = authData?.server_info;

        if (userInfo && userInfo.auth !== 0) {
          const latencyMs = Date.now() - startTime;

          // Categorías en vivo
          let liveCatMap = new Map<string, string>();
          try {
            const catRes = await fetchWithTimeout(
              `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`,
              5000
            );
            if (catRes.ok) {
              const cats: any = await catRes.json();
              if (Array.isArray(cats)) {
                cats.forEach((c) => liveCatMap.set(String(c.category_id), c.category_name));
              }
            }
          } catch {
            // Ignorar error secundario
          }

          // Canales en vivo
          let channels: ChannelItem[] = [];
          try {
            const streamsRes = await fetchWithTimeout(
              `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`,
              12000
            );
            if (streamsRes.ok) {
              const streams: any = await streamsRes.json();
              if (Array.isArray(streams)) {
                channels = streams.map((s: any, idx: number) => {
                  const catName = liveCatMap.get(String(s.category_id)) || 'General';
                  // Mantiene el enlace directo HTTP del servidor
                  const streamUrl = `${serverUrl}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}.ts`;
                  return {
                    id: `xtream_ch_${s.stream_id || idx + 1}`,
                    number: s.num ? parseInt(s.num, 10) : idx + 1,
                    name: s.name || `Canal ${idx + 1}`,
                    category: catName,
                    logo:
                      s.stream_icon && s.stream_icon.startsWith('http')
                        ? s.stream_icon
                        : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&auto=format&fit=crop&q=80',
                    url: streamUrl,
                    resolution: s.name && s.name.includes('FHD') ? '1080p FHD' : s.name && s.name.includes('HD') ? '720p HD' : 'Auto / Adaptable',
                    isBlocked: false,
                    epgNow: {
                      title: s.name || 'Emisión en directo',
                      startTime: '00:00',
                      endTime: '23:59',
                      description: `Señal en directo (${catName})`,
                    },
                    epgNext: {
                      title: 'Continuación de programación',
                      startTime: '23:59',
                      endTime: '06:00',
                      description: 'Transmisión continua.',
                    },
                  };
                });
              }
            }
          } catch (streamErr) {
            console.warn('Error al obtener canales:', streamErr);
          }

          // Películas VOD
          let movies: VodItem[] = [];
          try {
            const vodRes = await fetchWithTimeout(
              `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_streams`,
              10000
            );
            if (vodRes.ok) {
              const vodStreams: any = await vodRes.json();
              if (Array.isArray(vodStreams)) {
                movies = vodStreams.map((v: any, idx: number) => {
                  const ext = v.container_extension || 'mp4';
                  const streamUrl = `${serverUrl}/movie/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${v.stream_id}.${ext}`;
                  return {
                    id: `xtream_vod_${v.stream_id || idx + 1}`,
                    title: v.name || `Película ${idx + 1}`,
                    category: v.category_name || 'Películas Estreno',
                    type: 'movie',
                    year: v.year ? parseInt(v.year, 10) : 2026,
                    rating: v.rating ? String(v.rating) : '8.5',
                    poster:
                      v.stream_icon && v.stream_icon.startsWith('http')
                        ? v.stream_icon
                        : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
                    synopsis: v.plot || v.name || 'Película disponible en el servidor.',
                    duration: v.duration || '1h 45m',
                    url: streamUrl,
                    isBlocked: false,
                  };
                });
              }
            }
          } catch (vodErr) {
            console.warn('Error al obtener películas:', vodErr);
          }

          const categoriesSet = new Set<string>();
          channels.forEach((c) => categoriesSet.add(c.category));
          movies.forEach((v) => categoriesSet.add(v.category));

          return {
            success: true,
            works: true,
            statusCode: 200,
            latencyMs,
            message: `¡Conexión exitosa! Canales listados: ${channels.length}`,
            serverInfo: {
              url: serverUrl,
              port: serverInfo?.port,
              serverProtocol: serverInfo?.server_protocol,
              timezone: serverInfo?.timezone,
              rtmpPort: serverInfo?.rtmp_port,
            },
            userInfo: {
              username: userInfo.username || username,
              status: userInfo.status || 'Active',
              expDate: userInfo.exp_date ? String(userInfo.exp_date) : 'Activa',
              maxConnections: userInfo.max_connections || '1',
              activeCons: userInfo.active_cons || '0',
              isTrial: userInfo.is_trial,
            },
            channels,
            vod: movies,
            stats: {
              totalChannels: channels.length,
              totalVod: movies.length,
              categories: Array.from(categoriesSet),
            },
            sourceUrl: rawUrl,
          };
        } else if (userInfo && userInfo.auth === 0) {
          return {
            success: false,
            works: false,
            statusCode: 401,
            latencyMs: Date.now() - startTime,
            message: 'Error 401: Usuario o contraseña incorrectos / cuenta inactiva.',
            errorDetail: 'auth === 0',
            channels: [],
            vod: [],
            stats: { totalChannels: 0, totalVod: 0, categories: [] },
            sourceUrl: rawUrl,
          };
        }
      }
    } catch (apiErr: any) {
      console.warn('Fallo de conexión API Xtream:', apiErr?.message);
    }
  }

  // ESTRATEGIA 2: M3U fallback
  try {
    let m3uTargetUrl = rawUrl;
    if (username && password && (!rawUrl.includes('get.php') && !rawUrl.includes('.m3u'))) {
      m3uTargetUrl = `${serverUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=${outputFormat}`;
    }

    const m3uRes = await fetchWithTimeout(m3uTargetUrl, 12000);
    lastStatusCode = m3uRes.status;

    if (!m3uRes.ok) {
      return {
        success: false,
        works: false,
        statusCode: m3uRes.status,
        latencyMs: Date.now() - startTime,
        message: `Error HTTP ${m3uRes.status} al conectar con el servidor.`,
        errorDetail: `HTTP ${m3uRes.status}`,
        channels: [],
        vod: [],
        stats: { totalChannels: 0, totalVod: 0, categories: [] },
        sourceUrl: rawUrl,
      };
    }

    const m3uText = await m3uRes.text();
    const parsedData = parseM3uText(m3uText, serverUrl);

    return {
      success: true,
      works: true,
      statusCode: 200,
      latencyMs: Date.now() - startTime,
      message: `Lista M3U leída correctamente.`,
      serverInfo: { url: serverUrl },
      userInfo: { username: username || 'M3U User', status: 'Active', expDate: 'Activa' },
      channels: parsedData.channels,
      vod: parsedData.vod,
      stats: {
        totalChannels: parsedData.channels.length,
        totalVod: parsedData.vod.length,
        categories: parsedData.categories,
      },
      sourceUrl: rawUrl,
    };
  } catch (m3uErr: any) {
    return {
      success: false,
      works: false,
      statusCode: lastStatusCode || 0,
      latencyMs: Date.now() - startTime,
      message: `No se pudo conectar: ${m3uErr?.message || 'Error de red'}`,
      errorDetail: m3uErr?.message,
      channels: [],
      vod: [],
      stats: { totalChannels: 0, totalVod: 0, categories: [] },
      sourceUrl: rawUrl,
    };
  }
}

/**
 * Parsea el texto crudo del archivo M3U
 */
function parseM3uText(text: string, baseServer = '') {
  const lines = text.split('\n');
  const channels: ChannelItem[] = [];
  const vod: VodItem[] = [];
  const categoriesSet = new Set<string>();

  let currentExtinf: {
    name: string;
    logo: string;
    group: string;
    tvgId: string;
  } | null = null;

  let chNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const commaIdx = line.lastIndexOf(',');
      const rawName = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : `Canal ${chNumber}`;

      currentExtinf = {
        name: rawName,
        logo: logoMatch && logoMatch[1] ? logoMatch[1] : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&auto=format&fit=crop&q=80',
        group: groupMatch && groupMatch[1] ? groupMatch[1] : 'General',
        tvgId: tvgIdMatch && tvgIdMatch[1] ? tvgIdMatch[1] : '',
      };
    } else if (!line.startsWith('#') && currentExtinf) {
      let streamUrl = line;
      if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://') && baseServer) {
        streamUrl = `${baseServer}/${streamUrl.replace(/^\/+/, '')}`;
      }

      categoriesSet.add(currentExtinf.group);

      channels.push({
        id: `m3u_ch_${channels.length + 1}`,
        number: chNumber++,
        name: currentExtinf.name,
        category: currentExtinf.group,
        logo: currentExtinf.logo,
        url: streamUrl,
        resolution: '1080p HD',
        isBlocked: false,
        epgNow: {
          title: currentExtinf.name,
          startTime: '00:00',
          endTime: '23:59',
          description: `Señal en vivo de ${currentExtinf.group}`,
        },
        epgNext: {
          title: 'Continuación programación',
          startTime: '23:59',
          endTime: '06:00',
          description: 'Transmisión continua.',
        },
      });

      currentExtinf = null;
    }
  }

  return {
    channels,
    vod,
    categories: Array.from(categoriesSet),
  };
}