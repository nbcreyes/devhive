import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Send, MessageSquare, Search } from 'lucide-react';
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
  const bottomRef = useRef(null);

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
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      } catch (err) {
        console.error('[DMPage] failed to load DMs:', err.message);
      }
    }

    loadMessages();

    if (socket) {
      socket.emit('dm:join', userId);

      socket.on('dm:new', ({ message }) => {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
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
    socket.emit('dm:send', { recipientId: userId, content: content.trim() });
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
      {/* Conversations sidebar */}
      <div className="w-60 border-r border-border flex flex-col bg-card">
        <div className="p-3 border-b border-border">
          <h2 className="font-semibold text-sm mb-2">Direct Messages</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary/50 transition-colors"
              placeholder="Find a conversation..."
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.user._id}
                onClick={() => navigate(`/app/dms/${conv.user._id}`)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150',
                  userId === conv.user._id
                    ? 'bg-primary/15 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={conv.user.avatar} />
                    <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                      {conv.user.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card bg-green-500" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="truncate font-medium text-xs">
                    {conv.user.displayName || conv.user.username}
                  </p>
                  {conv.lastMessage && (
                    <p className="truncate text-xs text-muted-foreground">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))}

            {conversations.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      {userId && otherUser ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="h-12 border-b border-border flex items-center px-4 gap-3 shrink-0 bg-card">
            <div className="relative">
              <Avatar className="w-7 h-7">
                <AvatarImage src={otherUser.avatar} />
                <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                  {otherUser.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card bg-green-500" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">
                {otherUser.displayName || otherUser.username}
              </p>
              <p className="text-xs text-muted-foreground mono">@{otherUser.username}</p>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={otherUser.avatar} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
                    {otherUser.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-semibold">{otherUser.displayName || otherUser.username}</p>
                  <p className="text-sm text-muted-foreground mt-1">Start a conversation</p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {messages.map((message) => {
                const isMine = message.sender?._id === user?.id;
                return (
                  <div
                    key={message._id}
                    className={cn('flex gap-2 items-end', isMine && 'flex-row-reverse')}
                  >
                    {!isMine && (
                      <Avatar className="w-6 h-6 shrink-0 mb-1">
                        <AvatarImage src={message.sender?.avatar} />
                        <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                          {message.sender?.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn('max-w-xs space-y-1', isMine && 'items-end flex flex-col')}>
                      <div
                        className={cn(
                          'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-card border border-border rounded-bl-sm'
                        )}
                      >
                        {message.content}
                      </div>
                      <span className="text-xs text-muted-foreground px-1">
                        {format(new Date(message.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div ref={bottomRef} />
          </ScrollArea>

          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5 border border-border focus-within:border-primary/50 transition-colors">
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder={`Message ${otherUser.displayName || otherUser.username}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={handleSend}
                disabled={!content.trim()}
                className={cn(
                  'p-1.5 rounded-lg transition-all duration-150',
                  content.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                    : 'text-muted-foreground cursor-not-allowed'
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Your Messages</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select a conversation or start a new one
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DMPage;