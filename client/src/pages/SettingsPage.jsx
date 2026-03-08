import { useState } from 'react';
import { toast } from 'sonner';
import { Github } from 'lucide-react';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddTech(e) {
    e.preventDefault();
    if (!techStackInput.trim()) return;
    if (techStack.includes(techStackInput.trim())) return;
    setTechStack((prev) => [...prev, techStackInput.trim()]);
    setTechStackInput('');
  }

  function handleRemoveTech(tech) {
    setTechStack((prev) => prev.filter((t) => t !== tech));
  }

  function handleConnectGithub() {
    window.location.href = '/api/github/authorize';
  }

  async function handleDisconnectGithub() {
    try {
      await api.delete('/github/disconnect');
      updateUser({ githubUsername: null });
      toast.success('GitHub disconnected');
    } catch (err) {
      toast.error('Failed to disconnect GitHub');
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-lg mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>

          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">
                {user?.username?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {techStack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTech(tech)}
                  >
                    {tech} x
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="Add a technology"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTech(e)}
                />
                <Button type="button" variant="outline" onClick={handleAddTech}>
                  Add
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">GitHub Integration</h2>
          {user?.githubUsername ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                <span className="text-sm">Connected as @{user.githubUsername}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectGithub}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to see PRs, commits, and issues in channels.
              </p>
              <Button variant="outline" size="sm" onClick={handleConnectGithub}>
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