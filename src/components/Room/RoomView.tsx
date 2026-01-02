import { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../contexts/EncryptionContext';
import { getMessages, postMessage, voteOnMessage, reportMessage, type Message } from '../../services/messages';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';
import { supabase } from '../../lib/supabase';
import { trackMessageSent, trackMessageUpvoted, trackMessageReported, trackFirstMessageTime, trackRoomViewed } from '../../lib/analytics';
import type { Room } from '../../services/api';

interface RoomViewProps {
  room: Room;
  onBack: () => void;
}

type SortOption = 'helpful' | 'recent' | 'oldest';

export function RoomView({ room, onBack }: RoomViewProps) {
  const { user } = useAuth();
  const { decryptMessage, isReady: encryptionReady } = useEncryption();
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('helpful');
  const [joinedAt] = useState(Date.now()); // Track when user joined room

  useEffect(() => {
    // Track room view
    trackRoomViewed(room.id);
    loadMessages();

    // Set up polling as a fallback (every 5 seconds)
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 5000);

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log('Real-time INSERT event received:', payload);
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log('Real-time UPDATE event received:', payload);
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to room:', room.id);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error, attempting to reconnect...');
          // Retry subscription after a delay
          setTimeout(() => {
            loadMessages();
          }, 1000);
        }
      });

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  // Decrypt messages when they change
  useEffect(() => {
    if (encryptionReady && messages.length > 0) {
      decryptAllMessages();
    }
  }, [messages, encryptionReady]);

  async function decryptAllMessages() {
    const newDecrypted = new Map<string, string>();
    
    for (const message of messages) {
      if (message.is_encrypted && !decryptedMessages.has(message.id)) {
        try {
          const decrypted = await decryptMessage(message.content, room.id);
          newDecrypted.set(message.id, decrypted);
        } catch (error) {
          console.error('Failed to decrypt message:', message.id, error);
          newDecrypted.set(message.id, '[Unable to decrypt]');
        }
      }
    }
    
    if (newDecrypted.size > 0) {
      setDecryptedMessages(new Map([...decryptedMessages, ...newDecrypted]));
    }
  }

  async function loadMessages() {
    try {
      console.log('Loading messages for room:', room.id);
      const data = await getMessages(room.id);
      console.log('Loaded messages:', data);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostMessage(content: string, isEncrypted: boolean) {
    const timeToFirstMessage = messages.length === 0 ? (Date.now() - joinedAt) / 1000 : 0;
    
    await postMessage(room.id, content, replyingTo, isEncrypted);
    
    // Track message sent
    trackMessageSent(room.id, content.length, true); // Assuming anonymous for now
    
    // Track time to first message if this is the first message
    if (timeToFirstMessage > 0) {
      trackFirstMessageTime(room.id, timeToFirstMessage);
    }
    
    setReplyingTo(null);
    await loadMessages(); // Reload messages after posting
  }

  async function handleVote(messageId: string, voteType: 'up' | 'down') {
    try {
      await voteOnMessage(messageId, voteType);
      
      // Track upvote event
      if (voteType === 'up') {
        trackMessageUpvoted(messageId, room.id);
      }
      
      await loadMessages();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  }

  async function handleReport(messageId: string) {
    const reason = prompt('Reason for report:\n1. spam\n2. harassment\n3. misinformation\n4. self_harm\n5. other');
    if (!reason) return;

    const reasonMap: Record<string, any> = {
      '1': 'spam',
      '2': 'harassment',
      '3': 'misinformation',
      '4': 'self_harm',
      '5': 'other',
    };

    const details = prompt('Additional details (optional):');

    try {
      const reportReason = reasonMap[reason] || 'other';
      await reportMessage(messageId, reportReason, details || undefined);
      
      // Track report event
      trackMessageReported(messageId, room.id, reportReason);
      
      alert('Report submitted. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Failed to report:', error);
      alert('Failed to submit report. Please try again.');
    }
  }

  const sortedMessages = [...messages].sort((a, b) => {
    if (sortBy === 'helpful') {
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      return scoreB - scoreA;
    } else if (sortBy === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors duration-300">
      {/* Modern header with glassmorphism */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-white/30 dark:border-gray-700/30 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-all duration-200 font-semibold hover:-translate-x-1 transform">
            <ArrowLeft className="w-5 h-5" />
            Back to search
          </button>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">{room.title}</h1>
              {room.description && (
                <p className="text-gray-700 dark:text-gray-300 text-sm">{room.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">{room.member_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <MessageCircle className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">{room.message_count.toLocaleString()}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setSortBy('helpful')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all duration-200 font-medium ${
                  sortBy === 'helpful'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Helpful
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all duration-200 font-medium ${
                  sortBy === 'recent'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Clock className="w-3 h-3" />
                Recent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area - scrollable chat container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-xl">
              <MessageCircle className="w-16 h-16 text-purple-300 dark:text-purple-700 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 text-lg font-semibold">No messages yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Be the first to start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMessages.map((message) => {
                // Use decrypted content if available
                const displayMessage = message.is_encrypted && decryptedMessages.has(message.id)
                  ? { ...message, content: decryptedMessages.get(message.id)! }
                  : message;
                
                return (
                  <MessageItem
                    key={message.id}
                    message={displayMessage}
                    onReply={setReplyingTo}
                    onVote={handleVote}
                    onReport={handleReport}
                    isOwnMessage={message.user_id === user?.id}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fixed message composer at bottom */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-white/30 dark:border-gray-700/30 sticky bottom-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <MessageComposer
            roomId={room.id}
            onSubmit={handlePostMessage}
            parentMessageId={replyingTo}
            onCancel={() => setReplyingTo(null)}
          />
        </div>
      </div>
    </div>
  );
}
