import { ArrowLeft } from 'lucide-react';

import { IconButton } from '../icon-button/icon-button.tsx';
import { PageShell } from '../page-shell/page-shell.tsx';

type SettingsTab = {
  id: string;
  label: string;
};

type SettingsShellProps = {
  title: string;
  children: React.ReactNode;
  tabs?: SettingsTab[];
  activeTab?: string;
  onBack?: () => void;
  onTabChange?: (id: string) => void;
};

const SettingsShell = ({
  title,
  children,
  tabs,
  activeTab,
  onBack,
  onTabChange,
}: SettingsShellProps): React.ReactElement => (
  <PageShell>
    {/* Top bar */}
    <div className="flex items-center gap-3 h-14">
      <IconButton icon={ArrowLeft} label="Back" size="sm" onClick={onBack} />
      <span className="text-sm font-medium tracking-tight">{title}</span>
    </div>

    {/* Tabs */}
    {tabs && tabs.length > 0 && (
      <div className="flex gap-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-all duration-fast cursor-pointer
              ${
                activeTab === tab.id
                  ? 'bg-white/8 text-text font-medium'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/4'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )}

    {/* Content */}
    <div className="pb-12">{children}</div>
  </PageShell>
);

export type { SettingsShellProps, SettingsTab };
export { SettingsShell };
