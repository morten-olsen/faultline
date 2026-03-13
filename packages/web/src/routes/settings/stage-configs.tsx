import { Outlet, createFileRoute } from "@tanstack/react-router"

const StageConfigsLayout = (): React.ReactElement => <Outlet />

const Route = createFileRoute("/settings/stage-configs")({
  component: StageConfigsLayout,
})

export { Route }
