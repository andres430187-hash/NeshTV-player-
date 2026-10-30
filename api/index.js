import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  cachedClient = client;
  cachedDb = client.db(); // Usa la base de datos por defecto de tu URI
  return cachedDb;
}

export default async function handler(req, res) {
  // Cabeceras para permitir peticiones desde tu app web
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users'); // La tabla/colección donde se guardan los usuarios

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
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
