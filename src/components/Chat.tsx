
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
// Increase timeout to 60 seconds for slower LLM responses
const REQUEST_TIMEOUT = 60000;

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
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message to:", webhookUrl);
      console.log("Request timeout set to:", REQUEST_TIMEOUT, "ms");
      
      // Create an AbortController with increased timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("Request timed out after", REQUEST_TIMEOUT, "ms");
        controller.abort();
      }, REQUEST_TIMEOUT);
      
      try {
        const startTime = Date.now();
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
          }),
          signal: controller.signal,
        });
        
        const endTime = Date.now();
        const requestDuration = endTime - startTime;
        console.log("Request completed in", requestDuration, "ms");
        
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        // Check if there's content in the response before parsing
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        if (!responseText || responseText.trim() === '') {
          console.log("Empty response received");
          throw new Error("Empty response received from the server");
        }
        
        let responseContent: string;
        
        try {
          // First, attempt to parse the JSON text
          const responseData = JSON.parse(responseText);
          console.log("Parsed response data:", responseData);
          
          // Extract content from various possible response formats
          if (Array.isArray(responseData)) {
            // Handle array response
            if (responseData.length > 0) {
              const firstItem = responseData[0];
              if (typeof firstItem === 'string') {
                responseContent = firstItem;
              } else if (firstItem && typeof firstItem === 'object') {
                responseContent = firstItem.output || firstItem.response || firstItem.message || 
                                  firstItem.text || firstItem.content || firstItem.answer || 
                                  JSON.stringify(firstItem);
              } else {
                responseContent = JSON.stringify(responseData);
              }
            } else {
              responseContent = "Received an empty array response";
            }
          } else if (responseData && typeof responseData === 'object') {
            // Handle object response
            responseContent = responseData.output || responseData.response || responseData.message || 
                             responseData.text || responseData.content || responseData.answer || 
                             JSON.stringify(responseData);
          } else if (typeof responseData === 'string') {
            // Handle string response
            responseContent = responseData;
          } else {
            // Fallback
            responseContent = JSON.stringify(responseData);
          }
        } catch (parseError) {
          console.log("Failed to parse JSON, using raw text:", parseError);
          // If it's not valid JSON, use the raw text as the response
          responseContent = responseText;
        }
        
        // If we still don't have a valid response content, throw an error
        if (!responseContent || responseContent === "undefined" || responseContent === "null") {
          throw new Error("Could not extract a valid response from the server");
        }
        
        console.log("Final extracted response content:", responseContent);
        
        // Add assistant message
        const assistantMessage: MessageType = {
          id: uuidv4(),
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
        };
  
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      let errorMessage = "Sorry, I encountered an error processing your request. ";
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage += `The request timed out after ${REQUEST_TIMEOUT / 1000} seconds. The server may be busy or the model is taking too long to generate a response. Try again or use a different webhook.`;
        } else if (error.message === "Failed to fetch") {
          errorMessage += "Could not connect to the webhook. Please check your network connection and webhook URL in settings.";
        } else if (error.message.includes("HTTP")) {
          errorMessage += `Server error: ${error.message}. Please check if the webhook URL is correct and the server is running.`;
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "An unknown error occurred. Please try again.";
      }
      
      toast.error(errorMessage);
      
      // Add error message as assistant
      const errorResponseMessage: MessageType = {
        id: uuidv4(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponseMessage]);
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
    <Card className="flex h-full w-full flex-col overflow-hidden p-0 shadow-lg">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
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
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[50px] max-h-[100px] resize-none"
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
