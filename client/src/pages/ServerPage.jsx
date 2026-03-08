import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Volume2, Code } from 'lucide-react';
import useServerStore from '@/stores/serverStore';
import useSocketStore from '@/stores/socketStore';

function ServerPage() {
  const { serverId } = useParams();
  const { currentServer, channels, setCurrentServer } = useServerStore();
  const { socket } = useSocketStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (serverId) {
      setCurrentServer(serverId);
    }
  }, [serverId, setCurrentServer]);

  useEffect(() => {
    if (socket && serverId) {
      socket.emit('server:join', serverId);
    }
    return () => {
      if (socket && serverId) {
        socket.emit('server:leave', serverId);
      }
    };
  }, [socket, serverId]);

  if (!currentServer) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading server...</p>
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');
  const codeChannels = channels.filter((c) => c.type === 'code');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{currentServer.name}</h1>
          {currentServer.description && (
            <p className="text-muted-foreground">{currentServer.description}</p>
          )}
        </div>

        <div className="text-left space-y-4">
          {textChannels.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Text Channels
              </p>
              {textChannels.map((channel) => (
                <button
                  key={channel._id}
                  onClick={() =>
                    navigate(`/app/servers/${serverId}/channels/${channel._id}`)
                  }
                  className="w-full flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted transition-colors text-sm"
                >
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span>{channel.name}</span>
                </button>
              ))}
            </div>
          )}

          {voiceChannels.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Voice Channels
              </p>
              {voiceChannels.map((channel) => (
                <button
                  key={channel._id}
                  onClick={() =>
                    navigate(`/app/servers/${serverId}/channels/${channel._id}`)
                  }
                  className="w-full flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted transition-colors text-sm"
                >
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <span>{channel.name}</span>
                </button>
              ))}
            </div>
          )}

          {codeChannels.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Code Channels
              </p>
              {codeChannels.map((channel) => (
                <button
                  key={channel._id}
                  onClick={() =>
                    navigate(`/app/servers/${serverId}/channels/${channel._id}`)
                  }
                  className="w-full flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted transition-colors text-sm"
                >
                  <Code className="w-4 h-4 text-muted-foreground" />
                  <span>{channel.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServerPage;