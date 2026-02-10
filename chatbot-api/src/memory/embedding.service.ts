import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { EMBEDDING_MODEL } from '../pinecone';
import type { EmbeddingResult } from './types/memory.types';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private pinecone: Pinecone | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const apiKey = this.configService.get<string>('PINECONE_API');
    if (apiKey) {
      this.pinecone = new Pinecone({ apiKey });
      this.logger.log('Embedding service initialized (Pinecone inference)');
    } else {
      this.logger.warn('PINECONE_API not set - embeddings disabled');
    }
  }

  isConfigured(): boolean {
    return this.pinecone !== null;
  }

 
  async embed(text: string): Promise<EmbeddingResult> {
    if (!this.pinecone) {
      throw new Error('Embedding service not initialized');
    }

    try {
      const result = await this.pinecone.inference.embed({
        model: EMBEDDING_MODEL,
        inputs: [text],
        parameters: { inputType: 'passage' },
      });

      const item = result.data?.[0] as any;
      const embedding = item?.values;
      if (!embedding) {
        throw new Error('No embedding returned from Pinecone inference');
      }

      return {
        embedding: Array.from(embedding),
        model: EMBEDDING_MODEL,
      };
    } catch (error) {
      this.logger.error(`Embedding error: ${error.message}`);
      throw error;
    }
  }
  async embedQuery(text: string): Promise<EmbeddingResult> {
    if (!this.pinecone) {
      throw new Error('Embedding service not initialized');
    }

    try {
      const result = await this.pinecone.inference.embed({
        model: EMBEDDING_MODEL,
        inputs: [text],
        parameters: { inputType: 'query' },
      });

      const item = result.data?.[0] as any;
      const embedding = item?.values;
      if (!embedding) {
        throw new Error('No embedding returned from Pinecone inference');
      }

      return {
        embedding: Array.from(embedding),
        model: EMBEDDING_MODEL,
      };
    } catch (error) {
      this.logger.error(`Query embedding error: ${error.message}`);
      throw error;
    }}
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.pinecone) {
      throw new Error('Embedding service not initialized');
    }

    try {
      const result = await this.pinecone.inference.embed({
        model: EMBEDDING_MODEL,
        inputs: texts,
        parameters: { inputType: 'passage' },
      });

      return result.data.map((item: any) => Array.from(item.values));
    } catch (error) {
      this.logger.error(`Batch embedding error: ${error.message}`);
      throw error;
    }
  }
}
