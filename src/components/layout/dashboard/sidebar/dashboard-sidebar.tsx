import type { ReactNode } from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
} from "@/components/ui/sidebar";
import { DashboardSidebarControl } from "./dashboard-sidebar-control";

export interface DashboardSidebarProps {
	collapsible?: "offcanvas" | "icon" | "none";
	/** Nội dung nav — thường là `<DashboardSidebarNav />`. */
	children: ReactNode;
	className?: string;
}

/**
 * Frame thuần UI của sidebar cấp 1: chỉ lo khung (content + footer + nút
 * thu gọn), không biết gì về dữ liệu nav. Nav được compose từ bên ngoài.
 */
export const DashboardSidebar = ({
	collapsible = "icon",
	children,
	className,
}: DashboardSidebarProps) => (
	<Sidebar collapsible={collapsible} variant="sidebar" className={className}>
		<SidebarContent className="overflow-hidden">{children}</SidebarContent>
		<SidebarFooter>
			<SidebarGroup className="p-0">
				<DashboardSidebarControl />
			</SidebarGroup>
		</SidebarFooter>
	</Sidebar>
);
