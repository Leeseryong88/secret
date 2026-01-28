'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform } from 'framer-motion';
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
  ChevronDown,
  Edit2,
  Users
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
  zIndex: number;
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
  activeUsers: { id: string; nickname: string }[];
  currentUser: {
    id: string;
    nickname: string;
  };
  onAddMemo: (memo: Omit<Memo, 'id'>) => void;
  onUpdateMemo: (id: string, updates: Partial<Memo>) => void;
  onDeleteMemo: (id: string) => void;
  onExtend: (hours: number) => void;
  onLeave: () => void;
}

export default function MemoCanvas({
  lang,
  room,
  memos,
  activeUsers,
  currentUser,
  onAddMemo,
  onUpdateMemo,
  onDeleteMemo,
  onExtend,
  onLeave,
}: MemoCanvasProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<{ x: number, y: number } | null>(null);
  const [showExtendPicker, setShowExtendPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [extendVal, setExtendVal] = useState(24);
  const [extendUnit, setExtendUnit] = useState<'h' | 'd'>('h');
  const [viewportSize, setViewportSize] = useState({ width: 1000, height: 1000 });
  
  // Use MotionValues for smooth, high-frequency updates without re-renders
  const canvasX = useMotionValue(0);
  const canvasY = useMotionValue(0);
  const canvasScale = useMotionValue(1);

  // For React components that need to react to these changes (like Minimap)
  const [syncState, setSyncState] = useState({ x: 0, y: 0, scale: 1 });

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef<{ x: number, y: number } | null>(null);
  const t = translations[lang];

  const memoColors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3f4f6', '#ede9fe'];

  // Update sync state for Minimap
  useEffect(() => {
    const unsubX = canvasX.on('change', (v) => setSyncState(s => ({ ...s, x: v })));
    const unsubY = canvasY.on('change', (v) => setSyncState(s => ({ ...s, y: v })));
    const unsubS = canvasScale.on('change', (v) => setSyncState(s => ({ ...s, scale: v })));
    return () => { unsubX(); unsubY(); unsubS(); };
  }, [canvasX, canvasY, canvasScale]);

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

  // Wheel zoom logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelRaw = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSpeed = 0.0015;
        const delta = -e.deltaY * zoomSpeed;
        
        const currentScale = canvasScale.get();
        const newScale = Math.min(Math.max(0.1, currentScale + delta), 5);
        
        if (newScale === currentScale) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Coordinates in the grid before zoom
        const gridX = (mouseX - canvasX.get()) / currentScale;
        const gridY = (mouseY - canvasY.get()) / currentScale;

        // New canvas position to keep gridX/Y under the mouse
        canvasX.set(mouseX - gridX * newScale);
        canvasY.set(mouseY - gridY * newScale);
        canvasScale.set(newScale);
      } else {
        // Disable normal scroll panning as requested
        // e.preventDefault(); // Uncomment if you want to block browser default scroll entirely
      }
    };

    container.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelRaw);
  }, [canvasX, canvasY, canvasScale]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((room.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [room.expiresAt]);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const isBg = target === containerRef.current || target.id === 'canvas-main' || target.id === 'grid-bg';
    if (isBg) {
      isPanning.current = true;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      target.setPointerCapture(e.pointerId);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    
    const deltaX = e.clientX - lastPointerPos.current.x;
    const deltaY = e.clientY - lastPointerPos.current.y;
    
    canvasX.set(canvasX.get() + deltaX);
    canvasY.set(canvasY.get() + deltaY);
    
    lastPointerPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }

    if (!dragStartPos.current) return;
    const distance = Math.sqrt(Math.pow(e.clientX - dragStartPos.current.x, 2) + Math.pow(e.clientY - dragStartPos.current.y, 2));
    if (distance < 5) {
      const target = e.target as HTMLElement;
      const isBg = target === containerRef.current || target.id === 'canvas-main' || target.id === 'grid-bg';
      if (isBg) {
        const rect = containerRef.current!.getBoundingClientRect();
        setShowColorPicker({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setShowColorPicker(null);
      }
    }
    dragStartPos.current = null;
  };

  const createMemo = (color: string) => {
    if (!showColorPicker) return;
    const scale = canvasScale.get();
    const x = (showColorPicker.x - canvasX.get()) / scale;
    const y = (showColorPicker.y - canvasY.get()) / scale;
    const maxZ = memos.length > 0 ? Math.max(...memos.map(m => m.zIndex || 0)) : 0;
    onAddMemo({
      text: '', x: x - 100, y: y - 75, width: 200, height: 150, zIndex: maxZ + 1,
      style: { fontSize: 14, isBold: false, color }
    });
    setShowColorPicker(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 border-b border-black/5 bg-white/80 backdrop-blur-md flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto text-black">
          <div className="min-w-0 text-left">
            <h3 className="font-bold text-sm md:text-lg leading-tight truncate">{room.name || room.id}</h3>
            <div className="flex items-center text-[10px] md:text-xs text-gray-500 mt-0.5">
              <button onClick={() => { navigator.clipboard.writeText(room.id); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center hover:text-black transition-colors mr-3">
                {room.id} {copied ? <Check size={10} className="ml-1 text-emerald-600" /> : <Copy size={10} className="ml-1" />}
              </button>
              <div className="flex items-center text-orange-600 font-medium"><Clock size={10} className="mr-1" /> {formatTimeLeft(timeLeft)}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 pointer-events-auto relative">
          <div className="relative">
            <button 
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center space-x-1 px-2 py-1 bg-black/5 hover:bg-black/10 rounded-lg text-[10px] md:text-xs font-medium text-gray-600 transition-colors"
            >
              <Users size={12} />
              <span>{activeUsers.length}</span>
            </button>
            
            <AnimatePresence>
              {showParticipants && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }} 
                  className="absolute right-0 mt-2 p-3 bg-white rounded-xl shadow-2xl border border-black/5 w-48 z-[60]"
                >
                  <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">{t.participants}</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-none">
                    {activeUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className={cn(
                          "text-xs truncate",
                          user.id === currentUser.id ? "font-bold text-blue-600" : "text-gray-700"
                        )}>
                          {user.nickname} {user.id === currentUser.id && "(Me)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="px-3 py-1 bg-black/5 rounded-lg text-[10px] font-medium text-gray-500">{Math.round(syncState.scale * 100)}%</div>
          {timeLeft > 0 && (
            <div className="relative">
              <button 
                onClick={() => {
                  if (timeLeft > 86400) {
                    alert(t.extendOnlyWithin24h);
                    return;
                  }
                  setShowExtendPicker(!showExtendPicker);
                }} 
                className={cn(
                  "px-3 py-1.5 text-white text-[10px] md:text-xs font-bold rounded-lg transition-colors",
                  timeLeft > 86400 
                    ? "bg-gray-400 hover:bg-gray-500" 
                    : "bg-orange-500 hover:bg-orange-600"
                )}
              >
                {t.extend}
              </button>
              
              <AnimatePresence>
                {showExtendPicker && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 p-4 bg-white rounded-xl shadow-2xl border border-black/5 w-64 z-[60]">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1 flex items-center bg-black/5 rounded-lg overflow-hidden">
                        <input type="number" value={extendVal} onChange={(e) => setExtendVal(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-transparent px-2 py-1.5 focus:outline-none text-xs text-black font-bold" />
                      </div>
                      <div className="flex bg-black/5 p-0.5 rounded-lg">
                        {(['h', 'd'] as const).map((u) => (
                          <button key={u} onClick={() => setExtendUnit(u)} className={cn("px-2 py-1 rounded-md text-[10px] font-bold transition-all", extendUnit === u ? "bg-white text-blue-600 shadow-sm" : "text-gray-400")}>
                            {u === 'h' ? t.hour : t.day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const mins = extendUnit === 'h' ? extendVal * 60 : extendVal * 24 * 60;
                        const now = Date.now();
                        const newExpiresAt = room.expiresAt + mins * 60 * 1000;
                        const maxExpiresAt = now + 7 * 24 * 60 * 60 * 1000;

                        if (newExpiresAt > maxExpiresAt) {
                          alert(t.maxExtend7Days);
                          return;
                        }

                        if (mins > 0) {
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

      <div 
        ref={containerRef}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onContextMenu={(e) => { if (showColorPicker) { e.preventDefault(); setShowColorPicker(null); } }}
      >
        <motion.div
          id="canvas-main"
          className="absolute inset-0"
          style={{ x: canvasX, y: canvasY, scale: canvasScale, transformOrigin: '0 0' }}
        >
          <div id="grid-bg" className="absolute inset-0 pointer-events-none opacity-[0.2]" 
            style={{ backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '40px 40px', width: '100000px', height: '100000px', transform: 'translate(-50000px, -50000px)' }} 
          />
          {memos.map((memo) => (
            <StickyNote key={memo.id} memo={memo} canvasScale={canvasScale} onUpdate={(updates: Partial<Memo>) => onUpdateMemo(memo.id, updates)} onDelete={() => onDeleteMemo(memo.id)} />
          ))}
        </motion.div>

        <AnimatePresence>
          {showColorPicker && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute z-50 p-2 bg-white rounded-xl shadow-2xl border border-black/5 flex space-x-2" style={{ left: showColorPicker.x - 80, top: showColorPicker.y + 10 }} onClick={(e) => e.stopPropagation()}>
              {memoColors.map((color) => (
                <button key={color} onClick={() => createMemo(color)} className="w-8 h-8 rounded-lg border border-black/5 hover:scale-110 active:scale-95 transition-all shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Minimap 
          memos={memos} 
          canvasX={canvasX} 
          canvasY={canvasY} 
          canvasScale={canvasScale} 
          syncState={syncState}
          viewportSize={viewportSize} 
        />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/80 backdrop-blur-xl border border-black/5 rounded-full text-[10px] text-gray-500 z-30 pointer-events-none shadow-sm text-center leading-tight">Click to create memo • Drag to pan • Ctrl+Scroll to zoom</div>
    </div>
  );
}

interface MinimapProps {
  memos: Memo[];
  canvasX: any;
  canvasY: any;
  canvasScale: any;
  syncState: { x: number; y: number; scale: number };
  viewportSize: { width: number; height: number };
}

function Minimap({ memos, canvasX, canvasY, canvasScale, syncState, viewportSize }: MinimapProps) {
  const mapSize = 150;
  const containerRef = useRef<HTMLDivElement>(null);
  
  const bounds = useMemo(() => {
    const { x, y, scale } = syncState;
    const viewX = -x / scale;
    const viewY = -y / scale;
    const viewW = viewportSize.width / scale;
    const viewH = viewportSize.height / scale;

    const allX = memos.length > 0 ? memos.map((m:any) => m.x) : [0];
    const allY = memos.length > 0 ? memos.map((m:any) => m.y) : [0];
    const allXEnd = memos.length > 0 ? memos.map((m:any) => m.x + m.width) : [1000];
    const allYEnd = memos.length > 0 ? memos.map((m:any) => m.y + m.height) : [1000];

    const minX = Math.min(viewX, ...allX) - 200;
    const minY = Math.min(viewY, ...allY) - 200;
    const maxX = Math.max(viewX + viewW, ...allXEnd) + 200;
    const maxY = Math.max(viewY + viewH, ...allYEnd) + 200;
    
    return { minX, minY, maxX, maxY };
  }, [memos, syncState, viewportSize]);

  const mapScale = mapSize / Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const toMapCoord = (x: number, y: number) => ({ x: (x - bounds.minX) * mapScale, y: (y - bounds.minY) * mapScale });

  const handleMapClick = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = canvasScale.get();
    const targetCenterX = (e.clientX - rect.left) / mapScale + bounds.minX;
    const targetCenterY = (e.clientY - rect.top) / mapScale + bounds.minY;
    
    canvasX.set(-(targetCenterX - (viewportSize.width / scale) / 2) * scale);
    canvasY.set(-(targetCenterY - (viewportSize.height / scale) / 2) * scale);
  };

  const vRect = { 
    x: (-syncState.x / syncState.scale - bounds.minX) * mapScale, 
    y: (-syncState.y / syncState.scale - bounds.minY) * mapScale, 
    w: (viewportSize.width / syncState.scale) * mapScale, 
    h: (viewportSize.height / syncState.scale) * mapScale 
  };

  return (
    <div ref={containerRef} className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md border border-black/10 rounded-lg shadow-2xl overflow-hidden cursor-crosshair z-20 pointer-events-auto ring-1 ring-black/5" style={{ width: mapSize, height: mapSize }} onPointerDown={handleMapClick}>
      <div className="relative w-full h-full pointer-events-none">
        {memos.map((m: any) => {
          const c = toMapCoord(m.x, m.y);
          return <div key={m.id} className="absolute rounded-[1px]" style={{ left: c.x, top: c.y, width: m.width * mapScale, height: m.height * mapScale, backgroundColor: m.style.color, border: '0.5px solid rgba(0,0,0,0.1)' }} />;
        })}
        <div className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm shadow-[0_0_0_1000px_rgba(0,0,0,0.02)]" style={{ left: vRect.x, top: vRect.y, width: vRect.w, height: vRect.h }} />
      </div>
    </div>
  );
}

interface StickyNoteProps {
  memo: Memo;
  canvasScale: any;
  onUpdate: (updates: Partial<Memo>) => void;
  onDelete: () => void;
}

function StickyNote({ memo, canvasScale, onUpdate, onDelete }: StickyNoteProps) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();
  const [localSize, setLocalSize] = useState({ width: memo.width, height: memo.height });

  useEffect(() => { setLocalSize({ width: memo.width, height: memo.height }); }, [memo.width, memo.height]);

  return (
    <motion.div
      drag dragControls={dragControls} dragListener={false} dragMomentum={false}
      onDragEnd={(e, info) => {
        const s = canvasScale.get();
        onUpdate({ x: memo.x + info.offset.x / s, y: memo.y + info.offset.y / s });
      }}
      animate={{ x: memo.x, y: memo.y, zIndex: memo.zIndex || 0 }}
      className="absolute group shadow-xl hover:shadow-2xl transition-shadow duration-200 overflow-visible cursor-default"
      style={{ width: localSize.width, height: localSize.height }}
    >
      <div className="w-full h-full flex flex-col rounded-md overflow-hidden ring-1 ring-black/5 shadow-inner" style={{ backgroundColor: memo.style.color, color: '#333' }}>
        <div className="h-7 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b border-black/5 flex-shrink-0" onPointerDown={(e) => { e.stopPropagation(); dragControls.start(e); }}>
          <div className="flex items-center space-x-1" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={(e) => { e.stopPropagation(); onUpdate({ style: { ...memo.style, isBold: !memo.style.isBold } }); }} className={cn("p-1 rounded hover:bg-black/10", memo.style.isBold && "bg-black/10")}><Bold size={12} /></button>
            <div className="flex items-center bg-black/5 rounded-md px-1">
              <button onClick={(e) => { e.stopPropagation(); onUpdate({ style: { ...memo.style, fontSize: Math.max(8, memo.style.fontSize - 2) } }); }} className="p-0.5 hover:bg-black/10 rounded"><ChevronDown size={12} /></button>
              <span className="text-[10px] font-bold px-1 min-w-[16px] text-center">{memo.style.fontSize}</span>
              <button onClick={(e) => { e.stopPropagation(); onUpdate({ style: { ...memo.style, fontSize: Math.min(72, memo.style.fontSize + 2) } }); }} className="p-0.5 hover:bg-black/10 rounded"><ChevronUp size={12} /></button>
            </div>
          </div>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-black/10 text-red-600"><Trash2 size={12} /></button>
        </div>
        <textarea ref={textRef} value={memo.text} onPointerDown={(e) => e.stopPropagation()} onChange={(e) => onUpdate({ text: e.target.value })} placeholder="Type..." className="flex-1 w-full p-3 bg-transparent outline-none resize-none overflow-auto scrollbar-none" style={{ fontSize: `${memo.style.fontSize}px`, fontWeight: memo.style.isBold ? 'bold' : 'normal', lineHeight: 1.4 }} />
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onPointerDown={(e) => {
            e.preventDefault(); e.stopPropagation();
            const startX = e.clientX; const startY = e.clientY;
            const startW = localSize.width; const startH = localSize.height;
            const onMove = (pe: PointerEvent) => {
              const s = canvasScale.get();
              setLocalSize({ width: Math.max(100, startW + (pe.clientX - startX) / s), height: Math.max(80, startH + (pe.clientY - startY) / s) });
            };
            const onUp = () => {
              window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
              onUpdate({ width: localSize.width, height: localSize.height });
            };
            window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
          }}
        ><div className="w-2.5 h-2.5 border-r-2 border-b-2 border-black/20 rounded-br-sm" /></div>
      </div>
    </motion.div>
  );
}
