import { IconDeviceDesktop, IconHome } from "@tabler/icons-react";
import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout của section dashboard: sidebar cấp 1 xuất hiện ngay từ route này với
 * nav Home/Devices; các trang con render trong content.
 */
export const Route = createFileRoute("/_dashboard/dashboard")({
	staticData: {
		navItems: [
			{
				key: "main",
				items: [
					{ label: "Home", to: "/dashboard", icon: IconHome, exact: true },
					{
						label: "Devices",
						to: "/dashboard/devices",
						icon: IconDeviceDesktop,
						exact: true,
					},
				],
			},
		],
	},
	component: () => <Outlet />,
});
