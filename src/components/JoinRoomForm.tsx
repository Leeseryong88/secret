'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language, translations } from '@/lib/translations';

interface JoinRoomFormProps {
  lang: Language;
  onBack: () => void;
  onJoin: (roomId: string, password: string) => void;
}

export default function JoinRoomForm({ lang, onBack, onJoin }: JoinRoomFormProps) {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const t = translations[lang];

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
        {t.back}
      </button>

      <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">{t.join}</h2>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Key size={14} className="mr-2" />
            {t.roomName}
          </label>
          <input
            type="text"
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder={t.roomNamePlaceholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm md:text-base"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Lock size={14} className="mr-2" />
            {t.password}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm md:text-base"
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
          {t.enter}
        </button>
      </form>
    </motion.div>
  );
}
