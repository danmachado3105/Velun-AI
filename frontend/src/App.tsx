import { useEffect, useRef } from "react";
import { useConversation } from "./hooks/useConversation";
import { MessageBubble } from "./components/MessageBubble";
import { ChatInput } from "./components/ChatInput";

function App() {
  const { conversation, sendMessage, isSending, error } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rola a tela automaticamente para a última mensagem sempre que
  // uma nova mensagem chega ou é atualizada.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-white">Velun AI</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4">
        {!conversation && !error && (
          <p className="text-gray-400 text-center mt-10">Carregando conversa...</p>
        )}
        {error && <p className="text-red-400 text-center mt-10">{error}</p>}
        {conversation?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <ChatInput onSend={sendMessage} disabled={isSending || !conversation} />
    </div>
  );
}

export default App;