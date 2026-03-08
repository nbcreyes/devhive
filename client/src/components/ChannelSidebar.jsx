import { useNavigate, useParams } from 'react-router-dom';
import { Hash, Volume2, Code, Plus, Settings, Kanban } from 'lucide-react';
import useServerStore from '@/stores/serverStore';
import useAuthStore from '@/stores/authStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function ChannelIcon({ type }) {
  if (type === 'voice') return <Volume2 className="w-4 h-4" />;
  if (type === 'code') return <Code className="w-4 h-4" />;
  return <Hash className="w-4 h-4" />;
}

function ChannelSidebar() {
  const { currentServer, channels, currentChannel, setCurrentChannel } = useServerStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { serverId } = useParams();

  if (!currentServer) return null;

  function handleChannelClick(channel) {
    setCurrentChannel(channel);
    navigate(`/app/servers/${serverId}/channels/${channel._id}`);
  }

  return (
    <div className="w-56 bg-muted/30 flex flex-col border-r">
      <div className="p-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm truncate">{currentServer.name}</h2>
        <button
          onClick={() => navigate(`/app/servers/${serverId}/settings`)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Channels
            </span>
          </div>

          {channels.map((channel) => (
            <button
              key={channel._id}
              onClick={() => handleChannelClick(channel)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
                currentChannel?._id === channel._id && 'bg-muted text-foreground'
              )}
            >
              <ChannelIcon type={channel.type} />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-2">
        <button
          onClick={() => navigate(`/app/servers/${serverId}/kanban`)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Kanban className="w-4 h-4" />
          <span>Kanban Board</span>
        </button>
      </div>
    </div>
  );
}

export default ChannelSidebar;