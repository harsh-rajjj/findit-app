"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface MessageThreadProps {
  claimId: string;
  currentUserId: string;
  messages: Message[];
}

export function MessageThread({ claimId, currentUserId, messages: initialMessages }: MessageThreadProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    setError(null);
    setSending(true);
    try {
      const response = await fetch(`/api/claims/${claimId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to send message");
        return;
      }

      const result = await response.json();
      setMessages(prev => [...prev, {
        id: result.id,
        content: newMessage.trim(),
        senderId: currentUserId,
        senderName: "You",
        createdAt: new Date().toISOString(),
      }]);
      setNewMessage("");
      router.refresh();
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 px-1 py-3 max-h-80 min-h-[200px]"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start a conversation about pickup details</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isSent ? "justify-end" : "justify-start"} animate-slide-up`}
              >
                <div className={`max-w-[80%] ${isSent ? "items-end" : "items-start"}`}>
                  {!isSent && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1 font-medium">
                      @{msg.senderName}
                    </p>
                  )}
                  <div className={`px-4 py-2.5 ${
                    isSent ? "message-bubble-sent" : "message-bubble-received"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${isSent ? "text-right mr-1" : "ml-1"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-2 py-1.5 text-xs text-destructive bg-destructive/10 rounded-lg mb-2 animate-slide-up">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border/60 pt-3 flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          className="min-h-[44px] max-h-24 resize-none text-sm flex-1"
          disabled={sending}
          id="message-input"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          size="sm"
          className="gradient-primary text-white border-0 h-11 px-4 self-end shrink-0"
          id="message-send"
        >
          {sending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
