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

  // Guarda pedaços de texto que ainda não formam uma linha completa,
  // até a próxima leitura chegar e "completar" o que faltava.
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // "stream: true" garante que caracteres acentuados não fiquem
    // corrompidos quando cortados no meio por um pacote de rede.
    buffer += decoder.decode(value, { stream: true });

    // Cada evento SSE termina com uma linha em branco. Aceitamos tanto
    // "\n\n" quanto "\r\n\r\n" (formato usado por diferentes servidores),
    // para garantir que os eventos sejam sempre reconhecidos corretamente.
    const events = buffer.split(/\r\n\r\n|\n\n/);
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      if (!rawEvent.trim()) continue;

      const lines = rawEvent.split(/\r\n|\n/);

      // Um mesmo pedaço de texto pode vir dividido em várias linhas "data:",
      // quando ele contém quebras de linha. Juntamos todas com "\n" entre
      // elas, para não perder a quebra de linha original.
      const dataLines = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => (line.startsWith("data: ") ? line.slice(6) : line.slice(5)));

      if (dataLines.length > 0) {
        onChunk(dataLines.join("\n"));
      }
    }
  }
}

/**
 * Envia um arquivo para extração de texto (PDF, Word, .txt, .md).
 */
export async function uploadFile(
  conversationId: string,
  file: File
): Promise<{ filename: string; extracted_text: string; character_count: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Erro ao enviar arquivo.");
  }

  return response.json();
}

/**
 * Busca todas as memórias guardadas sobre o usuário.
 */
export async function listMemories(): Promise<import("../types/chat").Memory[]> {
  const response = await fetch(`${API_BASE_URL}/memories`);
  if (!response.ok) {
    throw new Error("Erro ao buscar memórias.");
  }
  return response.json();
}

/**
 * Apaga uma memória específica.
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/memories/${memoryId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao apagar memória.");
  }
}