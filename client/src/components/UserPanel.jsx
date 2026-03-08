import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/stores/authStore';
import useSocketStore from '@/stores/socketStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function UserPanel() {
  const { user, logout } = useAuthStore();
  const { disconnect, isConnected } = useSocketStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      disconnect();
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  }

  if (!user) return null;

  return (
    <div className="h-12 bg-card border-t border-border flex items-center px-3 gap-2.5">
      <div className="relative shrink-0">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
            {user.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${isConnected ? 'bg-green-500' : 'bg-zinc-500'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate leading-tight">{user.displayName || user.username}</p>
        <p className="text-xs text-muted-foreground truncate leading-tight mono">@{user.username}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Tooltip>
          <TooltipTrigger>
            <div
              onClick={() => navigate('/app/settings')}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <div
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Log out</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export default UserPanel;