import { Bot, User } from 'lucide-react';

type ChatBubbleRole = 'user' | 'assistant';

type ChatBubbleProps = {
  role: ChatBubbleRole;
  children: React.ReactNode;
  timestamp?: string;
};

const ChatBubble = ({ role, children, timestamp }: ChatBubbleProps): React.ReactElement => {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`
        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5
        ${isUser ? 'bg-white/8' : 'bg-blue-500/10'}
      `}
      >
        {isUser ? <User size={12} className="text-text-secondary" /> : <Bot size={12} className="text-blue-400/70" />}
      </div>

      {/* Message */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`
          rounded-xl px-3.5 py-2.5 max-w-[85%]
          ${isUser ? 'bg-white/8 text-text' : 'text-text-secondary'}
        `}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{children}</div>
        </div>
        {timestamp && (
          <span className={`text-xs text-text-muted/40 font-mono mt-1.5 px-1 ${isUser ? 'text-right' : ''}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
};

type ChatBubbleTypingProps = {
  label?: string;
};

const ChatBubbleTyping = ({ label = 'Thinking…' }: ChatBubbleTypingProps): React.ReactElement => (
  <div className="flex gap-2.5">
    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 bg-blue-500/10">
      <Bot size={12} className="text-blue-400/70" />
    </div>
    <div className="flex items-center gap-2 py-2">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-text-muted/30 animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-text-muted/30 animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-text-muted/30 animate-pulse" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  </div>
);

export type { ChatBubbleProps, ChatBubbleRole, ChatBubbleTypingProps };
export { ChatBubble, ChatBubbleTyping };
