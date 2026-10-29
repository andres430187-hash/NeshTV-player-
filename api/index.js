import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { StorageService } from '../src/server/storage.ts';
import { readXtreamContent } from '../src/server/xtreamParser.ts';

const app = express();
const storage = StorageService.getInstance();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rutas de API
app.get('/api/public/info', (req, res) => {
  try {
    res.json(storage.getPublicInfo());
  } catch (e) {
    res.json({ contactNote: 'Para soporte técnico o renovaciones, contáctanos vía WhatsApp.' });
  }
});

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
    const user = authResult.user;
    const db = storage.getDb();
    return res.json({
      success: true,
      isAdmin: user.id === 'usr_admin',
      user: {
        id: user.id,
        username: user.username,
        expiryDate: user.expiryDate,
        status: user.status,
      },
      channels: db.channels || [],
      vod: db.vod || [],
      playerSettings: db.playerSettings,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

app.get('/api/admin/data', (req, res) => {
  res.json(storage.getDb());
});

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

export default app;
