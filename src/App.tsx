import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useEncryption } from './contexts/EncryptionContext';
import { Welcome } from './components/Onboarding/Welcome';
import { AuthForm } from './components/Auth/AuthForm';
import { SearchBar } from './components/Search/SearchBar';
import { SearchResults } from './components/Search/SearchResults';
import { RoomView } from './components/Room/RoomView';
import { AnonymitySelector } from './components/Onboarding/AnonymitySelector';
import { SettingsMenu } from './components/Settings/SettingsMenu';
import { EncryptionSetup } from './components/Encryption/EncryptionSetup';
import { searchRooms, createRoom, joinRoom, getRoomMembership, type Room, type SearchResponse } from './services/api';
import { trackSearchQuery, trackRoomCreated, trackRoomJoined, trackSessionStart, trackPageView } from './lib/analytics';
import { Loader2, Plus, LogOut, Settings, Shield } from 'lucide-react';

type View = 'welcome' | 'auth' | 'search' | 'room';

function App() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { isEnabled: encryptionEnabled, isReady: encryptionReady } = useEncryption();
  const [view, setView] = useState<View>('welcome');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showAnonymitySelector, setShowAnonymitySelector] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEncryptionSetup, setShowEncryptionSetup] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10 w-full">
          <AuthForm
            mode={authMode}
            onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            onSuccess={() => setView('search')}
          />
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-12 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SupportCircle
          </h1>
          <div className="flex items-center gap-3">
            {encryptionEnabled && (
              <button
                onClick={() => setShowEncryptionSetup(true)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  encryptionReady
                    ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={encryptionReady ? 'Encryption active' : 'Setup encryption'}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowCreateRoom(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg hover:shadow-md transition-all duration-200 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              {profile?.email}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-12 text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            What situation are you in?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 text-sm">
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
          <div className="text-center py-16 animate-fade-in">
            <p className="text-gray-500 text-lg">
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

      {showSettings && (
        <SettingsMenu onClose={() => setShowSettings(false)} />
      )}

      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-white/30">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Create New Room
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Title *
                </label>
                <input
                  type="text"
                  value={newRoomData.title}
                  onChange={(e) => setNewRoomData({ ...newRoomData, title: e.target.value })}
                  placeholder="e.g., Tech Layoffs 2025"
                  className="w-full px-5 py-4 bg-white/70 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 focus:outline-none transition-all duration-300 text-base"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoomData.description}
                  onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                  placeholder="Describe what this room is about..."
                  rows={4}
                  className="w-full px-5 py-4 bg-white/70 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 focus:outline-none transition-all duration-300 text-base resize-none"
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={newRoomData.category}
                  onChange={(e) => setNewRoomData({ ...newRoomData, category: e.target.value })}
                  placeholder="e.g., Career, Health, Relationships"
                  className="w-full px-5 py-4 bg-white/70 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 focus:outline-none transition-all duration-300 text-base"
                  maxLength={50}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowCreateRoom(false);
                  setNewRoomData({ title: '', description: '', category: '' });
                }}
                className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creatingRoom || !newRoomData.title.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
              >
                {creatingRoom ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEncryptionSetup && (
        <EncryptionSetup onComplete={() => setShowEncryptionSetup(false)} />
      )}
    </div>
  );
}

export default App;
