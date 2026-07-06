import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../types/chat";

interface MessageBubbleProps {
  message: Message;
}

/**
 * Exibe uma única mensagem, com estilo diferente dependendo
 * se foi enviada pelo usuário ou pela IA. Mensagens da IA são
 * renderizadas como Markdown (negrito, listas, títulos, código, etc).
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white whitespace-pre-wrap"
            : "bg-gray-800 text-gray-100 border border-gray-700"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}