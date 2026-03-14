import { Button as BaseButton } from '@base-ui/react/button';
import { type LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-white text-neutral-950 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50',
  secondary:
    'bg-white/8 text-text-secondary hover:bg-white/12 hover:text-text active:bg-white/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/20',
  ghost:
    'text-text-secondary hover:text-text hover:bg-white/6 active:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/20',
  danger:
    'bg-red-500/12 text-red-400 hover:bg-red-500/20 active:bg-red-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm h-8 px-3 gap-1.5 rounded-lg',
  md: 'text-sm h-9 px-3.5 gap-2 rounded-lg',
  lg: 'text-base h-10 px-4 gap-2 rounded-lg',
};

const iconSizes: Record<ButtonSize, number> = {
  sm: 14,
  md: 15,
  lg: 16,
};

const Button = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  loading = false,
  onClick,
}: ButtonProps): React.ReactElement => {
  const iconSize = iconSizes[size];

  return (
    <BaseButton
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-fast cursor-pointer select-none
        data-[disabled]:opacity-35 data-[disabled]:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
    >
      {loading ? (
        <svg className="animate-spin" width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path d="M8 2a6 6 0 014.9 9.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : Icon ? (
        <Icon size={iconSize} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={iconSize} />}
    </BaseButton>
  );
};

export type { ButtonProps, ButtonVariant, ButtonSize };
export { Button };
