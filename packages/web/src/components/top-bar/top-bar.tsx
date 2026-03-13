import { Search, Plus, MessageSquare, Settings, User, ArrowLeft, MoreHorizontal } from 'lucide-react'
import { IconButton } from '../icon-button/icon-button.tsx'

type TopBarVariant = 'home' | 'detail'

type TopBarProps = {
  variant?: TopBarVariant
  onBack?: () => void
  onChat?: () => void
  onSettings?: () => void
}

const TopBar = ({ variant = 'home', onBack, onChat, onSettings }: TopBarProps): React.ReactElement => (
  <div className="flex items-center justify-between h-14">
    {variant === 'home' ? (
      <>
        <span className="text-sm font-medium tracking-tight">Faultline</span>
        <div className="flex items-center gap-1">
          <IconButton icon={Search} label="Search issues" size="sm" />
          <IconButton icon={Plus} label="Create issue" size="sm" />
          <IconButton icon={MessageSquare} label="Ask the agent" size="sm" onClick={onChat} />
          <IconButton icon={Settings} label="Settings" size="sm" onClick={onSettings} />
          <div className="w-px h-4 bg-white/8 mx-1" />
          <IconButton icon={User} label="Account" size="sm" />
        </div>
      </>
    ) : (
      <>
        <IconButton icon={ArrowLeft} label="Back" size="sm" onClick={onBack} />
        <IconButton icon={MoreHorizontal} label="More actions" size="sm" />
      </>
    )}
  </div>
)

export type { TopBarProps, TopBarVariant }
export { TopBar }
