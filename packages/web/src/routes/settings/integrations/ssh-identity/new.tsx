import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Shield } from 'lucide-react';

import { useClient } from '../../../../client/client.context.js';
import { IntegrationForm } from '../../../../components/integration-form/integration-form.tsx';
import { FormField } from '../../../../components/form-field/form-field.tsx';
import { Input } from '../../../../components/input/input.tsx';
import { TextArea } from '../../../../components/text-area/text-area.tsx';
import { ToggleGroup } from '../../../../components/toggle-group/toggle-group.tsx';
import { AnimatedField } from '../../../../components/animated-field/animated-field.tsx';

const NewSshIdentity = (): React.ReactElement => {
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [source, setSource] = useState<'generate' | 'import'>('generate');
  const [privateKey, setPrivateKey] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      client.call['sshIdentities.create']({
        name,
        source,
        ...(source === 'import' ? { privateKey } : {}),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sshIdentities'] });
      navigate({ to: `/settings/integrations/ssh-identity/${data.identity.id}/edit` });
    },
  });

  const canSave = name.trim().length > 0 && (source === 'generate' || privateKey.trim().length > 0);

  return (
    <IntegrationForm
      title="New SSH Identity"
      saving={mutation.isPending}
      onBack={() => navigate({ to: '/settings/integrations' })}
      onSave={() => canSave && mutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name" description="How you'll refer to this key elsewhere in Faultline">
          <Input placeholder="deploy-readonly" value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Key source">
          <ToggleGroup
            value={source}
            onChange={(v) => setSource(v as 'generate' | 'import')}
            options={[
              { value: 'generate', label: 'Generate' },
              { value: 'import', label: 'Import' },
            ]}
          />
        </FormField>
      </AnimatedField>

      {source === 'generate' ? (
        <AnimatedField index={2}>
          <div className="flex items-start gap-2.5 bg-white/3 rounded-xl px-4 py-3">
            <Shield size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-secondary leading-relaxed">
              An ed25519 keypair will be generated on the server. The private key never leaves the host.
            </span>
          </div>
        </AnimatedField>
      ) : (
        <AnimatedField index={2}>
          <FormField
            label="Private key"
            description="Paste your key here. It stays on the server and is never sent back to the browser."
          >
            <TextArea
              placeholder={'-----BEGIN OPENSSH PRIVATE KEY-----\n...'}
              rows={6}
              mono
              value={privateKey}
              onChange={(v) => setPrivateKey(v)}
            />
          </FormField>
        </AnimatedField>
      )}
    </IntegrationForm>
  );
};

const Route = createFileRoute('/settings/integrations/ssh-identity/new')({
  component: NewSshIdentity,
});

export { Route };
