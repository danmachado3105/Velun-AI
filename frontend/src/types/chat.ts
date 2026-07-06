/**
 * Tipos de dados relacionados a conversas e mensagens.
 *
 * Esses tipos espelham os schemas do backend (Pydantic), garantindo
 * que o frontend saiba exatamente o formato dos dados que recebe.
 */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}