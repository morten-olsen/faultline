import { Button as BaseButton } from '@base-ui/react/button'
import { type LucideIcon } from 'lucide-react'

type IconButtonVariant = 'ghost' | 'secondary' | 'danger'
type IconButtonSize = 'sm' | 'md' | 'lg'

type IconButtonProps = {
  icon: LucideIcon
  label: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  disabled?: boolean
  onClick?: () => void
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: 'text-text-muted hover:text-text hover:bg-white/6 active:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/20',
  secondary: 'text-text-secondary bg-white/6 hover:bg-white/10 hover:text-text active:bg-white/14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/20',
  danger: 'text-text-muted hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400/50',
}

const sizeConfig: Record<IconButtonSize, { box: string; icon: number }> = {
  sm: { box: 'w-7 h-7 rounded-lg', icon: 14 },
  md: { box: 'w-9 h-9 rounded-lg', icon: 16 },
  lg: { box: 'w-10 h-10 rounded-lg', icon: 18 },
}

const IconButton = ({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
}: IconButtonProps): React.ReactElement => {
  const cfg = sizeConfig[size]

  return (
    <BaseButton
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        transition-all duration-fast cursor-pointer select-none
        data-[disabled]:opacity-35 data-[disabled]:pointer-events-none
        ${variantStyles[variant]}
        ${cfg.box}
      `}
    >
      <Icon size={cfg.icon} />
    </BaseButton>
  )
}

export type { IconButtonProps, IconButtonVariant, IconButtonSize }
export { IconButton }
