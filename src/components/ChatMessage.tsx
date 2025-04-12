
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

export type MessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

interface ChatMessageProps {
  message: MessageType;
  isLast: boolean;
}

const ChatMessage = ({ message, isLast }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 py-4 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 border bg-white">
          <AvatarFallback className="bg-indigo-100 text-indigo-800">
            <Bot size={16} />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3",
          isUser
            ? "bg-chat-user-bubble text-chat-user-text"
            : "bg-chat-assistant-bubble text-chat-assistant-text"
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 border bg-white">
          <AvatarFallback className="bg-gray-100 text-gray-800">
            <User size={16} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
