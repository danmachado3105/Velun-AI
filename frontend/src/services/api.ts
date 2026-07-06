/**
 * Serviço de comunicação com a API do Velun AI.
 *
 * Centraliza todas as chamadas HTTP em um só lugar, para que o
 * restante do frontend nunca precise saber detalhes de URLs ou
 * formato de requisição.
 */

import type { Conversation } from "../types/chat";

const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function createConversation(): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Erro ao criar conversa.");
  }
  return response.json();
}

export async function listConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/conversations`);
  if (!response.ok) {
    throw new Error("Erro ao listar conversas.");
  }
  return response.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}`);
  if (!response.ok) {
    throw new Error("Erro ao buscar conversa.");
  }
  return response.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao apagar conversa.");
  }
}

/**
 * Envia uma mensagem e recebe a resposta da IA em tempo real (streaming),
 * chamando `onChunk` a cada pedacinho de texto recebido.
 */
export async function sendMessageStream(
  conversationId: string,
  content: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok || !response.body) {
    throw new Error("Erro ao enviar mensagem.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    // O formato SSE manda linhas tipo "data: algum texto".
    // Extraímos só o conteúdo depois de "data: ".
    const lines = text.split("\n").filter((line) => line.startsWith("data:"));
    for (const line of lines) {
      // Removemos apenas o prefixo "data: " (com o espaço logo depois dos dois pontos),
      // sem usar trim() no restante — isso preserva os espaços entre as palavras
      // que a IA está enviando aos poucos.
      const chunkContent = line.startsWith("data: ")
        ? line.slice(6)
        : line.slice(5);
      if (chunkContent) {
        onChunk(chunkContent);
      }
    }
  }
}