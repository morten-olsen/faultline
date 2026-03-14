import { Outlet, createFileRoute } from '@tanstack/react-router';

const IssuesLayout = (): React.ReactElement => <Outlet />;

const Route = createFileRoute('/issues')({
  component: IssuesLayout,
});

export { Route };
