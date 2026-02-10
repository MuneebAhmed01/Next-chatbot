import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import type { MemoryMetadata, MemoryQueryResult, MemoryContext } from './types/memory.types';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private embeddingService: EmbeddingService,
    private vectorStoreService: VectorStoreService,
  ) {}

  isReady(): boolean {
    return this.embeddingService.isConfigured() && this.vectorStoreService.isReady();
  }

  async retrieve(
    query: string,
    userId: string,
    limit: number = 5,
  ): Promise<MemoryContext> {
    if (!this.isReady()) {
      this.logger.warn('Memory service not ready, returning empty context');
      return { relevantMemories: [], formattedContext: '' };
    }

    try {
     
      const { embedding } = await this.embeddingService.embedQuery(query);

      const memories = await this.vectorStoreService.query(embedding, userId, limit);

    
      const relevantMemories = memories.filter(m => m.score >= 0.5);

      
      const formattedContext = this.formatMemoriesForPrompt(relevantMemories);

      this.logger.log(`Retrieved ${relevantMemories.length} relevant memories for user ${userId}`);
      
      return { relevantMemories, formattedContext };
    } catch (error) {
      this.logger.error(`Memory retrieval failed: ${error.message}`);
      return { relevantMemories: [], formattedContext: '' };
    }
  }

//   store new message
  async store(
    content: string,
    userId: string,
    type: MemoryMetadata['type'] = 'context',
    chatId?: string,
    importance: number = 5,
  ): Promise<string> {
    if (!this.isReady()) {
      this.logger.warn('Memory service not ready, skipping store');
      return '';
    }

    try {
    //embedding generation
      const { embedding } = await this.embeddingService.embed(content);

      // Create memory record
      const id = uuidv4();
      const metadata: MemoryMetadata = {
        userId,
        chatId,
        content,
        type,
        timestamp: Date.now(),
        importance,
      };

      // Store in Pinecone
      await this.vectorStoreService.upsert({
        id,
        values: embedding,
        metadata,
      });

      this.logger.log(`Stored memory ${id} (${type}) for user ${userId}: "${content.substring(0, 50)}..."`);
      return id;
    } catch (error) {
      this.logger.error(`Memory storage failed: ${error.message}`);
      throw error;
    }
  }

  async storeExchange(
    userMessage: string,
    aiResponse: string,
    userId: string,
    chatId?: string,
  ): Promise<string> {
    const content = `User said: ${userMessage}\nAssistant replied: ${aiResponse.substring(0, 300)}`;
    return this.store(content, userId, 'context', chatId, 5);
  }


  async storePreference(
    preference: string,
    userId: string,
  ): Promise<string> {
    return this.store(preference, userId, 'user_preference', undefined, 9);
  }

 
  async storeFact(
    fact: string,
    userId: string,
  ): Promise<string> {
    return this.store(fact, userId, 'fact', undefined, 8);
  }

  async clearUserMemories(userId: string): Promise<void> {
    await this.vectorStoreService.deleteByUserId(userId);
  }

 
  private formatMemoriesForPrompt(memories: MemoryQueryResult[]): string {
    if (memories.length === 0) return '';

    const sorted = memories.sort((a, b) => b.score - a.score);
    
    const lines = sorted.map((m, i) => {
      const typeLabel = this.getTypeLabel(m.type);
      return `${i + 1}. [${typeLabel}] ${m.content}`;
    });

    return `Relevant memories from previous conversations:\n${lines.join('\n')}`;
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      user_preference: 'Preference',
      fact: 'Fact',
      context: 'Context',
      summary: 'Summary',
    };
    return labels[type] || 'Memory';
  }
}
