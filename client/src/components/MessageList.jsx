import { useEffect, useRef, useState } from 'react';
import { Loader2, Hash } from 'lucide-react';
import Message from '@/components/Message';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

function MessageList({ channelId, socket, onThreadClick }) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!channelId) return;
    setMessages([]);
    setIsLoading(true);
    loadMessages();
  }, [channelId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('message:new', ({ message }) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    socket.on('message:updated', ({ message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    });

    socket.on('message:deleted', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        )
      );
    });

    socket.on('message:threadCountUpdated', ({ messageId, threadCount }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, threadCount } : m))
      );
    });

    return () => {
      socket.off('message:new');
      socket.off('message:updated');
      socket.off('message:deleted');
      socket.off('message:threadCountUpdated');
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [isLoading]);

  async function loadMessages(cursor = null) {
    try {
      const params = cursor ? `?cursor=${cursor}` : '';
      const res = await api.get(`/channels/${channelId}/messages${params}`);
      if (cursor) {
        setMessages((prev) => [...res.data.messages, ...prev]);
      } else {
        setMessages(res.data.messages);
      }
      setHasMore(res.data.hasMore);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      console.error('[MessageList] failed to load messages:', err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  async function loadMore() {
    setIsLoadingMore(true);
    await loadMessages(nextCursor);
  }

  function handleEdit(message) {
    const content = prompt('Edit message:', message.content);
    if (content && content !== message.content) {
      socket?.emit('message:edit', { messageId: message._id, content });
    }
  }

  function handleDelete(message) {
    if (confirm('Delete this message?')) {
      socket?.emit('message:delete', { messageId: message._id });
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {hasMore && (
        <div className="flex justify-center py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {isLoadingMore ? (
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
            ) : null}
            Load older messages
          </Button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to say something!</p>
          </div>
        </div>
      )}

      <div className="py-2">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const isGrouped =
            prevMessage &&
            prevMessage.author?._id === message.author?._id &&
            new Date(message.createdAt) - new Date(prevMessage.createdAt) < 5 * 60 * 1000;

          return (
            <Message
              key={message._id}
              message={message}
              isGrouped={isGrouped}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onThreadClick={onThreadClick}
            />
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;