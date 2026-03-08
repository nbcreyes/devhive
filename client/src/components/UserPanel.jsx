import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/stores/authStore';
import useSocketStore from '@/stores/socketStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function UserPanel() {
  const { user, logout } = useAuthStore();
  const { disconnect } = useSocketStore();
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
    <div className="h-12 bg-muted/50 border-t flex items-center px-2 gap-2">
      <Avatar className="w-8 h-8">
        <AvatarImage src={user.avatar} />
        <AvatarFallback className="text-xs">
          {user.username?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{user.displayName || user.username}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={() => navigate('/app/settings')}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Log out</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export default UserPanel;