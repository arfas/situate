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
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {room.title}
          </h3>
          {room.category && (
            <span className="inline-block px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
              {room.category}
            </span>
          )}
        </div>
        {showMatchInfo && room.similarity && (
          <div className="ml-4 text-right">
            <span className="text-sm font-medium text-green-600">
              {Math.round(room.similarity * 100)}% match
            </span>
          </div>
        )}
      </div>

      {room.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">
          {room.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{room.member_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{room.message_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTimeAgo(room.last_activity)}</span>
          </div>
        </div>

        <button
          onClick={() => onJoin(room)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View Room
        </button>
      </div>
    </div>
  );
}
