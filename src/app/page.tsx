'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HomeView from '@/components/HomeView';
import CreateRoomForm from '@/components/CreateRoomForm';
import JoinRoomForm from '@/components/JoinRoomForm';
import MemoCanvas from '@/components/MemoCanvas';
import * as chatApi from '@/lib/chat';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Language, translations } from '@/lib/translations';

type ViewState = 'HOME' | 'CREATE' | 'JOIN' | 'CHAT';

export default function Home() {
  const [view, setView] = useState<ViewState>('HOME');
  const [lang, setLang] = useState<Language>('en'); // Default to English
  const [room, setRoom] = useState<any>(null);
  const [memos, setMemos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    nickname: '',
  });

  const t = translations[lang];

  useEffect(() => {
    // Initialize language from localStorage or default to English
    const savedLang = localStorage.getItem('chat-lang') as Language;
    if (savedLang) setLang(savedLang);

    // Listen to auth state changes to get the correct UID
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(prev => ({ ...prev, id: user.uid }));
      }
    });

    // Initialize user nickname
    const savedNickname = localStorage.getItem('chat-nickname');
    const nickname = savedNickname || t.anonymous + ' ' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    if (!savedNickname) localStorage.setItem('chat-nickname', nickname);
    
    setCurrentUser(prev => ({ ...prev, nickname }));

    return () => unsubscribe();
  }, [lang, t.anonymous]);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('chat-lang', newLang);
  };

  // Subscribe to memos when in CHAT view
  useEffect(() => {
    if (view === 'CHAT' && room?.id) {
      const unsubscribe = chatApi.subscribeMemos(room.id, (msgs) => {
        setMemos(msgs);
      });
      return () => unsubscribe();
    }
  }, [view, room?.id]);

  const handleCreateRoom = async (data: { name: string; expiresHours: number; password: string; type: 'chat' | 'memo' }) => {
    setLoading(true);
    try {
      const { roomId, expiresAt, type } = await chatApi.createRoom(data.name, data.expiresHours, data.password, data.type);
      setRoom({ id: roomId, name: data.name || roomId, expiresAt, type });
      setView('CHAT');
    } catch (err: any) {
      console.error(err);
      alert(t.createError + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string, password: string) => {
    setLoading(true);
    try {
      const roomData = await chatApi.joinRoom(roomId, password);
      setRoom(roomData);
      setView('CHAT');
    } catch (err: any) {
      console.error(err);
      alert(t.joinError + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemo = async (memo: any) => {
    if (!room) return;
    try {
      await chatApi.addMemo(room.id, memo);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMemo = async (id: string, updates: any) => {
    if (!room) return;
    try {
      // Optimistically update local UI for smoother resize/drag
      setMemos(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      await chatApi.updateMemo(room.id, id, updates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMemo = async (id: string) => {
    if (!room) return;
    try {
      await chatApi.deleteMemo(room.id, id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtend = async () => {
    if (!room) return;
    try {
      await chatApi.extendRoom(room.id);
      setRoom((prev: any) => ({
        ...prev,
        expiresAt: prev.expiresAt + 4 * 60 * 60 * 1000
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = () => {
    if (confirm(t.leaveConfirm)) {
      setView('HOME');
      setRoom(null);
      setMemos([]);
    }
  };

  return (
    <main className="h-screen h-[svh] bg-[#0a0a0a] text-white flex flex-col items-center overflow-hidden">
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="w-full max-w-5xl flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'HOME' && (
            <div key="home-container" className="flex-1 flex flex-col justify-center overflow-y-auto px-4 py-8">
              <HomeView
                lang={lang}
                setLang={handleSetLang}
                onCreateClick={() => setView('CREATE')}
                onJoinClick={() => setView('JOIN')}
              />
            </div>
          )}

          {view === 'CREATE' && (
            <div key="create-container" className="flex-1 flex flex-col justify-center overflow-y-auto px-4 py-8">
              <CreateRoomForm
                lang={lang}
                onBack={() => setView('HOME')}
                onCreate={handleCreateRoom}
              />
            </div>
          )}

          {view === 'JOIN' && (
            <div key="join-container" className="flex-1 flex flex-col justify-center overflow-y-auto px-4 py-8">
              <JoinRoomForm
                lang={lang}
                onBack={() => setView('HOME')}
                onJoin={handleJoinRoom}
              />
            </div>
          )}

          {view === 'CHAT' && room && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {room.type === 'memo' ? (
                <MemoCanvas
                  lang={lang}
                  room={room}
                  memos={memos}
                  currentUser={currentUser}
                  onAddMemo={handleAddMemo}
                  onUpdateMemo={handleUpdateMemo}
                  onDeleteMemo={handleDeleteMemo}
                  onExtend={handleExtend}
                  onLeave={handleLeave}
                />
              ) : (
                <ChatInterface
                  lang={lang}
                  room={room}
                  messages={messages}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  onUpdateNickname={handleUpdateNickname}
                  onExtend={handleExtend}
                  onLeave={handleLeave}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {view !== 'CHAT' && (
        <footer className="w-full py-6 text-gray-600 text-[10px] md:text-sm flex flex-col items-center space-y-1 bg-[#0a0a0a] border-t border-white/5">
          <div className="flex items-center space-x-2 md:space-x-4">
            <span>{t.footer1}</span>
            <span className="opacity-30">•</span>
            <span>{t.footer2}</span>
            <span className="opacity-30">•</span>
            <span>{t.footer3}</span>
          </div>
          <p className="opacity-50">© 2026 Anonymous Secret Chat. All rights reserved.</p>
        </footer>
      )}
    </main>
  );
}
