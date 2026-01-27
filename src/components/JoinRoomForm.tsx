'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JoinRoomFormProps {
  onBack: () => void;
  onJoin: (roomId: string, password: string) => void;
}

export default function JoinRoomForm({ onBack, onJoin }: JoinRoomFormProps) {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !password) return;
    onJoin(roomId, password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-md mx-auto p-6"
    >
      <button
        onClick={onBack}
        className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        돌아가기
      </button>

      <h2 className="text-3xl font-bold mb-8">채팅방 입장하기</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Key size={16} className="mr-2" />
            채팅방 ID
          </label>
          <input
            type="text"
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID를 입력하세요"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Lock size={16} className="mr-2" />
            비밀번호
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!roomId || !password}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg transition-all",
            (roomId && password)
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          )}
        >
          입장하기
        </button>
      </form>
    </motion.div>
  );
}
