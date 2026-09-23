import {
	IconAdjustments,
	IconHelpCircle,
	IconSettings,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useMatch } from "@tanstack/react-router";
import { usePathname } from "@/components/layout/dashboard";
import { Badge } from "@/components/ui/badge";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { inquiryListQueryOptions } from "@/features/inquiries";

/**
 * Sidebar cấp 2 của phần Setup, khai báo qua `staticData.productMenu`.
 *
 * Không dùng được `ProductMenuNav` sẵn có vì nó nhận `to` tĩnh, trong khi các
 * route ở đây có param `$experimentId`. Cấu trúc và spacing giữ nguyên như
 * `ProductMenuNav` để hai chỗ trông như một.
 *
 * `/setup` trỏ vào General: vào Setup là để sửa chính experiment trước đã, còn
 * Inquiries có route riêng `/setup/inquiries`.
 */
export const ExperimentSetupMenu = () => {
	const pathname = usePathname();
	const match = useMatch({
		from: "/_dashboard/dashboard/experiments/$experimentId",
		shouldThrow: false,
	});
	const experimentId = match?.params.experimentId ?? "";
	const base = `/dashboard/experiments/${experimentId}/setup`;

	const { data: inquiries } = useQuery({
		...inquiryListQueryOptions(experimentId),
		enabled: experimentId !== "",
	});

	return (
		<div className="flex flex-col gap-4 py-2">
			<div className="flex flex-col gap-1 px-2">
				<SidebarMenu className="gap-1">
					<SidebarMenuItem>
						<SidebarMenuButton
							render={
								<Link
									to="/dashboard/experiments/$experimentId/setup"
									params={{ experimentId }}
								/>
							}
							isActive={pathname === base}
						>
							<IconSettings />
							<span>General</span>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							render={
								<Link
									to="/dashboard/experiments/$experimentId/setup/inquiries"
									params={{ experimentId }}
								/>
							}
							isActive={pathname === `${base}/inquiries`}
						>
							<IconHelpCircle />
							<span>Inquiries</span>
							{inquiries ? (
								<Badge variant="secondary" className="ml-auto">
									{inquiries.length}
								</Badge>
							) : null}
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton
							render={
								<Link
									to="/dashboard/experiments/$experimentId/setup/interaction"
									params={{ experimentId }}
								/>
							}
							isActive={pathname === `${base}/interaction`}
						>
							<IconAdjustments />
							<span>Interaction</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</div>
		</div>
	);
};
