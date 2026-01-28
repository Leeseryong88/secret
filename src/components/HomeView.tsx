'use client';

import { Plus, MessageSquare, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Language, translations } from '@/lib/translations';

interface HomeViewProps {
  lang: Language;
  setLang: (lang: Language) => void;
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export default function HomeView({ lang, setLang, onCreateClick, onJoinClick }: HomeViewProps) {
  const t = translations[lang];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex space-x-8 md:space-x-12 mb-12"
      >
        {/* Create Room - Icon Only */}
        <button
          onClick={onCreateClick}
          className="flex flex-col items-center group"
          title={t.create}
        >
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 group-active:scale-95 transition-all">
            <Plus className="text-white" size={40} />
          </div>
        </button>

        {/* Join Room - Icon Only */}
        <button
          onClick={onJoinClick}
          className="flex flex-col items-center group"
          title={t.join}
        >
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 group-active:scale-95 transition-all">
            <MessageSquare className="text-white" size={40} />
          </div>
        </button>
      </motion.div>

      {/* Language Switcher - Moved here */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center space-x-2 bg-black/5 rounded-full p-1 border border-black/5 mb-8"
      >
        <Globe size={14} className="text-gray-400 ml-2" />
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLang('ko')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            lang === 'ko' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          KO
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-xs text-gray-500 max-w-sm leading-relaxed"
      >
        {t.desc}
      </motion.div>
    </div>
  );
}
