import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { QueryClient } from "@tanstack/react-query";

type RouterContext = {
  queryClient: QueryClient;
};

function RootComponent(): React.ReactElement {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});
