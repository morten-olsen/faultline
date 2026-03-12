import { createFileRoute } from "@tanstack/react-router";

function IndexComponent(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Faultline</h1>
        <p className="mt-2 text-neutral-400">
          Autonomous infrastructure management
        </p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexComponent,
});
