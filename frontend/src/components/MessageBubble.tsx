import type { Message } from "../types/chat";

interface MessageBubbleProps {
  message: Message;
}

/**
 * Exibe uma única mensagem, com estilo diferente dependendo
 * se foi enviada pelo usuário ou pela IA.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-100 border border-gray-700"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}