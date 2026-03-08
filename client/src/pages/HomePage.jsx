import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Users, Kanban, Sparkles } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import useServerStore from '@/stores/serverStore';

function HomePage() {
  const { user } = useAuthStore();
  const { servers, fetchServers } = useServerStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">
            Welcome back, {user?.displayName || user?.username}
          </h1>
          <p className="text-muted-foreground">
            You are a member of {servers.length} server{servers.length !== 1 ? 's' : ''}.
            Pick up where you left off.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <p className="font-medium text-sm">Channels</p>
            <p className="text-xs text-muted-foreground">
              Text, voice, and code channels for your team
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <p className="font-medium text-sm">Members</p>
            <p className="text-xs text-muted-foreground">
              Role-based permissions for your team
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <Kanban className="w-5 h-5 text-muted-foreground" />
            <p className="font-medium text-sm">Kanban Board</p>
            <p className="text-xs text-muted-foreground">
              Track tasks and projects per server
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card space-y-2">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            <p className="font-medium text-sm">AI Summaries</p>
            <p className="text-xs text-muted-foreground">
              Catch up on channels with Groq AI
            </p>
          </div>
        </div>

        {servers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            You are not in any servers yet. Create one using the + button on the left.
          </p>
        )}
      </div>
    </div>
  );
}

export default HomePage;