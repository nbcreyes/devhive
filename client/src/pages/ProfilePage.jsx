import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Github, MessageSquare, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/stores/authStore';

function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get(`/users/${userId}`);
        setProfile(res.data.user);
      } catch (err) {
        console.error('[ProfilePage] failed to load profile:', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">User not found</p>
      </div>
    );
  }

  const statusColor = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    offline: 'bg-zinc-500',
  }[profile.status] || 'bg-zinc-500';

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-in-fast">
      <div className="max-w-lg mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="p-5 rounded-xl border border-border bg-card space-y-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <Avatar className="w-16 h-16 ring-2 ring-border">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">
                  {profile.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${statusColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm text-muted-foreground mono">@{profile.username}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{profile.status}</p>
            </div>

            {currentUser?.id !== userId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/app/dms/${userId}`)}
                className="shrink-0 border-border hover:border-primary/30 hover:bg-primary/5"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            )}
          </div>

          {profile.bio && (
            <div className="space-y-1 pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">About</p>
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.techStack && profile.techStack.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs font-medium">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {profile.githubUsername && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">GitHub</p>
              <a
                href={`https://github.com/${profile.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Github className="w-4 h-4" />
                {profile.githubUsername}
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div className="p-3 rounded-lg bg-background border border-border text-center">
              <p className="text-2xl font-bold text-primary">{profile.serverCount ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Servers</p>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border text-center">
              <p className="text-2xl font-bold text-primary">{profile.messageCount ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Messages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;