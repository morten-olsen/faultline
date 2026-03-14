import { forwardRef } from 'react';
import { ArrowLeft, Bot } from 'lucide-react';

type ChatLayoutProps = {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  composer: React.ReactNode;
  onBack?: () => void;
};

const ChatLayout = forwardRef<HTMLDivElement, ChatLayoutProps>(
  ({ children, trailing, composer, onBack }, ref): React.ReactElement => (
    <div className="bg-bg min-h-screen font-sans text-text antialiased flex flex-col">
      <div className="max-w-lg mx-auto px-5 w-full flex flex-col flex-1 min-h-0">
        {/* Nav bar */}
        <div className="flex items-center justify-between h-14 flex-shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Bot size={14} className="text-blue-400/50" />
              <span className="text-xs text-text-muted">Chat</span>
            </div>
            {trailing}
          </div>
        </div>

        {/* Messages area */}
        <div ref={ref} className="flex-1 overflow-y-auto min-h-0 pt-4 pb-4">
          {children}
        </div>

        {/* Composer */}
        <div className="pb-6 pt-2 flex-shrink-0">{composer}</div>
      </div>
    </div>
  ),
);

ChatLayout.displayName = 'ChatLayout';

export type { ChatLayoutProps };
export { ChatLayout };
