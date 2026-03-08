import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function MessageInput({
  channelId,
  socket,
  placeholder = "Send a message...",
}) {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef(null);

  function handleSend() {
    if (!content.trim() || !socket) return;
    socket.emit("message:send", {
      channelId,
      content: content.trim(),
    });

    setContent("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleChange(e) {
    setContent(e.target.value);

    if (!socket) return;

    socket.emit("typing:start", { channelId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { channelId });
    }, 2000);
  }

  return (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon" disabled={!content.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default MessageInput;
