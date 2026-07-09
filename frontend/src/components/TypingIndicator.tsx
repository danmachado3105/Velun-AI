import { Sparkles } from "lucide-react";

/**
 * Indicador visual de que a IA está processando uma resposta,
 * exibido antes do primeiro pedaço de texto chegar via streaming.
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2 mb-4">
      <div className="w-7 h-7 rounded-full aurora-gradient flex items-center justify-center shrink-0 mt-1">
        <Sparkles size={14} className="text-white" />
      </div>
      <div
        className="rounded-2xl px-4 py-3 border shadow-sm flex items-center gap-1"
        style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
      >
        <span className="typing-dot w-1.5 h-1.5 rounded-full aurora-gradient inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full aurora-gradient inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full aurora-gradient inline-block" />
      </div>
    </div>
  );
}