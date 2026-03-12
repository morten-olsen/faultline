import { type LucideIcon } from 'lucide-react'

type BadgeVariant = 'default' | 'healthy' | 'warning' | 'critical' | 'info'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  icon?: LucideIcon
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'text-text-muted bg-white/5',
  healthy: 'text-green-400 bg-green-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  critical: 'text-red-400 bg-red-500/10',
  info: 'text-blue-400 bg-blue-500/10',
}

const Badge = ({
  children,
  variant = 'default',
  icon: Icon,
}: BadgeProps): React.ReactElement => (
  <span className={`
    inline-flex items-center gap-1 text-xs font-medium leading-none
    px-2 py-1 rounded-full
    ${variantStyles[variant]}
  `}>
    {Icon && <Icon size={12} strokeWidth={2.5} />}
    {children}
  </span>
)

export type { BadgeProps, BadgeVariant }
export { Badge }
