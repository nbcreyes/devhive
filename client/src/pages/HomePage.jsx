import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Users, LayoutDashboard, Sparkles, ArrowRight } from 'lucide-react';
import useAuthStore from '@/stores/authStore';
import useServerStore from '@/stores/serverStore';

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all duration-200 group">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function HomePage() {
  const { user } = useAuthStore();
  const { servers, fetchServers } = useServerStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-8 animate-in-fast">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {servers.length} server{servers.length !== 1 ? 's' : ''} joined
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hey, {user?.displayName || user?.username}
          </h1>
          <p className="text-muted-foreground">
            Your developer workspace. Pick up where you left off.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FeatureCard
            icon={Hash}
            title="Channels"
            description="Text, voice, and collaborative code channels"
          />
          <FeatureCard
            icon={Users}
            title="Members"
            description="Role-based permissions and team management"
          />
          <FeatureCard
            icon={LayoutDashboard}
            title="Kanban"
            description="Track tasks and projects per server"
          />
          <FeatureCard
            icon={Sparkles}
            title="AI Summaries"
            description="Catch up on any channel instantly"
          />
        </div>

        {servers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Your Servers
            </p>
            <div className="space-y-1.5">
              {servers.map((server) => (
                <button
                  key={server._id}
                  onClick={() => navigate(`/app/servers/${server._id}`)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-secondary transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary mono">
                        {server.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{server.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {servers.length === 0 && (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              No servers yet. Create one using the <span className="text-primary">+</span> button on the left.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;