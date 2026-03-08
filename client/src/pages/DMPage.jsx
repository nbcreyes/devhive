import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import useSocketStore from '@/stores/socketStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

function DMPage() {
  const { userId } = useParams();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await api.get('/dm/conversations');
        setConversations(res.data.conversations);
      } catch (err) {
        console.error('[DMPage] failed to load conversations:', err.message);
      }
    }
    loadConversations();
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function loadMessages() {
      try {
        const [messagesRes, userRes] = await Promise.all([
          api.get(`/dm/${userId}`),
          api.get(`/users/${userId}`),
        ]);
        setMessages(messagesRes.data.messages);
        setOtherUser(userRes.data.user);
      } catch (err) {
        console.error('[DMPage] failed to load DMs:', err.message);
      }
    }

    loadMessages();

    if (socket) {
      socket.emit('dm:join', userId);

      socket.on('dm:new', ({ message }) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on('dm:updated', ({ message }) => {
        setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
      });

      socket.on('dm:deleted', ({ messageId }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, isDeleted: true, content: 'This message was deleted' }
              : m
          )
        );
      });

      return () => {
        socket.emit('dm:leave', userId);
        socket.off('dm:new');
        socket.off('dm:updated');
        socket.off('dm:deleted');
      };
    }
  }, [userId, socket]);

  function handleSend() {
    if (!content.trim() || !socket || !userId) return;

    socket.emit('dm:send', {
      recipientId: userId,
      content: content.trim(),
    });

    setContent('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-56 border-r flex flex-col">
        <div className="p-3 border-b">
          <h2 className="font-semibold text-sm">Direct Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.user._id}
                onClick={() => navigate(`/app/dms/${conv.user._id}`)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors',
                  userId === conv.user._id && 'bg-muted'
                )}
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={conv.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {conv.user.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {conv.user.displayName || conv.user.username}
                </span>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {userId && otherUser ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="h-12 border-b flex items-center px-4 gap-2 shrink-0">
            <Avatar className="w-6 h-6">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback className="text-xs">
                {otherUser.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">
              {otherUser.displayName || otherUser.username}
            </span>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={cn(
                    'flex gap-2',
                    message.sender?._id === user?.id && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={message.sender?.avatar} />
                    <AvatarFallback className="text-xs">
                      {message.sender?.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-xs px-3 py-2 rounded-lg text-sm',
                      message.sender?._id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p>{message.content}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        message.sender?._id === user?.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {format(new Date(message.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder={`Message ${otherUser.displayName || otherUser.username}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon" disabled={!content.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Select a conversation to start messaging
          </p>
        </div>
      )}
    </div>
  );
}

export default DMPage;