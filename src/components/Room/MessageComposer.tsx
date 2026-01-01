import { useState } from 'react';
import { Send, X } from 'lucide-react';

interface MessageComposerProps {
  onSubmit: (content: string) => Promise<void>;
  parentMessageId?: string | null;
  onCancel?: () => void;
  placeholder?: string;
}

export function MessageComposer({
  onSubmit,
  parentMessageId,
  onCancel,
  placeholder = "Share your thoughts...",
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const maxLength = 2000;
  const remaining = maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      onCancel?.();
    } catch (error) {
      console.error('Failed to post message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
      {parentMessageId && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200">
          <span className="text-sm text-blue-700">Replying to message</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-blue-700 hover:text-blue-900"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        maxLength={maxLength}
        className="w-full px-4 py-3 resize-none focus:outline-none"
      />

      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
        <span
          className={`text-sm ${
            remaining < 100 ? 'text-orange-600 font-medium' : 'text-gray-500'
          }`}
        >
          {remaining} characters remaining
        </span>

        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? (
            'Posting...'
          ) : (
            <>
              <Send className="w-4 h-4" />
              Post
            </>
          )}
        </button>
      </div>
    </form>
  );
}
