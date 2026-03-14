import { Outlet, createFileRoute } from '@tanstack/react-router';

const SettingsLayout = (): React.ReactElement => <Outlet />;

const Route = createFileRoute('/settings')({
  component: SettingsLayout,
});

export { Route };
