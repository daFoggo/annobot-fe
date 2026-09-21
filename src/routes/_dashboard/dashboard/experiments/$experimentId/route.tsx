import { createFileRoute, Outlet } from "@tanstack/react-router";
import { experimentDetailQueryOptions } from "@/features/experiments";
import { ExperimentSidebarNav } from "./-components/experiment-sidebar-nav";

/**
 * Layout của một experiment: nạp chi tiết (critical) rồi để các trang con render
 * trong content. Vào experiment thì sidebar cấp 1 mới xuất hiện (nav của
 * experiment); tên experiment hiển thị ở switcher trên header.
 */
export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId",
)({
	staticData: {
		sidebarNav: ExperimentSidebarNav,
	},
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			experimentDetailQueryOptions(params.experimentId),
		),
	component: () => <Outlet />,
});
