import { Injectable } from '@nestjs/common';
import type { ChatMessage, PromptContext } from './types/memory.types';


@Injectable()
export class PromptBuilderService {
  private readonly defaultSystemPrompt = `You are a helpful AI assistant with access to long-term memory. 
You can remember important information from previous conversations.
Be concise, accurate, and helpful. Reference relevant memories when appropriate.`;

  
  build(context: PromptContext): ChatMessage[] {
    const messages: ChatMessage[] = [];

   
    const systemContent = this.buildSystemPrompt(
      context.systemPrompt,
      context.memoryContext,
    );
    messages.push({ role: 'system', content: systemContent });

    
    const recentHistory = context.recentHistory.slice(-10);
    messages.push(...recentHistory);

 
    messages.push({ role: 'user', content: context.userMessage });

    return messages;
  }

 
  private buildSystemPrompt(
    customPrompt?: string,
    memoryContext?: string,
  ): string {
    const base = customPrompt || this.defaultSystemPrompt;

    if (!memoryContext) {
      return base;
    }

    return `${base}

---
LONG-TERM MEMORY CONTEXT:
${memoryContext}
---

Use the above memories to provide more personalized and contextually relevant responses.
If the memories are relevant to the user's question, incorporate them naturally.`;
  }

 
  formatHistory(messages: Array<{ role: string; content: string }>): ChatMessage[] {
    return messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }


  getDefaultSystemPrompt(): string {
    return this.defaultSystemPrompt;
  }
}
