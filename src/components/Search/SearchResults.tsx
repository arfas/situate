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
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchType === 'semantic' ? 'Best Matches' : 'Search Results'}
            </h2>
            {searchType === 'semantic' && (
              <Sparkles className="w-5 h-5 text-blue-500" />
            )}
          </div>

          <div className="space-y-4">
            {results.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={onJoinRoom}
                showMatchInfo={searchType === 'semantic'}
              />
            ))}
          </div>

          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <p className="text-gray-700 mb-3">
              Can't find what you're looking for?
            </p>
            <button
              onClick={onCreateRoom}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New Room
            </button>
          </div>
        </div>
      )}

      {!hasResults && showPopular && hasPopular && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Popular Communities
          </h2>
          <p className="text-gray-600 mb-6">
            Start exploring with these active communities
          </p>

          <div className="space-y-4">
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
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-6">
            No rooms found. Be the first to create one!
          </p>
          <button
            onClick={onCreateRoom}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create New Room
          </button>
        </div>
      )}
    </div>
  );
}
