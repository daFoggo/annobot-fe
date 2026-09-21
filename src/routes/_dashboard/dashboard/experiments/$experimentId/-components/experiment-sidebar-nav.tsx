import { IconChartBar, IconSettings } from "@tabler/icons-react";
import { Link, useMatch } from "@tanstack/react-router";
import { usePathname } from "@/components/layout/dashboard";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

/**
 * Nav của sidebar cấp 1 khi đang trong một experiment. Vì route có param động,
 * component tự resolve `experimentId` từ URL và truyền `params` cho `Link`
 * (thứ mà `staticData.navItems` tĩnh không biểu diễn được).
 */
export const ExperimentSidebarNav = () => {
	const pathname = usePathname();
	const match = useMatch({
		from: "/_dashboard/dashboard/experiments/$experimentId",
		shouldThrow: false,
	});
	const experimentId = match?.params.experimentId ?? "";
	const overviewPath = `/dashboard/experiments/${experimentId}`;

	return (
		<SidebarGroup className="gap-0.5">
			<SidebarMenu className="gap-1">
				<SidebarMenuItem>
					<SidebarMenuButton
						render={
							<Link
								to="/dashboard/experiments/$experimentId"
								params={{ experimentId }}
							/>
						}
						isActive={pathname === overviewPath}
						tooltip="Overview"
					>
						<IconChartBar />
						<span>Overview</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
				<SidebarMenuItem>
					<SidebarMenuButton
						render={
							<Link
								to="/dashboard/experiments/$experimentId/settings"
								params={{ experimentId }}
							/>
						}
						isActive={pathname === `${overviewPath}/settings`}
						tooltip="Settings"
					>
						<IconSettings />
						<span>Settings</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
};
