import { ChevronDown } from 'lucide-react';

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value?: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onChange?: (value: string) => void;
};

const Select = ({
  value,
  options,
  placeholder,
  disabled = false,
  error = false,
  onChange,
}: SelectProps): React.ReactElement => (
  <div className="relative">
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className={`
        w-full appearance-none bg-white/4 rounded-lg px-3.5 py-2.5 pr-9
        text-base outline-none transition-all duration-fast cursor-pointer
        ${value ? 'text-text' : 'text-text-muted/60'}
        ${error ? 'ring-1 ring-red-500/40 focus:ring-red-400/60' : 'ring-1 ring-white/8 focus:ring-white/20'}
        ${disabled ? 'opacity-35 pointer-events-none' : ''}
      `}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
  </div>
);

export type { SelectProps, SelectOption };
export { Select };
