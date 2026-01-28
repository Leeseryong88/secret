'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  Clock, 
  LogOut, 
  ShieldAlert, 
  Copy, 
  Check, 
  Plus, 
  Type, 
  Trash2, 
  Bold,
  ChevronUp,
  ChevronDown
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
  const [scale, setScale] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState<{ x: number, y: number } | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const memoColors = [
    '#fef3c7', // Yellow
    '#dcfce7', // Green
    '#dbeafe', // Blue
    '#fce7f3', // Pink
    '#f3f4f6', // White/Gray
    '#ede9fe', // Purple
  ];

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setViewportSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Prevent browser zoom on Ctrl + Wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelRaw = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSpeed = 0.001;
        setScale(s => Math.min(Math.max(0.1, s - e.deltaY * zoomSpeed), 5));
      }
    };

    container.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelRaw);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [room.expiresAt]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (!dragStartPos.current) return;

    const distance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.current.x, 2) +
      Math.pow(e.clientY - dragStartPos.current.y, 2)
    );

    // Only show color picker if it's a click, not a drag (distance < 5px)
    if (distance < 5) {
      if (e.target !== containerRef.current && e.target !== canvasRef.current) {
        setShowColorPicker(null);
        return;
      }
      
      const rect = containerRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setShowColorPicker({ x, y });
    }
    
    dragStartPos.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
      setCanvasPos(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const createMemo = (color: string) => {
    if (!showColorPicker) return;

    const x = (showColorPicker.x - canvasPos.x) / scale;
    const y = (showColorPicker.y - canvasPos.y) / scale;

    onAddMemo({
      text: '',
      x: x - 100,
      y: y - 75,
      width: 200,
      height: 150,
      style: {
        fontSize: 14,
        isBold: false,
        color,
      }
    });
    setShowColorPicker(null);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showExtendButton = timeLeft > 0 && timeLeft <= 7200;

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 border-b border-black/5 bg-white/80 backdrop-blur-md flex items-center justify-between z-30">
        <div className="flex items-center space-x-3">
          <div className="min-w-0">
            <h3 className="font-bold text-sm md:text-lg leading-tight truncate text-black">
              {room.name || room.id}
            </h3>
            <div className="flex items-center text-[10px] md:text-xs text-gray-500 mt-0.5">
              <button onClick={copyRoomId} className="flex items-center hover:text-black transition-colors mr-3">
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
          <div className="px-3 py-1 bg-black/5 rounded-lg text-[10px] font-medium text-gray-500">
            {Math.round(scale * 100)}%
          </div>
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
            className="p-1.5 md:p-2 hover:bg-black/5 rounded-full text-gray-400 hover:text-red-500 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
        onPointerDown={handleCanvasPointerDown}
        onPointerUp={handleCanvasPointerUp}
        onWheel={handleWheel}
      >
        <motion.div
          ref={canvasRef}
          drag
          dragMomentum={false}
          onDrag={(e, info) => setCanvasPos(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }))}
          className="absolute inset-0"
          style={{ 
            x: canvasPos.x, 
            y: canvasPos.y,
            scale: scale,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.2]" 
            style={{ 
              backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', 
              backgroundSize: '40px 40px',
              width: '100000px',
              height: '100000px',
              transform: 'translate(-50000px, -50000px)'
            }} 
          />

          {memos.map((memo) => (
            <StickyNote 
              key={memo.id} 
              memo={memo} 
              scale={scale}
              onUpdate={(updates) => onUpdateMemo(memo.id, updates)}
              onDelete={() => onDeleteMemo(memo.id)}
            />
          ))}
        </motion.div>

        {/* Color Picker Overlay */}
        <AnimatePresence>
          {showColorPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute z-50 p-2 bg-white rounded-xl shadow-2xl border border-black/5 flex space-x-2"
              style={{ left: showColorPicker.x - 80, top: showColorPicker.y + 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              {memoColors.map((color) => (
                <button
                  key={color}
                  onClick={() => createMemo(color)}
                  className="w-8 h-8 rounded-lg border border-black/5 hover:scale-110 active:scale-95 transition-all shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimap */}
        <Minimap 
          memos={memos} 
          canvasPos={canvasPos} 
          scale={scale} 
          viewportSize={viewportSize} 
        />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-black/5 rounded-full text-[10px] text-gray-500 z-30 pointer-events-none shadow-sm text-center">
        Click to create memo • Drag to pan • Ctrl+Scroll to zoom
      </div>
    </div>
  );
}

function Minimap({ memos, canvasPos, scale, viewportSize }: { memos: Memo[], canvasPos: { x: number, y: number }, scale: number, viewportSize: { width: number, height: number } }) {
  const mapSize = 150;
  
  const bounds = useMemo(() => {
    if (memos.length === 0) return { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
    
    let minX = Math.min(...memos.map(m => m.x)) - 500;
    let minY = Math.min(...memos.map(m => m.y)) - 500;
    let maxX = Math.max(...memos.map(m => m.x + m.width)) + 500;
    let maxY = Math.max(...memos.map(m => m.y + m.height)) + 500;
    
    const viewX = -canvasPos.x / scale;
    const viewY = -canvasPos.y / scale;
    const viewW = viewportSize.width / scale;
    const viewH = viewportSize.height / scale;
    
    minX = Math.min(minX, viewX);
    minY = Math.min(minY, viewY);
    maxX = Math.max(maxX, viewX + viewW);
    maxY = Math.max(maxY, viewY + viewH);
    
    return { minX, minY, maxX, maxY };
  }, [memos, canvasPos, scale, viewportSize]);

  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  const maxRange = Math.max(rangeX, rangeY);
  
  const mapScale = mapSize / maxRange;

  const toMapCoord = (x: number, y: number) => ({
    x: (x - bounds.minX) * mapScale,
    y: (y - bounds.minY) * mapScale
  });

  const viewportRect = {
    x: (-canvasPos.x / scale - bounds.minX) * mapScale,
    y: (-canvasPos.y / scale - bounds.minY) * mapScale,
    w: (viewportSize.width / scale) * mapScale,
    h: (viewportSize.height / scale) * mapScale
  };

  return (
    <div 
      className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-md border border-black/5 rounded-lg shadow-xl overflow-hidden pointer-events-none z-20"
      style={{ width: mapSize, height: mapSize }}
    >
      <div className="relative w-full h-full">
        {memos.map(memo => {
          const coord = toMapCoord(memo.x, memo.y);
          return (
            <div 
              key={memo.id}
              className="absolute rounded-[1px]"
              style={{
                left: coord.x,
                top: coord.y,
                width: memo.width * mapScale,
                height: memo.height * mapScale,
                backgroundColor: memo.style.color,
                border: '0.5px solid rgba(0,0,0,0.1)'
              }}
            />
          );
        })}
        <div 
          className="absolute border border-blue-500 bg-blue-500/10 rounded-sm"
          style={{
            left: viewportRect.x,
            top: viewportRect.y,
            width: viewportRect.w,
            height: viewportRect.h
          }}
        />
      </div>
    </div>
  );
}

function StickyNote({ memo, scale, onUpdate, onDelete }: { memo: Memo; scale: number; onUpdate: (updates: Partial<Memo>) => void; onDelete: () => void }) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

  const adjustFontSize = (delta: number) => {
    onUpdate({ style: { ...memo.style, fontSize: Math.max(8, Math.min(72, memo.style.fontSize + delta)) } });
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={(e, info) => {
        onUpdate({ 
          x: memo.x + info.offset.x / scale, 
          y: memo.y + info.offset.y / scale 
        });
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, x: memo.x, y: memo.y }}
      className="absolute group shadow-2xl overflow-visible cursor-default"
      style={{ width: memo.width, height: memo.height }}
    >
      <div 
        className="w-full h-full flex flex-col rounded-sm overflow-hidden"
        style={{ backgroundColor: memo.style.color, color: '#333' }}
      >
        <div 
          className="h-6 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b border-black/5 flex-shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex space-x-1" onPointerDown={(e) => e.stopPropagation()}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ style: { ...memo.style, isBold: !memo.style.isBold } });
              }}
              className={cn("p-0.5 rounded hover:bg-black/10 transition-colors", memo.style.isBold && "bg-black/10")}
            >
              <Bold size={10} />
            </button>
            <div className="flex items-center bg-black/5 rounded px-0.5">
              <button 
                onClick={(e) => { e.stopPropagation(); adjustFontSize(-2); }}
                className="p-0.5 hover:bg-black/10 rounded transition-colors"
              >
                <ChevronDown size={10} />
              </button>
              <span className="text-[8px] font-bold px-0.5 min-w-[12px] text-center">{memo.style.fontSize}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); adjustFontSize(2); }}
                className="p-0.5 hover:bg-black/10 rounded transition-colors"
              >
                <ChevronUp size={10} />
              </button>
            </div>
          </div>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-0.5 rounded hover:bg-black/10 text-red-600 transition-colors"
          >
            <Trash2 size={10} />
          </button>
        </div>

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

        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = memo.width;
            const startHeight = memo.height;

            const onMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = (moveEvent.clientX - startX) / scale;
              const deltaY = (moveEvent.clientY - startY) / scale;
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
