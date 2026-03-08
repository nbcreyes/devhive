import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import useSocketStore from "@/stores/socketStore";
import useAuthStore from "@/stores/authStore";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "c",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "markdown",
];

function CodeEditor({ channelId }) {
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const [code, setCode] = useState("// Start coding...\n");
  const [language, setLanguage] = useState("javascript");
  const [activeUsers, setActiveUsers] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [showOutput, setShowOutput] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const isRemoteChange = useRef(false);
  const editorRef = useRef(null);
  const messagesBottomRef = useRef(null);

  useEffect(() => {
    if (!socket || !channelId) return;

    socket.emit("editor:join", { channelId });
    socket.emit("channel:join", channelId);

    socket.on("editor:init", ({ content, language: lang }) => {
      isRemoteChange.current = true;
      setCode(content || "// Start coding...\n");
      if (lang) setLanguage(lang);
      isRemoteChange.current = false;
    });

    socket.on("editor:change", ({ content, userId }) => {
      if (userId === user?.id) return;
      isRemoteChange.current = true;
      setCode(content);
      isRemoteChange.current = false;
    });

    socket.on("editor:languageChange", ({ language: lang }) => {
      setLanguage(lang);
    });

    socket.on("editor:cursor", ({ userId, username }) => {
      setActiveUsers((prev) => {
        if (prev.find((u) => u.id === userId)) return prev;
        return [...prev, { id: userId, username }];
      });
    });

    socket.on("editor:userLeft", ({ userId }) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    socket.on("message:new", ({ message }) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(
        () => messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    });

    return () => {
      socket.emit("editor:leave", { channelId });
      socket.emit("channel:leave", channelId);
      socket.off("editor:init");
      socket.off("editor:change");
      socket.off("editor:languageChange");
      socket.off("editor:cursor");
      socket.off("editor:userLeft");
      socket.off("message:new");
    };
  }, [socket, channelId, user?.id]);

  // Load existing messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await api.get(`/channels/${channelId}/messages`);
        setMessages(res.data.messages);
      } catch (err) {
        console.error("[CodeEditor] failed to load messages:", err.message);
      }
    }
    if (channelId) loadMessages();
  }, [channelId]);

  function handleEditorChange(value) {
    if (isRemoteChange.current) return;
    setCode(value);
    socket?.emit("editor:change", { channelId, content: value });
  }

  function handleLanguageChange(lang) {
    setLanguage(lang);
    socket?.emit("editor:languageChange", { channelId, language: lang });
  }

  function handleCursorChange(editor) {
    const position = editor.getPosition();
    if (position) {
      socket?.emit("editor:cursor", {
        channelId,
        position: { lineNumber: position.lineNumber, column: position.column },
        username: user?.username,
      });
    }
  }

  function handleEditorMount(editor) {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition(() => handleCursorChange(editor));
  }

  async function handleRunCode() {
    if (!code.trim()) return;
    setIsRunning(true);
    setShowOutput(true);
    setOutput(null);

    try {
      const res = await api.post("/execute", { code, language });

      // JS runs in the browser sandbox
      if (res.data.clientSide) {
        const logs = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => logs.push(args.map(String).join(" "));
        console.error = (...args) =>
          logs.push("ERROR: " + args.map(String).join(" "));
        console.warn = (...args) =>
          logs.push("WARN: " + args.map(String).join(" "));

        try {
          // eslint-disable-next-line no-new-func
          const fn = new Function(code);
          fn();
          setOutput({
            output: logs.join("\n") || "(no output)",
            stderr: "",
            exitCode: 0,
          });
        } catch (err) {
          setOutput({ output: "", stderr: err.message, exitCode: 1 });
        } finally {
          console.log = originalLog;
          console.error = originalError;
          console.warn = originalWarn;
        }
      } else {
        setOutput(res.data);
      }
    } catch (err) {
      setOutput({ output: "", stderr: "Failed to execute code", exitCode: 1 });
    } finally {
      setIsRunning(false);
    }
  }

  function handleSendMessage() {
    if (!chatInput.trim() || !socket) return;
    socket.emit("message:send", { channelId, content: chatInput.trim() });
    setChatInput("");
  }

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      <div className="h-10 border-b flex items-center px-4 gap-3 shrink-0 bg-muted/30">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-40 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang} className="text-xs">
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleRunCode}
          disabled={isRunning}
        >
          {isRunning ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          {isRunning ? "Running..." : "Run"}
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          {activeUsers.map((u) => (
            <Badge key={u.id} variant="secondary" className="text-xs">
              {u.username}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main area: editor + chat */}
      <div
        style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}
      >
        {/* Editor + output */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: "on",
                renderWhitespace: "selection",
                smoothScrolling: true,
              }}
            />
          </div>

          {/* Output panel */}
          {showOutput && (
            <div
              className="border-t bg-zinc-900 text-zinc-100"
              style={{
                height: "180px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="flex items-center justify-between px-3 py-1 border-b border-zinc-700 shrink-0">
                <span className="text-xs font-medium text-zinc-400">
                  Output
                </span>
                <div className="flex items-center gap-2">
                  {output && (
                    <span
                      className={cn(
                        "text-xs",
                        output.exitCode === 0
                          ? "text-green-400"
                          : "text-red-400",
                      )}
                    >
                      Exit code: {output.exitCode}
                    </span>
                  )}
                  <button
                    onClick={() => setShowOutput(false)}
                    className="text-zinc-400 hover:text-zinc-100"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {isRunning && (
                  <p className="text-xs text-zinc-400 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Running...
                  </p>
                )}
                {output && (
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {output.output && (
                      <span className="text-zinc-100">{output.output}</span>
                    )}
                    {output.stderr && (
                      <span className="text-red-400">{output.stderr}</span>
                    )}
                    {!output.output && !output.stderr && (
                      <span className="text-zinc-500">No output</span>
                    )}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className="w-64 border-l flex flex-col shrink-0">
          <div className="px-3 py-2 border-b shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chat
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No messages yet
                </p>
              )}
              {messages.map((message) => (
                <div key={message._id} className="flex gap-2">
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarImage src={message.author?.avatar} />
                    <AvatarFallback className="text-xs">
                      {message.author?.username?.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium truncate">
                        {message.author?.displayName ||
                          message.author?.username}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(message.createdAt), "h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesBottomRef} />
            </div>
          </ScrollArea>

          <div className="p-2 border-t shrink-0">
            <div className="flex gap-1">
              <input
                className="flex-1 text-xs bg-muted rounded px-2 py-1.5 outline-none"
                placeholder="Message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <Button
                size="icon"
                className="w-7 h-7 shrink-0"
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;
