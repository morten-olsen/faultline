import { X } from 'lucide-react'

type TagVariant = 'default' | 'healthy' | 'warning' | 'critical' | 'info'

type TagProps = {
  children: React.ReactNode
  variant?: TagVariant
  removable?: boolean
  onRemove?: () => void
}

const variantStyles: Record<TagVariant, string> = {
  default: 'text-text-secondary bg-white/6',
  healthy: 'text-green-400 bg-green-500/8',
  warning: 'text-amber-400 bg-amber-500/8',
  critical: 'text-red-400 bg-red-500/8',
  info: 'text-blue-400 bg-blue-500/8',
}

const Tag = ({
  children,
  variant = 'default',
  removable = false,
  onRemove,
}: TagProps): React.ReactElement => (
  <span className={`
    inline-flex items-center gap-1.5 text-sm
    px-2.5 py-0.5 rounded-md
    ${variantStyles[variant]}
  `}>
    {children}
    {removable && (
      <button
        type="button"
        onClick={onRemove}
        className="
          opacity-40 hover:opacity-100 transition-opacity duration-fast
          cursor-pointer -mr-0.5
        "
      >
        <X size={12} />
      </button>
    )}
  </span>
)

export type { TagProps, TagVariant }
export { Tag }
