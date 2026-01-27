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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Language Switcher */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-8 flex items-center space-x-2 bg-white/5 rounded-full p-1 border border-white/10"
      >
        <Globe size={14} className="text-gray-500 ml-2" />
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            lang === 'en' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLang('ko')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            lang === 'ko' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          KO
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex space-x-8 md:space-x-12"
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-xs text-gray-600 max-w-sm leading-relaxed"
      >
        {t.desc}
      </motion.div>
    </div>
  );
}
