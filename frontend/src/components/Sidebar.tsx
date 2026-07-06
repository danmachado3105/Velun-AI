import type { Conversation } from "../types/chat";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

/**
 * Barra lateral com a lista de conversas, botão de nova conversa
 * e opção de apagar cada uma.
 */
export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={onNewConversation}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white py-2 px-4 font-medium"
        >
          + Nova conversa
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
              }`}
            >
              <span className="truncate text-sm">{conversation.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // evita selecionar a conversa ao clicar em apagar
                  onDeleteConversation(conversation.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition text-xs px-1"
                title="Apagar conversa"
              >
                ✕
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}