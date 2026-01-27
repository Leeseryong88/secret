'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HomeView from '@/components/HomeView';
import CreateRoomForm from '@/components/CreateRoomForm';
import JoinRoomForm from '@/components/JoinRoomForm';
import ChatInterface from '@/components/ChatInterface';
import * as chatApi from '@/lib/chat';

type ViewState = 'HOME' | 'CREATE' | 'JOIN' | 'CHAT';

export default function Home() {
  const [view, setView] = useState<ViewState>('HOME');
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState({
    id: '',
    nickname: '',
  });

  useEffect(() => {
    // Initialize user nickname
    const savedNickname = localStorage.getItem('chat-nickname');
    const nickname = savedNickname || '익명 ' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    if (!savedNickname) localStorage.setItem('chat-nickname', nickname);
    
    setCurrentUser(prev => ({ ...prev, nickname }));
  }, []);

  // Subscribe to messages when in CHAT view
  useEffect(() => {
    if (view === 'CHAT' && room?.id) {
      const unsubscribe = chatApi.subscribeMessages(room.id, (msgs) => {
        setMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [view, room?.id]);

  const handleCreateRoom = async (data: { name: string; expiresHours: number; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { roomId, expiresAt } = await chatApi.createRoom(data.name, data.expiresHours, data.password);
      setRoom({ id: roomId, name: data.name || roomId, expiresAt });
      setView('CHAT');
    } catch (err: any) {
      console.error(err);
      setError('채팅방 생성에 실패했습니다. (Firebase 설정 확인 필요)');
      // Fallback to mock for demo if needed, but better to show error
      alert('채팅방 생성 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const roomData = await chatApi.joinRoom(roomId, password);
      setRoom(roomData);
      setView('CHAT');
    } catch (err: any) {
      console.error(err);
      alert('입장 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNickname = (newNickname: string) => {
    setCurrentUser(prev => ({ ...prev, nickname: newNickname }));
    localStorage.setItem('chat-nickname', newNickname);
  };

  const handleSendMessage = async (text: string) => {
    if (!room) return;
    try {
      await chatApi.sendMessage(room.id, text, currentUser.nickname);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtend = async () => {
    if (!room) return;
    try {
      await chatApi.extendRoom(room.id);
      // Room data will be updated via Firestore if we had a listener, 
      // but for now let's manually update or rely on the fact that 
      // the room object in state needs to be updated.
      // In a real app, we'd listen to the room document.
      setRoom((prev: any) => ({
        ...prev,
        expiresAt: prev.expiresAt + 4 * 60 * 60 * 1000
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeave = () => {
    if (confirm('채팅방을 나가시겠습니까?')) {
      setView('HOME');
      setRoom(null);
      setMessages([]);
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
                onCreateClick={() => setView('CREATE')}
                onJoinClick={() => setView('JOIN')}
              />
            </div>
          )}

          {view === 'CREATE' && (
            <div key="create-container" className="flex-1 flex flex-col justify-center overflow-y-auto px-4 py-8">
              <CreateRoomForm
                onBack={() => setView('HOME')}
                onCreate={handleCreateRoom}
              />
            </div>
          )}

          {view === 'JOIN' && (
            <div key="join-container" className="flex-1 flex flex-col justify-center overflow-y-auto px-4 py-8">
              <JoinRoomForm
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
              <ChatInterface
                room={room}
                messages={messages}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onUpdateNickname={handleUpdateNickname}
                onExtend={handleExtend}
                onLeave={handleLeave}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {view !== 'CHAT' && (
        <footer className="w-full py-6 text-gray-600 text-[10px] md:text-sm flex flex-col items-center space-y-1 bg-[#0a0a0a] border-t border-white/5">
          <div className="flex items-center space-x-2 md:space-x-4">
            <span>개인정보 수집 없음</span>
            <span className="opacity-30">•</span>
            <span>서버 로그 자동 삭제</span>
            <span className="opacity-30">•</span>
            <span>종단간 암호화 예정</span>
          </div>
          <p className="opacity-50">© 2026 Anonymous Secret Chat. All rights reserved.</p>
        </footer>
      )}
    </main>
  );
}
