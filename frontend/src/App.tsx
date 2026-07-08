import { useEffect, useRef } from "react";
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
  } = useConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeId}
        onSelectConversation={selectConversation}
        onNewConversation={newConversation}
        onDeleteConversation={deleteConversation}
      />

      <div className="flex flex-col flex-1">
        <header className="border-b border-gray-800 px-6 py-4">
          <h1 className="text-xl font-bold text-white">Velun AI</h1>
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
        />
      </div>
    </div>
  );
}

export default App;