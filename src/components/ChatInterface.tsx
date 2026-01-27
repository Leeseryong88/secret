'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, Users, LogOut, ShieldAlert, Copy, Check, UserCircle2, Edit2 } from 'lucide-react';
import { cn, formatTimeLeft } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  senderId: string;
  nickname: string;
  createdAt: number;
}

interface ChatInterfaceProps {
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
  onExtend: () => void;
  onLeave: () => void;
}

export default function ChatInterface({
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
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(currentUser.nickname);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const showExtendButton = timeLeft > 0 && timeLeft <= 7200; // 2 hours in seconds

  return (
    <div className="flex flex-col h-[90vh] max-w-4xl mx-auto w-full bg-black/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight truncate max-w-[150px] md:max-w-[300px]">
              {room.name || room.id}
            </h3>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <button 
                onClick={copyRoomId}
                className="flex items-center hover:text-white transition-colors mr-3"
              >
                ID: {room.id}
                {copied ? <Check size={12} className="ml-1 text-emerald-500" /> : <Copy size={12} className="ml-1" />}
              </button>
              <div className="flex items-center text-orange-400">
                <Clock size={12} className="mr-1" />
                {formatTimeLeft(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Nickname Editor */}
          <div className="hidden md:flex items-center bg-white/5 rounded-full px-3 py-1 border border-white/10 mr-2">
            <UserCircle2 size={14} className="text-gray-400 mr-2" />
            {isEditingNickname ? (
              <form onSubmit={handleNicknameSubmit} className="flex items-center">
                <input
                  autoFocus
                  value={tempNickname}
                  onChange={(e) => setTempNickname(e.target.value)}
                  onBlur={handleNicknameSubmit}
                  className="bg-transparent text-xs text-white focus:outline-none w-20"
                />
              </form>
            ) : (
              <div className="flex items-center">
                <span className="text-xs text-gray-300 mr-2">{currentUser.nickname}</span>
                <button onClick={() => setIsEditingNickname(true)} className="text-gray-500 hover:text-white">
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onLeave}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-all"
            title="방 나가기"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>

      {/* Extension Alert */}
      <AnimatePresence>
        {showExtendButton && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-orange-500/10 border-b border-orange-500/20 p-3 flex items-center justify-between"
          >
            <div className="flex items-center text-orange-400 text-sm">
              <ShieldAlert size={16} className="mr-2" />
              방이 곧 만료됩니다. 대화를 더 이어가시겠습니까?
            </div>
            <button
              onClick={onExtend}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
            >
              4시간 연장
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <p>아직 메시지가 없습니다. 첫 인사를 건네보세요!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[80%]",
                msg.senderId === currentUser.id ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className="flex items-center space-x-2 mb-1 px-1">
                <span className="text-xs font-medium text-gray-500">
                  {msg.nickname}
                </span>
                <span className="text-[10px] text-gray-700">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                  msg.senderId === currentUser.id
                    ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10"
                    : "bg-white/10 text-gray-200 rounded-tl-none border border-white/5"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <form onSubmit={handleSend} className="flex space-x-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
              inputText.trim()
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageSquare({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
