export interface MemoryMetadata {
  userId: string;
  chatId?: string;
  content: string;
  type: 'user_preference' | 'fact' | 'context' | 'summary';
  timestamp: number;
  importance?: number;
}

export interface MemoryRecord {
  id: string;
  values: number[];
  metadata: MemoryMetadata;
}

export interface MemoryQueryResult {
  id: string;
  score: number;
  content: string;
  type: string;
  timestamp: number;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface MemoryContext {
  relevantMemories: MemoryQueryResult[];
  formattedContext: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PromptContext {
  systemPrompt: string;
  memoryContext: string;
  recentHistory: ChatMessage[];
  userMessage: string;
}
