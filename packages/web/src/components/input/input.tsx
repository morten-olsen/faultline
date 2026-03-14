import { Input as BaseInput } from '@base-ui/react/input';
import { type LucideIcon } from 'lucide-react';

type InputProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  error?: string;
  onChange?: (value: string) => void;
};

const Input = ({
  value,
  defaultValue,
  placeholder,
  icon: Icon,
  disabled = false,
  error,
  onChange,
}: InputProps): React.ReactElement => (
  <div>
    <div
      className={`
      flex items-center gap-2.5 bg-white/4 rounded-lg px-3.5 py-2.5
      transition-all duration-fast
      ${
        error ? 'ring-1 ring-red-500/40 focus-within:ring-red-400/60' : 'ring-1 ring-white/8 focus-within:ring-white/20'
      }
      ${disabled ? 'opacity-35 pointer-events-none' : ''}
    `}
    >
      {Icon && <Icon size={16} className="text-text-muted flex-shrink-0" />}
      <BaseInput
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="
          flex-1 bg-transparent text-base text-text placeholder:text-text-muted/60
          outline-none min-w-0
        "
      />
    </div>
    {error && <p className="text-red-400 text-sm mt-2 ml-1">{error}</p>}
  </div>
);

export type { InputProps };
export { Input };
