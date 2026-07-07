import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  isUploadingFile?: boolean;
}

/**
 * Campo de texto onde o usuário digita mensagens, com botão
 * de anexar arquivos (PDF, Word, texto).
 */
export function ChatInput({
  onSend,
  onFileSelected,
  disabled,
  isUploadingFile,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    // Limpa o campo para permitir selecionar o mesmo arquivo de novo, se precisar.
    event.target.value = "";
  }

  return (
    <div className="flex items-end gap-2 border-t border-gray-800 p-4 bg-gray-900">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploadingFile}
        title="Anexar arquivo"
        className="rounded-xl border border-gray-700 px-3 py-3 text-gray-300 hover:bg-gray-800 transition disabled:opacity-40"
      >
        {isUploadingFile ? "..." : "📎"}
      </button>

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