import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { MemoryService } from './memory.service';
import { PromptBuilderService } from './prompt-builder.service';
@Module({
  providers: [
    EmbeddingService,
    VectorStoreService,
    MemoryService,
    PromptBuilderService,
  ],
  exports: [
    MemoryService,
    PromptBuilderService,
  ],
})
export class MemoryModule {}
