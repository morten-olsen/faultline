import { Bot } from 'lucide-react';
import { motion } from 'motion/react';

const ChatEmptyState = (): React.ReactElement => (
  <div className="flex flex-col items-center justify-center h-full pb-16">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.1 }}
      className="text-center space-y-3"
    >
      <div className="w-10 h-10 rounded-full bg-white/4 flex items-center justify-center mx-auto mb-4">
        <Bot size={18} className="text-text-muted/40" />
      </div>
      <p className="text-sm text-text-secondary">Ask a question or request an action.</p>
      <p className="text-xs text-text-muted leading-relaxed max-w-xs">
        Check on your infrastructure, run ad-hoc tasks, or ask about anything that happened.
      </p>
    </motion.div>
  </div>
);

export { ChatEmptyState };
