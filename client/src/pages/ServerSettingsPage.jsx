import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Settings, Hash, Volume2, Code, Trash2, Plus, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import useServerStore from '@/stores/serverStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ServerSettingsPage() {
  const { serverId } = useParams();
  const { currentServer, channels, setCurrentServer, addChannel } = useServerStore();
  const navigate = useNavigate();
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('text');
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateChannel(e) {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setIsCreating(true);
    try {
      const res = await api.post(`/servers/${serverId}/channels`, {
        name: newChannelName.trim(),
        type: newChannelType,
      });
      addChannel(res.data.channel);
      setNewChannelName('');
      toast.success('Channel created');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create channel');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteChannel(channelId) {
    if (!confirm('Delete this channel? This cannot be undone.')) return;
    try {
      await api.delete(`/servers/${serverId}/channels/${channelId}`);
      await setCurrentServer(serverId);
      toast.success('Channel deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete channel');
    }
  }

  function channelIcon(type) {
    if (type === 'voice') return <Volume2 className="w-3.5 h-3.5" />;
    if (type === 'code') return <Code className="w-3.5 h-3.5" />;
    return <Hash className="w-3.5 h-3.5" />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-in-fast">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/app/servers/${serverId}`)}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Server Settings</h1>
            <p className="text-muted-foreground text-sm">{currentServer?.name}</p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Channels</h2>
          </div>

          <div className="space-y-1.5">
            {channels.map((channel) => (
              <div
                key={channel._id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border group"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {channelIcon(channel.type)}
                  <span>{channel.name}</span>
                  <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{channel.type}</span>
                </div>
                <button
                  onClick={() => handleDeleteChannel(channel._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateChannel} className="pt-2 border-t border-border space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Create Channel
            </p>
            <div className="flex gap-2">
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="bg-background border-border focus:border-primary focus:ring-0 flex-1"
              />
              <Select value={newChannelType} onValueChange={setNewChannelType}>
                <SelectTrigger className="w-28 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={isCreating || !newChannelName.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Channel'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ServerSettingsPage;