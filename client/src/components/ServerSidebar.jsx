import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, MessageSquare, Home } from 'lucide-react';
import useServerStore from '@/stores/serverStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreateServerModal from '@/components/CreateServerModal';
import { cn } from '@/lib/utils';

function ServerIcon({ server, isActive, onClick }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          onClick={onClick}
          className={cn(
            'relative w-10 h-10 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group',
            isActive
              ? 'rounded-lg ring-2 ring-primary glow-sm scale-105'
              : 'hover:rounded-lg hover:scale-105'
          )}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={server.icon} />
            <AvatarFallback className={cn(
              'text-xs font-semibold transition-colors',
              isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
            )}>
              {server.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-1 h-6 bg-primary rounded-r" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">{server.name}</TooltipContent>
    </Tooltip>
  );
}

function ActionIcon({ icon: Icon, tooltip, onClick, variant = 'default' }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          onClick={onClick}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:rounded-lg hover:scale-105',
            variant === 'add' && 'bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground',
            variant === 'default' && 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary',
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function ServerSidebar() {
  const { servers, fetchServers, setCurrentServer } = useServerStore();
  const navigate = useNavigate();
  const { serverId } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  function handleServerClick(server) {
    setCurrentServer(server._id);
    navigate(`/app/servers/${server._id}`);
  }

  return (
    <div className="w-16 bg-card flex flex-col items-center py-3 gap-2 border-r border-border">
      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={() => navigate('/app')}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center cursor-pointer hover:rounded-lg hover:scale-105 transition-all duration-200 glow-sm"
          >
            <span className="text-primary-foreground font-bold text-xs mono">DH</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">Home</TooltipContent>
      </Tooltip>

      <div className="w-8 h-px bg-border my-1" />

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto w-full items-center py-1">
        {servers.map((server) => (
          <ServerIcon
            key={server._id}
            server={server}
            isActive={serverId === server._id}
            onClick={() => handleServerClick(server)}
          />
        ))}
      </div>

      <div className="w-8 h-px bg-border my-1" />

      <ActionIcon
        icon={Plus}
        tooltip="Create Server"
        onClick={() => setShowCreateModal(true)}
        variant="add"
      />
      <ActionIcon
        icon={MessageSquare}
        tooltip="Direct Messages"
        onClick={() => navigate('/app/dms')}
      />

      {showCreateModal && (
        <CreateServerModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

export default ServerSidebar;