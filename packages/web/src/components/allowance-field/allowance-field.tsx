import { ChevronDown } from 'lucide-react'
import { Tag } from '../tag/tag.tsx'

/* ── Types ────────────────────────────────────────────────────────── */

type AllowanceOption = {
  value: string
  label: string
}

type AllowanceMode = 'all' | 'select' | 'none'

type AllowanceFieldProps = {
  label: string
  description?: string
  mode: AllowanceMode
  selected: string[]
  options: AllowanceOption[]
  onModeChange?: (mode: AllowanceMode) => void
  onAdd?: (value: string) => void
  onRemove?: (value: string) => void
}

/* ── Mode toggle ──────────────────────────────────────────────────── */

const modes: { value: AllowanceMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'select', label: 'Select' },
  { value: 'none', label: 'None' },
]

const ModeToggle = ({
  value,
  onChange,
}: {
  value: AllowanceMode
  onChange?: (mode: AllowanceMode) => void
}): React.ReactElement => (
  <div className="flex gap-1 bg-white/4 ring-1 ring-white/8 rounded-lg p-1">
    {modes.map((m) => (
      <button
        key={m.value}
        type="button"
        onClick={() => onChange?.(m.value)}
        className={`
          flex-1 text-sm py-1 px-2.5 rounded-md transition-all duration-fast cursor-pointer
          ${m.value === value
            ? 'bg-white/10 text-text font-medium'
            : 'text-text-muted hover:text-text-secondary'
          }
        `}
      >
        {m.label}
      </button>
    ))}
  </div>
)

/* ── Component ────────────────────────────────────────────────────── */

const AllowanceField = ({
  label,
  description,
  mode,
  selected,
  options,
  onModeChange,
  onAdd,
  onRemove,
}: AllowanceFieldProps): React.ReactElement => {
  // Options not yet selected
  const available = options.filter((o) => !selected.includes(o.value))

  // Build label lookup for selected values
  const labelMap = new Map(options.map((o) => [o.value, o.label]))

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label className="text-sm font-medium text-text">{label}</label>
          {description && (
            <p className="text-sm text-text-muted mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0 mt-0.5">
          <ModeToggle value={mode} onChange={onModeChange} />
        </div>
      </div>

      {mode === 'all' && (
        <p className="text-sm text-text-muted py-1">
          Agent can access all {label.toLowerCase()}
        </p>
      )}

      {mode === 'none' && (
        <p className="text-sm text-text-muted py-1">
          Agent cannot access any {label.toLowerCase()}
        </p>
      )}

      {mode === 'select' && (
        <div className="space-y-2">
          {/* Dropdown to add */}
          {available.length > 0 && (
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onAdd?.(e.target.value)
                }}
                className="
                  w-full appearance-none bg-white/4 rounded-lg px-3.5 py-2.5 pr-9
                  text-base text-text-muted/60 outline-none transition-all duration-fast cursor-pointer
                  ring-1 ring-white/8 focus:ring-white/20
                "
              >
                <option value="" disabled>Add…</option>
                {available.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          )}

          {/* Selected tags */}
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => (
                <Tag key={id} variant="default" removable onRemove={() => onRemove?.(id)}>
                  {labelMap.get(id) ?? id}
                </Tag>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted py-1">
              No {label.toLowerCase()} selected — agent has no access
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export type { AllowanceFieldProps, AllowanceMode, AllowanceOption }
export { AllowanceField }
