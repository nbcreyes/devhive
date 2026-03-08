import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Github, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
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
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const statusColors = {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-xl">
                {profile.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background ${
                statusColors[profile.status] || statusColors.offline
              }`}
            />
          </div>

          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold">
              {profile.displayName || profile.username}
            </h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            <p className="text-sm capitalize text-muted-foreground">
              {profile.status}
            </p>
          </div>

          {currentUser?.id !== userId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/dms/${userId}`)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
          )}
        </div>

        <Separator />

        {profile.bio && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              About
            </p>
            <p className="text-sm">{profile.bio}</p>
          </div>
        )}

        {profile.techStack && profile.techStack.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.techStack.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {profile.githubUsername && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              GitHub
            </p>
            <a
              href={`https://github.com/${profile.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <Github className="w-4 h-4" />
              {profile.githubUsername}
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-card text-center">
            <p className="text-2xl font-bold">{profile.serverCount}</p>
            <p className="text-xs text-muted-foreground">Servers</p>
          </div>
          <div className="p-4 rounded-lg border bg-card text-center">
            <p className="text-2xl font-bold">{profile.messageCount}</p>
            <p className="text-xs text-muted-foreground">Messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;