import { uploadFile } from "../services/api";
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
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const [pendingAttachment, setPendingAttachment] = useState<{
    filename: string;
    content: string;
  } | null>(null);

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

      // Se houver um arquivo anexado pendente, monta o conteúdo real
      // (enviado para a IA) juntando o texto do arquivo com a mensagem,
      // mas a mensagem exibida na tela mostra só um resumo do anexo.
      const hasAttachment = pendingAttachment !== null;
      const displayContent = hasAttachment
        ? `📎 ${pendingAttachment!.filename}${content ? `\n\n${content}` : ""}`
        : content;
      const fullContentForAI = hasAttachment
        ? `Arquivo anexado: ${pendingAttachment!.filename}\n\n${pendingAttachment!.content}${content ? `\n\n${content}` : ""}`
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
          c.id === activeId
            ? { ...c, messages: [...c.messages, userMessage, assistantPlaceholder] }
            : c
        )
      );
      setIsSending(true);
      setError(null);

      try {
        await sendMessageStream(activeId, fullContentForAI, (chunk) => {
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

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!activeId) return;

      setIsUploadingFile(true);
      setError(null);

      try {
        const result = await uploadFile(activeId, file);
        setPendingAttachment({
          filename: result.filename,
          content: result.extracted_text,
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
  };
}