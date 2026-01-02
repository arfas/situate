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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 focus-within:border-slate-500 focus-within:shadow-md transition-all duration-200">
      {parentMessageId && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">💬 Replying to message</span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={maxLength}
        className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
      />

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-300 dark:border-gray-700">
        <span
          className={`text-xs font-medium ${
            remaining < 100 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {remaining}
        </span>

        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Sending...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send
            </>
          )}
        </button>
      </div>
    </form>
  );
}
