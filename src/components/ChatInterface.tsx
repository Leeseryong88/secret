'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, Users, LogOut, ShieldAlert, Copy, Check, UserCircle2, Edit2 } from 'lucide-react';
import { cn, formatTimeLeft } from '@/lib/utils';
import { Language, translations } from '@/lib/translations';

interface Message {
  id: string;
  text: string;
  senderId: string;
  nickname: string;
  createdAt: number;
}

interface ChatInterfaceProps {
  lang: Language;
  room: {
    id: string;
    name?: string;
    expiresAt: number;
  };
  messages: Message[];
  currentUser: {
    id: string;
    nickname: string;
  };
  onSendMessage: (text: string) => void;
  onUpdateNickname: (newNickname: string) => void;
  onExtend: (hours: number) => void;
  onLeave: () => void;
}

export default function ChatInterface({
  lang,
  room,
  messages,
  currentUser,
  onSendMessage,
  onUpdateNickname,
  onExtend,
  onLeave,
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showExtendPicker, setShowExtendPicker] = useState(false);
  const [extendVal, setExtendVal] = useState(24);
  const [extendUnit, setExtendUnit] = useState<'h' | 'd'>('h');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(currentUser.nickname);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    setTempNickname(currentUser.nickname);
  }, [currentUser.nickname]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [room.expiresAt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempNickname.trim() && tempNickname !== currentUser.nickname) {
      onUpdateNickname(tempNickname.trim());
    }
    setIsEditingNickname(false);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] md:bg-white md:rounded-3xl md:border border-black/5 overflow-hidden md:shadow-2xl">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-black/5 bg-white/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center space-x-3 text-black">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm md:text-lg leading-tight truncate">
              {room.name || room.id}
            </h3>
            <div className="flex items-center text-[10px] md:text-xs text-gray-500 mt-0.5">
              <button onClick={copyRoomId} className="flex items-center hover:text-black transition-colors mr-3">
                {room.id} {copied ? <Check size={10} className="ml-1 text-emerald-600" /> : <Copy size={10} className="ml-1" />}
              </button>
              <div className="flex items-center text-orange-600">
                <Clock size={10} className="mr-1" /> {formatTimeLeft(timeLeft)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 relative">
          {timeLeft > 0 && timeLeft <= 86400 && (
            <div className="relative">
              <button onClick={() => setShowExtendPicker(!showExtendPicker)} className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] md:text-xs font-bold rounded-lg transition-colors">{t.extend}</button>
              
              <AnimatePresence>
                {showExtendPicker && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 p-4 bg-white rounded-xl shadow-2xl border border-black/5 w-64 z-[60]">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1 flex items-center bg-black/5 rounded-lg overflow-hidden">
                        <input type="number" value={extendVal} onChange={(e) => setExtendVal(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-transparent px-2 py-1.5 focus:outline-none text-xs text-black font-bold" />
                      </div>
                      <div className="flex bg-black/5 p-0.5 rounded-lg">
                        {(['h', 'd'] as const).map((u) => (
                          <button key={u} type="button" onClick={() => setExtendUnit(u)} className={cn("px-2 py-1 rounded-md text-[10px] font-bold transition-all", extendUnit === u ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>
                            {u === 'h' ? t.hour : t.day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const mins = extendUnit === 'h' ? extendVal * 60 : extendVal * 24 * 60;
                        if (mins > 0 && mins <= 10080) {
                          onExtend(mins / 60);
                          setShowExtendPicker(false);
                        }
                      }} 
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      {t.enter}
                    </button>
                    <p className="text-[9px] text-gray-400 mt-2 text-center">{t.min10Mins} • {t.max7Days}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <button onClick={onLeave} className="p-1.5 md:p-2 hover:bg-black/5 rounded-full text-gray-400 hover:text-red-500 transition-all"><LogOut size={20} /></button>
        </div>
      </div>


      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-[#f8f9fa]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <Users size={48} className="opacity-20" />
            <p className="text-sm md:text-base">{t.emptyMessages}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[80%]", msg.senderId === currentUser.id ? "ml-auto items-end" : "items-start")}>
              <div className="flex items-center space-x-2 mb-1 px-1">
                <span className="text-[10px] md:text-xs font-medium text-gray-500">{msg.nickname}</span>
                <span className="text-[9px] md:text-[10px] text-gray-300">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={cn("px-3 py-2 md:px-4 md:py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed break-words shadow-sm", msg.senderId === currentUser.id ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-black/5")}>
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 md:p-4 bg-white border-t border-black/5 pb-safe">
        <form onSubmit={handleSend} className="flex items-center space-x-2 md:space-x-3">
          <div className="flex items-center bg-black/5 rounded-2xl px-3 py-2.5 border border-black/5 flex-shrink-0">
            {isEditingNickname ? (
              <input autoFocus value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleNicknameSubmit(e)} onBlur={handleNicknameSubmit} className="bg-transparent text-xs md:text-sm text-gray-800 focus:outline-none w-16 md:w-24" />
            ) : (
              <button type="button" onClick={() => setIsEditingNickname(true)} className="flex items-center group">
                <span className="text-xs md:text-sm text-blue-600 font-medium max-w-[60px] md:max-w-[100px] truncate mr-1">{currentUser.nickname}</span>
                <Edit2 size={12} className="text-gray-400 group-hover:text-gray-600" />
              </button>
            )}
          </div>
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={t.messagePlaceholder} className="flex-1 bg-black/5 border border-black/5 rounded-2xl px-4 md:px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 text-sm md:text-base" />
          <button type="submit" disabled={!inputText.trim()} className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0", inputText.trim() ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
