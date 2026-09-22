import { IconDevices, IconFlask, IconHome } from "@tabler/icons-react";
import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout của section dashboard: sidebar cấp 1 xuất hiện ngay từ route này với
 * nav Home/Experiments/Devices; các trang con render trong content.
 */
export const Route = createFileRoute("/_dashboard/dashboard")({
	staticData: {
		navItems: [
			{
				key: "main",
				items: [
					{ label: "Home", to: "/dashboard", icon: IconHome, exact: true },
					{
						label: "Experiments",
						to: "/dashboard/experiments",
						icon: IconFlask,
					},
					{
						label: "Devices",
						to: "/dashboard/devices",
						icon: IconDevices,
						exact: true,
					},
				],
			},
		],
	},
	component: () => <Outlet />,
});
