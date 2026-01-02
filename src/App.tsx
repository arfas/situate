import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Welcome } from './components/Onboarding/Welcome';
import { AuthForm } from './components/Auth/AuthForm';
import { SearchBar } from './components/Search/SearchBar';
import { SearchResults } from './components/Search/SearchResults';
import { RoomView } from './components/Room/RoomView';
import { AnonymitySelector } from './components/Onboarding/AnonymitySelector';
import { searchRooms, createRoom, joinRoom, getRoomMembership, type Room, type SearchResponse } from './services/api';
import { trackSearchQuery, trackRoomCreated, trackRoomJoined, trackSessionStart, trackPageView } from './lib/analytics';
import { Loader2, Plus, LogOut } from 'lucide-react';

type View = 'welcome' | 'auth' | 'search' | 'room';

function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<View>('welcome');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAnonymitySelector, setShowAnonymitySelector] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ title: '', description: '', category: '' });
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        trackSessionStart();
        if (view === 'welcome' || view === 'auth') {
          setView('search');
          trackPageView('search');
        }
      } else if (view === 'search' || view === 'room') {
        // Only reset to welcome if user was logged in and is now logged out
        // Don't reset if they're just navigating from welcome to auth
        setView('welcome');
        setSearchResults(null);
        setSelectedRoom(null);
        setShowAnonymitySelector(false);
        setShowCreateRoom(false);
      }
    }
  }, [authLoading, user]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    try {
      const results = await searchRooms(query);
      setSearchResults(results);
      
      // Track search query
      trackSearchQuery(query, results.results.length);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback: show empty results with option to create room
      setSearchResults({
        results: [],
        popularRooms: [],
        searchType: 'keyword',
        message: 'Search is currently unavailable. Create a new room instead!'
      });
      trackSearchQuery(query, 0);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleJoinRoom = async (room: Room) => {
    const membership = await getRoomMembership(room.id);

    if (membership) {
      setSelectedRoom(room);
      setView('room');
    } else {
      setSelectedRoom(room);
      setShowAnonymitySelector(true);
    }
  };

  const handleAnonymitySelected = async (level: any, displayName: string) => {
    if (!selectedRoom) return;

    try {
      console.log('Joining room:', selectedRoom.id, 'with display name:', displayName);
      const result = await joinRoom(selectedRoom.id, displayName, level);
      console.log('Join result:', result);
      
      // Track room join event
      trackRoomJoined(selectedRoom.id, level !== 'identified');
      
      setShowAnonymitySelector(false);
      setView('room');
      trackPageView('room');
    } catch (error) {
      console.error('Failed to join room:', error);
      alert(`Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomData.title.trim()) {
      alert('Please enter a room title');
      return;
    }

    setCreatingRoom(true);
    try {
      const room = await createRoom(newRoomData.title, newRoomData.description, newRoomData.category) as Room;
      
      // Track room creation
      trackRoomCreated(room.id, newRoomData.category, true);
      
      setShowCreateRoom(false);
      setNewRoomData({ title: '', description: '', category: '' });
      await handleJoinRoom(room);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setCreatingRoom(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (view === 'welcome') {
    return (
      <Welcome
        onGetStarted={() => {
          setAuthMode('signup');
          setView('auth');
        }}
        onSignIn={() => {
          setAuthMode('signin');
          setView('auth');
        }}
      />
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <AuthForm
          mode={authMode}
          onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
          onSuccess={() => setView('search')}
        />
      </div>
    );
  }

  if (view === 'room' && selectedRoom) {
    return (
      <RoomView
        room={selectedRoom}
        onBack={() => {
          setSelectedRoom(null);
          setView('search');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            SupportCircle
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Room
            </button>
            <span className="text-sm text-gray-600">
              {profile?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What situation are you in?
          </h2>
          <p className="text-gray-600 mb-8">
            Describe your situation and we'll find the perfect community for you
          </p>
          <div className="flex justify-center">
            <SearchBar onSearch={handleSearch} loading={searchLoading} />
          </div>
        </div>

        {searchResults && (
          <SearchResults
            results={searchResults.results}
            popularRooms={searchResults.popularRooms}
            searchType={searchResults.searchType}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={() => setShowCreateRoom(true)}
          />
        )}

        {!searchResults && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              Start typing to search for communities
            </p>
          </div>
        )}
      </div>

      {showAnonymitySelector && selectedRoom && (
        <AnonymitySelector
          onSelect={handleAnonymitySelected}
          onCancel={() => {
            setShowAnonymitySelector(false);
            setSelectedRoom(null);
          }}
          defaultPseudonym={profile?.persistent_pseudonym}
        />
      )}

      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Room
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Title *
                </label>
                <input
                  type="text"
                  value={newRoomData.title}
                  onChange={(e) => setNewRoomData({ ...newRoomData, title: e.target.value })}
                  placeholder="e.g., Tech Layoffs 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoomData.description}
                  onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                  placeholder="Describe what this room is about..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={newRoomData.category}
                  onChange={(e) => setNewRoomData({ ...newRoomData, category: e.target.value })}
                  placeholder="e.g., Career, Health, Relationships"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateRoom(false);
                  setNewRoomData({ title: '', description: '', category: '' });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creatingRoom || !newRoomData.title.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingRoom ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
