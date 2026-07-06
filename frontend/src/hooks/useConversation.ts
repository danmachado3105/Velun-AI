import { useCallback, useEffect, useState } from "react";
import { createConversation, sendMessageStream } from "../services/api";
import type { Conversation, Message } from "../types/chat";

/**
 * Hook responsável por gerenciar o estado de uma conversa:
 * criação, envio de mensagens e recebimento da resposta em streaming.
 */
export function useConversation() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cria uma conversa nova assim que o hook é usado pela primeira vez.
  useEffect(() => {
    createConversation()
      .then(setConversation)
      .catch(() => setError("Não foi possível criar a conversa."));
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversation) return;

      // Mostra a mensagem do usuário na tela imediatamente,
      // sem esperar a resposta da IA (deixa a interface mais ágil).
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };

      // Cria um "espaço reservado" para a resposta da IA, que vai
      // sendo preenchido aos poucos conforme o streaming chega.
      const assistantMessageId = crypto.randomUUID();
      const assistantPlaceholder: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      setConversation((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, userMessage, assistantPlaceholder] }
          : prev
      );
      setIsSending(true);
      setError(null);

      try {
        await sendMessageStream(conversation.id, content, (chunk) => {
          // A cada pedaço de texto recebido, atualiza só a mensagem
          // da IA que está sendo escrita, sem mexer nas outras.
          setConversation((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ),
            };
          });
        });
      } catch {
        setError("Erro ao enviar mensagem. Verifique se o backend e o Ollama estão rodando.");
      } finally {
        setIsSending(false);
      }
    },
    [conversation]
  );

  return { conversation, sendMessage, isSending, error };
}