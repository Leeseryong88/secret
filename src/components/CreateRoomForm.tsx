'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Lock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language, translations } from '@/lib/translations';

interface CreateRoomFormProps {
  lang: Language;
  onBack: () => void;
  onCreate: (data: { name: string; expiresHours: number; password: string }) => void;
}

export default function CreateRoomForm({ lang, onBack, onCreate }: CreateRoomFormProps) {
  const [name, setName] = useState('');
  const [expiresHours, setExpiresHours] = useState(2);
  const [password, setPassword] = useState('');
  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !name) return;
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
        {t.back}
      </button>

      <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">{t.create}</h2>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Hash size={14} className="mr-2" />
            {t.roomName}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.roomNamePlaceholder}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-400 mb-2 flex items-center">
            <Clock size={14} className="mr-2" />
            {t.expires} ({expiresHours}{t.hours})
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
          <div className="flex justify-between text-[10px] text-gray-500 mt-2">
            <span>1h</span>
            <span>12h</span>
            <span>24h</span>
          </div>
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
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base"
          />
        </div>

        <button
          type="submit"
          disabled={!password || !name}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg transition-all",
            (password && name)
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          )}
        >
          {t.create}
        </button>
      </form>
    </motion.div>
  );
}
