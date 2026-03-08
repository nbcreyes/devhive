import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto py-2">
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Load more messages'
            )}
          </Button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">
            No messages yet. Say hello!
          </p>
        </div>
      )}

      {messages.map((message) => (
        <Message
          key={message._id}
          message={message}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onThreadClick={onThreadClick}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;