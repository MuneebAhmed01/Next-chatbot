import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get('OPENROUTER_API_KEY') || '';
    
    if (!this.apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is not set');
    } else {
      this.logger.log('OpenRouter API key configured');
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async getModels() {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Failed to fetch models: ${response.status}`);
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      this.logger.error(`Error fetching models: ${error.message}`);
      throw error;
    }
  }

  async sendMessage(options: {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }) {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter API key is not configured');
    }

    this.logger.log(`Sending message to model: ${options.model}`);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Chatbot API'
        },
        body: JSON.stringify({
          model: options.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 1000
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        this.logger.error(`OpenRouter API error: ${response.status} - ${JSON.stringify(responseData)}`);
        
        if (response.status === 401) {
          throw new Error('Invalid OpenRouter API key');
        }
        
        throw new Error(responseData?.error?.message || 'OpenRouter API error');
      }

      return responseData;
    } catch (error) {
      this.logger.error(`Error calling OpenRouter API: ${error.message}`);
      throw error;
    }
  }
}
