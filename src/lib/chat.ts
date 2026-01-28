import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  updateDoc,
  increment,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from './firebase';

// Password hashing helper (simple SHA-256 for MVP, in real app use Cloud Functions)
async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createRoom(name: string, expiresHours: number, password: string, type: 'chat' | 'memo' = 'chat') {
  await signInAnonymously(auth);
  const user = auth.currentUser;
  if (!user) throw new Error('Auth failed');

  if (!name.trim()) throw new Error('방 이름을 입력해주세요.');

  const roomId = name.trim();
  
  const roomDoc = await getDoc(doc(db, 'rooms', roomId));
  if (roomDoc.exists()) {
    const data = roomDoc.data();
    if (data.status === 'active' && data.expiresAt.toMillis() > Date.now()) {
      throw new Error('이미 존재하는 방 이름입니다. 다른 이름을 사용해주세요.');
    }
  }

  const salt = Math.random().toString(36).substr(2, 8);
  const passwordHash = await hashPassword(password, salt);
  
  const now = Date.now();
  const expiresAt = now + expiresHours * 60 * 60 * 1000;

  const roomData = {
    id: roomId,
    name: roomId,
    type,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(expiresAt),
    passwordHash,
    salt,
    status: 'active',
    creatorId: user.uid,
    extendCount: 0,
  };

  await setDoc(doc(db, 'rooms', roomId), roomData);
  return { roomId, expiresAt, type };
}

export async function joinRoom(roomId: string, password: string) {
  await signInAnonymously(auth);
  const roomDoc = await getDoc(doc(db, 'rooms', roomId));
  
  if (!roomDoc.exists()) {
    throw new Error('채팅방을 찾을 수 없습니다.');
  }

  const data = roomDoc.data();
  const inputHash = await hashPassword(password, data.salt);

  if (inputHash !== data.passwordHash) {
    throw new Error('비밀번호가 올바르지 않습니다.');
  }

  if (data.status === 'expired' || data.expiresAt.toMillis() < Date.now()) {
    throw new Error('이미 만료된 채팅방입니다.');
  }

  return {
    id: roomId,
    name: data.name,
    type: data.type || 'chat',
    expiresAt: data.expiresAt.toMillis(),
  };
}

export function subscribeMessages(roomId: string, callback: (messages: any[]) => void) {
  const q = query(
    collection(db, 'rooms', roomId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
    }));
    callback(messages);
  });
}

export async function sendMessage(roomId: string, text: string, nickname: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await addDoc(collection(db, 'rooms', roomId, 'messages'), {
    text,
    senderId: user.uid,
    nickname,
    createdAt: serverTimestamp(),
  });
}

export function subscribeMemos(roomId: string, callback: (memos: any[]) => void) {
  const q = query(
    collection(db, 'rooms', roomId, 'memos'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const memos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(memos);
  });
}

export async function addMemo(roomId: string, memo: { x: number; y: number; text: string; width: number; height: number; style: any }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await addDoc(collection(db, 'rooms', roomId, 'memos'), {
    ...memo,
    authorId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateMemo(roomId: string, memoId: string, updates: any) {
  const memoRef = doc(db, 'rooms', roomId, 'memos', memoId);
  await updateDoc(memoRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMemo(roomId: string, memoId: string) {
  const memoRef = doc(db, 'rooms', roomId, 'memos', memoId);
  await deleteDoc(memoRef);
}

export async function extendRoom(roomId: string) {
  const roomRef = doc(db, 'rooms', roomId);
  const roomDoc = await getDoc(roomRef);
  
  if (!roomDoc.exists()) return;
  
  const data = roomDoc.data();
  const currentExpiresAt = data.expiresAt.toMillis();
  const newExpiresAt = currentExpiresAt + 4 * 60 * 60 * 1000;

  await updateDoc(roomRef, {
    expiresAt: Timestamp.fromMillis(newExpiresAt),
    extendCount: increment(1),
    lastExtendedAt: serverTimestamp(),
  });
}
