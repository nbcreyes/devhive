import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

function MessageInput({ channelId, socket, placeholder = 'Send a message...' }) {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef(null);

  function handleSend() {
    if (!content.trim() || !socket) return;
    socket.emit('message:send', { channelId, content: content.trim() });
    setContent('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(e) {
    setContent(e.target.value);
    if (!socket) return;
    socket.emit('typing:start', { channelId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { channelId });
    }, 2000);
  }

  return (
    <div className="px-4 py-3 border-t border-border">
      <div className={cn(
        'flex items-center gap-2 bg-secondary rounded-lg px-4 py-2.5 border border-border transition-all duration-200 focus-within:border-primary/50 focus-within:bg-secondary/80'
      )}>
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className={cn(
            'p-1.5 rounded-md transition-all duration-150',
            content.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
              : 'text-muted-foreground cursor-not-allowed'
          )}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default MessageInput;