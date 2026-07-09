import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../types/chat";

interface MessageBubbleProps {
  message: Message;
  isLastAssistantMessage?: boolean;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

/**
 * Exibe uma única mensagem, com estilo diferente dependendo
 * se foi enviada pelo usuário ou pela IA. Inclui ações como
 * copiar, editar (mensagens do usuário) e regenerar (última
 * resposta da IA).
 */
export function MessageBubble({
  message,
  isLastAssistantMessage,
  onRegenerate,
  onEdit,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleSaveEdit() {
    const trimmed = editText.trim();
    if (trimmed && onEdit) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[70%] w-full">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl px-4 py-3 outline-none border"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditText(message.content);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border opacity-70 hover:opacity-100 transition"
              style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              className="text-xs px-3 py-1.5 rounded-lg aurora-gradient text-white font-medium"
            >
              Salvar e regenerar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1 group`}>
      <div className="max-w-[70%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Ações: aparecem ao passar o mouse, para não poluir a interface */}
        <div
          className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <button
            onClick={handleCopy}
            title="Copiar"
            className="text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition"
            style={{ color: "var(--text-primary)" }}
          >
            {copied ? "✓ Copiado" : "📋"}
          </button>
          {isUser && onEdit && (
            <button
              onClick={() => setIsEditing(true)}
              title="Editar mensagem"
              className="text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition"
              style={{ color: "var(--text-primary)" }}
            >
              ✏️
            </button>
          )}
          {!isUser && isLastAssistantMessage && onRegenerate && (
            <button
              onClick={onRegenerate}
              title="Tentar novamente"
              className="text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition"
              style={{ color: "var(--text-primary)" }}
            >
              🔄
            </button>
          )}
        </div>
      </div>
    </div>
  );
}