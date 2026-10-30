import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import { UserAccount, ChannelItem, VodItem, IPTVPlaylist } from '../types/index.ts';

export async function fetchUsersFromFirestore(): Promise<UserAccount[]> {
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const users: UserAccount[] = [];
    snap.forEach((d) => {
      users.push(d.data() as UserAccount);
    });
    return users;
  } catch (err) {
    console.error('Error fetching users from Firestore:', err);
    return [];
  }
}

export async function saveUserToFirestore(user: UserAccount): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', user.id);
    await setDoc(docRef, user, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
    return false;
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', userId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
    return false;
  }
}

export async function fetchPlaylistsFromFirestore(): Promise<IPTVPlaylist[]> {
  try {
    const colRef = collection(db, 'playlists');
    const snap = await getDocs(colRef);
    const playlists: IPTVPlaylist[] = [];
    snap.forEach((d) => {
      playlists.push(d.data() as IPTVPlaylist);
    });
    return playlists;
  } catch (err) {
    console.error('Error fetching playlists from Firestore:', err);
    return [];
  }
}

export async function fetchChannelsFromFirestore(): Promise<ChannelItem[]> {
  try {
    const colRef = collection(db, 'channels');
    const snap = await getDocs(colRef);
    const channels: ChannelItem[] = [];
    snap.forEach((d) => {
      channels.push(d.data() as ChannelItem);
    });
    return channels;
  } catch (err) {
    console.error('Error fetching channels from Firestore:', err);
    return [];
  }
}

export async function fetchVodFromFirestore(): Promise<VodItem[]> {
  try {
    const colRef = collection(db, 'vod');
    const snap = await getDocs(colRef);
    const vodList: VodItem[] = [];
    snap.forEach((d) => {
      vodList.push(d.data() as VodItem);
    });
    return vodList;
  } catch (err) {
    console.error('Error fetching VOD from Firestore:', err);
    return [];
  }
}

export async function authenticateClientViaFirestore(username: string, pass: string): Promise<{
  success: boolean;
  user?: UserAccount;
  suspended?: boolean;
  message?: string;
}> {
  try {
    const uClean = username.trim().toLowerCase();
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    
    let matchedUser: UserAccount | null = null;
    snap.forEach((d) => {
      const data = d.data() as UserAccount;
      if (data.username?.trim().toLowerCase() === uClean) {
        matchedUser = data;
      }
    });

    if (!matchedUser) {
      return { success: false, message: `Usuario "${username}" no encontrado en Firebase.` };
    }

    const u = matchedUser as UserAccount;
    if (u.status === 'blocked') {
      return { success: false, suspended: true, message: 'Cuenta suspendida por falta de pago.' };
    }

    if (u.expiryDate) {
      const expTime = new Date(u.expiryDate).getTime();
      if (!isNaN(expTime) && expTime < Date.now()) {
        return { success: false, suspended: true, message: 'Tu suscripción ha vencido.' };
      }
    }

    if (u.password && u.password.trim() !== pass.trim()) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    return { success: true, user: u };
  } catch (err: any) {
    console.error('Error authenticating with Firestore:', err);
    return { success: false, message: 'Error conectando con Firebase Firestore: ' + (err.message || '') };
  }
}
