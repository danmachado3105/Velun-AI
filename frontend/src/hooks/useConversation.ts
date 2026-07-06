import { useCallback, useEffect, useState } from "react";
import {
  createConversation,
  deleteConversation as deleteConversationApi,
  listConversations,
  sendMessageStream,
} from "../services/api";
import type { Conversation, Message } from "../types/chat";

/**
 * Hook responsável por gerenciar a lista de conversas, a conversa
 * ativa no momento, e o envio de mensagens com streaming.
 */
export function useConversation() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ao carregar a página, busca as conversas existentes. Se não houver
  // nenhuma, cria uma nova automaticamente.
  useEffect(() => {
    listConversations()
      .then(async (existing) => {
        if (existing.length > 0) {
          setConversations(existing);
          setActiveId(existing[0].id);
        } else {
          const created = await createConversation();
          setConversations([created]);
          setActiveId(created.id);
        }
      })
      .catch(() => setError("Não foi possível carregar as conversas."));
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  const handleNewConversation = useCallback(async () => {
    try {
      const created = await createConversation();
      setConversations((prev) => [created, ...prev]);
      setActiveId(created.id);
    } catch {
      setError("Não foi possível criar uma nova conversa.");
    }
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversationApi(id);
        setConversations((prev) => {
          const remaining = prev.filter((c) => c.id !== id);
          // Se a conversa apagada era a ativa, seleciona outra automaticamente.
          if (id === activeId) {
            setActiveId(remaining[0]?.id ?? null);
          }
          return remaining;
        });
      } catch {
        setError("Não foi possível apagar a conversa.");
      }
    },
    [activeId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeId) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };

      const assistantMessageId = crypto.randomUUID();
      const assistantPlaceholder: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      // Atualiza apenas a conversa ativa dentro da lista de conversas.
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, userMessage, assistantPlaceholder] }
            : c
        )
      );
      setIsSending(true);
      setError(null);

      try {
        await sendMessageStream(activeId, content, (chunk) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeId
                ? {
                    ...c,
                    messages: c.messages.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + chunk }
                        : msg
                    ),
                  }
                : c
            )
          );
        });
      } catch {
        setError("Erro ao enviar mensagem. Verifique se o backend e o Ollama estão rodando.");
      } finally {
        setIsSending(false);
      }
    },
    [activeId]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    sendMessage,
    isSending,
    error,
    newConversation: handleNewConversation,
    selectConversation: handleSelectConversation,
    deleteConversation: handleDeleteConversation,
  };
}