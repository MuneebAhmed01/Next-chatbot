import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, Index, RecordMetadata } from '@pinecone-database/pinecone';
import { PINECONE_INDEX_NAME } from '../pinecone';
import type { MemoryMetadata, MemoryRecord, MemoryQueryResult } from './types/memory.types';
@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private pinecone: Pinecone | null = null;
  private index: Index<RecordMetadata> | null = null;
  private readonly namespace = 'chatbot';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const apiKey = this.configService.get<string>('PINECONE_API');
    
    if (!apiKey) {
      this.logger.warn('PINECONE_API not set - vector store disabled');
      return;
    }

    try {
      this.pinecone = new Pinecone({ apiKey });
      this.index = this.pinecone.index(PINECONE_INDEX_NAME);
      this.logger.log(`Connected to Pinecone index: ${PINECONE_INDEX_NAME}`);
    } catch (error) {
      this.logger.error(`Pinecone initialization failed: ${error.message}`);
    }
  }

  isReady(): boolean {
    return this.index !== null;
  }

  async upsert(record: MemoryRecord): Promise<void> {
    if (!this.index) {
      throw new Error('Vector store not initialized');
    }

    try {
      await this.index.namespace(this.namespace).upsert({
        records: [
          {
            id: record.id,
            values: record.values,
            metadata: record.metadata as unknown as RecordMetadata,
          },
        ],
      });
      this.logger.debug(`Stored memory: ${record.id}`);
    } catch (error) {
      this.logger.error(`Upsert failed: ${error.message}`);
      throw error;
    }
  }


  async upsertBatch(records: MemoryRecord[]): Promise<void> {
    if (!this.index) {
      throw new Error('Vector store not initialized');
    }

    try {
      const pineconeRecords = records.map(r => ({
        id: r.id,
        values: r.values,
        metadata: r.metadata as unknown as RecordMetadata,
      }));
      
      await this.index.namespace(this.namespace).upsert({ records: pineconeRecords });
      this.logger.debug(`Stored ${records.length} memories`);
    } catch (error) {
      this.logger.error(`Batch upsert failed: ${error.message}`);
      throw error;
    }
  }

  
  async query(
    embedding: number[],
    userId: string,
    topK: number = 5,
  ): Promise<MemoryQueryResult[]> {
    if (!this.index) {
      this.logger.warn('Vector store not initialized, returning empty results');
      return [];
    }

    try {
      const response = await this.index.namespace(this.namespace).query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter: { userId: { $eq: userId } },
      });

      return (response.matches || []).map(match => {
        const metadata = match.metadata as unknown as MemoryMetadata;
        return {
          id: match.id,
          score: match.score || 0,
          content: metadata?.content || '',
          type: metadata?.type || 'context',
          timestamp: metadata?.timestamp || 0,
        };
      });
    } catch (error) {
      this.logger.error(`Query failed: ${error.message}`);
      return [];
    }
  }

  
  async delete(ids: string[]): Promise<void> {
    if (!this.index) {
      throw new Error('Vector store not initialized');
    }

    try {
      
      for (const id of ids) {
        await this.index.namespace(this.namespace).deleteOne({ id });
      }
      this.logger.debug(`Deleted ${ids.length} memories`);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`);
     
    }
  }

  
  async deleteByUserId(userId: string): Promise<void> {
    if (!this.index) {
      throw new Error('Vector store not initialized');
    }

    try {
      
      const dummyVector = new Array(1024).fill(0);
      const results = await this.index.namespace(this.namespace).query({
        vector: dummyVector,
        topK: 100,
        filter: { userId: { $eq: userId } },
      });

      if (results.matches && results.matches.length > 0) {
        for (const match of results.matches) {
          await this.index.namespace(this.namespace).deleteOne({ id: match.id });
        }
      }
      this.logger.log(`Deleted all memories for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Delete by user failed: ${error.message}`);
      throw error;
    }
  }
}
