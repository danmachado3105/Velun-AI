import { useEffect, useState } from "react";
import { listMemories, deleteMemory } from "../services/api";
import type { Memory } from "../types/chat";

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal que exibe todas as memórias que o Velun AI guardou sobre
 * o usuário, permitindo apagar cada uma individualmente.
 */
export function MemoriesModal({ isOpen, onClose }: MemoriesModalProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    listMemories()
      .then(setMemories)
      .catch(() => setError("Não foi possível carregar as memórias."))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  async function handleDelete(id: string) {
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError("Não foi possível apagar essa memória.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-lg max-h-[80vh] rounded-2xl border flex flex-col"
        style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h2 className="font-display font-bold text-lg aurora-text">
            O que o Velun sabe sobre você
          </h2>
          <button
            onClick={onClose}
            className="text-lg opacity-60 hover:opacity-100 transition"
            style={{ color: "var(--text-primary)" }}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading && <p className="opacity-60 text-sm">Carregando memórias...</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!isLoading && !error && memories.length === 0 && (
            <p className="opacity-60 text-sm">
              Nenhuma memória guardada ainda. Converse com o Velun e ele vai
              aprender coisas sobre você aos poucos!
            </p>
          )}
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {memory.content}
              </span>
              <button
                onClick={() => handleDelete(memory.id)}
                className="text-xs text-gray-500 hover:text-red-400 transition shrink-0"
                title="Apagar memória"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}