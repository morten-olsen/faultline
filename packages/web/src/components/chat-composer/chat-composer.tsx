import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

type ChatComposerProps = {
  placeholder?: string
  disabled?: boolean
  onSend?: (message: string) => void
}

const ChatComposer = ({
  placeholder = 'Ask something…',
  disabled = false,
  onSend,
}: ChatComposerProps): React.ReactElement => {
  const [value, setValue] = useState('')
  const canSend = value.trim().length > 0 && !disabled

  const handleSend = (): void => {
    if (!canSend) return
    onSend?.(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`
      flex items-end gap-2 bg-white/4 rounded-xl px-3.5 py-2.5
      ring-1 ring-white/8 focus-within:ring-white/20 transition-all duration-fast
      ${disabled ? 'opacity-35 pointer-events-none' : ''}
    `}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="
          flex-1 bg-transparent text-sm text-text placeholder:text-text-muted/60
          outline-none min-w-0 resize-none leading-relaxed py-0.5
          max-h-32 overflow-y-auto
        "
        style={{ fieldSizing: 'content' } as React.CSSProperties}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className={`
          flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
          transition-all duration-fast cursor-pointer
          ${canSend
            ? 'bg-white text-neutral-950 hover:bg-neutral-200 active:bg-neutral-300'
            : 'bg-white/6 text-text-muted/30 cursor-default'
          }
        `}
        aria-label="Send message"
      >
        <ArrowUp size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export type { ChatComposerProps }
export { ChatComposer }
