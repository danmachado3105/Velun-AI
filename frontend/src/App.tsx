import { useEffect, useRef, useState } from "react";
import { useConversation } from "./hooks/useConversation";
import { MessageBubble } from "./components/MessageBubble";
import { ChatInput } from "./components/ChatInput";
import { Sidebar } from "./components/Sidebar";

function App() {
  const {
    conversations,
    activeConversation,
    activeId,
    sendMessage,
    isSending,
    error,
    newConversation,
    selectConversation,
    deleteConversation,
    handleFileSelected,
    isUploadingFile,
    pendingAttachment,
    removeAttachment,
  } = useConversation();

  const [isDark, setIsDark] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <Sidebar
        conversations={conversations}
        activeConversationId={activeId}
        onSelectConversation={selectConversation}
        onNewConversation={newConversation}
        onDeleteConversation={deleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1">
        <header
          className="border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-xl hover:opacity-70 transition"
              style={{ color: "var(--text-primary)" }}
              title={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              ☰
            </button>
            <h1 className="text-xl font-display font-bold aurora-text">Velun AI</h1>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="text-sm px-3 py-1.5 rounded-lg border transition"
            style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          >
            {isDark ? "☀️ Claro" : "🌙 Escuro"}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-4">
          {!activeConversation && !error && (
            <div className="flex flex-col items-center justify-center h-full opacity-60">
              <div className="w-8 h-8 rounded-full aurora-gradient animate-pulse mb-3" />
              <p>Carregando conversa...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-red-400 text-center max-w-sm">{error}</p>
            </div>
          )}
          {activeConversation && activeConversation.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-70">
              <h2 className="text-2xl font-display aurora-text font-bold mb-2">
                Olá! Eu sou o Velun AI
              </h2>
              <p className="text-sm opacity-70">Envie uma mensagem para começar a conversar.</p>
            </div>
          )}
          {activeConversation?.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </main>

        <ChatInput
          onSend={sendMessage}
          onFileSelected={handleFileSelected}
          disabled={isSending || !activeConversation}
          isUploadingFile={isUploadingFile}
          pendingAttachment={pendingAttachment}
          onRemoveAttachment={removeAttachment}
        />
      </div>
    </div>
  );
}

export default App;