import { Pinecone } from '@pinecone-database/pinecone';

export const PINECONE_INDEX_NAME = 'chatbot-memory';
export const EMBEDDING_DIMENSION = 1024;
export const EMBEDDING_MODEL = 'multilingual-e5-large';

let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API;
    if (!apiKey) {
      throw new Error('PINECONE_API env niot found');
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}