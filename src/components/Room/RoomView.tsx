import { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, Clock, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('helpful');
  const [joinedAt] = useState(Date.now()); // Track when user joined room

  useEffect(() => {
    // Track room view
    trackRoomViewed(room.id);
    loadMessages();

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log('Real-time event received:', payload);
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

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

  async function handlePostMessage(content: string) {
    const timeToFirstMessage = messages.length === 0 ? (Date.now() - joinedAt) / 1000 : 0;
    
    await postMessage(room.id, content, replyingTo);
    
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to search
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.title}</h1>

          {room.description && (
            <p className="text-gray-600 mb-4">{room.description}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{room.member_count.toLocaleString()} members</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>{room.message_count.toLocaleString()} messages</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <button
              onClick={() => setSortBy('helpful')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'helpful'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Helpful
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'recent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Recent
            </button>
            <button
              onClick={() => setSortBy('oldest')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                sortBy === 'oldest'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Oldest
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <MessageComposer
            onSubmit={handlePostMessage}
            parentMessageId={replyingTo}
            onCancel={() => setReplyingTo(null)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No messages yet</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 divide-y divide-gray-100">
            {sortedMessages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onReply={setReplyingTo}
                onVote={handleVote}
                onReport={handleReport}
                isOwnMessage={message.user_id === user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
