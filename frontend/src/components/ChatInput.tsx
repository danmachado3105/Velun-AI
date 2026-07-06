import { useState } from "react";
import type { KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

/**
 * Campo de texto onde o usuário digita e envia mensagens.
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  // Permite enviar apertando Enter (mas Shift+Enter quebra linha, como em qualquer chat).
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-gray-800 p-4 bg-gray-900">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Digite sua mensagem..."
        rows={1}
        className="flex-1 resize-none rounded-xl bg-gray-800 text-white px-4 py-3 outline-none border border-gray-700 focus:border-blue-500 disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="rounded-xl bg-blue-600 px-4 py-3 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
      >
        Enviar
      </button>
    </div>
  );
}