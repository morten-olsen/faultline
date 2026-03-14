import { ArrowLeft, Trash2 } from 'lucide-react';

import { IconButton } from '../icon-button/icon-button.tsx';
import { Button } from '../button/button.tsx';
import { PageShell } from '../page-shell/page-shell.tsx';

type IntegrationFormProps = {
  title: string;
  children: React.ReactNode;
  isEdit?: boolean;
  saving?: boolean;
  onBack?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
};

const IntegrationForm = ({
  title,
  children,
  isEdit = false,
  saving = false,
  onBack,
  onSave,
  onDelete,
}: IntegrationFormProps): React.ReactElement => (
  <PageShell>
    {/* Top bar */}
    <div className="flex items-center justify-between h-14">
      <div className="flex items-center gap-3">
        <IconButton icon={ArrowLeft} label="Back" size="sm" onClick={onBack} />
        <span className="text-sm font-medium tracking-tight">{title}</span>
      </div>
      {isEdit && <IconButton icon={Trash2} label="Delete" variant="danger" size="sm" onClick={onDelete} />}
    </div>

    {/* Form fields */}
    <div className="space-y-5 pt-2 pb-8">{children}</div>

    {/* Actions */}
    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
      <Button variant="primary" onClick={onSave} loading={saving}>
        {isEdit ? 'Save changes' : 'Create'}
      </Button>
      <Button variant="ghost" onClick={onBack}>
        Cancel
      </Button>
    </div>
  </PageShell>
);

export type { IntegrationFormProps };
export { IntegrationForm };
