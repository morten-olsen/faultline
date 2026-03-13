type ToggleOption = {
  value: string
  label: string
}

type ToggleGroupProps = {
  options: ToggleOption[]
  value: string
  onChange?: (value: string) => void
}

const ToggleGroup = ({ options, value, onChange }: ToggleGroupProps): React.ReactElement => (
  <div className="flex gap-1 bg-white/4 ring-1 ring-white/8 rounded-lg p-1">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange?.(opt.value)}
        className={`
          flex-1 text-sm py-1.5 rounded-md transition-all duration-fast cursor-pointer
          ${opt.value === value
            ? 'bg-white/10 text-text font-medium'
            : 'text-text-muted hover:text-text-secondary'
          }
        `}
      >
        {opt.label}
      </button>
    ))}
  </div>
)

export type { ToggleGroupProps, ToggleOption }
export { ToggleGroup }
