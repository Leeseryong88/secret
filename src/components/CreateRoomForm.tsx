'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Lock, Hash, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Language, translations } from '@/lib/translations';

interface CreateRoomFormProps {
  lang: Language;
  onBack: () => void;
  onCreate: (data: { name: string; expiresHours: number; password: string; type: 'chat' | 'memo' }) => void;
}

export default function CreateRoomForm({ lang, onBack, onCreate }: CreateRoomFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [roomType, setRoomType] = useState<'chat' | 'memo'>('chat');
  
  // Expiry time state
  const [val, setVal] = useState(2);
  const [unit, setUnit] = useState<'m' | 'h' | 'd'>('h');
  const t = translations[lang];

  const totalMinutes = unit === 'm' ? val : unit === 'h' ? val * 60 : val * 24 * 60;
  const isValidTime = totalMinutes >= 10 && totalMinutes <= 7 * 24 * 60;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !name || !isValidTime) return;
    onCreate({ name, expiresHours: totalMinutes / 60, password, type: roomType });
  };

  const adjustVal = (delta: number) => {
    setVal(prev => Math.max(1, prev + delta));
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
        className="flex items-center text-gray-400 hover:text-black mb-8 transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-2" />
        {t.back}
      </button>

      <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-black">{t.create}</h2>

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div>
          <label className="block text-xs md:text-sm font-bold text-gray-500 mb-2 flex items-center">
            <Plus size={14} className="mr-2" />
            {t.roomType}
          </label>
          <div className="flex bg-black/5 p-1 rounded-xl border border-black/5">
            <button
              type="button"
              onClick={() => setRoomType('chat')}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                roomType === 'chat' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t.chatRoom}
            </button>
            <button
              type="button"
              onClick={() => setRoomType('memo')}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                roomType === 'memo' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {t.memoRoom}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-gray-500 mb-2 flex items-center">
            <Hash size={14} className="mr-2" />
            {t.roomName}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.roomNamePlaceholder}
            className="w-full bg-black/5 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base text-black"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-gray-500 mb-2 flex items-center">
            <Clock size={14} className="mr-2" />
            {t.expires}
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center bg-black/5 rounded-xl border border-black/5 overflow-hidden">
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-transparent px-4 py-3 focus:outline-none text-sm md:text-base text-black font-bold"
              />
              <div className="flex flex-col border-l border-black/5">
                <button type="button" onClick={() => adjustVal(1)} className="p-1 hover:bg-black/5"><ChevronUp size={14} /></button>
                <button type="button" onClick={() => adjustVal(-1)} className="p-1 hover:bg-black/5 border-t border-black/5"><ChevronDown size={14} /></button>
              </div>
            </div>
            <div className="flex bg-black/5 p-1 rounded-xl border border-black/5">
              {(['m', 'h', 'd'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-bold transition-all",
                    unit === u ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {u === 'm' ? t.minute : u === 'h' ? t.hour : t.day}
                </button>
              ))}
            </div>
          </div>
          <div className={cn("text-[10px] mt-2 font-medium", isValidTime ? "text-gray-400" : "text-red-500")}>
            {t.min10Mins} • {t.max7Days}
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-gray-500 mb-2 flex items-center">
            <Lock size={14} className="mr-2" />
            {t.password}
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            className="w-full bg-black/5 border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base text-black"
          />
        </div>

        <button
          type="submit"
          disabled={!password || !name || !isValidTime}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-lg transition-all",
            (password && name && isValidTime)
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {t.create}
        </button>
      </form>
    </motion.div>
  );
}
