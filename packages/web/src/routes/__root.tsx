import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ClientProvider } from "../client/client.context.js";

import type { QueryClient } from "@tanstack/react-query";

type RouterContext = {
  queryClient: QueryClient;
};

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${import.meta.env.BASE_URL}api/ws`;

function RootComponent(): React.ReactElement {
  return (
    <ClientProvider url={WS_URL}>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </div>
    </ClientProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});
