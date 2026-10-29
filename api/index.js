import express from 'express';
import { StorageService } from '../src/server/storage.ts';

const app = express();
const storage = StorageService.getInstance();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Endpoints principales
app.get('/api/public/info', (req, res) => {
  try {
    res.json(storage.getPublicInfo());
  } catch (e) {
    res.json({ contactNote: 'Para soporte técnico o renovaciones, contáctanos vía WhatsApp.' });
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
