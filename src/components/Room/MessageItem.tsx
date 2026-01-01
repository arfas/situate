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
      className={`group ${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}
      style={{ maxWidth: depth > 3 ? '100%' : undefined }}
    >
      <div className={`flex gap-3 ${message.is_pinned ? 'bg-yellow-50 p-4 rounded-lg border border-yellow-200' : ''}`}>
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={() => onVote(message.id, 'up')}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              message.user_vote === 'up' ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <span
            className={`text-sm font-medium ${
              score > 0 ? 'text-orange-500' : score < 0 ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => onVote(message.id, 'down')}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              message.user_vote === 'down' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => hasReplies && setCollapsed(!collapsed)}
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {message.author_display_name}
            </button>
            <span className="text-sm text-gray-500">
              {formatTimeAgo(message.created_at)}
            </span>
            {message.is_pinned && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                Pinned
              </span>
            )}
            {message.updated_at !== message.created_at && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </div>

          {!collapsed && (
            <>
              <div className="text-gray-800 mb-3 whitespace-pre-wrap break-words">
                {message.content}
              </div>

              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => onReply(message.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Reply
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute left-0 top-6 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px]">
                        {isOwnMessage && onEdit && (
                          <button
                            onClick={() => {
                              onEdit(message.id);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
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
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 text-red-600"
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
                          className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
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

          {collapsed && hasReplies && (
            <p className="text-sm text-gray-500">
              [{message.replies!.length} {message.replies!.length === 1 ? 'reply' : 'replies'} hidden]
            </p>
          )}

          {!collapsed && hasReplies && (
            <div className="mt-3 space-y-2">
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
