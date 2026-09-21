import {
	IconLayoutSidebarLeftCollapse,
	IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Nút thu gọn/mở rộng sidebar, đặt ở footer (Supabase cũng để control ở đây
 * thay vì dùng `SidebarTrigger`/`SidebarRail`).
 */
export const DashboardSidebarControl = () => {
	const { state, toggleSidebar } = useSidebar();
	const isExpanded = state === "expanded";

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={toggleSidebar}
			aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
		>
			{isExpanded ? (
				<IconLayoutSidebarLeftCollapse />
			) : (
				<IconLayoutSidebarLeftExpand />
			)}
		</Button>
	);
};
