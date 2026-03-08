import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Volume2, Code, Users, ArrowRight } from 'lucide-react';
import useServerStore from '@/stores/serverStore';
import useSocketStore from '@/stores/socketStore';

function ChannelButton({ channel, serverId, navigate }) {
  const icons = {
    voice: <Volume2 className="w-4 h-4 text-muted-foreground" />,
    code: <Code className="w-4 h-4 text-muted-foreground" />,
    text: <Hash className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <button
      onClick={() => navigate(`/app/servers/${serverId}/channels/${channel._id}`)}
      className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-secondary transition-all duration-150 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          {icons[channel.type]}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">{channel.name}</p>
          {channel.topic && (
            <p className="text-xs text-muted-foreground truncate max-w-32">{channel.topic}</p>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function ServerPage() {
  const { serverId } = useParams();
  const { currentServer, channels, members, setCurrentServer } = useServerStore();
  const { socket } = useSocketStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (serverId) setCurrentServer(serverId);
  }, [serverId, setCurrentServer]);

  useEffect(() => {
    if (socket && serverId) {
      socket.emit('server:join', serverId);
    }
    return () => {
      if (socket && serverId) socket.emit('server:leave', serverId);
    };
  }, [socket, serverId]);

  if (!currentServer) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading server...</p>
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');
  const codeChannels = channels.filter((c) => c.type === 'code');

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-in-fast">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary mono">
                {currentServer.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{currentServer.name}</h1>
              {currentServer.description && (
                <p className="text-sm text-muted-foreground">{currentServer.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {members.length} member{members.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Hash className="w-3.5 h-3.5" />
              {channels.length} channel{channels.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {textChannels.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Text Channels
            </p>
            <div className="space-y-1.5">
              {textChannels.map((channel) => (
                <ChannelButton key={channel._id} channel={channel} serverId={serverId} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {voiceChannels.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Voice Channels
            </p>
            <div className="space-y-1.5">
              {voiceChannels.map((channel) => (
                <ChannelButton key={channel._id} channel={channel} serverId={serverId} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {codeChannels.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Code Channels
            </p>
            <div className="space-y-1.5">
              {codeChannels.map((channel) => (
                <ChannelButton key={channel._id} channel={channel} serverId={serverId} navigate={navigate} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServerPage;