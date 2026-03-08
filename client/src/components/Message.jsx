import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function Message({ message, onEdit, onDelete, onThreadClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-1 hover:bg-muted/50 group relative',
        message.isDeleted && 'opacity-50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Avatar className="w-8 h-8 mt-0.5 shrink-0">
        <AvatarImage src={message.author?.avatar} />
        <AvatarFallback className="text-xs">
          {message.author?.username?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">
            {message.author?.displayName || message.author?.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), 'MMM d, h:mm a')}
          </span>
          {message.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {message.isCode ? (
          <pre className="mt-1 p-3 bg-muted rounded text-sm overflow-x-auto">
            <code>{message.content}</code>
          </pre>
        ) : (
          <p className="text-sm break-words">{message.content}</p>
        )}

        {message.threadCount > 0 && (
          <button
            onClick={() => onThreadClick(message)}
            className="mt-1 text-xs text-blue-500 hover:underline flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            {message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {isHovered && !message.isDeleted && (
        <div className="absolute right-4 top-1 flex items-center gap-1 bg-background border rounded shadow-sm p-1">
          <button
            onClick={() => onThreadClick(message)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(message)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(message)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Message;