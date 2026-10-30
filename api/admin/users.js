import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  cachedDb = client.db();
  return cachedDb;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Si hacen GET, devolvemos la lista de usuarios/listas
    if (req.method === 'GET') {
      const users = await collection.find({}).project({ password: 0 }).toArray();
      return res.status(200).json({ success: true, users });
    }

    // Si hacen POST, guardamos el nuevo usuario/lista
    if (req.method === 'POST') {
      const { username, password, expiryDate, status, notes, blockedChannels } = req.body || {};

      if (!username || !password || !expiryDate) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const newUser = {
        username,
        password,
        expiryDate,
        status: status || 'active',
        notes: notes || '',
        blockedChannels: blockedChannels || [],
        createdAt: new Date().toISOString()
      };

      const result = await collection.insertOne(newUser);
      return res.status(200).json({ success: true, id: result.insertedId, user: newUser });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
