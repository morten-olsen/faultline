import { Outlet, createFileRoute } from '@tanstack/react-router';

const IntegrationsLayout = (): React.ReactElement => <Outlet />;

const Route = createFileRoute('/settings/integrations')({
  component: IntegrationsLayout,
});

export { Route };
