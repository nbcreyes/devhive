import { useState } from 'react';
import { toast } from 'sonner';
import { Github, User, Code2 } from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h2 className="font-semibold text-sm">{title}</h2>
    </div>
  );
}

function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [techStackInput, setTechStackInput] = useState('');
  const [techStack, setTechStack] = useState(user?.techStack || []);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.patch('/users/me', { displayName, bio, techStack });
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddTech(e) {
    e.preventDefault();
    if (!techStackInput.trim() || techStack.includes(techStackInput.trim())) return;
    setTechStack((prev) => [...prev, techStackInput.trim()]);
    setTechStackInput('');
  }

  function handleRemoveTech(tech) {
    setTechStack((prev) => prev.filter((t) => t !== tech));
  }

  function handleConnectGithub() {
    window.location.href = 'http://localhost:3001/api/github/authorize';
  }

  async function handleDisconnectGithub() {
    try {
      await api.delete('/github/disconnect');
      updateUser({ githubUsername: null });
      toast.success('GitHub disconnected');
    } catch {
      toast.error('Failed to disconnect GitHub');
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-in-fast">
      <div className="max-w-lg mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-5">
          <SectionHeader icon={User} title="Profile" />

          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <Avatar className="w-14 h-14 ring-2 ring-border">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg font-bold bg-primary/20 text-primary">
                {user?.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Display Name
              </Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="bg-background border-border focus:border-primary focus:ring-0"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Bio
              </Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows={3}
                className="bg-background border-border focus:border-primary focus:ring-0 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tech Stack
              </Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {techStack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors text-xs"
                    onClick={() => handleRemoveTech(tech)}
                  >
                    {tech} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="Add a technology"
                  className="bg-background border-border focus:border-primary focus:ring-0"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTech(e)}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTech}>
                  Add
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <SectionHeader icon={Github} title="GitHub Integration" />
          {user?.githubUsername ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Github className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">@{user.githubUsername}</p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnectGithub}
                className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect GitHub to see PRs, commits, and issues in your channels.
              </p>
              <Button variant="outline" size="sm" onClick={handleConnectGithub}
                className="border-border hover:border-primary/30 hover:bg-primary/5">
                <Github className="w-4 h-4 mr-2" />
                Connect GitHub
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;