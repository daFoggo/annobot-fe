import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/dashboard";
import { AssistantProvider } from "@/features/assistant";
import { getMeQueryOptions, useLogoutMutation } from "@/features/auth";
import { DashboardHeaderContext } from "./-components/dashboard-header-context";

const DashboardLayoutRoute = () => {
	const user = Route.useLoaderData();
	const logout = useLogoutMutation();
	const navigate = useNavigate();

	return (
		<DashboardShell.Provider
			user={user}
			isSigningOut={logout.isPending}
			onSignOut={() =>
				logout.mutate(undefined, {
					onSuccess: () => navigate({ to: "/" }),
				})
			}
		>
			<AssistantProvider>
				<DashboardShell.Frame>
					<DashboardShell.Header context={<DashboardHeaderContext />} />
					<DashboardShell.Body>
						<DashboardShell.Sidebar />
						<DashboardShell.ProductMenu />
						<DashboardShell.Content>
							<Outlet />
						</DashboardShell.Content>
						<DashboardShell.Assistant />
					</DashboardShell.Body>
				</DashboardShell.Frame>
			</AssistantProvider>
		</DashboardShell.Provider>
	);
};

export const Route = createFileRoute("/_dashboard")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.query(getMeQueryOptions());
		if (!user) throw redirect({ to: "/auth/sign-in" });
	},
	loader: async ({ context }) => {
		const user = await context.queryClient.query(getMeQueryOptions());
		if (!user) throw redirect({ to: "/auth/sign-in" });
		return user;
	},
	component: DashboardLayoutRoute,
});
