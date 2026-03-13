import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const hashHistory = createHashHistory();
const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  history: hashHistory,
  context: { queryClient },
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const App = (): React.ReactElement => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

export { App };
