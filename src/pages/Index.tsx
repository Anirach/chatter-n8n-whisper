
import Chat from "@/components/Chat";
import { Bot } from "lucide-react";

const Index = () => {
  return (
    <div className="flex h-screen flex-col items-center bg-gray-50 p-2">
      <header className="mb-2 flex items-center gap-2 pt-2">
        <div className="rounded-full bg-indigo-100 p-1">
          <Bot className="h-5 w-5 text-indigo-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Whisper Chat Assistant</h1>
      </header>
      
      <main className="flex-1 w-full max-w-4xl overflow-hidden">
        <Chat />
      </main>
      
      <footer className="py-1 text-center text-xs text-gray-500">
        Powered by n8n and Whisper • {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Index;
