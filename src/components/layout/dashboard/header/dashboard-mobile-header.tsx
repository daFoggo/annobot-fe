import { Link } from "@tanstack/react-router";
import { AppLogo } from "@/components/common/app-logo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ProductMenuSheetTrigger } from "../product-menu/product-menu-sheet";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { DashboardUserMenu } from "./dashboard-user-menu";

/**
 * Thanh điều hướng riêng cho mobile. Supabase Studio dùng một bar tách biệt
 * thay vì thu nhỏ header desktop, nên layout ở đây cũng làm tương tự.
 *
 * Không nhận prop boolean nào: nút product menu là một part tự quyết định
 * hiện/ẩn dựa trên shell context.
 */
export const DashboardMobileHeader = () => (
	<nav className="flex h-12 w-full shrink-0 items-center gap-2 overflow-x-auto border-b bg-sidebar pr-3 pl-2 md:hidden">
		<Link to="/" aria-label="Home" className="flex shrink-0 items-center">
			<AppLogo hideTitle />
		</Link>
		<div className="min-w-0 flex-1">
			<DashboardBreadcrumb />
		</div>
		<div className="flex shrink-0 items-center gap-1">
			<DashboardUserMenu />
			<SidebarTrigger variant="outline" aria-label="Open navigation" />
			<ProductMenuSheetTrigger />
		</div>
	</nav>
);
