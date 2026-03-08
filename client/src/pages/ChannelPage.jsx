import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Hash, Volume2, Code, Sparkles, X } from "lucide-react";
import useServerStore from "@/stores/serverStore";
import useSocketStore from "@/stores/socketStore";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/lib/api";
import { toast } from "sonner";
import CodeEditor from "@/components/CodeEditor";

function ChannelPage() {
  const { channelId, serverId } = useParams();
  const { channels, setCurrentChannel, setCurrentServer } = useServerStore();
  const { socket } = useSocketStore();
  const [channel, setChannel] = useState(null);
  const [threadMessage, setThreadMessage] = useState(null);
  const [threads, setThreads] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Load server data if store is empty on page refresh
  useEffect(() => {
    if (serverId && channels.length === 0) {
      setCurrentServer(serverId);
    }
  }, [serverId, channels.length, setCurrentServer]);

  // Find the channel in the store once channels are loaded
  useEffect(() => {
    const found = channels.find((c) => c._id === channelId);
    if (found) {
      setChannel(found);
      setCurrentChannel(found);
    }
  }, [channelId, channels, setCurrentChannel]);

  // Join the channel socket room
  useEffect(() => {
    if (!socket || !channelId) return;
    socket.emit("channel:join", channelId);
    return () => {
      socket.emit("channel:leave", channelId);
    };
  }, [socket, channelId]);

  // Load threads when a message thread is opened
  useEffect(() => {
    if (!threadMessage) return;

    async function loadThreads() {
      try {
        const res = await api.get(`/messages/${threadMessage._id}/threads`);
        setThreads(res.data.threads);
      } catch (err) {
        console.error("[ChannelPage] failed to load threads:", err.message);
      }
    }

    loadThreads();

    if (socket) {
      socket.emit("thread:join", threadMessage._id);

      socket.on("thread:new", ({ thread }) => {
        setThreads((prev) => [...prev, thread]);
      });

      return () => {
        socket.emit("thread:leave", threadMessage._id);
        socket.off("thread:new");
      };
    }
  }, [threadMessage, socket]);

  async function handleGetSummary() {
    setIsSummaryLoading(true);
    try {
      const res = await api.get(`/channels/${channelId}/summary`);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to get summary");
    } finally {
      setIsSummaryLoading(false);
    }
  }

  function sendThreadReply(content) {
    if (!socket || !threadMessage) return;
    socket.emit("thread:send", {
      messageId: threadMessage._id,
      content,
    });
  }

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading channel...</p>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flex: 1, overflow: "hidden", height: "100%" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          height: "100%",
        }}
      >
        <div className="h-12 border-b flex items-center px-4 gap-2 shrink-0">
          {channel.type === "voice" && (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          )}
          {channel.type === "code" && (
            <Code className="w-4 h-4 text-muted-foreground" />
          )}
          {channel.type === "text" && (
            <Hash className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{channel.name}</span>
          {channel.topic && (
            <span className="text-xs text-muted-foreground border-l pl-2">
              {channel.topic}
            </span>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGetSummary}
              disabled={isSummaryLoading}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {isSummaryLoading ? "Summarizing..." : "AI Summary"}
            </Button>
          </div>
        </div>

        {summary && (
          <div className="mx-4 mt-2 p-3 bg-muted rounded-lg text-sm relative">
            <button
              onClick={() => setSummary(null)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="font-medium mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Summary
            </p>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        )}

        {channel.type === "code" ? (
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CodeEditor channelId={channelId} />
          </div>
        ) : (
          <>
            <MessageList
              channelId={channelId}
              socket={socket}
              onThreadClick={setThreadMessage}
            />
            <MessageInput
              channelId={channelId}
              socket={socket}
              placeholder={`Message #${channel.name}`}
            />
          </>
        )}
      </div>

      {threadMessage && (
        <div className="w-72 border-l flex flex-col">
          <div className="h-12 border-b flex items-center px-4 justify-between shrink-0">
            <span className="font-medium text-sm">Thread</span>
            <button
              onClick={() => setThreadMessage(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {threads.map((thread) => (
                <div key={thread._id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs">
                    {thread.author?.username?.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium">
                      {thread.author?.displayName || thread.author?.username}
                    </p>
                    <p className="text-sm">{thread.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                className="flex-1 text-sm bg-muted rounded px-3 py-1.5 outline-none"
                placeholder="Reply in thread..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    sendThreadReply(e.target.value.trim());
                    e.target.value = "";
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChannelPage;
