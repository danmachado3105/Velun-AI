import { uploadFile } from "../services/api";
import { useCallback, useEffect, useState } from "react";
import {
  createConversation,
  deleteConversation as deleteConversationApi,
  listConversations,
  sendMessageStream,
} from "../services/api";
import type { Conversation, Message } from "../types/chat";
import { regenerateMessage, editMessage } from "../services/api";

/**
 * Hook responsável por gerenciar a lista de conversas, a conversa
 * ativa no momento, e o envio de mensagens com streaming.
 */
export function useConversation() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const [pendingAttachment, setPendingAttachment] = useState<{
    filename: string;
    content: string;
  } | null>(null);

  // Ao carregar a página, busca as conversas existentes. Se não houver
  // nenhuma, cria uma nova automaticamente.
  useEffect(() => {
    listConversations()
      .then((existing) => {
        setConversations(existing);
        // Propositalmente NÃO seleciona nenhuma conversa automaticamente
        // ao carregar a página — o app sempre começa em uma tela de
        // boas-vindas, pronta para uma nova conversa.
      })
      .catch(() => setError("Não foi possível carregar as conversas."))
      .finally(() => setIsLoadingConversations(false));
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  const handleNewConversation = useCallback(() => {
    // Não cria a conversa no banco ainda — só marca que não há
    // conversa ativa. A conversa real só é criada quando o usuário
    // mandar a primeira mensagem (veja sendMessage).
    setActiveId(null);
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
      let conversationId = activeId;

      // Se não há conversa ativa (ex: usuário clicou em "Nova conversa"
      // mas ainda não mandou nada), cria a conversa agora, na hora certa.
      if (!conversationId) {
        try {
          const created = await createConversation();
          setConversations((prev) => [created, ...prev]);
          conversationId = created.id;
          setActiveId(created.id);
        } catch {
          setError("Não foi possível criar a conversa.");
          return;
        }
      }

      // O documento já foi salvo no backend durante o upload; aqui só
      // precisamos indicar visualmente que ele foi anexado a esta mensagem.
      const hasAttachment = pendingAttachment !== null;
      const displayContent = hasAttachment
        ? `📎 ${pendingAttachment!.filename}${content ? `\n\n${content}` : ""}`
        : content;

      setPendingAttachment(null);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: displayContent,
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
          c.id === conversationId
            ? { ...c, messages: [...c.messages, userMessage, assistantPlaceholder] }
            : c
        )
      );
      setIsSending(true);
      setError(null);

      try {
        await sendMessageStream(conversationId, content, (chunk) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId
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
    [activeId, pendingAttachment]
  );

  const regenerateLastResponse = useCallback(async () => {
    if (!activeId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const lastAssistantIndex = [...c.messages].reverse().findIndex((m) => m.role === "assistant");
        if (lastAssistantIndex === -1) return c;
        const cutIndex = c.messages.length - 1 - lastAssistantIndex;

        const newAssistantId = crypto.randomUUID();
        const trimmedMessages = c.messages.slice(0, cutIndex);
        return {
          ...c,
          messages: [
            ...trimmedMessages,
            { id: newAssistantId, role: "assistant", content: "", created_at: new Date().toISOString() },
          ],
        };
      })
    );

    setIsSending(true);
    setError(null);

    try {
      await regenerateMessage(activeId, (chunk) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeId) return c;
            const lastMessage = c.messages[c.messages.length - 1];
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === lastMessage.id ? { ...m, content: m.content + chunk } : m
              ),
            };
          })
        );
      });
    } catch {
      setError("Erro ao regenerar resposta.");
    } finally {
      setIsSending(false);
    }
  }, [activeId]);

  const editMessageAndRegenerate = useCallback(
    async (messageId: string, newContent: string) => {
      if (!activeId) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const editIndex = c.messages.findIndex((m) => m.id === messageId);
          if (editIndex === -1) return c;

          const newAssistantId = crypto.randomUUID();
          const trimmedMessages = c.messages.slice(0, editIndex);
          return {
            ...c,
            messages: [
              ...trimmedMessages,
              { id: messageId, role: "user", content: newContent, created_at: new Date().toISOString() },
              { id: newAssistantId, role: "assistant", content: "", created_at: new Date().toISOString() },
            ],
          };
        })
      );

      setIsSending(true);
      setError(null);

      try {
        await editMessage(activeId, messageId, newContent, (chunk) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== activeId) return c;
              const lastMessage = c.messages[c.messages.length - 1];
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === lastMessage.id ? { ...m, content: m.content + chunk } : m
                ),
              };
            })
          );
        });
      } catch {
        setError("Erro ao editar mensagem.");
      } finally {
        setIsSending(false);
      }
    },
    [activeId]
  );

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!activeId) return;

      setIsUploadingFile(true);
      setError(null);

      try {
        const result = await uploadFile(activeId, file);
        setPendingAttachment({
          filename: result.filename,
          content: "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao processar arquivo.");
      } finally {
        setIsUploadingFile(false);
      }
    },
    [activeId]
  );

  const removeAttachment = useCallback(() => {
    setPendingAttachment(null);
  }, []);

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
    handleFileSelected,
    isUploadingFile,
    pendingAttachment,
    removeAttachment,
    isLoadingConversations,
    regenerateLastResponse,
    editMessageAndRegenerate,
  };
}