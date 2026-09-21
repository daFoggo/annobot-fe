import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthShell } from "@/components/layout/auth";

const AuthLayout = () => (
	<AuthShell>
		<Outlet />
	</AuthShell>
);

export const Route = createFileRoute("/auth")({
	component: AuthLayout,
});
