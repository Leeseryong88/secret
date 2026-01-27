'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  LogOut, 
  ShieldAlert, 
  Copy, 
  Check, 
  Plus, 
  Type, 
  Trash2, 
  Maximize2,
  Minimize2,
  Bold,
  Palette
} from 'lucide-react';
import { cn, formatTimeLeft } from '@/lib/utils';
import { Language, translations } from '@/lib/translations';

interface Memo {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize: number;
    isBold: boolean;
    color: string;
  };
}

interface MemoCanvasProps {
  lang: Language;
  room: {
    id: string;
    name?: string;
    expiresAt: number;
  };
  memos: Memo[];
  currentUser: {
    id: string;
    nickname: string;
  };
  onAddMemo: (memo: Omit<Memo, 'id'>) => void;
  onUpdateMemo: (id: string, updates: Partial<Memo>) => void;
  onDeleteMemo: (id: string) => void;
  onExtend: () => void;
  onLeave: () => void;
}

export default function MemoCanvas({
  lang,
  room,
  memos,
  currentUser,
  onAddMemo,
  onUpdateMemo,
  onDeleteMemo,
  onExtend,
  onLeave,
}: MemoCanvasProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [canvasPos, setCanvasPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [room.expiresAt]);

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasPos.x;
    const y = e.clientY - rect.top - canvasPos.y;

    onAddMemo({
      text: '',
      x: x - 100,
      y: y - 75,
      width: 200,
      height: 150,
      style: {
        fontSize: 14,
        isBold: false,
        color: '#fef3c7', // light yellow
      }
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showExtendButton = timeLeft > 0 && timeLeft <= 7200;

  return (
    <div className="flex flex-col h-full w-full bg-[#111] overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 border-b border-white/5 bg-black/60 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center space-x-3">
          <div className="min-w-0">
            <h3 className="font-bold text-sm md:text-lg leading-tight truncate text-white">
              {room.name || room.id}
            </h3>
            <div className="flex items-center text-[10px] md:text-xs text-gray-500 mt-0.5">
              <button onClick={copyRoomId} className="flex items-center hover:text-white transition-colors mr-3">
                {room.id}
                {copied ? <Check size={10} className="ml-1 text-emerald-500" /> : <Copy size={10} className="ml-1" />}
              </button>
              <div className="flex items-center text-orange-400">
                <Clock size={10} className="mr-1" />
                {formatTimeLeft(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showExtendButton && (
            <button
              onClick={onExtend}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] md:text-xs font-bold rounded-lg transition-colors"
            >
              {t.extend}
            </button>
          )}
          <button
            onClick={onLeave}
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full cursor-crosshair relative overflow-hidden"
        onDoubleClick={handleCanvasDoubleClick}
      >
        <motion.div
          drag
          dragMomentum={false}
          onDrag={(e, info) => setCanvasPos(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }))}
          className="absolute inset-0"
          style={{ x: canvasPos.x, y: canvasPos.y }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
            style={{ 
              backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', 
              backgroundSize: '40px 40px',
              width: '10000px',
              height: '10000px',
              transform: 'translate(-5000px, -5000px)'
            }} 
          />

          {memos.map((memo) => (
            <StickyNote 
              key={memo.id} 
              memo={memo} 
              onUpdate={(updates) => onUpdateMemo(memo.id, updates)}
              onDelete={() => onDeleteMemo(memo.id)}
            />
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-[10px] text-gray-500 z-30 pointer-events-none">
        Double click anywhere to create a memo • Drag canvas to pan
      </div>
    </div>
  );
}

function StickyNote({ memo, onUpdate, onDelete }: { memo: Memo; onUpdate: (updates: Partial<Memo>) => void; onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(e, info) => {
        onUpdate({ x: memo.x + info.offset.x, y: memo.y + info.offset.y });
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, x: memo.x, y: memo.y }}
      className="absolute group shadow-2xl overflow-visible"
      style={{ width: memo.width, height: memo.height }}
    >
      <div 
        className="w-full h-full flex flex-col rounded-sm overflow-hidden"
        style={{ backgroundColor: memo.style.color, color: '#333' }}
      >
        {/* Memo Header */}
        <div className="h-6 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b border-black/5">
          <div className="flex space-x-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ style: { ...memo.style, isBold: !memo.style.isBold } });
              }}
              className={cn("p-0.5 rounded hover:bg-black/10 transition-colors", memo.style.isBold && "bg-black/10")}
            >
              <Bold size={10} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const newSize = memo.style.fontSize === 24 ? 12 : memo.style.fontSize + 4;
                onUpdate({ style: { ...memo.style, fontSize: newSize } });
              }}
              className="p-0.5 rounded hover:bg-black/10 transition-colors"
            >
              <Type size={10} />
            </button>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-0.5 rounded hover:bg-black/10 text-red-600 transition-colors"
          >
            <Trash2 size={10} />
          </button>
        </div>

        {/* Memo Content */}
        <textarea
          ref={textRef}
          value={memo.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Type something..."
          className="flex-1 w-full p-3 bg-transparent outline-none resize-none overflow-auto scrollbar-none"
          style={{ 
            fontSize: `${memo.style.fontSize}px`, 
            fontWeight: memo.style.isBold ? 'bold' : 'normal' 
          }}
        />

        {/* Resize Handle */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = memo.width;
            const startHeight = memo.height;

            const onMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
              onUpdate({ 
                width: Math.max(100, startWidth + deltaX),
                height: Math.max(80, startHeight + deltaY)
              });
            };

            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-black/20" />
        </div>
      </div>
    </motion.div>
  );
}
