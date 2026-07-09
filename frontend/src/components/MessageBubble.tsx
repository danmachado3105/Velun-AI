import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser ? "aurora-gradient text-white whitespace-pre-wrap" : "border"
        }`}
        style={
          isUser
            ? undefined
            : {
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }
        }
      >
        {isUser ? (
          message.content
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}