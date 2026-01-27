'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Lock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateRoomFormProps {
  onBack: () => void;
  onCreate: (data: { name: string; expiresHours: number; password: string }) => void;
}

export default function CreateRoomForm({ onBack, onCreate }: CreateRoomFormProps) {
  const [name, setName] = useState('');
  const [expiresHours, setExpiresHours] = useState(2);
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    onCreate({ name, expiresHours, password });
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

      <h2 className="text-3xl font-bold mb-8">새 채팅방 만들기</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Hash size={16} className="mr-2" />
            방 이름 (선택)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="비밀스러운 대화방"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Clock size={16} className="mr-2" />
            만료 시간 ({expiresHours}시간)
          </label>
          <input
            type="range"
            min="1"
            max="24"
            step="1"
            value={expiresHours}
            onChange={(e) => setExpiresHours(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1시간</span>
            <span>12시간</span>
            <span>24시간</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Lock size={16} className="mr-2" />
            비밀번호 (필수)
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <p className="text-xs text-gray-500 mt-2">
            채팅방 입장을 위해 필요합니다. 서버에는 해시되어 저장됩니다.
          </p>
        </div>

        <button
          type="submit"
          disabled={!password}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg transition-all",
            password
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          )}
        >
          채팅방 생성하기
        </button>
      </form>
    </motion.div>
  );
}
