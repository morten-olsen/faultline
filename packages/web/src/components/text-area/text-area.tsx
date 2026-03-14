type TextAreaProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  error?: boolean;
  mono?: boolean;
  onChange?: (value: string) => void;
};

const TextArea = ({
  value,
  defaultValue,
  placeholder,
  rows = 4,
  disabled = false,
  error = false,
  mono = false,
  onChange,
}: TextAreaProps): React.ReactElement => (
  <textarea
    value={value}
    defaultValue={defaultValue}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    onChange={(e) => onChange?.(e.target.value)}
    className={`
      w-full bg-white/4 rounded-lg px-3.5 py-2.5 resize-none
      text-base text-text placeholder:text-text-muted/60
      outline-none transition-all duration-fast
      ${mono ? 'font-mono text-sm' : ''}
      ${error ? 'ring-1 ring-red-500/40 focus:ring-red-400/60' : 'ring-1 ring-white/8 focus:ring-white/20'}
      ${disabled ? 'opacity-35 pointer-events-none' : ''}
    `}
  />
);

export type { TextAreaProps };
export { TextArea };
