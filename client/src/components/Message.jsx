import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Pencil, Trash2, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function formatTime(date) {
  const d = new Date(date);
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

function Message({ message, isGrouped, onEdit, onDelete, onThreadClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'flex gap-3 px-4 group relative transition-colors duration-100 rounded-sm',
        isGrouped ? 'py-0.5 mt-0' : 'py-2 mt-1',
        isHovered && 'bg-white/[0.02]',
        message.isDeleted && 'opacity-40'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isGrouped ? (
        <div className="w-8 shrink-0 flex items-center justify-center">
          {isHovered && (
            <span className="text-xs text-muted-foreground/50 mono">
              {format(new Date(message.createdAt), 'h:mm')}
            </span>
          )}
        </div>
      ) : (
        <Avatar className="w-8 h-8 mt-0.5 shrink-0">
          <AvatarImage src={message.author?.avatar} />
          <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
            {message.author?.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm">
              {message.author?.displayName || message.author?.username}
            </span>
            <span className="text-xs text-muted-foreground mono">
              {formatTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="text-xs text-muted-foreground/60 italic">(edited)</span>
            )}
          </div>
        )}

        {message.isCode ? (
          <pre className="mt-1 p-3 bg-zinc-900 border border-border rounded-lg text-xs overflow-x-auto mono text-green-400 leading-relaxed">
            <code>{message.content}</code>
          </pre>
        ) : (
          <p className={cn(
            'text-sm leading-relaxed break-words',
            message.isDeleted && 'italic text-muted-foreground'
          )}>
            {message.content}
          </p>
        )}

        {message.threadCount > 0 && (
          <button
            onClick={() => onThreadClick(message)}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors font-medium bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded-md"
          >
            <MessageSquare className="w-3 h-3" />
            {message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {isHovered && !message.isDeleted && (
        <div className="absolute right-4 top-1 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-xl p-1 animate-in-fast z-10">
          <button
            onClick={() => onThreadClick(message)}
            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Reply in thread"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(message)}
            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Edit message"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(message)}
            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-destructive transition-colors"
            title="Delete message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Message;