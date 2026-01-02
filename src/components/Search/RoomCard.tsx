import { Users, MessageCircle, Clock } from 'lucide-react';
import type { Room } from '../../services/api';

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
  showMatchInfo?: boolean;
}

export function RoomCard({ room, onJoin, showMatchInfo }: RoomCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
            {room.title}
          </h3>
          {room.category && (
            <span className="inline-block px-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium">
              {room.category}
            </span>
          )}
        </div>
        {showMatchInfo && room.similarity && (
          <div className="ml-4 text-right">
            <span className="inline-block px-3 py-1 text-sm font-semibold bg-slate-700 dark:bg-slate-600 text-white rounded-full">
              {Math.round(room.similarity * 100)}% match
            </span>
          </div>
        )}
      </div>

      {room.description && (
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">
          {room.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5 transition-colors">
            <Users className="w-4 h-4" />
            <span className="font-medium">{room.member_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">{room.message_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 transition-colors">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatTimeAgo(room.last_activity)}</span>
          </div>
        </div>

        <button
          onClick={() => onJoin(room)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg hover:shadow-md transition-all duration-200 font-medium text-sm"
        >
          View Room
        </button>
      </div>
    </div>
  );
}
