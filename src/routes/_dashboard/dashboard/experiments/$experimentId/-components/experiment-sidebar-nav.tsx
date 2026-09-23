import {
	IconLayoutDashboard,
	IconSettings,
	IconWaveSine,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useMatch } from "@tanstack/react-router";
import { usePathname } from "@/components/layout/dashboard";
import { Badge } from "@/components/ui/badge";
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	CASES_OVERVIEW_PAGE_SIZE,
	caseListQueryOptions,
} from "@/features/cases";

/**
 * Nav của một experiment, chia theo việc người dùng làm chứ không theo bảng dữ
 * liệu: xem nó tìm được gì (Overview, Cases) và cấu hình nó (Setup).
 *
 * Số đếm dùng lại đúng query key mà trang Overview dùng, nên TanStack Query
 * dedupe — nav không tạo thêm request nào.
 */
export const ExperimentSidebarNav = () => {
	const pathname = usePathname();
	const match = useMatch({
		from: "/_dashboard/dashboard/experiments/$experimentId",
		shouldThrow: false,
	});
	const experimentId = match?.params.experimentId ?? "";
	const base = `/dashboard/experiments/${experimentId}`;
	const enabled = experimentId !== "";

	const { data: cases } = useQuery({
		...caseListQueryOptions({
			experiment_id: experimentId,
			page: 1,
			page_size: CASES_OVERVIEW_PAGE_SIZE,
		}),
		enabled,
	});

	const inSetup = pathname.startsWith(`${base}/setup`);

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
						isActive={pathname === base}
						tooltip="Overview"
					>
						<IconLayoutDashboard />
						<span>Overview</span>
					</SidebarMenuButton>
				</SidebarMenuItem>

				<SidebarMenuItem>
					<SidebarMenuButton
						render={
							<Link
								to="/dashboard/experiments/$experimentId/cases"
								params={{ experimentId }}
							/>
						}
						isActive={pathname === `${base}/cases`}
						tooltip="Cases"
					>
						<IconWaveSine />
						<span>Cases</span>
						{cases ? (
							<Badge variant="secondary" className="ml-auto">
								{cases.total_count}
							</Badge>
						) : null}
					</SidebarMenuButton>
				</SidebarMenuItem>

				<SidebarMenuItem>
					<SidebarMenuButton
						render={
							<Link
								to="/dashboard/experiments/$experimentId/setup"
								params={{ experimentId }}
							/>
						}
						isActive={inSetup}
						tooltip="Setup"
					>
						<IconSettings />
						<span>Setup</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
};
