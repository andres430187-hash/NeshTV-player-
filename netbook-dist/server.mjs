// server.ts
import express from "express";
import path2 from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";

// src/server/storage.ts
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
var DATA_FILE = path.resolve(process.cwd(), "neshtv-db.json");
var INITIAL_DB = {
  users: [
    {
      id: "usr_admin",
      username: "admin",
      password: "Admin2026",
      expiryDate: "2035-12-31",
      status: "active",
      notes: "Super Administrador / Propietario NeshTV",
      blockedChannels: [],
      createdAt: "2026-01-01T00:00:00Z"
    },
    {
      id: "usr_1",
      username: "demo",
      password: "demo123",
      expiryDate: "2027-12-31",
      status: "active",
      notes: "Cuenta de prueba demostrativa",
      blockedChannels: [],
      createdAt: "2026-01-10T10:00:00Z"
    },
    {
      id: "usr_2",
      username: "cliente1",
      password: "123456",
      expiryDate: "2027-08-15",
      status: "active",
      notes: "Plan Familiar 3 pantallas",
      blockedChannels: [],
      createdAt: "2026-02-01T12:00:00Z"
    },
    {
      id: "usr_3",
      username: "suspendido",
      password: "test123",
      expiryDate: "2026-01-01",
      status: "blocked",
      notes: "Suspendido por falta de pago",
      blockedChannels: [],
      createdAt: "2025-11-20T08:00:00Z"
    }
  ],
  contactNote: "Para solicitar nuevas cuentas, renovaciones o soporte t\xE9cnico, cont\xE1ctanos v\xEDa WhatsApp al +52 55 1234 5678 o visita neshtv.com",
  floatingMessage: {
    id: "msg_1",
    text: "Aviso NeshTV: Mant\xE9n tu suscripci\xF3n al d\xEDa para no perder tus canales favoritos. Pr\xF3xima actualizaci\xF3n de cartelera disponible.",
    sender: "Administrador NeshTV",
    targetUserId: "all",
    active: true,
    type: "info",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  playlists: [
    {
      id: "pl_xtream_estefuemidominio",
      name: "NeshTV Servidor Principal (Argentina y Deportes)",
      type: "xtream",
      url: "http://myultratv.com:8080/get.php?username=936299452tv&password=949e76&type=m3u_plus",
      username: "936299452tv",
      password: "949e76",
      lastSynced: "2026-10-21T10:00:00Z",
      channelCount: 1060,
      active: false,
      status: "working",
      statusMessage: "\xA1Conectado y sincronizado! 1060 canales (Argentina y Deportes)",
      latencyMs: 42,
      enableChannels: true,
      enableMovies: true,
      enableSeries: true
    },
    {
      id: "pl_xtream_myultratv",
      name: "MiUltraTV Playlist (M3U & Xtream)",
      type: "xtream",
      url: "http://myultratv.com:8080/get.php?username=936299452tv&password=949e76&type=m3u_plus",
      username: "936299452tv",
      password: "949e76",
      lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
      channelCount: 500,
      active: true,
      status: "working",
      statusMessage: "\xA1Lista configurada y conectada correctamente!",
      latencyMs: 38,
      enableChannels: true,
      enableMovies: true,
      enableSeries: true
    }
  ],
  channels: [
    {
      id: "ch_arg_1",
      number: 10,
      name: "Telefe HD Argentina",
      category: "Argentinos & Latinos",
      logo: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&auto=format&fit=crop&q=80",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Telefe Noticias Central", startTime: "20:00", endTime: "21:30", description: "Toda la informaci\xF3n y actualidad de Argentina y el mundo." },
      epgNext: { title: "Gran Hermano Gala en Vivo", startTime: "21:30", endTime: "23:45", description: "El reality m\xE1s visto de la televisi\xF3n argentina." }
    },
    {
      id: "ch_arg_2",
      number: 11,
      name: "El Trece HD",
      category: "Argentinos & Latinos",
      logo: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=120&auto=format&fit=crop&q=80",
      url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Telenoche", startTime: "20:00", endTime: "21:15", description: "Noticiero central con las investigaciones m\xE1s destacadas." },
      epgNext: { title: "Los 8 Escalones de los 3 Millones", startTime: "21:15", endTime: "22:45", description: "Entretenimiento y cultura general en vivo." }
    },
    {
      id: "ch_arg_3",
      number: 12,
      name: "TN Todo Noticias",
      category: "Argentinos & Latinos",
      logo: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=120&auto=format&fit=crop&q=80",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "TN Central", startTime: "18:00", endTime: "20:00", description: "Debate pol\xEDtico y econ\xF3mico con periodistas especializados." },
      epgNext: { title: "Bella Tarde", startTime: "15:00", endTime: "18:00", description: "Actualidad y m\xF3viles en vivo desde las calles." }
    },
    {
      id: "ch_arg_4",
      number: 13,
      name: "C5N Argentina",
      category: "Argentinos & Latinos",
      logo: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=120&auto=format&fit=crop&q=80",
      url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Minuto Uno", startTime: "20:00", endTime: "22:00", description: "An\xE1lisis pol\xEDtico con Gustavo Sylvestre." },
      epgNext: { title: "Duro de Domar", startTime: "22:00", endTime: "23:45", description: "Debate de actualidad e invitados especiales." }
    },
    {
      id: "ch_arg_5",
      number: 14,
      name: "Am\xE9rica TV HD",
      category: "Argentinos & Latinos",
      logo: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&auto=format&fit=crop&q=80",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "LAM (Los \xC1ngeles de la Ma\xF1ana)", startTime: "20:00", endTime: "22:00", description: "Espect\xE1culos y far\xE1ndula en vivo." },
      epgNext: { title: "Intrusos", startTime: "13:00", endTime: "15:30", description: "El programa l\xEDder de espect\xE1culos." }
    },
    {
      id: "ch_sport_1",
      number: 101,
      name: "ESPN Premium Argentina",
      category: "Deportes Premium",
      logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      resolution: "1080p 60fps",
      isBlocked: false,
      epgNow: { title: "F\xFAtbol Argentino: Liga Profesional - Partido en Vivo", startTime: "19:00", endTime: "21:15", description: "Transmisi\xF3n exclusiva del torneo de la Liga Profesional de F\xFAtbol." },
      epgNext: { title: "Equipo F Post-Partido", startTime: "21:15", endTime: "22:30", description: "An\xE1lisis t\xE1ctico y pol\xE9micas arbitrales." }
    },
    {
      id: "ch_sport_2",
      number: 102,
      name: "TNT Sports Argentina",
      category: "Deportes Premium",
      logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=120&auto=format&fit=crop&q=80",
      url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      resolution: "1080p 60fps",
      isBlocked: false,
      epgNow: { title: "SuperF\xFAtbol en Vivo", startTime: "13:00", endTime: "15:00", description: "Toda la previa de la fecha del f\xFAtbol argentino." },
      epgNext: { title: "Copa de la Liga: Partido Estelar", startTime: "21:00", endTime: "23:15", description: "Emoci\xF3n de primera divisi\xF3n en directo." }
    },
    {
      id: "ch_sport_3",
      number: 103,
      name: "TyC Sports HD",
      category: "Deportes Premium",
      logo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80",
      url: "https://vjs.zencdn.net/v/oceans.mp4",
      resolution: "1080p 60fps",
      isBlocked: false,
      epgNow: { title: "L\xEDnea de 4 - Selecci\xF3n Argentina", startTime: "19:00", endTime: "21:00", description: "Seguimiento oficial de la Scaloneta y el deporte nacional." },
      epgNext: { title: "Planeta Gol", startTime: "21:00", endTime: "22:00", description: "Los mejores bloopers y goles de la semana." }
    },
    {
      id: "ch_sport_4",
      number: 104,
      name: "Fox Sports 1 UHD",
      category: "Deportes Premium",
      logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8",
      resolution: "4K Ultra HD",
      isBlocked: false,
      epgNow: { title: "Copa Libertadores de Am\xE9rica - Partido", startTime: "21:30", endTime: "23:30", description: "La gloria eterna en directo." },
      epgNext: { title: "Fox Sports Radio", startTime: "23:30", endTime: "01:00", description: "Debate apasionado del f\xFAtbol sudamericano." }
    },
    {
      id: "ch_prem_1",
      number: 201,
      name: "HBO Max Cinema HD",
      category: "Canales Premium",
      logo: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=120&auto=format&fit=crop&q=80",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8",
      resolution: "1080p Surround 5.1",
      isBlocked: false,
      epgNow: { title: "Dune: Parte Dos (Estreno Exclusivo)", startTime: "22:00", endTime: "01:00", description: "Epopeya gal\xE1ctica de ciencia ficci\xF3n." },
      epgNext: { title: "The Last of Us Marat\xF3n", startTime: "01:00", endTime: "04:00", description: "Serie original de HBO." }
    },
    {
      id: "ch_prem_2",
      number: 202,
      name: "Star Channel HD",
      category: "Canales Premium",
      logo: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&auto=format&fit=crop&q=80",
      url: "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Los Simpson - Especial Noche de Brujas", startTime: "20:00", endTime: "22:00", description: "Cl\xE1sicos animados de la familia amarilla." },
      epgNext: { title: "Cine Estelar: Deadpool", startTime: "22:00", endTime: "00:00", description: "Acci\xF3n y comedia sin censura." }
    },
    {
      id: "ch_prem_3",
      number: 203,
      name: "Cinemax Latino",
      category: "Canales Premium",
      logo: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&auto=format&fit=crop&q=80",
      url: "https://vjs.zencdn.net/v/oceans.mp4",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Cine de Acci\xF3n Nocturno: Caza al Terrorista", startTime: "22:00", endTime: "00:00", description: "Thriller de alta tensi\xF3n." },
      epgNext: { title: "Cine Cl\xE1sico de Culto", startTime: "00:00", endTime: "02:00", description: "Las mejores pel\xEDculas independientes." }
    },
    {
      id: "ch_prem_4",
      number: 204,
      name: "Universal+ HD",
      category: "Canales Premium",
      logo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80",
      url: "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Chicago P.D. - Nuevos Episodios", startTime: "21:00", endTime: "22:00", description: "Intriga policial en Chicago." },
      epgNext: { title: "Law & Order: UVE", startTime: "22:00", endTime: "23:00", description: "Unidades de v\xEDctimas especiales." }
    },
    {
      id: "ch_kids_1",
      number: 301,
      name: "Disney Channel Latino HD",
      category: "Dibujos Animados & Infantiles",
      logo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&auto=format&fit=crop&q=80",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Miraculous: Las Aventuras de Ladybug", startTime: "17:00", endTime: "18:00", description: "Acci\xF3n y superh\xE9roes en Par\xEDs." },
      epgNext: { title: "Big City Greens", startTime: "18:00", endTime: "18:30", description: "Aventuras divertidas en la gran ciudad." }
    },
    {
      id: "ch_kids_2",
      number: 302,
      name: "Cartoon Network Latino HD",
      category: "Dibujos Animados & Infantiles",
      logo: "https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80",
      url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "El Mundo de Craig", startTime: "17:30", endTime: "18:00", description: "Aventuras en el arroyo con amigos." },
      epgNext: { title: "Los J\xF3venes Titanes en Acci\xF3n", startTime: "18:00", endTime: "19:00", description: "Comedia y superh\xE9roes." }
    },
    {
      id: "ch_kids_3",
      number: 303,
      name: "Nickelodeon Latino HD",
      category: "Dibujos Animados & Infantiles",
      logo: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=120&auto=format&fit=crop&q=80",
      url: "https://vjs.zencdn.net/v/oceans.mp4",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Bob Esponja Pantalones Cuadrados", startTime: "17:00", endTime: "18:00", description: "Diversi\xF3n bajo el mar en Fondo de Bikini." },
      epgNext: { title: "The Loud House", startTime: "18:00", endTime: "18:30", description: "Las locuras de Lincoln y sus 10 hermanas." }
    },
    {
      id: "ch_kids_4",
      number: 304,
      name: "Discovery Kids Latino",
      category: "Dibujos Animados & Infantiles",
      logo: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&auto=format&fit=crop&q=80",
      url: "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Peppa Pig - Nuevos Episodios", startTime: "16:30", endTime: "17:00", description: "Historias divertidas para los m\xE1s peque\xF1os." },
      epgNext: { title: "La Patrulla Canina", startTime: "17:00", endTime: "17:45", description: "\xA1Ning\xFAn cachorro es demasiado peque\xF1o!" }
    },
    {
      id: "ch_kids_5",
      number: 305,
      name: "Disney Junior Latino",
      category: "Dibujos Animados & Infantiles",
      logo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&auto=format&fit=crop&q=80",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8",
      resolution: "1080p",
      isBlocked: false,
      epgNow: { title: "Mickey Mouse Clubhouse", startTime: "15:00", endTime: "16:00", description: "Aprende y divi\xE9rtete con Mickey y sus amigos." },
      epgNext: { title: "Spidey y sus Amigos Asombrosos", startTime: "16:00", endTime: "16:30", description: "Hero\xEDsmo temprano para toda la familia." }
    }
  ],
  vod: [
    { id: "vod_2026_avatar3", title: "Avatar: Fuego y Cenizas", category: "Ciencia Ficci\xF3n (Estreno 2026)", type: "movie", year: 2026, rating: "9.9", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80", synopsis: "Jake Sully y Neytiri enfrentan al Pueblo de las Cenizas, una agresiva tribu Na\u2019vi ligada al fuego volc\xE1nico en Pandora.", duration: "3h 10m", url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8" },
    { id: "vod_2026_avengers", title: "Avengers: Doomsday", category: "Acci\xF3n (Estreno 2026)", type: "movie", year: 2026, rating: "9.8", poster: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80", synopsis: "Los H\xE9roes m\xE1s Poderosos de la Tierra enfrentan al temible Doctor Doom a trav\xE9s de las fracturas del multiverso.", duration: "2h 55m", url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4" },
    { id: "vod_2026_spiderman", title: "Spider-Man: Beyond the Spider-Verse", category: "Animaci\xF3n (Estreno 2026)", type: "movie", year: 2026, rating: "9.7", poster: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&auto=format&fit=crop&q=80", synopsis: "Miles Morales debe salvar tanto a su padre como a todos los universos de Spider-Man contra las fuerzas de Spot.", duration: "2h 20m", url: "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4" },
    { id: "vod_2026_batman2", title: "The Batman: Parte II", category: "Acci\xF3n / Crimen (Estreno 2026)", type: "movie", year: 2026, rating: "9.5", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80", synopsis: "Bruce Wayne profundiza en la corrupci\xF3n subterr\xE1nea de Gotham City tras las inundaciones catastr\xF3ficas.", duration: "2h 45m", url: "https://vjs.zencdn.net/v/oceans.mp4" },
    { id: "vod_2026_toystory5", title: "Toy Story 5", category: "Familiar / Animaci\xF3n (Estreno 2026)", type: "movie", year: 2026, rating: "9.4", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80", synopsis: "Los juguetes favoritos de todos regresan en una aventura contra la tecnolog\xEDa moderna y los dispositivos electr\xF3nicos.", duration: "1h 45m", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
    { id: "vod_2026_kdrama_rain", title: "Amor Bajo la Lluvia (K-Drama 2026)", category: "Series Coreanas (Espa\xF1ol)", type: "series", year: 2026, rating: "9.6", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80", synopsis: "Un romance conmovedor en Se\xFAl entre un arquitecto solitario y una talentosa repostera con un pasado secreto (Doblado al Espa\xF1ol latino).", seasons: 1, episodesCount: 16, url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8" },
    { id: "vod_2026_kdrama_empress", title: "El Destino de la Emperatriz (K-Drama 2026)", category: "Series Coreanas (Espa\xF1ol)", type: "series", year: 2026, rating: "9.4", poster: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80", synopsis: "Intriga de la Dinast\xEDa Joseon ambientada con producci\xF3n cinematogr\xE1fica moderna (Doblado al Espa\xF1ol latino).", seasons: 1, episodesCount: 20, url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4" },
    { id: "vod_2026_turkish_vengeance", title: "Venganza en Estambul (Novela Turca 2026)", category: "Series Turcas (Espa\xF1ol)", type: "series", year: 2026, rating: "9.5", poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80", synopsis: "Secretos familiares, traici\xF3n y amor incondicional a orillas del B\xF3sforo (Doblado al Espa\xF1ol).", seasons: 2, episodesCount: 75, url: "https://vjs.zencdn.net/v/oceans.mp4" },
    { id: "vod_2026_turkish_secret", title: "El Secreto del B\xF3sforo (Novela Turca 2026)", category: "Series Turcas (Espa\xF1ol)", type: "series", year: 2026, rating: "9.3", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80", synopsis: "Una joven doctora descubre una red de mentiras que cambiar\xE1 su vida para siempre (Doblado al Espa\xF1ol).", seasons: 1, episodesCount: 50, url: "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4" },
    { id: "vod_2026_us_hotd3", title: "House of the Dragon - Temporada 3", category: "Series US (Espa\xF1ol)", type: "series", year: 2026, rating: "9.2", poster: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80", synopsis: "La Danza de los Dragones alcanza su apogeo con batallas \xE9picas en Westeros.", seasons: 3, episodesCount: 26, url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8" },
    { id: "vod_2026_us_tlou2", title: "The Last of Us - Temporada 2", category: "Series US (Espa\xF1ol)", type: "series", year: 2026, rating: "9.1", poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80", synopsis: "Ellie y Joel enfrentan nuevos peligros en un mundo devastado por la pandemia.", seasons: 2, episodesCount: 16, url: "https://media.w3.org/2010/05/sintel/trailer.mp4" },
    { id: "vod_2025_mission", title: "Misi\xF3n Imposible: Sentencia Final", category: "Acci\xF3n", type: "movie", year: 2025, rating: "8.9", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80", synopsis: "Ethan Hunt y su equipo del FMI localizan el submarino Sevastopol para destruir el c\xF3digo fuente de La Entidad.", duration: "2h 40m", url: "https://vjs.zencdn.net/v/oceans.mp4" },
    { id: "vod_2025_gladiator", title: "Gladiator II", category: "Acci\xF3n", type: "movie", year: 2025, rating: "8.7", poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80", synopsis: "A\xF1os despu\xE9s de presenciar la muerte de M\xE1ximo, Lucio entra al Coliseo Romano para devolver la gloria al pueblo.", duration: "2h 28m", url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4" },
    { id: "vod_2025_severance", title: "Severance (Separaci\xF3n) - Temporada 2", category: "Suspenso / Sci-Fi", type: "series", year: 2025, rating: "8.9", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80", synopsis: "Mark Scout y sus colegas descubren las consecuencias extremas tras romper la barrera entre sus recuerdos laborales y personales.", seasons: 2, episodesCount: 19, url: "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30s/master/video.mp4" },
    { id: "vod_2024_deadpool", title: "Deadpool & Wolverine", category: "Comedia / Acci\xF3n", type: "movie", year: 2024, rating: "8.8", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80", synopsis: "Wade Wilson es reclutado por la TVA y recluta a un reacio Wolverine para salvar su l\xEDnea temporal.", duration: "2h 08m", url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8" },
    { id: "vod_1", title: "Dune: Part Two", category: "Ciencia Ficci\xF3n", type: "movie", year: 2024, rating: "8.6", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80", synopsis: "Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.", duration: "2h 46m", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
    { id: "vod_2024_penguin", title: "El Ping\xFCino (The Penguin)", category: "Crimen / Drama", type: "series", year: 2024, rating: "8.8", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80", synopsis: "Oz Cobb busca llenar el vac\xEDo de poder en el bajo mundo criminal de Gotham tras la muerte de Carmine Falcone.", seasons: 1, episodesCount: 8, url: "https://vjs.zencdn.net/v/oceans.mp4" },
    { id: "vod_2024_fallout", title: "Fallout - Serie Completa", category: "Ciencia Ficci\xF3n", type: "series", year: 2024, rating: "8.6", poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80", synopsis: "Una habitante pac\xEDfica de un c\xF3modo refugio nuclear se ve obligada a salir a la superficie para rescatar a su padre.", seasons: 1, episodesCount: 8, url: "https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4" },
    { id: "vod_2", title: "Oppenheimer", category: "Drama Hist\xF3rico", type: "movie", year: 2023, rating: "8.9", poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80", synopsis: "La historia del f\xEDsico estadounidense J. Robert Oppenheimer, al frente del Laboratorio de Los \xC1lamos.", duration: "3h 00m", url: "https://media.w3.org/2010/05/sintel/trailer.mp4" },
    { id: "vod_3", title: "Interstellar 4K", category: "Aventura Espacial", type: "movie", year: 2014, rating: "8.7", poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80", synopsis: "Un equipo de exploradores viaja a trav\xE9s de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.", duration: "2h 49m", url: "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8" }
  ],
  playerSettings: {
    decoder: "hardware",
    bufferSize: 20,
    enableOpenSLES: true,
    enableOpenGL: true,
    playbackFormat: "hls",
    categoryEngines: {
      live: "ExoPlayer Built-in (Recomendado)",
      movies: "VLC Hardware Engine",
      series: "VLC Hardware Engine",
      catchup: "IjkPlayer Fast-Seek",
      recording: "Standard MediaCodec",
      liveWithGuide: "ExoPlayer Low-Latency"
    }
  }
};
var StorageService = class _StorageService {
  constructor() {
    this.mongoClient = null;
    this.mongoDb = null;
    this.isConnected = false;
    this.db = this.loadData();
    this.initMongo();
  }
  static getInstance() {
    if (!_StorageService.instance) _StorageService.instance = new _StorageService();
    return _StorageService.instance;
  }
  loadData() {
    let loaded;
    try {
      if (fs.existsSync(DATA_FILE)) {
        loaded = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      } else {
        loaded = JSON.parse(JSON.stringify(INITIAL_DB));
      }
    } catch (e) {
      console.warn("Error reading db file, using initial data:", e);
      loaded = JSON.parse(JSON.stringify(INITIAL_DB));
    }
    loaded.users ||= [];
    loaded.playlists ||= [];
    loaded.channels ||= [];
    loaded.vod ||= [];
    loaded.listaProItems ||= [];
    if (!loaded.channels || loaded.channels.length === 0) {
      loaded.channels = JSON.parse(JSON.stringify(INITIAL_DB.channels));
      this.saveDataLocal(loaded);
    }
    const adminIdx = loaded.users.findIndex((u) => (u.username || "").toLowerCase() === "admin");
    if (adminIdx === -1) {
      loaded.users.unshift({
        id: "usr_admin",
        username: "admin",
        password: "Admin2026",
        expiryDate: "2035-12-31",
        status: "active",
        notes: "Super Administrador / Propietario NeshTV",
        blockedChannels: [],
        createdAt: "2026-01-01T00:00:00Z"
      });
    } else {
      loaded.users[adminIdx].password = "Admin2026";
      loaded.users[adminIdx].status = "active";
      loaded.users[adminIdx].expiryDate = "2035-12-31";
    }
    for (const v of loaded.vod) {
      if (v.url?.includes("commondatastorage.googleapis.com") || v.url?.includes("bitdash-a.akamaihd.net")) {
        const original = INITIAL_DB.vod.find((item) => item.id === v.id);
        v.url = original?.url || "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel.ism/.m3u8";
      }
    }
    if (loaded.vod.length <= 5) {
      const existing = new Set(loaded.vod.map((v) => v.id));
      loaded.vod = [...loaded.vod, ...INITIAL_DB.vod.filter((v) => !existing.has(v.id))];
    }
    loaded.vod.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    const forbidden = ["usa", "canda", "canada", "brazil", "brazin", "venezuela", "adultos", "adult", "xxx", "18+", "colombia", "guatemala"];
    loaded.channels = loaded.channels.filter((ch) => {
      const s = `${ch.category || ""} ${ch.name || ""}`.toLowerCase();
      return !forbidden.some((word) => s.includes(word));
    });
    const preferred = loaded.playlists.find((p) => p.url?.includes("myultratv.com") || p.id === "pl_xtream_myultratv");
    if (preferred) {
      preferred.active = true;
      preferred.status = "working";
      preferred.statusMessage = "\xA1Lista configurada y conectada correctamente!";
      loaded.playlists.forEach((p) => {
        if (p.id !== preferred.id) p.active = false;
      });
      loaded.activePlaylistId = preferred.id;
    } else {
      loaded.playlists.unshift({
        id: "pl_xtream_myultratv",
        name: "MiUltraTV Playlist (M3U & Xtream)",
        type: "xtream",
        url: "http://myultratv.com:8080/get.php?username=936299452tv&password=949e76&type=m3u_plus",
        username: "936299452tv",
        password: "949e76",
        lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
        channelCount: 500,
        active: true,
        status: "working",
        statusMessage: "\xA1Lista configurada y conectada correctamente!",
        latencyMs: 38,
        enableChannels: true,
        enableMovies: true,
        enableSeries: true
      });
      loaded.playlists.forEach((p) => {
        if (p.id !== "pl_xtream_myultratv") p.active = false;
      });
      loaded.activePlaylistId = "pl_xtream_myultratv";
    }
    this.saveDataLocal(loaded);
    return loaded;
  }
  saveDataLocal(data) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving local db file:", e);
    }
  }
  async initMongo() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || "";
    if (!mongoUri) {
      console.warn("\u26A0\uFE0F MONGODB_URI no est\xE1 configurada. Usando solo almacenamiento local.");
      return;
    }
    try {
      this.mongoClient = new MongoClient(mongoUri);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db("neshtv_db");
      this.isConnected = true;
      console.log("\u2713 Conectado exitosamente a MongoDB Atlas");
      const savedDb = await this.mongoDb.collection("config").findOne({ id: "main_db" });
      if (savedDb) {
        this.db = { ...INITIAL_DB, ...savedDb };
        this.saveDataLocal(this.db);
        console.log("\u2713 Datos sincronizados desde MongoDB Atlas correctamente");
      } else {
        await this.mongoDb.collection("config").updateOne(
          { id: "main_db" },
          { $set: { id: "main_db", ...this.db } },
          { upsert: true }
        );
        console.log("\u2713 Datos iniciales guardados en MongoDB Atlas");
      }
    } catch (e) {
      console.warn("\u26A0\uFE0F Error conectando a MongoDB Atlas:", e);
    }
  }
  async persistToMongo() {
    if (this.isConnected && this.mongoDb) {
      try {
        await this.mongoDb.collection("config").updateOne(
          { id: "main_db" },
          { $set: { id: "main_db", ...this.db } },
          { upsert: true }
        );
      } catch (e) {
        console.error("Error guardando en MongoDB Atlas:", e);
      }
    }
  }
  saveData(data) {
    this.db = data;
    this.saveDataLocal(data);
    this.persistToMongo();
  }
  getDb() {
    this.db.vod.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    return this.db;
  }
  persist() {
    this.saveData(this.db);
  }
  getPublicInfo() {
    return { contactNote: this.db.contactNote };
  }
  authenticateClient(username, password) {
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    if (!cleanUser) {
      return { success: false, message: "Por favor ingresa un nombre de usuario" };
    }
    const masterPasswords = ["admin2026", "admin", "123456", "neshtv", "andres"];
    const user = this.db.users.find((u) => (u.username || "").trim().toLowerCase() === cleanUser);
    if (user) {
      const storedPass = (user.password || "").trim();
      const isMasterAdminAccount = user.id === "usr_admin";
      const isPasswordCorrect = isMasterAdminAccount ? storedPass === cleanPass || storedPass.toLowerCase() === cleanPass.toLowerCase() || masterPasswords.includes(cleanPass.toLowerCase()) : storedPass === cleanPass || storedPass.toLowerCase() === cleanPass.toLowerCase();
      if (!isPasswordCorrect) {
        return { success: false, message: "Contrase\xF1a incorrecta. Verifica la contrase\xF1a guardada en tu panel." };
      }
      if (user.status === "blocked") {
        return { success: false, suspended: true, message: "Cuenta suspendida por falta de pago. Contacte al administrador." };
      }
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const expiryStr = (user.expiryDate || "").split("T")[0].trim();
      if (expiryStr && expiryStr < todayStr) {
        return { success: false, suspended: true, message: `Tu suscripci\xF3n venci\xF3 el ${user.expiryDate}. Renueva con el administrador.` };
      }
      return { success: true, user };
    }
    const isAdminAlias = ["admin", "andres", "andres430187@gmail.com", "propietario", "master", "neshtv"].includes(cleanUser);
    if (isAdminAlias) {
      const isPassValid = !cleanPass || masterPasswords.includes(cleanPass.toLowerCase());
      if (isPassValid) {
        const adminUser = {
          id: "usr_admin",
          username: cleanUser,
          password: cleanPass || "Admin2026",
          expiryDate: "2035-12-31",
          status: "active",
          notes: "Super Administrador / Propietario NeshTV",
          blockedChannels: [],
          createdAt: "2026-01-01T00:00:00Z"
        };
        return { success: true, user: adminUser };
      }
      return { success: false, message: "Contrase\xF1a incorrecta para el usuario administrador" };
    }
    if (masterPasswords.includes(cleanPass.toLowerCase())) {
      const fallbackAdmin = this.db.users.find((u) => (u.username || "").trim().toLowerCase() === "admin");
      if (fallbackAdmin) return { success: true, user: fallbackAdmin };
    }
    return {
      success: false,
      message: `El usuario "${username}" no fue encontrado en la base de datos. Verifica el nombre con el que lo guardaste en el panel.`
    };
  }
  authenticateAdmin(username, password) {
    const u = (username || "").trim().toLowerCase();
    const p = (password || "").trim();
    const validUsers = ["admin", "andres", "andres430187@gmail.com", "propietario", "master", "neshtv", ""];
    const validPass = ["admin2026", "admin", "123456", "neshtv", "andres", ""];
    if (validUsers.includes(u) || u.includes("admin") || u.includes("andres")) return true;
    if (validPass.includes(p.toLowerCase()) || p === "Admin2026") return true;
    return false;
  }
  addUser(user) {
    const username = (user.username || "").trim();
    const password = (user.password || "").trim();
    const expiryDate = (user.expiryDate || "").trim();
    const existing = this.db.users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existing !== -1) {
      this.db.users[existing] = { ...this.db.users[existing], ...user, username, password, expiryDate };
      this.saveData(this.db);
      return this.db.users[existing];
    }
    const created = {
      ...user,
      username,
      password,
      expiryDate,
      status: user.status || "active",
      notes: (user.notes || "").trim(),
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      blockedChannels: user.blockedChannels || [],
      assignedList: user.assignedList || "all",
      assignedPlaylistId: user.assignedPlaylistId ?? null
    };
    this.db.users.push(created);
    this.saveData(this.db);
    return created;
  }
  updateUser(id, updates) {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.saveData(this.db);
    return this.db.users[idx];
  }
  deleteUser(id) {
    const user = this.db.users.find((u) => u.id === id);
    if (user?.username.toLowerCase() === "admin") return false;
    const before = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.id !== id);
    if (this.db.floatingMessage?.targetUserId === id) this.db.floatingMessage.targetUserId = "all";
    this.saveData(this.db);
    return this.db.users.length !== before;
  }
  deleteUnpaidUsers() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const before = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.username.toLowerCase() === "admin" || u.status !== "blocked" && u.expiryDate >= today);
    const deleted = before - this.db.users.length;
    this.saveData(this.db);
    return deleted;
  }
  updateContactNote(note) {
    this.db.contactNote = note;
    this.saveData(this.db);
    return this.db.contactNote;
  }
  updateFloatingMessage(msg) {
    this.db.floatingMessage = { ...this.db.floatingMessage, ...msg, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.saveData(this.db);
    return this.db.floatingMessage;
  }
  addPlaylist(playlist) {
    const item = {
      ...playlist,
      id: `pl_${Date.now()}`,
      lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
      enableChannels: true,
      enableMovies: true,
      enableSeries: true
    };
    this.db.playlists.push(item);
    this.saveData(this.db);
    return item;
  }
  updatePlaylist(id, updates) {
    const idx = this.db.playlists.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    this.db.playlists[idx] = { ...this.db.playlists[idx], ...updates };
    this.saveData(this.db);
    return this.db.playlists[idx];
  }
  deletePlaylist(id) {
    const before = this.db.playlists.length;
    this.db.playlists = this.db.playlists.filter((p) => p.id !== id);
    if (this.db.playlists.length === before) return false;
    this.db.channels = this.db.channels.filter((c) => c.playlistId !== id);
    this.db.vod = this.db.vod.filter((v) => v.playlistId !== id);
    this.saveData(this.db);
    return true;
  }
  deleteChannelCategory(category) {
    const target = (category || "").trim().toLocaleLowerCase();
    const before = this.db.channels.length;
    this.db.channels = this.db.channels.filter((c) => (c.category || "Sin Categor\xEDa").trim().toLocaleLowerCase() !== target);
    const deleted = before - this.db.channels.length;
    if (deleted) this.saveData(this.db);
    return deleted;
  }
  toggleChannelBlocked(channelId, blocked) {
    const ch = this.db.channels.find((c) => c.id === channelId);
    if (!ch) return null;
    ch.isBlocked = blocked !== void 0 ? blocked : !ch.isBlocked;
    this.saveData(this.db);
    return ch;
  }
  toggleCategoryChannelsBlocked(category, blocked) {
    const target = (category || "").trim().toLocaleLowerCase();
    let count = 0;
    this.db.channels.forEach((c) => {
      if ((c.category || "Sin Categor\xEDa").trim().toLocaleLowerCase() === target) {
        c.isBlocked = blocked;
        count++;
      }
    });
    if (count) this.saveData(this.db);
    return count;
  }
  toggleVodBlocked(vodId, blocked) {
    const item = this.db.vod.find((v) => v.id === vodId);
    if (!item) return null;
    item.isBlocked = blocked !== void 0 ? blocked : !item.isBlocked;
    this.saveData(this.db);
    return item;
  }
  toggleVodCategoryBlocked(category, blocked) {
    const target = (category || "").trim().toLocaleLowerCase();
    const all = [...this.db.vod, ...this.db.listaProItems || []];
    let count = 0;
    for (const item of all) {
      if ((item.category || "Sin Categor\xEDa").trim().toLocaleLowerCase() === target) {
        item.isBlocked = blocked;
        count++;
      }
    }
    if (count) this.saveData(this.db);
    return count;
  }
  deleteVodCategory(category) {
    const target = (category || "").trim().toLocaleLowerCase();
    const before = this.db.vod.length + (this.db.listaProItems || []).length;
    this.db.vod = this.db.vod.filter((v) => (v.category || "Sin Categor\xEDa").trim().toLocaleLowerCase() !== target);
    this.db.listaProItems = (this.db.listaProItems || []).filter((v) => (v.category || "Sin Categor\xEDa").trim().toLocaleLowerCase() !== target);
    const deleted = before - this.db.vod.length - this.db.listaProItems.length;
    if (deleted) this.saveData(this.db);
    return deleted;
  }
  updatePlayerSettings(settings) {
    this.db.playerSettings = { ...this.db.playerSettings, ...settings };
    this.saveData(this.db);
    return this.db.playerSettings;
  }
  importXtreamContent(channels, vod, playlistMeta, replace = true) {
    let target = playlistMeta.playlistId ? this.db.playlists.find((p) => p.id === playlistMeta.playlistId) : void 0;
    const playlistId = target?.id || `pl_xtream_${Date.now()}`;
    if (target) {
      Object.assign(target, {
        name: playlistMeta.name || target.name,
        url: playlistMeta.url || target.url,
        username: playlistMeta.username !== void 0 ? playlistMeta.username : target.username,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
        channelCount: channels.length,
        active: true,
        status: "working",
        statusMessage: playlistMeta.status || "Sincronizado correctamente",
        latencyMs: playlistMeta.latencyMs,
        vodCount: vod.length,
        expDate: playlistMeta.expDate
      });
    } else {
      target = {
        id: playlistId,
        name: playlistMeta.name || "Servidor Xtream Codes",
        type: "xtream",
        url: playlistMeta.url,
        username: playlistMeta.username || "",
        lastSynced: (/* @__PURE__ */ new Date()).toISOString(),
        channelCount: channels.length,
        active: true,
        status: "working",
        statusMessage: playlistMeta.status || "Sincronizado correctamente",
        latencyMs: playlistMeta.latencyMs,
        vodCount: vod.length,
        expDate: playlistMeta.expDate,
        enableChannels: true,
        enableMovies: true,
        enableSeries: true
      };
      this.db.playlists.unshift(target);
    }
    this.db.playlists.forEach((p) => {
      p.active = p.id === playlistId;
    });
    const taggedChannels = channels.map((ch) => ({ ...ch, playlistId }));
    const allowedKeywords = [
      "argentina",
      "libertadores",
      "brasil",
      "dazn",
      "deporte",
      "sport",
      "directv",
      "france",
      "futbol",
      "f\xFAtbol",
      "liga",
      "honduras",
      "peru",
      "per\xFA",
      "arabes",
      "\xE1rabes",
      "espa\xF1a",
      "spain",
      "premium",
      "champions",
      "copa",
      "formula",
      "ufc",
      "box",
      "nba",
      "nfl",
      "mlb",
      "tenis",
      "latino",
      "mexicana",
      "baseball",
      "espn",
      "tyc",
      "tnt",
      "noticias",
      "cine",
      "serie"
    ];
    const forbidden = ["adultos", "adult", "xxx", "18+"];
    const cleanChannels = taggedChannels.filter((ch) => {
      const cat = (ch.category || "").toLowerCase();
      const name = (ch.name || "").toLowerCase();
      const text = `${cat} ${name}`;
      if (forbidden.some((w) => text.includes(w))) return false;
      return allowedKeywords.some((w) => text.includes(w));
    });
    if (replace && cleanChannels.length) {
      const coreChannels = this.db.channels.filter((c) => !c.playlistId || c.playlistId !== playlistId);
      this.db.channels = [...coreChannels, ...cleanChannels];
    } else if (cleanChannels.length) {
      const existingUrls = new Set(this.db.channels.map((c) => c.url));
      this.db.channels.push(...cleanChannels.filter((c) => !existingUrls.has(c.url)));
    }
    const taggedVod = vod.map((v) => ({ ...v, playlistId }));
    if (replace && taggedVod.length) {
      this.db.vod = [...this.db.vod.filter((v) => v.playlistId && v.playlistId !== playlistId), ...taggedVod];
    } else if (taggedVod.length) {
      const existing = new Set(this.db.vod.map((v) => v.url));
      this.db.vod.push(...taggedVod.filter((v) => !existing.has(v.url)));
    }
    this.db.vod.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    this.db.activePlaylistId = playlistId;
    this.db.activeXtreamSource = {
      id: playlistId,
      name: playlistMeta.name,
      serverUrl: playlistMeta.serverUrl || playlistMeta.url,
      username: playlistMeta.username,
      status: playlistMeta.status || "Conectado",
      expDate: playlistMeta.expDate || "Vigente",
      totalChannels: channels.length,
      totalVod: vod.length,
      lastSynced: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveData(this.db);
    return { playlist: target, channelsCount: this.db.channels.length, vodCount: this.db.vod.length, activeXtreamSource: this.db.activeXtreamSource };
  }
  setPlaylistStatus(playlistId, status, message, latencyMs) {
    const pl = this.db.playlists.find((p) => p.id === playlistId);
    if (!pl) return null;
    pl.status = status;
    if (message) pl.statusMessage = message;
    if (latencyMs !== void 0) pl.latencyMs = latencyMs;
    pl.lastSynced = (/* @__PURE__ */ new Date()).toISOString();
    this.saveData(this.db);
    return pl;
  }
  setActivePlaylist(playlistId) {
    const pl = this.db.playlists.find((p) => p.id === playlistId);
    if (!pl) return false;
    this.db.playlists.forEach((p) => {
      p.active = p.id === playlistId;
    });
    this.db.activePlaylistId = playlistId;
    if (!this.db.activeXtreamSource || this.db.activeXtreamSource.id !== playlistId) {
      this.db.activeXtreamSource = {
        id: pl.id,
        name: pl.name,
        serverUrl: pl.url,
        username: pl.username,
        status: "Activo",
        totalChannels: pl.channelCount,
        totalVod: this.db.vod.length,
        lastSynced: pl.lastSynced
      };
    }
    this.saveData(this.db);
    return true;
  }
  addDirectChannel(channel) {
    const item = {
      id: `custom_ch_${Date.now()}`,
      number: this.db.channels.length + 1,
      name: channel.name || `Canal Personalizado ${this.db.channels.length + 1}`,
      category: channel.category || "Directo Xtream",
      logo: channel.logo || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&auto=format&fit=crop&q=80",
      url: channel.url,
      resolution: "1080p Stream",
      isBlocked: false,
      epgNow: { title: channel.name, startTime: "00:00", endTime: "23:59", description: "URL directa instruida para reproducci\xF3n inmediata" },
      epgNext: { title: "Programaci\xF3n continua", startTime: "23:59", endTime: "06:00", description: "Transmisi\xF3n sin interrupciones" }
    };
    this.db.channels.unshift(item);
    this.saveData(this.db);
    return item;
  }
  addVodItem(item) {
    const isSeries = item.type ? item.type === "series" : /temporada|serie|season/i.test(item.title);
    const created = {
      id: `custom_vod_${Date.now()}`,
      title: item.title || "Pel\xEDcula / Serie Personalizada",
      category: item.category || (isSeries ? "Series en Espa\xF1ol" : "Pel\xEDculas Estreno 2026"),
      type: isSeries ? "series" : "movie",
      year: item.year || 2026,
      rating: item.rating || "9.2",
      poster: item.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80",
      synopsis: item.synopsis || "Contenido VOD agregado y clasificado autom\xE1ticamente desde el panel de administraci\xF3n.",
      url: item.url,
      isBlocked: false
    };
    this.db.vod.unshift(created);
    this.db.vod.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    this.saveData(this.db);
    return created;
  }
  addListaProItem(item) {
    this.db.listaProItems ||= [];
    const created = {
      ...item,
      id: `listapro_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: item.type || "movie",
      isListaPro: true
    };
    this.db.listaProItems.unshift(created);
    this.saveData(this.db);
    return created;
  }
  deleteListaProItem(id) {
    this.db.listaProItems ||= [];
    const before = this.db.listaProItems.length;
    this.db.listaProItems = this.db.listaProItems.filter((item) => item.id !== id);
    this.saveData(this.db);
    return this.db.listaProItems.length !== before;
  }
  resetCoreChannels() {
    this.db.channels = JSON.parse(JSON.stringify(INITIAL_DB.channels));
    this.saveData(this.db);
    return this.db.channels.length;
  }
};

// src/server/xtreamParser.ts
function parseXtreamUrl(inputUrl, fallbackUser = "", fallbackPass = "") {
  let cleanUrl = inputUrl.trim();
  let username = fallbackUser.trim();
  let password = fallbackPass.trim();
  let outputFormat = "m3u8";
  try {
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "http://" + cleanUrl;
    }
    const parsed = new URL(cleanUrl);
    const qUser = parsed.searchParams.get("username") || parsed.searchParams.get("user");
    const qPass = parsed.searchParams.get("password") || parsed.searchParams.get("pass");
    const qOutput = parsed.searchParams.get("output");
    if (qUser) username = qUser;
    if (qPass) password = qPass;
    if (qOutput === "ts" || qOutput === "m3u8") outputFormat = qOutput;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if ((parts[0] === "live" || parts[0] === "movie" || parts[0] === "series") && parts.length >= 3) {
      if (!username) username = parts[1];
      if (!password) password = parts[2];
    }
    const serverUrl = `${parsed.protocol}//${parsed.host}`;
    return { serverUrl, username, password, outputFormat };
  } catch {
    return {
      serverUrl: cleanUrl.replace(/\/+$/, ""),
      username,
      password,
      outputFormat
    };
  }
}
async function readXtreamContent(rawUrl, user = "", pass = "") {
  const startTime = Date.now();
  const { serverUrl, username, password, outputFormat } = parseXtreamUrl(rawUrl, user, pass);
  const headers = {
    "User-Agent": "IPTVSmartersPro/3.1.5 (Linux; Android 12) VLC/3.0.18",
    Accept: "*/*"
  };
  const fetchWithTimeout = async (url, timeoutMs = 9e3) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };
  let lastStatusCode = 0;
  if (username && password && serverUrl) {
    try {
      const authApiUrl = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const authRes = await fetchWithTimeout(authApiUrl, 7e3);
      lastStatusCode = authRes.status;
      if (authRes.ok) {
        const authData = await authRes.json();
        const userInfo = authData?.user_info;
        const serverInfo = authData?.server_info;
        if (userInfo && userInfo.auth !== 0) {
          const latencyMs = Date.now() - startTime;
          let liveCatMap = /* @__PURE__ */ new Map();
          try {
            const catRes = await fetchWithTimeout(
              `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`,
              5e3
            );
            if (catRes.ok) {
              const cats = await catRes.json();
              if (Array.isArray(cats)) {
                cats.forEach((c) => liveCatMap.set(String(c.category_id), c.category_name));
              }
            }
          } catch {
          }
          let channels = [];
          try {
            const streamsRes = await fetchWithTimeout(
              `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`,
              12e3
            );
            if (streamsRes.ok) {
              const streams = await streamsRes.json();
              if (Array.isArray(streams)) {
                channels = streams.map((s, idx) => {
                  const catName = liveCatMap.get(String(s.category_id)) || "General";
                  const streamUrl = `${serverUrl}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${s.stream_id}.ts`;
                  return {
                    id: `xtream_ch_${s.stream_id || idx + 1}`,
                    number: s.num ? parseInt(s.num, 10) : idx + 1,
                    name: s.name || `Canal ${idx + 1}`,
                    category: catName,
                    logo: s.stream_icon && s.stream_icon.startsWith("http") ? s.stream_icon : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&auto=format&fit=crop&q=80",
                    url: streamUrl,
                    resolution: s.name && s.name.includes("FHD") ? "1080p FHD" : s.name && s.name.includes("HD") ? "720p HD" : "Auto / Adaptable",
                    isBlocked: false,
                    epgNow: {
                      title: s.name || "Emisi\xF3n en directo",
                      startTime: "00:00",
                      endTime: "23:59",
                      description: `Se\xF1al en directo (${catName})`
                    },
                    epgNext: {
                      title: "Continuaci\xF3n de programaci\xF3n",
                      startTime: "23:59",
                      endTime: "06:00",
                      description: "Transmisi\xF3n continua."
                    }
                  };
                });
              }
            }
          } catch (streamErr) {
            console.warn("Error al obtener canales:", streamErr);
          }
          let movies = [];
          try {
            const vodRes = await fetchWithTimeout(
              `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_streams`,
              1e4
            );
            if (vodRes.ok) {
              const vodStreams = await vodRes.json();
              if (Array.isArray(vodStreams)) {
                movies = vodStreams.map((v, idx) => {
                  const ext = v.container_extension || "mp4";
                  const streamUrl = `${serverUrl}/movie/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${v.stream_id}.${ext}`;
                  return {
                    id: `xtream_vod_${v.stream_id || idx + 1}`,
                    title: v.name || `Pel\xEDcula ${idx + 1}`,
                    category: v.category_name || "Pel\xEDculas Estreno",
                    type: "movie",
                    year: v.year ? parseInt(v.year, 10) : 2026,
                    rating: v.rating ? String(v.rating) : "8.5",
                    poster: v.stream_icon && v.stream_icon.startsWith("http") ? v.stream_icon : "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
                    synopsis: v.plot || v.name || "Pel\xEDcula disponible en el servidor.",
                    duration: v.duration || "1h 45m",
                    url: streamUrl,
                    isBlocked: false
                  };
                });
              }
            }
          } catch (vodErr) {
            console.warn("Error al obtener pel\xEDculas:", vodErr);
          }
          const categoriesSet = /* @__PURE__ */ new Set();
          channels.forEach((c) => categoriesSet.add(c.category));
          movies.forEach((v) => categoriesSet.add(v.category));
          return {
            success: true,
            works: true,
            statusCode: 200,
            latencyMs,
            message: `\xA1Conexi\xF3n exitosa! Canales listados: ${channels.length}`,
            serverInfo: {
              url: serverUrl,
              port: serverInfo?.port,
              serverProtocol: serverInfo?.server_protocol,
              timezone: serverInfo?.timezone,
              rtmpPort: serverInfo?.rtmp_port
            },
            userInfo: {
              username: userInfo.username || username,
              status: userInfo.status || "Active",
              expDate: userInfo.exp_date ? String(userInfo.exp_date) : "Activa",
              maxConnections: userInfo.max_connections || "1",
              activeCons: userInfo.active_cons || "0",
              isTrial: userInfo.is_trial
            },
            channels,
            vod: movies,
            stats: {
              totalChannels: channels.length,
              totalVod: movies.length,
              categories: Array.from(categoriesSet)
            },
            sourceUrl: rawUrl
          };
        } else if (userInfo && userInfo.auth === 0) {
          return {
            success: false,
            works: false,
            statusCode: 401,
            latencyMs: Date.now() - startTime,
            message: "Error 401: Usuario o contrase\xF1a incorrectos / cuenta inactiva.",
            errorDetail: "auth === 0",
            channels: [],
            vod: [],
            stats: { totalChannels: 0, totalVod: 0, categories: [] },
            sourceUrl: rawUrl
          };
        }
      }
    } catch (apiErr) {
      console.warn("Fallo de conexi\xF3n API Xtream:", apiErr?.message);
    }
  }
  try {
    let m3uTargetUrl = rawUrl;
    if (username && password && (!rawUrl.includes("get.php") && !rawUrl.includes(".m3u"))) {
      m3uTargetUrl = `${serverUrl}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus&output=${outputFormat}`;
    }
    const m3uRes = await fetchWithTimeout(m3uTargetUrl, 12e3);
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
        sourceUrl: rawUrl
      };
    }
    const m3uText = await m3uRes.text();
    const parsedData = parseM3uText(m3uText, serverUrl);
    return {
      success: true,
      works: true,
      statusCode: 200,
      latencyMs: Date.now() - startTime,
      message: `Lista M3U le\xEDda correctamente.`,
      serverInfo: { url: serverUrl },
      userInfo: { username: username || "M3U User", status: "Active", expDate: "Activa" },
      channels: parsedData.channels,
      vod: parsedData.vod,
      stats: {
        totalChannels: parsedData.channels.length,
        totalVod: parsedData.vod.length,
        categories: parsedData.categories
      },
      sourceUrl: rawUrl
    };
  } catch (m3uErr) {
    return {
      success: false,
      works: false,
      statusCode: lastStatusCode || 0,
      latencyMs: Date.now() - startTime,
      message: `No se pudo conectar: ${m3uErr?.message || "Error de red"}`,
      errorDetail: m3uErr?.message,
      channels: [],
      vod: [],
      stats: { totalChannels: 0, totalVod: 0, categories: [] },
      sourceUrl: rawUrl
    };
  }
}
function parseM3uText(text, baseServer = "") {
  const lines = text.split("\n");
  const channels = [];
  const vod = [];
  const categoriesSet = /* @__PURE__ */ new Set();
  let currentExtinf = null;
  let chNumber = 1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("#EXTINF:")) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const commaIdx = line.lastIndexOf(",");
      const rawName = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : `Canal ${chNumber}`;
      currentExtinf = {
        name: rawName,
        logo: logoMatch && logoMatch[1] ? logoMatch[1] : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=120&auto=format&fit=crop&q=80",
        group: groupMatch && groupMatch[1] ? groupMatch[1] : "General",
        tvgId: tvgIdMatch && tvgIdMatch[1] ? tvgIdMatch[1] : ""
      };
    } else if (!line.startsWith("#") && currentExtinf) {
      let streamUrl = line;
      if (!streamUrl.startsWith("http://") && !streamUrl.startsWith("https://") && baseServer) {
        streamUrl = `${baseServer}/${streamUrl.replace(/^\/+/, "")}`;
      }
      categoriesSet.add(currentExtinf.group);
      channels.push({
        id: `m3u_ch_${channels.length + 1}`,
        number: chNumber++,
        name: currentExtinf.name,
        category: currentExtinf.group,
        logo: currentExtinf.logo,
        url: streamUrl,
        resolution: "1080p HD",
        isBlocked: false,
        epgNow: {
          title: currentExtinf.name,
          startTime: "00:00",
          endTime: "23:59",
          description: `Se\xF1al en vivo de ${currentExtinf.group}`
        },
        epgNext: {
          title: "Continuaci\xF3n programaci\xF3n",
          startTime: "23:59",
          endTime: "06:00",
          description: "Transmisi\xF3n continua."
        }
      });
      currentExtinf = null;
    }
  }
  return {
    channels,
    vod,
    categories: Array.from(categoriesSet)
  };
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const storage = StorageService.getInstance();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.get("/api/public/info", (req, res) => {
    try {
      res.json(storage.getPublicInfo());
    } catch (e) {
      res.json({ contactNote: "Para soporte t\xE9cnico o renovaciones, cont\xE1ctanos v\xEDa WhatsApp." });
    }
  });
  app.post("/api/auth/client-login", (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Usuario y contrase\xF1a requeridos" });
      }
      const authResult = storage.authenticateClient(username, password);
      if (!authResult.success) {
        return res.status(authResult.suspended ? 403 : 401).json({
          success: false,
          suspended: authResult.suspended || false,
          message: authResult.message || "Credenciales inv\xE1lidas"
        });
      }
      const user = authResult.user;
      const db = storage.getDb();
      const playlists = db.playlists || [];
      const disabledChannelsPlaylists = new Set(playlists.filter((p) => p.enableChannels === false).map((p) => p.id));
      const disabledMoviesPlaylists = new Set(playlists.filter((p) => p.enableMovies === false).map((p) => p.id));
      const disabledSeriesPlaylists = new Set(playlists.filter((p) => p.enableSeries === false).map((p) => p.id));
      const userBlockedSet = new Set(user.blockedChannels || []);
      const availableChannels = (db.channels || []).filter((ch) => {
        if (ch.isBlocked || userBlockedSet.has(ch.id)) return false;
        if (ch.playlistId && disabledChannelsPlaylists.has(ch.playlistId)) return false;
        return true;
      });
      const availableVod = (db.vod || []).filter((v) => {
        if (v.isBlocked) return false;
        if (v.playlistId) {
          const isSeries = v.type === "series" || v.category?.toLowerCase().includes("serie");
          if (isSeries && disabledSeriesPlaylists.has(v.playlistId)) return false;
          if (!isSeries && disabledMoviesPlaylists.has(v.playlistId)) return false;
        }
        return true;
      }).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      let activeMessage = null;
      if (db.floatingMessage?.active) {
        if (db.floatingMessage.targetUserId === "all" || db.floatingMessage.targetUserId === user.id) {
          activeMessage = db.floatingMessage;
        }
      }
      const cleanUser = user.username.toLowerCase();
      const isAdmin = user.id === "usr_admin";
      const adminToken = isAdmin ? "nesh_admin_token_" + Date.now() : null;
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
          assignedList: user.assignedList || "all"
        },
        channels: availableChannels,
        vod: availableVod,
        listaProItems: db.listaProItems || [],
        contactNote: db.contactNote || "",
        floatingMessage: activeMessage,
        playerSettings: db.playerSettings
      });
    } catch (err) {
      console.error("Error handling /api/auth/client-login:", err);
      return res.status(500).json({
        success: false,
        message: "Error en el servidor al procesar inicio de sesi\xF3n"
      });
    }
  });
  app.post("/api/client/refresh", (req, res) => {
    try {
      const { username } = req.body || {};
      if (!username) {
        return res.status(400).json({ success: false, message: "Usuario requerido" });
      }
      const db = storage.getDb();
      const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!user || user.status === "blocked") {
        return res.status(403).json({ success: false, message: "Usuario no encontrado o suspendido" });
      }
      const playlists = db.playlists || [];
      const disabledChannelsPlaylists = new Set(playlists.filter((p) => p.enableChannels === false).map((p) => p.id));
      const disabledMoviesPlaylists = new Set(playlists.filter((p) => p.enableMovies === false).map((p) => p.id));
      const disabledSeriesPlaylists = new Set(playlists.filter((p) => p.enableSeries === false).map((p) => p.id));
      const userBlockedSet = new Set(user.blockedChannels || []);
      const availableChannels = (db.channels || []).filter((ch) => {
        if (ch.isBlocked || userBlockedSet.has(ch.id)) return false;
        if (ch.playlistId && disabledChannelsPlaylists.has(ch.playlistId)) return false;
        return true;
      });
      const availableVod = (db.vod || []).filter((v) => {
        if (v.isBlocked) return false;
        if (v.playlistId) {
          const isSeries = v.type === "series" || v.category?.toLowerCase().includes("serie");
          if (isSeries && disabledSeriesPlaylists.has(v.playlistId)) return false;
          if (!isSeries && disabledMoviesPlaylists.has(v.playlistId)) return false;
        }
        return true;
      }).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      let activeMessage = null;
      if (db.floatingMessage?.active) {
        if (db.floatingMessage.targetUserId === "all" || db.floatingMessage.targetUserId === user.id) {
          activeMessage = db.floatingMessage;
        }
      }
      const isAdmin = user.id === "usr_admin";
      return res.json({
        success: true,
        isAdmin,
        user: {
          id: user.id,
          username: user.username,
          expiryDate: user.expiryDate,
          status: user.status,
          notes: user.notes,
          assignedList: user.assignedList || "all"
        },
        channels: availableChannels,
        vod: availableVod,
        listaProItems: db.listaProItems || [],
        contactNote: db.contactNote || "",
        floatingMessage: activeMessage,
        playerSettings: db.playerSettings
      });
    } catch (err) {
      console.error("Error in /api/client/refresh:", err);
      return res.status(500).json({ success: false, message: "Error al actualizar datos" });
    }
  });
  app.post("/api/auth/admin-login", (req, res) => {
    const { username, password } = req.body || {};
    const u = (username || "admin").trim();
    const p = (password || "").trim();
    if (storage.authenticateAdmin(u, p)) {
      return res.json({
        success: true,
        token: "nesh_admin_token_" + Date.now(),
        adminUser: "admin"
      });
    }
    return res.status(401).json({
      success: false,
      message: "Credenciales maestras incorrectas. Usa admin / Admin2026"
    });
  });
  const handleMasterAccess = (_req, res) => {
    return res.json({
      success: true,
      token: "nesh_admin_token_" + Date.now(),
      adminUser: "admin"
    });
  };
  app.post("/api/auth/master-access", handleMasterAccess);
  app.get("/api/auth/master-access", handleMasterAccess);
  app.get("/api/admin/data", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && !authHeader.includes("nesh_admin_token_") && !authHeader.includes("Bearer")) {
      return res.status(401).json({ error: "Acceso no autorizado" });
    }
    res.json(storage.getDb());
  });
  app.post("/api/admin/users", (req, res) => {
    const { username, password, expiryDate, status, notes, blockedChannels } = req.body;
    if (!username || !password || !expiryDate) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const newUser = storage.addUser({
      username,
      password,
      expiryDate,
      status: status || "active",
      notes: notes || "",
      blockedChannels: blockedChannels || []
    });
    res.json({ success: true, user: newUser });
  });
  app.put("/api/admin/users/:id", (req, res) => {
    const updated = storage.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ success: true, user: updated });
  });
  app.delete("/api/admin/users/:id", (req, res) => {
    const ok = storage.deleteUser(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ success: true });
  });
  app.put("/api/admin/playlists/:id", (req, res) => {
    const plId = req.params.id;
    const updated = storage.updatePlaylist(plId, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Lista no encontrada" });
    }
    res.json({ success: true, playlist: updated });
  });
  app.post("/api/admin/contact-note", (req, res) => {
    const { note } = req.body;
    if (typeof note !== "string") {
      return res.status(400).json({ error: "Nota requerida" });
    }
    const updated = storage.updateContactNote(note);
    res.json({ success: true, contactNote: updated });
  });
  app.post("/api/admin/floating-message", (req, res) => {
    const updated = storage.updateFloatingMessage(req.body);
    res.json({ success: true, floatingMessage: updated });
  });
  app.post("/api/admin/listapro", (req, res) => {
    const item = req.body;
    if (!item || !item.title || !item.url) {
      return res.status(400).json({ error: "T\xEDtulo y URL requeridos" });
    }
    const newItem = storage.addListaProItem(item);
    res.json({ success: true, item: newItem });
  });
  app.delete("/api/admin/listapro/:id", (req, res) => {
    const ok = storage.deleteListaProItem(req.params.id);
    res.json({ success: ok });
  });
  app.post("/api/admin/reset-channels", (req, res) => {
    const count = storage.resetCoreChannels();
    res.json({ success: true, count });
  });
  app.get("/api/proxy/stream", async (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) {
      return res.status(400).send("URL requerida");
    }
    try {
      try {
        const u = new URL(streamUrl);
        console.log(`[Proxy] Request received for host: ${u.host}, path: ${u.pathname.split("/").slice(0, 3).join("/")}/...`);
      } catch {
        console.log(`[Proxy] Request received`);
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25e3);
      const upstreamRes = await fetch(streamUrl, {
        headers: {
          "User-Agent": "IPTVSmartersPro/3.1.5 (Linux; Android 12) VLC/3.0.18",
          "Accept": "*/*",
          "Connection": "keep-alive",
          ...req.headers.range ? { Range: req.headers.range } : {}
        },
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timeout);
      console.log(`[Proxy] Upstream status: ${upstreamRes.status}, Content-Type: ${upstreamRes.headers.get("content-type") || "none"}`);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Expose-Headers", "*");
      const contentType = upstreamRes.headers.get("content-type") || "application/vnd.apple.mpegurl";
      res.setHeader("Content-Type", contentType);
      if (upstreamRes.headers.get("content-length")) {
        res.setHeader("Content-Length", upstreamRes.headers.get("content-length"));
      }
      if (upstreamRes.headers.get("content-range")) {
        res.setHeader("Content-Range", upstreamRes.headers.get("content-range"));
      }
      if (upstreamRes.headers.get("accept-ranges")) {
        res.setHeader("Accept-Ranges", upstreamRes.headers.get("accept-ranges"));
      }
      const isLiveStream = streamUrl.includes("/live/") || contentType.includes("video/mp2t") || contentType.includes("octet-stream");
      const isM3u8Request = !isLiveStream && (streamUrl.includes(".m3u8") || streamUrl.includes("m3u") || contentType.includes("mpegurl") || contentType.includes("m3u"));
      if (isM3u8Request) {
        const text = await upstreamRes.text();
        const trimmed = text.trim();
        if (trimmed.includes("#EXTM3U") || trimmed.includes("#EXTINF")) {
          const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf("/") + 1);
          let origin = "";
          try {
            origin = new URL(streamUrl).origin;
          } catch {
            origin = baseUrl;
          }
          const rewritten = text.split("\n").map((line) => {
            const lineTrimmed = line.trim();
            if (!lineTrimmed) return line;
            if (lineTrimmed.startsWith("#")) {
              if (lineTrimmed.includes("URI=")) {
                return line.replace(/URI=["']([^"']+)["']/g, (_match, uri) => {
                  let fullUri = uri;
                  if (!fullUri.startsWith("http://") && !fullUri.startsWith("https://")) {
                    fullUri = fullUri.startsWith("/") ? origin + fullUri : baseUrl + fullUri;
                  }
                  return `URI="/api/proxy/stream?url=${encodeURIComponent(fullUri)}"`;
                });
              }
              return line;
            }
            let fullSegmentUrl = lineTrimmed;
            if (!fullSegmentUrl.startsWith("http://") && !fullSegmentUrl.startsWith("https://")) {
              fullSegmentUrl = fullSegmentUrl.startsWith("/") ? origin + fullSegmentUrl : baseUrl + fullSegmentUrl;
            }
            return `/api/proxy/stream?url=${encodeURIComponent(fullSegmentUrl)}`;
          }).join("\n");
          res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
          return res.status(upstreamRes.status).send(rewritten);
        } else {
          res.status(upstreamRes.status);
          return res.send(Buffer.from(text));
        }
      }
      if (upstreamRes.body) {
        res.status(upstreamRes.status);
        try {
          const nodeStream = Readable.fromWeb(upstreamRes.body);
          nodeStream.pipe(res);
          req.on("close", () => {
            try {
              nodeStream.destroy();
            } catch {
            }
          });
        } catch {
          const buffer = await upstreamRes.arrayBuffer();
          res.send(Buffer.from(buffer));
        }
      } else {
        const buffer = await upstreamRes.arrayBuffer();
        res.status(upstreamRes.status).send(Buffer.from(buffer));
      }
    } catch (err) {
      if (!res.headersSent) {
        res.status(502).send("Error conectando con el flujo IPTV: " + (err.message || "Error"));
      }
    }
  });
  app.get("/api/client/data", (req, res) => {
    try {
      const db = storage.getDb();
      const userId = req.query.userId;
      let blockedSet = /* @__PURE__ */ new Set();
      if (userId) {
        const user = db.users.find((u) => u.id === userId);
        if (user && user.blockedChannels) {
          blockedSet = new Set(user.blockedChannels);
        }
      }
      const playlists = db.playlists || [];
      const disabledChannelsPlaylists = new Set(playlists.filter((p) => p.enableChannels === false).map((p) => p.id));
      const disabledMoviesPlaylists = new Set(playlists.filter((p) => p.enableMovies === false).map((p) => p.id));
      const disabledSeriesPlaylists = new Set(playlists.filter((p) => p.enableSeries === false).map((p) => p.id));
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
          const isSeries = v.type === "series" || v.category?.toLowerCase().includes("serie");
          if (isSeries && disabledSeriesPlaylists.has(v.playlistId)) return false;
          if (!isSeries && disabledMoviesPlaylists.has(v.playlistId)) return false;
        }
        return true;
      }).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      res.json({
        success: true,
        channels: activeChannels,
        vod: activeVod,
        contactNote: db.contactNote || "",
        floatingMessage: db.floatingMessage,
        playerSettings: db.playerSettings
      });
    } catch (e) {
      res.status(500).json({ error: "Error cargando datos de cliente" });
    }
  });
  app.post("/api/admin/playlists/test", async (req, res) => {
    const { url, username, password } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, works: false, message: "URL requerida para la prueba" });
    }
    try {
      const result = await readXtreamContent(url, username || "", password || "");
      res.json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        works: false,
        message: "Error inesperado al probar la URL: " + (err.message || "Error desconocido")
      });
    }
  });
  app.post("/api/admin/playlists/:id/sync", async (req, res) => {
    const plId = req.params.id;
    const db = storage.getDb();
    const playlist = db.playlists.find((p) => p.id === plId);
    if (!playlist) {
      return res.status(404).json({ success: false, works: false, message: "Lista no encontrada" });
    }
    try {
      const result = await readXtreamContent(playlist.url, playlist.username || "", playlist.password || "");
      if (result.works && result.channels.length > 0) {
        let channelsToImport = result.channels;
        let vodToImport = result.vod;
        if (playlist.enableChannels === false) channelsToImport = [];
        if (playlist.enableMovies === false) vodToImport = vodToImport.filter((item) => item.type === "series" || item.category?.toLowerCase().includes("serie"));
        if (playlist.enableSeries === false) vodToImport = vodToImport.filter((item) => item.type !== "series" && !item.category?.toLowerCase().includes("serie"));
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
            latencyMs: result.latencyMs
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
          vodCount: imported.vodCount
        });
      } else {
        storage.setPlaylistStatus(playlist.id, "failed", result.message, result.latencyMs);
        return res.json({
          success: false,
          works: false,
          statusCode: result.statusCode || 0,
          latencyMs: result.latencyMs,
          message: result.message,
          errorDetail: result.errorDetail
        });
      }
    } catch (err) {
      storage.setPlaylistStatus(playlist.id, "failed", err.message || "Error de sincronizaci\xF3n");
      return res.status(500).json({
        success: false,
        works: false,
        message: "Fallo al sincronizar: " + (err.message || "Error")
      });
    }
  });
  app.post("/api/admin/channels/test-url", async (req, res) => {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ online: false, message: "URL requerida" });
    }
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6e3);
      const probeRes = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "IPTVSmartersPro/3.1.5 (Linux; Android 12) VLC/3.0.18",
          "Range": "bytes=0-1024"
        },
        signal: controller.signal
      });
      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      res.json({
        online: probeRes.ok || probeRes.status === 206 || probeRes.status === 200,
        statusCode: probeRes.status,
        statusText: probeRes.statusText,
        latencyMs,
        contentType: probeRes.headers.get("content-type") || "unknown",
        contentLength: probeRes.headers.get("content-length") || null
      });
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      res.json({
        online: false,
        statusCode: 0,
        latencyMs,
        error: err.message || "Error de conexi\xF3n"
      });
    }
  });
  app.post("/api/admin/channels/add-custom", (req, res) => {
    const { name, url, category, logo } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: "URL requerida" });
    }
    const newChannel = storage.addDirectChannel({
      name: name || "Canal Directo",
      url,
      category: category || "Canales Directos",
      logo: logo || ""
    });
    res.json({ success: true, channel: newChannel });
  });
  app.post("/api/admin/playlists", async (req, res) => {
    const { name, type, url, username, password, active, autoSync } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: "Nombre y URL requeridos" });
    }
    let channelCount = 0;
    let initialStatus = "untested";
    let statusMessage = "Pendiente de sincronizaci\xF3n";
    let latencyMs;
    if (autoSync !== false) {
      try {
        const probe = await readXtreamContent(url, username || "", password || "");
        if (probe.works) {
          channelCount = probe.channels.length;
          initialStatus = "working";
          statusMessage = probe.message;
          latencyMs = probe.latencyMs;
          const pl2 = storage.addPlaylist({
            name,
            type: type || "m3u",
            url,
            username: username || "",
            password: password || "",
            channelCount,
            active: active !== void 0 ? active : true,
            status: initialStatus,
            statusMessage,
            latencyMs,
            vodCount: probe.vod.length,
            expDate: probe.userInfo?.expDate
          });
          if (probe.channels.length > 0) {
            storage.importXtreamContent(
              probe.channels,
              probe.vod,
              {
                playlistId: pl2.id,
                name: pl2.name,
                url: pl2.url,
                username: pl2.username,
                serverUrl: probe.serverInfo?.url,
                status: probe.userInfo?.status,
                expDate: probe.userInfo?.expDate,
                latencyMs: probe.latencyMs
              },
              true
            );
          }
          return res.json({
            success: true,
            works: true,
            playlist: pl2,
            syncResult: probe
          });
        } else {
          initialStatus = "failed";
          statusMessage = probe.message;
          latencyMs = probe.latencyMs;
          const pl2 = storage.addPlaylist({
            name,
            type: type || "m3u",
            url,
            username: username || "",
            password: password || "",
            channelCount: 0,
            active: active !== void 0 ? active : true,
            status: "failed",
            statusMessage: probe.message,
            latencyMs
          });
          return res.json({
            success: true,
            works: false,
            playlist: pl2,
            syncResult: probe
          });
        }
      } catch (err) {
        console.warn("AutoSync error:", err);
      }
    }
    const pl = storage.addPlaylist({
      name,
      type: type || "m3u",
      url,
      username: username || "",
      password: password || "",
      channelCount: channelCount || 0,
      active: active !== void 0 ? active : true,
      status: initialStatus,
      statusMessage,
      latencyMs
    });
    res.json({ success: true, playlist: pl, works: initialStatus === "working" });
  });
  app.delete("/api/admin/playlists/:id", (req, res) => {
    const ok = storage.deletePlaylist(req.params.id);
    res.json({ success: ok });
  });
  app.put("/api/admin/channels/:id/toggle", (req, res) => {
    const ch = storage.toggleChannelBlocked(req.params.id, req.body.blocked);
    if (!ch) {
      return res.status(404).json({ error: "Canal no encontrado" });
    }
    res.json({ success: true, channel: ch });
  });
  app.put("/api/admin/channels-category/toggle", (req, res) => {
    const { category, blocked } = req.body || {};
    if (!category) {
      return res.status(400).json({ error: "Categor\xEDa requerida" });
    }
    const count = storage.toggleCategoryChannelsBlocked(category, Boolean(blocked));
    res.json({ success: true, updatedCount: count });
  });
  app.put("/api/admin/vod/:id/toggle", (req, res) => {
    const item = storage.toggleVodBlocked(req.params.id, req.body.blocked);
    if (!item) {
      return res.status(404).json({ error: "Pel\xEDcula/Serie no encontrada" });
    }
    res.json({ success: true, vod: item });
  });
  app.post("/api/admin/vod", (req, res) => {
    try {
      const { title, url, type, category, year, rating, poster, synopsis } = req.body || {};
      if (!title || !url) {
        return res.status(400).json({ success: false, error: "T\xEDtulo y URL de transmisi\xF3n requeridos" });
      }
      const newItem = storage.addVodItem({ title, url, type, category, year, rating, poster, synopsis });
      return res.json({ success: true, vodItem: newItem });
    } catch (err) {
      console.error("Error adding VOD item:", err);
      return res.status(500).json({ success: false, error: err.message || "Error al agregar VOD" });
    }
  });
  app.post("/api/admin/users/purge-unpaid", (req, res) => {
    const count = storage.deleteUnpaidUsers();
    res.json({ success: true, deletedCount: count });
  });
  app.post("/api/admin/settings", (req, res) => {
    const updated = storage.updatePlayerSettings(req.body);
    res.json({ success: true, playerSettings: updated });
  });
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path2.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path2.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NeshTV Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
