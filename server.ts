import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { StorageService } from './src/server/storage.ts';
import { readXtreamContent } from './src/server/xtreamParser.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const storage = StorageService.getInstance();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS and pre-flight handling
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Public endpoint for login screen footer info
  app.get('/api/public/info', (req, res) => {
    try {
      res.json(storage.getPublicInfo());
    } catch (e) {
      res.json({ contactNote: 'Para soporte técnico o renovaciones, contáctanos vía WhatsApp.' });
    }
  });

  // Client authentication endpoint
  app.post('/api/auth/client-login', (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
      }

      const authResult = storage.authenticateClient(username, password);
      if (!authResult.success) {
        return res.status(authResult.suspended ? 403 : 401).json({
          success: false,
          suspended: authResult.suspended || false,
          message: authResult.message || 'Credenciales inválidas',
        });
      }

      const user = authResult.user!;
      const db = storage.getDb();

      // FILTROS DE TILDES POR LISTA (Canales, Películas, Series)
      const playlists = db.playlists || [];
      const disabledChannelsPlaylists = new Set(playlists.filter(p => p.enableChannels === false).map(p => p.id));
      const disabledMoviesPlaylists = new Set(playlists.filter(p => p.enableMovies === false).map(p => p.id));
      const disabledSeriesPlaylists = new Set(playlists.filter(p => p.enableSeries === false).map(p => p.id));

      // Filter out channels that are blocked globally, by user, or disabled via playlist checkboxes
      const userBlockedSet = new Set(user.blockedChannels || []);
      const availableChannels = (db.channels || []).filter(ch => {
        if (ch.isBlocked || userBlockedSet.has(ch.id)) return false;
        if (ch.playlistId && disabledChannelsPlaylists.has(ch.playlistId)) return false;
        return true;
      });

      // Filter VOD / Movies & Series based on playlist checkboxes
      const availableVod = (db.vod || []).filter(v => {
        if (v.isBlocked) return false;
        if (v.playlistId) {
          const isSeries = v.type === 'series' || v.category?.toLowerCase().includes('serie');
          if (isSeries && disabledSeriesPlaylists.has(v.playlistId)) return false;
          if (!isSeries && disabledMoviesPlaylists.has(v.playlistId)) return false;
        }
        return true;
      }).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));

      // Floating message for this user or all
      let activeMessage = null;
      if (db.floatingMessage?.active) {
        if (db.floatingMessage.targetUserId === 'all' || db.floatingMessage.targetUserId === user.id) {
          activeMessage = db.floatingMessage;
        }
      }

      const cleanUser = user.username.toLowerCase();
      const isAdmin = user.id === 'usr_admin';
      const adminToken = isAdmin ? 'nesh_admin_token_' + Date.now() : null;

      return res.json({
        success: true,
        isAdmin,
        adminToken,
        user: {
          id: user.id,
          username: user.username,
          expiryDate: user.expiryDate,
          status: user.status,
          notes: user.notes,
          assignedList: user.assignedList || 'all',
        },
        channels: availableChannels,
        vod: availableVod,
        listaProItems: db.listaProItems || [],
        contactNote: db.contactNote || '',
        floatingMessage: activeMessage,
        playerSettings: db.playerSettings,
      });
    } catch (err: any) {
      console.error('Error handling /api/auth/client-login:', err);
      return res.status(500).json({
        success: false,
        message: 'Error en el servidor al procesar inicio de sesión',
      });
    }
  });

  // Client data refresh endpoint (fetches latest channels, VOD and settings for active user)
  app.post('/api/client/refresh', (req, res) => {
    try {
      const { username } = req.body || {};
      if (!username) {
        return res.status(400).json({ success: false, message: 'Usuario requerido' });
      }
      const db = storage.getDb();
      const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user || user.status === 'blocked') {
        return res.status(403).json({ success: false, message: 'Usuario no encontrado o suspendido' });
      }

      const playlists = db.playlists || [];
      const disabledChannelsPlaylists = new Set(playlists.filter(p => p.enableChannels === false).map(p => p.id));
      const disabledMoviesPlaylists = new Set(playlists.filter(p => p.enableMovies === false).map(p => p.id));
      const disabledSeriesPlaylists = new Set(playlists.filter(p => p.enableSeries === false).map(p => p.id));

      const userBlockedSet = new Set(user.blockedChannels || []);
      const availableChannels = (db.channels || []).filter(ch => {
        if (ch.isBlocked || userBlockedSet.has(ch.id)) return false;
        if (ch.playlistId && disabledChannelsPlaylists.has(ch.playlistId)) return false;
        return true;
      });

      const availableVod = (db.vod || []).filter(v => {
        if (v.isBlocked) return false;
        if (v.playlistId) {
          const isSeries = v.type === 'series' || v.category?.toLowerCase().includes('serie');
          if (isSeries && disabledSeriesPlaylists.has(v.playlistId)) return false;
          if (!isSeries && disabledMoviesPlaylists.has(v.playlistId)) return false;
        }
        return true;
      }).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));

      let activeMessage = null;
      if (db.floatingMessage?.active) {
        if (db.floatingMessage.targetUserId === 'all' || db.floatingMessage.targetUserId === user.id) {
          activeMessage = db.floatingMessage;
        }
      }

      const isAdmin = user.id === 'usr_admin';

      return res.json({
        success: true,
        isAdmin,
        user: {
          id: user.id,
          username: user.username,
          expiryDate: user.expiryDate,
          status: user.status,
          notes: user.notes,
          assignedList: user.assignedList || 'all',
        },
        channels: availableChannels,
        vod: availableVod,
        listaProItems: db.listaProItems || [],
        contactNote: db.contactNote || '',
        floatingMessage: activeMessage,
        playerSettings: db.playerSettings,
      });

    } catch (err) {
      console.error('Error in /api/client/refresh:', err);
      return res.status(500).json({ success: false, message: 'Error al actualizar datos' });
    }
  });

  // Admin authentication endpoint
  app.post('/api/auth/admin-login', (req, res) => {
    const { username, password } = req.body || {};
    const u = (username || 'admin').trim();
    const p = (password || '').trim();

    if (storage.authenticateAdmin(u, p)) {
      return res.json({
        success: true,
        token: 'nesh_admin_token_' + Date.now(),
        adminUser: 'admin',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Credenciales maestras incorrectas. Usa admin / Admin2026',
    });
  });

  // Direct Master Access endpoint for app owner (supports GET and POST)
  const handleMasterAccess = (_req: express.Request, res: express.Response) => {
    return res.json({
      success: true,
      token: 'nesh_admin_token_' + Date.now(),
      adminUser: 'admin',
    });
  };
  app.post('/api/auth/master-access', handleMasterAccess);
  app.get('/api/auth/master-access', handleMasterAccess);

  // Admin: Get all data
  app.get('/api/admin/data', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && !authHeader.includes('nesh_admin_token_') && !authHeader.includes('Bearer')) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }
    res.json(storage.getDb());
  });

  // Admin: Create user
  app.post('/api/admin/users', (req, res) => {
    const { username, password, expiryDate, status, notes, blockedChannels } = req.body;
    if (!username || !password || !expiryDate) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    const newUser = storage.addUser({
      username,
      password,
      expiryDate,
      status: status || 'active',
      notes: notes || '',
      blockedChannels: blockedChannels || [],
    });
    res.json({ success: true, user: newUser });
  });

  // Admin: Update user
  app.put('/api/admin/users/:id', (req, res) => {
    const updated = storage.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ success: true, user: updated });
  });

  // Admin: Delete user
  app.delete('/api/admin/users/:id', (req, res) => {
    const ok = storage.deleteUser(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ success: true });
  });

  // Admin: Update playlist settings (enable/disable channels, movies, series)
  app.put('/api/admin/playlists/:id', (req, res) => {
    const plId = req.params.id;
    const updated = storage.updatePlaylist(plId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Lista no encontrada' });
    }
    res.json({ success: true, playlist: updated });
  });

  // Admin: Update contact note
  app.post('/api/admin/contact-note', (req, res) => {
    const { note } = req.body;
    if (typeof note !== 'string') {
      return res.status(400).json({ error: 'Nota requerida' });
    }
    const updated = storage.updateContactNote(note);
    res.json({ success: true, contactNote: updated });
  });

  // Admin: Update floating message
  app.post('/api/admin/floating-message', (req, res) => {
    const updated = storage.updateFloatingMessage(req.body);
    res.json({ success: true, floatingMessage: updated });
  });

  // Admin: Add Lista Pro item
  app.post('/api/admin/listapro', (req, res) => {
    const item = req.body;
    if (!item || !item.title || !item.url) {
      return res.status(400).json({ error: 'Título y URL requeridos' });
    }
    const newItem = storage.addListaProItem(item);
    res.json({ success: true, item: newItem });
  });

  // Admin: Delete Lista Pro item
  app.delete('/api/admin/listapro/:id', (req, res) => {
    const ok = storage.deleteListaProItem(req.params.id);
    res.json({ success: ok });
  });

  // Admin: Reset core channels
  app.post('/api/admin/reset-channels', (req, res) => {
    const count = storage.resetCoreChannels();
    res.json({ success: true, count });
  });

  // Streaming Proxy for CORS, Mixed Content (HTTP on HTTPS) and Xtream/HLS bypass
  app.get('/api/proxy/stream', async (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) {
      return res.status(400).send('URL requerida');
    }

    try {
      try {
        const u = new URL(streamUrl);
        console.log(`[Proxy] Request received for host: ${u.host}, path: ${u.pathname.split('/').slice(0, 3).join('/')}/...`);
      } catch {
        console.log(`[Proxy] Request received`);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const upstreamRes = await fetch(streamUrl, {
        headers: {
          'User-Agent': 'IPTVSmartersPro/3.1.5 (Linux; Android 12) VLC/3.0.18',
          'Accept': '*/*',
          'Connection': 'keep-alive',
          ...(req.headers.range ? { Range: req.headers.range as string } : {}),
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);
      console.log(`[Proxy] Upstream status: ${upstreamRes.status}, Content-Type: ${upstreamRes.headers.get('content-type') || 'none'}`);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Expose-Headers', '*');

      const contentType = upstreamRes.headers.get('content-type') || 'application/vnd.apple.mpegurl';
      res.setHeader('Content-Type', contentType);

      if (upstreamRes.headers.get('content-length')) {
        res.setHeader('Content-Length', upstreamRes.headers.get('content-length')!);
      }
      if (upstreamRes.headers.get('content-range')) {
        res.setHeader('Content-Range', upstreamRes.headers.get('content-range')!);
      }
      if (upstreamRes.headers.get('accept-ranges')) {
        res.setHeader('Accept-Ranges', upstreamRes.headers.get('accept-ranges')!);
      }

      const isLiveStream = streamUrl.includes('/live/') || contentType.includes('video/mp2t') || contentType.includes('octet-stream');
      const isM3u8Request = !isLiveStream && (streamUrl.includes('.m3u8') || streamUrl.includes('m3u') || contentType.includes('mpegurl') || contentType.includes('m3u'));

      if (isM3u8Request) {
        const text = await upstreamRes.text();
        const trimmed = text.trim();

        if (trimmed.includes('#EXTM3U') || trimmed.includes('#EXTINF')) {
          const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
          let origin = '';
          try {
            origin = new URL(streamUrl).origin;
          } catch {
            origin = baseUrl;
          }

          const rewritten = text
            .split('\n')
            .map((line) => {
              const lineTrimmed = line.trim();
              if (!lineTrimmed) return line;

              if (lineTrimmed.startsWith('#')) {
                if (lineTrimmed.includes('URI=')) {
                  return line.replace(/URI=["']([^"']+)["']/g, (_match, uri) => {
                    let fullUri = uri;
                    if (!fullUri.startsWith('http://') && !fullUri.startsWith('https://')) {
                      fullUri = fullUri.startsWith('/') ? origin + fullUri : baseUrl + fullUri;
                    }
                    return `URI="/api/proxy/stream?url=${encodeURIComponent(fullUri)}"`;
                  });
                }
                return line;
              }

              let fullSegmentUrl = lineTrimmed;
              if (!fullSegmentUrl.startsWith('http://') && !fullSegmentUrl.startsWith('https://')) {
                fullSegmentUrl = fullSegmentUrl.startsWith('/') ? origin + fullSegmentUrl : baseUrl + fullSegmentUrl;
              }
              return `/api/proxy/stream?url=${encodeURIComponent(fullSegmentUrl)}`;
            })
            .join('\n');

          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          return res.status(upstreamRes.status).send(rewritten);
        } else {
          res.status(upstreamRes.status);
          return res.send(Buffer.from(text));
        }
      }

      if (upstreamRes.body) {
        res.status(upstreamRes.status);
        try {
          const nodeStream = Readable.fromWeb(upstreamRes.body as any);
          nodeStream.pipe(res);
          req.on('close', () => {
            try {
              nodeStream.destroy();
            } catch {}
          });
        } catch {
          const buffer = await upstreamRes.arrayBuffer();
          res.send(Buffer.from(buffer));
        }
      } else {
        const buffer = await upstreamRes.arrayBuffer();
        res.status(upstreamRes.status).send(Buffer.from(buffer));
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).send('Error conectando con el flujo IPTV: ' + (err.message || 'Error'));
      }
    }
  });

  // Client refresh data endpoint (returns strictly active, unblocked channels for clients)
  app.get('/api/client/data', (req, res) => {
    try {
      const db = storage.getDb();
      const userId = req.query.userId as string;
      let blockedSet = new Set<string>();

      if (userId) {
        const user = db.users.find((u) => u.id === userId);
        if (user && user.blockedChannels) {
          blockedSet = new Set(user.blockedChannels);
        }
      }

      const playlists = db.playlists || [];
      const disabledChannelsPlaylists = new Set(playlists.filter(p => p.enableChannels === false).map(p => p.id));
      const disabledMoviesPlaylists = new Set(playlists.filter(p => p.enableMovies === false).map(p => p.id));
      const disabledSeriesPlaylists = new Set(playlists.filter(p => p.enableSeries === false).map(p => p.id));

      const activeChannels = (db.channels || []).filter(
        (c) => {
          if (c.isBlocked || blockedSet.has(c.id)) return false;
          if (c.playlistId && disabledChannelsPlaylists.has(c.playlistId)) return false;
          return true;
        }
      );

      const activeVod = (db.vod || []).filter((v) => {
        if (v.isBlocked) return false;
        if (v.playlistId) {
          const isSeries = v.type === 'series' || v.category?.toLowerCase().includes('serie');
          if (isSeries && disabledSeriesPlaylists.has(v.playlistId)) return false;
          if (!isSeries && disabledMoviesPlaylists.has(v.playlistId)) return false;
        }
        return true;
      }).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));

      res.json({
        success: true,
        channels: activeChannels,
        vod: activeVod,
        contactNote: db.contactNote || '',
        floatingMessage: db.floatingMessage,
        playerSettings: db.playerSettings,
      });
    } catch (e: any) {
      res.status(500).json({ error: 'Error cargando datos de cliente' });
    }
  });

  // Admin: Test playlist URL connectivity and validate whether it works or not
  app.post('/api/admin/playlists/test', async (req, res) => {
    const { url, username, password } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, works: false, message: 'URL requerida para la prueba' });
    }

    try {
      const result = await readXtreamContent(url, username || '', password || '');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        works: false,
        message: 'Error inesperado al probar la URL: ' + (err.message || 'Error desconocido'),
      });
    }
  });

  // Admin: Sync playlist URL and import channels & VOD into database
  app.post('/api/admin/playlists/:id/sync', async (req, res) => {
    const plId = req.params.id;
    const db = storage.getDb();
    const playlist = db.playlists.find(p => p.id === plId);

    if (!playlist) {
      return res.status(404).json({ success: false, works: false, message: 'Lista no encontrada' });
    }

    try {
      const result = await readXtreamContent(playlist.url, playlist.username || '', playlist.password || '');

      if (result.works && result.channels.length > 0) {
        let channelsToImport = result.channels;
        let vodToImport = result.vod;

        if (playlist.enableChannels === false) channelsToImport = [];
        if (playlist.enableMovies === false) vodToImport = vodToImport.filter(item => item.type === 'series' || item.category?.toLowerCase().includes('serie'));
        if (playlist.enableSeries === false) vodToImport = vodToImport.filter(item => item.type !== 'series' && !item.category?.toLowerCase().includes('serie'));

        const imported = storage.importXtreamContent(
          channelsToImport,
          vodToImport,
          {
            playlistId: playlist.id,
            name: playlist.name,
            url: playlist.url,
            username: playlist.username,
            serverUrl: result.serverInfo?.url,
            status: result.userInfo?.status,
            expDate: result.userInfo?.expDate,
            latencyMs: result.latencyMs,
          },
          true
        );

        return res.json({
          success: true,
          works: true,
          message: result.message,
          latencyMs: result.latencyMs,
          statusCode: result.statusCode || 200,
          stats: result.stats,
          playlist: imported.playlist,
          channelsCount: imported.channelsCount,
          vodCount: imported.vodCount,
        });
      } else {
        storage.setPlaylistStatus(playlist.id, 'failed', result.message, result.latencyMs);
        return res.json({
          success: false,
          works: false,
          statusCode: result.statusCode || 0,
          latencyMs: result.latencyMs,
          message: result.message,
          errorDetail: result.errorDetail,
        });
      }
    } catch (err: any) {
      storage.setPlaylistStatus(playlist.id, 'failed', err.message || 'Error de sincronización');
      return res.status(500).json({
        success: false,
        works: false,
        message: 'Fallo al sincronizar: ' + (err.message || 'Error'),
      });
    }
  });

  // Admin: Test any single channel or stream URL in real time
  app.post('/api/admin/channels/test-url', async (req, res) => {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ online: false, message: 'URL requerida' });
    }

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const probeRes = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'IPTVSmartersPro/3.1.5 (Linux; Android 12) VLC/3.0.18',
          'Range': 'bytes=0-1024',
        },
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;

      res.json({
        online: probeRes.ok || probeRes.status === 206 || probeRes.status === 200,
        statusCode: probeRes.status,
        statusText: probeRes.statusText,
        latencyMs,
        contentType: probeRes.headers.get('content-type') || 'unknown',
        contentLength: probeRes.headers.get('content-length') || null,
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      res.json({
        online: false,
        statusCode: 0,
        latencyMs,
        error: err.message || 'Error de conexión',
      });
    }
  });

  // Admin: Add direct/custom channel
  app.post('/api/admin/channels/add-custom', (req, res) => {
    const { name, url, category, logo } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'URL requerida' });
    }
    const newChannel = storage.addDirectChannel({
      name: name || 'Canal Directo',
      url,
      category: category || 'Canales Directos',
      logo: logo || '',
    });
    res.json({ success: true, channel: newChannel });
  });

  // Admin: Add playlist (with auto-sync support)
  app.post('/api/admin/playlists', async (req, res) => {
    const { name, type, url, username, password, active, autoSync } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: 'Nombre y URL requeridos' });
    }

    let channelCount = 0;
    let initialStatus: 'working' | 'failed' | 'untested' = 'untested';
    let statusMessage = 'Pendiente de sincronización';
    let latencyMs: number | undefined;

    if (autoSync !== false) {
      try {
        const probe = await readXtreamContent(url, username || '', password || '');
        if (probe.works) {
          channelCount = probe.channels.length;
          initialStatus = 'working';
          statusMessage = probe.message;
          latencyMs = probe.latencyMs;

          const pl = storage.addPlaylist({
            name,
            type: type || 'm3u',
            url,
            username: username || '',
            password: password || '',
            channelCount,
            active: active !== undefined ? active : true,
            status: initialStatus,
            statusMessage,
            latencyMs,
            vodCount: probe.vod.length,
            expDate: probe.userInfo?.expDate,
          });

          if (probe.channels.length > 0) {
            storage.importXtreamContent(
              probe.channels,
              probe.vod,
              {
                playlistId: pl.id,
                name: pl.name,
                url: pl.url,
                username: pl.username,
                serverUrl: probe.serverInfo?.url,
                status: probe.userInfo?.status,
                expDate: probe.userInfo?.expDate,
                latencyMs: probe.latencyMs,
              },
              true
            );
          }

          return res.json({
            success: true,
            works: true,
            playlist: pl,
            syncResult: probe,
          });
        } else {
          initialStatus = 'failed';
          statusMessage = probe.message;
          latencyMs = probe.latencyMs;

          const pl = storage.addPlaylist({
            name,
            type: type || 'm3u',
            url,
            username: username || '',
            password: password || '',
            channelCount: 0,
            active: active !== undefined ? active : true,
            status: 'failed',
            statusMessage: probe.message,
            latencyMs,
          });

          return res.json({
            success: true,
            works: false,
            playlist: pl,
            syncResult: probe,
          });
        }
      } catch (err: any) {
        console.warn('AutoSync error:', err);
      }
    }

    const pl = storage.addPlaylist({
      name,
      type: type || 'm3u',
      url,
      username: username || '',
      password: password || '',
      channelCount: channelCount || 0,
      active: active !== undefined ? active : true,
      status: initialStatus,
      statusMessage,
      latencyMs,
    });
    res.json({ success: true, playlist: pl, works: initialStatus === 'working' });
  });

  // Admin: Delete playlist
  app.delete('/api/admin/playlists/:id', (req, res) => {
    const ok = storage.deletePlaylist(req.params.id);
    res.json({ success: ok });
  });

  // Admin: Toggle channel blocked state
  app.put('/api/admin/channels/:id/toggle', (req, res) => {
    const ch = storage.toggleChannelBlocked(req.params.id, req.body.blocked);
    if (!ch) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    res.json({ success: true, channel: ch });
  });

  // Admin: Toggle entire category blocked state
  app.put('/api/admin/channels-category/toggle', (req, res) => {
    const { category, blocked } = req.body || {};
    if (!category) {
      return res.status(400).json({ error: 'Categoría requerida' });
    }
    const count = storage.toggleCategoryChannelsBlocked(category, Boolean(blocked));
    res.json({ success: true, updatedCount: count });
  });

  // Admin: Toggle VOD blocked state
  app.put('/api/admin/vod/:id/toggle', (req, res) => {
    const item = storage.toggleVodBlocked(req.params.id, req.body.blocked);
    if (!item) {
      return res.status(404).json({ error: 'Película/Serie no encontrada' });
    }
    res.json({ success: true, vod: item });
  });

  // Admin: Add custom VOD item (movie or series) with auto or manual classification
  app.post('/api/admin/vod', (req, res) => {
    try {
      const { title, url, type, category, year, rating, poster, synopsis } = req.body || {};
      if (!title || !url) {
        return res.status(400).json({ success: false, error: 'Título y URL de transmisión requeridos' });
      }
      const newItem = storage.addVodItem({ title, url, type, category, year, rating, poster, synopsis });
      return res.json({ success: true, vodItem: newItem });
    } catch (err: any) {
      console.error('Error adding VOD item:', err);
      return res.status(500).json({ success: false, error: err.message || 'Error al agregar VOD' });
    }
  });

  // Admin: Purge unpaid/expired users
  app.post('/api/admin/users/purge-unpaid', (req, res) => {
    const count = storage.deleteUnpaidUsers();
    res.json({ success: true, deletedCount: count });
  });

  // Admin: Update player settings
  app.post('/api/admin/settings', (req, res) => {
    const updated = storage.updatePlayerSettings(req.body);
    res.json({ success: true, playerSettings: updated });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NeshTV Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
