import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppLogo } from "@/components/common/app-logo";
import { ThemeToggle } from "@/components/common/theme-provider";
import { usePathname } from "../dashboard-nav";
import { useDashboardShell } from "../dashboard-shell-context";
import {
	DashboardBreadcrumb,
	useDashboardBreadcrumbActions,
	useDashboardBreadcrumbs,
} from "./dashboard-breadcrumb";
import { DashboardHeaderDivider } from "./dashboard-header-divider";
import { DashboardHelpMenu } from "./dashboard-help-menu";
import { DashboardSearchTrigger } from "./dashboard-search-trigger";
import { DashboardUserMenu } from "./dashboard-user-menu";

export interface DashboardHeaderProps {
	/** Bộ chọn ngữ cảnh (workspace, môi trường...) nằm sau logo. */
	context?: ReactNode;
	/** Hành động cấp ứng dụng nằm sau breadcrumb (ví dụ nút "Connect"). */
	actions?: ReactNode;
}

/**
 * Header desktop, chạy hết chiều ngang và nằm TRÊN sidebar (như Supabase
 * Studio). Chỉ hiển thị từ breakpoint `md`; dưới đó dùng `DashboardMobileHeader`.
 *
 * Ở cấp gốc (không có breadcrumb) logo hiện kèm tiêu đề; khi vào một section có
 * breadcrumb thì logo chỉ còn icon để nhường chỗ cho ngữ cảnh.
 */
export const DashboardHeader = ({ context, actions }: DashboardHeaderProps) => {
	const hasBreadcrumb = useDashboardBreadcrumbs().length > 0;
	const BreadcrumbActions = useDashboardBreadcrumbActions();
	const hasBreadcrumbArea = hasBreadcrumb || Boolean(BreadcrumbActions);
	const hasNav = useDashboardShell().state.hasNav;
	const pathname = usePathname();
	// Ở /dashboard (Home) logo giữ tiêu đề; các nơi khác có nav/breadcrumb thì
	// chỉ còn icon để nhường chỗ cho ngữ cảnh.
	const hideLogoTitle =
		hasBreadcrumbArea || (hasNav && pathname !== "/dashboard");

	return (
		<header className="hidden h-11 shrink-0 items-center border-b bg-sidebar md:flex md:h-12">
			<div className="flex h-full flex-1 items-center justify-between gap-x-8 overflow-x-auto pr-3 pl-4">
				<div className="flex min-w-0 items-center text-sm">
					<Link to="/" aria-label="Home" className="flex shrink-0 items-center">
						<AppLogo hideTitle={hideLogoTitle} />
					</Link>
					{context}
					{hasBreadcrumbArea ? (
						<>
							<DashboardHeaderDivider className="pl-2" />
							<DashboardBreadcrumb>
								{BreadcrumbActions ? <BreadcrumbActions /> : null}
							</DashboardBreadcrumb>
						</>
					) : null}
					{actions ? (
						<div className="ml-3 flex shrink-0 items-center gap-x-2">
							{actions}
						</div>
					) : null}
				</div>
				<div className="flex shrink-0 items-center gap-x-2">
					<DashboardSearchTrigger />
					<div className="flex items-center gap-1">
						<DashboardHelpMenu />
						<ThemeToggle />
					</div>
					<DashboardUserMenu />
				</div>
			</div>
		</header>
	);
};
