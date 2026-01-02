import { RoomCard } from './RoomCard';
import { Plus, Sparkles } from 'lucide-react';
import type { Room } from '../../services/api';

interface SearchResultsProps {
  results: Room[];
  popularRooms: Room[];
  searchType?: 'semantic' | 'keyword';
  onJoinRoom: (room: Room) => void;
  onCreateRoom: () => void;
  showPopular?: boolean;
}

export function SearchResults({
  results,
  popularRooms,
  searchType,
  onJoinRoom,
  onCreateRoom,
  showPopular = true,
}: SearchResultsProps) {
  const hasResults = results && results.length > 0;
  const hasPopular = popularRooms && popularRooms.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {hasResults && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {searchType === 'semantic' ? 'Best Matches' : 'Search Results'}
            </h2>
            {searchType === 'semantic' && (
              <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
            )}
          </div>

          <div className="space-y-5">
            {results.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={onJoinRoom}
                showMatchInfo={searchType === 'semantic'}
              />
            ))}
          </div>

          <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
            <p className="text-gray-800 dark:text-gray-200 mb-3 text-base font-medium">
              Can't find what you're looking for?
            </p>
            <button
              onClick={onCreateRoom}
              className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg hover:shadow-md transition-all duration-200 font-medium text-sm"
            >
              <Plus className="w-5 h-5" />
              Create New Room
            </button>
          </div>
        </div>
      )}

      {!hasResults && showPopular && hasPopular && (
        <div className="animate-fade-in">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Popular Communities
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
            Start exploring with these active communities
          </p>

          <div className="space-y-5">
            {popularRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={onJoinRoom}
              />
            ))}
          </div>
        </div>
      )}

      {!hasResults && !hasPopular && (
        <div className="text-center py-16 animate-fade-in">
          <p className="text-gray-600 dark:text-gray-400 text-xl mb-8 font-medium">
            No rooms found. Be the first to create one!
          </p>
          <button
            onClick={onCreateRoom}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold hover:scale-105 transform"
          >
            <Plus className="w-5 h-5" />
            Create New Room
          </button>
        </div>
      )}
    </div>
  );
}
