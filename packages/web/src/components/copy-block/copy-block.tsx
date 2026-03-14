import { Copy } from 'lucide-react';

type CopyBlockProps = {
  value: string;
  label?: string;
  onCopy?: () => void;
};

const CopyBlock = ({ value, label, onCopy }: CopyBlockProps): React.ReactElement => (
  <div>
    {label && (
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-muted">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="
            flex items-center gap-1 text-xs text-text-muted
            hover:text-text-secondary transition-colors duration-fast cursor-pointer
          "
        >
          <Copy size={12} />
          Copy
        </button>
      </div>
    )}
    <div className="bg-white/4 ring-1 ring-white/8 rounded-lg px-3.5 py-2.5 font-mono text-sm text-text-secondary break-all select-all">
      {value}
    </div>
  </div>
);

export type { CopyBlockProps };
export { CopyBlock };
