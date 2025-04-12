
import Chat from "@/components/Chat";
import { Bot } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4">
      <header className="mb-8 flex items-center gap-2 pt-8">
        <div className="rounded-full bg-indigo-100 p-2">
          <Bot className="h-6 w-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Whisper Chat Assistant</h1>
      </header>
      
      <main className="container max-w-4xl">
        <Chat />
      </main>
      
      <footer className="mt-8 pb-6 text-center text-sm text-gray-500">
        Powered by n8n and Whisper • {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Index;
