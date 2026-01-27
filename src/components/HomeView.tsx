'use client';

import { Shield, Plus, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomeViewProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export default function HomeView({ onCreateClick, onJoinClick }: HomeViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-lg"
      >
        <button
          onClick={onCreateClick}
          className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <Plus className="text-white" size={20} />
          </div>
          <span className="text-lg md:text-xl font-semibold">채팅방 만들기</span>
          <span className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">새로운 대화를 시작하세요</span>
        </button>

        <button
          onClick={onJoinClick}
          className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-600 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
            <MessageSquare className="text-white" size={20} />
          </div>
          <span className="text-lg md:text-xl font-semibold">채팅방 들어가기</span>
          <span className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">ID와 비밀번호를 입력하세요</span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-xs text-gray-600 max-w-sm"
      >
        어디서나 ID와 비밀번호만 알고있으면 채팅을 할 수 있으며 만료된 채팅방의 모든 데이터는 서버에서 영구적으로 삭제되며 복구할 수 없습니다.
      </motion.div>
    </div>
  );
}
