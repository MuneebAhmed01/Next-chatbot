"use client";

interface ContextIndicatorProps {
  messageCount: number;
  maxContext: number;
}

export default function ContextIndicator({ messageCount, maxContext }: ContextIndicatorProps) {
  const contextMessages = Math.min(messageCount, maxContext);
  const hasContext = contextMessages > 1;

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-gray-800/50 rounded-full border border-gray-700/50">
      <div className={`w-2 h-2 rounded-full ${hasContext ? 'bg-green-500' : 'bg-gray-500'}`}></div>
      <span className="text-xs text-gray-400">
        {hasContext ? `${contextMessages} messages in context` : 'No context'}
      </span>
    </div>
  );
}
