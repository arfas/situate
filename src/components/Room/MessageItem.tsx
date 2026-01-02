import { useState } from 'react';
import { ArrowUp, ArrowDown, MessageCircle, MoreVertical, Flag, Edit2, Trash2 } from 'lucide-react';
import type { Message } from '../../services/messages';

interface MessageItemProps {
  message: Message;
  onReply: (messageId: string) => void;
  onVote: (messageId: string, voteType: 'up' | 'down') => void;
  onReport: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  depth?: number;
  isOwnMessage?: boolean;
}

export function MessageItem({
  message,
  onReply,
  onVote,
  onReport,
  onEdit,
  onDelete,
  depth = 0,
  isOwnMessage = false,
}: MessageItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const score = message.upvotes - message.downvotes;
  const hasReplies = message.replies && message.replies.length > 0;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={`group animate-fade-in ${depth > 0 ? 'ml-12 mt-3' : ''}`}
      style={{ maxWidth: depth > 3 ? '100%' : undefined }}
    >
      <div className={`flex gap-3 ${message.is_pinned ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-2xl border border-yellow-300/50 dark:border-yellow-700/50 shadow-md' : ''}`}>
        {/* Vote buttons with modern styling */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={() => onVote(message.id, 'up')}
            className={`p-2 rounded-xl hover:scale-110 transition-all duration-200 ${
              message.user_vote === 'up' 
                ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg' 
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-orange-400 hover:to-pink-500 hover:text-white shadow-md'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <span
            className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
              score > 0 
                ? 'bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/50 dark:to-pink-900/50 text-orange-600 dark:text-orange-400' 
                : score < 0 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => onVote(message.id, 'down')}
            className={`p-2 rounded-xl hover:scale-110 transition-all duration-200 ${
              message.user_vote === 'down' 
                ? 'bg-blue-500 text-white shadow-lg' 
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white shadow-md'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Message content bubble */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => hasReplies && setCollapsed(!collapsed)}
                className="font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
              >
                {message.author_display_name}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {formatTimeAgo(message.created_at)}
              </span>
              {message.is_pinned && (
                <span className="text-xs bg-gray-700 dark:bg-gray-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  📌 Pinned
                </span>
              )}
              {message.updated_at !== message.created_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400 italic">(edited)</span>
              )}
            </div>

          {!collapsed && (
            <>
              <div className="text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap break-words leading-relaxed text-sm">
                {message.content}
              </div>

              <div className="flex items-center gap-3 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => onReply(message.id)}
                  className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MessageCircle className="w-3 h-3" />
                  Reply
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute left-0 top-8 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 py-2 min-w-[160px] animate-fade-in">
                        {isOwnMessage && onEdit && (
                          <button
                            onClick={() => {
                              onEdit(message.id);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors text-gray-700 dark:text-gray-300 font-medium"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        {isOwnMessage && onDelete && (
                          <button
                            onClick={() => {
                              onDelete(message.id);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400 font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onReport(message.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-gray-700 dark:text-gray-300 font-medium"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          </div>

          {collapsed && hasReplies && (
            <button 
              onClick={() => setCollapsed(false)}
              className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium px-3 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all duration-200"
            >
              💬 {message.replies!.length} {message.replies!.length === 1 ? 'reply' : 'replies'} hidden - click to show
            </button>
          )}

          {!collapsed && hasReplies && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
              {message.replies!.map((reply) => (
                <MessageItem
                  key={reply.id}
                  message={reply}
                  onReply={onReply}
                  onVote={onVote}
                  onReport={onReport}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                  isOwnMessage={isOwnMessage}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
