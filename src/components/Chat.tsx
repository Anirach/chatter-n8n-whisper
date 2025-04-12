
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Trash2, Loader2, Bot } from "lucide-react";
import ChatMessage, { MessageType } from "@/components/ChatMessage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "@/lib/utils";
import SettingsDialog from "@/components/SettingsDialog";

// Default webhook URL
const DEFAULT_WEBHOOK_URL = "https://n8n.opensource-technology.com/webhook-test/6b89a398-7b90-4bc3-80c1-8401dc8a5c40";

const Chat = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => {
    // Try to get saved URL from localStorage
    const savedUrl = localStorage.getItem("webhookUrl");
    return savedUrl || DEFAULT_WEBHOOK_URL;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save webhook URL to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("webhookUrl", webhookUrl);
  }, [webhookUrl]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: MessageType = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: MessageType = {
        id: uuidv4(),
        role: "assistant",
        content: data.response || "Sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get a response. Please try again later.");
      
      // Add error message as assistant
      const errorMessage: MessageType = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  const handleWebhookUrlChange = (newUrl: string) => {
    setWebhookUrl(newUrl);
  };

  return (
    <Card className="flex h-[calc(100vh-2rem)] w-full flex-col overflow-hidden p-0 shadow-lg">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Chat Assistant</h2>
        <div className="flex items-center gap-2">
          <SettingsDialog 
            currentUrl={webhookUrl} 
            onUrlChange={handleWebhookUrlChange} 
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            disabled={messages.length === 0 || isLoading}
            title="Clear chat"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold">Welcome to the Chat Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Ask me anything and I'll do my best to assist you.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
              />
            ))}
          </>
        )}
        {isLoading && (
          <div className="flex items-start gap-4 py-4">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Bot size={16} className="text-indigo-800" />
            </div>
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></div>
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse delay-75"></div>
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Chat;
