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
      />

      <div className="flex flex-col flex-1">
        <header
          className="border-b px-6 py-4 flex items-center justify-between"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h1 className="text-xl font-display font-bold aurora-text">Velun AI</h1>
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
            <p className="text-gray-400 text-center mt-10">Carregando...</p>
          )}
          {error && <p className="text-red-400 text-center mt-10">{error}</p>}
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