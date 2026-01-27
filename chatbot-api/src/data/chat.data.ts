export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface UserChatUsage {
  userId: string;
  messagesUsed: number;
  messagesLimit: number;
  plan: 'free' | 'pro';
}

export const chatThreads: ChatThread[] = [
  {
    id: 'chat-001',
    title: 'How to learn TypeScript',
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    messages: [
      { id: 'msg-001', role: 'user', content: 'How do I start learning TypeScript?', timestamp: new Date('2024-01-15T10:00:00') },
      { id: 'msg-002', role: 'assistant', content: 'Great question! Start with the official TypeScript documentation...', timestamp: new Date('2024-01-15T10:00:05') },
      { id: 'msg-003', role: 'user', content: 'What are the key concepts?', timestamp: new Date('2024-01-15T10:15:00') },
      { id: 'msg-004', role: 'assistant', content: 'Key concepts include: Types, Interfaces, Generics, and Type Guards...', timestamp: new Date('2024-01-15T10:15:05') },
    ],
  },
  {
    id: 'chat-002',
    title: 'NestJS Best Practices',
    createdAt: new Date('2024-01-16T14:00:00'),
    updatedAt: new Date('2024-01-16T14:45:00'),
    messages: [
      { id: 'msg-005', role: 'user', content: 'What are NestJS best practices?', timestamp: new Date('2024-01-16T14:00:00') },
      { id: 'msg-006', role: 'assistant', content: 'Here are some NestJS best practices: Use modules, leverage dependency injection...', timestamp: new Date('2024-01-16T14:00:05') },
    ],
  },
  {
    id: 'chat-003',
    title: 'Database Design Help',
    createdAt: new Date('2024-01-17T09:00:00'),
    updatedAt: new Date('2024-01-17T09:20:00'),
    messages: [
      { id: 'msg-007', role: 'user', content: 'How should I design my database schema?', timestamp: new Date('2024-01-17T09:00:00') },
      { id: 'msg-008', role: 'assistant', content: 'Database design depends on your use case. Start by identifying entities...', timestamp: new Date('2024-01-17T09:00:05') },
    ],
  },
  {
    id: 'chat-004',
    title: 'React vs Angular',
    createdAt: new Date('2024-01-18T16:00:00'),
    updatedAt: new Date('2024-01-18T16:30:00'),
    messages: [
      { id: 'msg-009', role: 'user', content: 'Should I use React or Angular?', timestamp: new Date('2024-01-18T16:00:00') },
      { id: 'msg-010', role: 'assistant', content: 'Both are excellent choices. React is more flexible, Angular is more opinionated...', timestamp: new Date('2024-01-18T16:00:05') },
    ],
  },
];

export const userUsage: UserChatUsage = {
  userId: 'user-001',
  messagesUsed: 25,
  messagesLimit: 100,
  plan: 'free',
};
