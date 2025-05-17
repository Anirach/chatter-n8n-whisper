
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        ) : (
          <div className="markdown-content text-sm">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="text-blue-200 underline hover:text-blue-100"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="mb-2 whitespace-pre-wrap break-words" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="mb-2 ml-6 list-disc" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="mb-2 ml-6 list-decimal" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="mb-1" />
                ),
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="mb-2 mt-3 text-xl font-bold" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="mb-2 mt-3 text-lg font-bold" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="mb-2 mt-2 text-base font-bold" />
                ),
                strong: ({ node, ...props }) => (
                  <strong {...props} className="font-bold" />
                ),
                code: ({ node, ...props }) => (
                  <code
                    {...props}
                    className="rounded bg-gray-700 px-1 py-0.5 font-mono text-sm"
                  />
                ),
                pre: ({ node, ...props }) => (
                  <pre
                    {...props}
                    className="mb-2 overflow-x-auto rounded bg-gray-700 p-2 font-mono text-sm"
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
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
