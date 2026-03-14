import { useState } from 'react';
import { Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '../button/button.tsx';

type ApprovalAction = {
  label: string;
  variant: 'primary' | 'ghost';
  onClick: () => void;
};

type ApprovalCardProps = {
  title: string;
  body: string;
  actions: ApprovalAction[];
  icon?: LucideIcon;
  onReject?: (reason: string) => void;
};

const ApprovalCard = ({ title, body, actions, icon: Icon = Hand, onReject }: ApprovalCardProps): React.ReactElement => {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectClick = (): void => {
    if (onReject) {
      setShowRejectInput(true);
    }
  };

  const handleRejectSubmit = (): void => {
    if (onReject && rejectReason.trim()) {
      onReject(rejectReason.trim());
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  return (
    <div className="bg-white/3 ring-1 ring-amber-500/12 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-amber-400/80" />
        <span className="text-sm font-medium text-text">{title}</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>

      <AnimatePresence mode="wait">
        {showRejectInput ? (
          <motion.div
            key="reject-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 pt-1"
          >
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why are you rejecting this plan?"
              className="w-full bg-white/5 text-sm text-text rounded-lg px-3 py-2 border border-white/8 focus:border-amber-500/30 focus:outline-none resize-none placeholder:text-text-muted"
              rows={2}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleRejectSubmit}>
                Reject
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 pt-1"
          >
            {actions.map((action) => (
              <Button key={action.label} variant={action.variant} size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
            {onReject && (
              <Button variant="ghost" size="sm" onClick={handleRejectClick}>
                Reject
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export type { ApprovalCardProps, ApprovalAction };
export { ApprovalCard };
