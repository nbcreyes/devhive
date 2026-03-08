import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, MessageSquare } from 'lucide-react';
import useServerStore from '@/stores/serverStore';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import CreateServerModal from '@/components/CreateServerModal';
import { cn } from '@/lib/utils';

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
    <div className="w-16 bg-muted/50 flex flex-col items-center py-3 gap-2 border-r">
      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={() => navigate('/app')}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm hover:rounded-xl transition-all cursor-pointer"
          >
            DH
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">Home</TooltipContent>
      </Tooltip>

      <Separator className="w-8" />

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto w-full items-center">
        {servers.map((server) => (
          <Tooltip key={server._id}>
            <TooltipTrigger>
              <div
                onClick={() => handleServerClick(server)}
                className={cn(
                  'w-10 h-10 rounded-full overflow-hidden hover:rounded-xl transition-all cursor-pointer',
                  serverId === server._id && 'rounded-xl ring-2 ring-primary'
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={server.icon} />
                  <AvatarFallback className="text-xs">
                    {server.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{server.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator className="w-8" />

      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-green-500 hover:text-white hover:rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">Create Server</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={() => navigate('/app/dms')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:rounded-xl transition-all cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">Direct Messages</TooltipContent>
      </Tooltip>

      {showCreateModal && (
        <CreateServerModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

export default ServerSidebar;