import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { TopBar } from "../components/top-bar/top-bar.tsx";
import { Button } from "../components/button/button.tsx";

function IndexComponent(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="bg-bg min-h-screen font-sans text-text antialiased">
      <div className="max-w-lg mx-auto px-5">
        <TopBar
          onChat={() => navigate({ to: "/chat" })}
          onSettings={() => navigate({ to: "/settings/integrations" })}
        />
        <div className="pt-8 pb-12">
          <h1 className="text-2xl font-medium tracking-tight">Faultline</h1>
          <p className="mt-2 text-text-muted text-sm">
            Autonomous infrastructure management
          </p>
          <div className="mt-6">
            <Button
              variant="secondary"
              icon={AlertTriangle}
              onClick={() => navigate({ to: "/issues" })}
            >
              Issues
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexComponent,
});
