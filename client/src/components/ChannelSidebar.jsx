import { useNavigate, useParams } from 'react-router-dom';
import { Hash, Volume2, Code, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import useServerStore from '@/stores/serverStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

function ChannelIcon({ type }) {
  if (type === 'voice') return <Volume2 className="w-3.5 h-3.5" />;
  if (type === 'code') return <Code className="w-3.5 h-3.5" />;
  return <Hash className="w-3.5 h-3.5" />;
}

function ChannelSidebar() {
  const { currentServer, channels, currentChannel, setCurrentChannel } = useServerStore();
  const navigate = useNavigate();
  const { serverId } = useParams();

  if (!currentServer) return null;

  function handleChannelClick(channel) {
    setCurrentChannel(channel);
    navigate(`/app/servers/${serverId}/channels/${channel._id}`);
  }

  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');
  const codeChannels = channels.filter((c) => c.type === 'code');

  return (
    <div className="w-56 bg-card flex flex-col border-r border-border">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <h2 className="font-semibold text-sm truncate">{currentServer.name}</h2>
        </div>
        <button
          onClick={() => navigate(`/app/servers/${serverId}/settings`)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {textChannels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                Text
              </p>
              <div className="space-y-0.5">
                {textChannels.map((channel) => (
                  <button
                    key={channel._id}
                    onClick={() => handleChannelClick(channel)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all duration-150',
                      currentChannel?._id === channel._id
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <ChannelIcon type={channel.type} />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {voiceChannels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                Voice
              </p>
              <div className="space-y-0.5">
                {voiceChannels.map((channel) => (
                  <button
                    key={channel._id}
                    onClick={() => handleChannelClick(channel)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all duration-150',
                      currentChannel?._id === channel._id
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <ChannelIcon type={channel.type} />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {codeChannels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                Code
              </p>
              <div className="space-y-0.5">
                {codeChannels.map((channel) => (
                  <button
                    key={channel._id}
                    onClick={() => handleChannelClick(channel)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-all duration-150',
                      currentChannel?._id === channel._id
                        ? 'bg-primary/15 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <ChannelIcon type={channel.type} />
                    <span className="truncate">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border">
        <button
          onClick={() => navigate(`/app/servers/${serverId}/kanban`)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Kanban Board</span>
        </button>
      </div>
    </div>
  );
}

export default ChannelSidebar;