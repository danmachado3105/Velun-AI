import { useEffect, useRef, useState } from "react";
import { useConversation } from "./hooks/useConversation";
import { MessageBubble } from "./components/MessageBubble";
import { ChatInput } from "./components/ChatInput";
import { Sidebar } from "./components/Sidebar";
import { Sun, Moon, Menu } from "lucide-react";
import { TypingIndicator } from "./components/TypingIndicator";

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
    isLoadingConversations,
    regenerateLastResponse,
    editMessageAndRegenerate,
  } = useConversation();

  const [isDark, setIsDark] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
              className="hover:opacity-70 transition"
              style={{ color: "var(--text-primary)" }}
              title={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-display font-bold aurora-text">Velun AI</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition hover:opacity-80"
              style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? "Claro" : "Escuro"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-4">
          {isLoadingConversations && (
            <div className="flex flex-col items-center justify-center h-full opacity-60">
              <div className="w-8 h-8 rounded-full aurora-gradient animate-pulse mb-3" />
              <p>Carregando...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-red-400 text-center max-w-sm">{error}</p>
            </div>
          )}
          {!isLoadingConversations && !error && (!activeConversation || activeConversation.messages.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full opacity-70">
              <h2 className="text-2xl font-display aurora-text font-bold mb-2">
                Olá! Eu sou o Velun AI
              </h2>
              <p className="text-sm">Envie uma mensagem para começar a conversar.</p>
            </div>
          )}
          {activeConversation?.messages.map((message, index) => {
            const isLastAssistantMessage =
              message.role === "assistant" &&
              index === activeConversation.messages.length - 1;

            // Enquanto a resposta ainda está vazia (streaming não começou),
            // mostra o indicador de "digitando..." no lugar da bolha vazia.
            if (isLastAssistantMessage && message.content === "" && isSending) {
              return <TypingIndicator key={message.id} />;
            }

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isLastAssistantMessage={isLastAssistantMessage}
                onRegenerate={regenerateLastResponse}
                onEdit={editMessageAndRegenerate}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        <ChatInput
          onSend={sendMessage}
          onFileSelected={handleFileSelected}
          disabled={isSending || isLoadingConversations}
          isUploadingFile={isUploadingFile}
          pendingAttachment={pendingAttachment}
          onRemoveAttachment={removeAttachment}
        />
      </div>
    </div>
  );
}

export default App;