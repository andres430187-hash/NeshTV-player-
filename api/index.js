import mongoose from 'mongoose';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  const opts = { bufferCommands: false };
  cachedDb = await mongoose.connect(process.env.MONGODB_URI, opts);
  return cachedDb;
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  expiryDate: { type: String, required: true },
  status: { type: String, default: 'active' },
  notes: String,
  blockedChannels: [String],
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    await connectToDatabase();
    
    const { username, password, expiryDate, status, notes, blockedChannels } = req.body || {};

    if (!username || !password || !expiryDate) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const newUser = await UserModel.create({
      username,
      password,
      expiryDate,
      status: status || 'active',
      notes: notes || '',
      blockedChannels: blockedChannels || []
    });

    return res.status(200).json({ success: true, user: newUser });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
