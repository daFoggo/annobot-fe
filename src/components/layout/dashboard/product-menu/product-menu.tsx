import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { isPathActive, usePathname } from "../dashboard-nav";
import type { DashboardProductMenuGroup } from "../types";
import { ProductMenuSeparator } from "./product-menu-separator";

export interface ProductMenuNavProps {
	groups: DashboardProductMenuGroup[];
}

/**
 * Danh sách link chuẩn của product menu. Các section có nội dung tuỳ biến
 * (ví dụ bộ lọc của trang Logs) render thẳng nội dung của mình thay vì dùng
 * component này.
 */
export const ProductMenuNav = ({ groups }: ProductMenuNavProps) => {
	const pathname = usePathname();

	return (
		<div className="flex flex-col gap-4 py-4">
			{groups.map((group, index) => (
				<Fragment key={group.key}>
					{index > 0 ? <ProductMenuSeparator className="mx-3" /> : null}
					<div className="flex flex-col gap-1 px-3">
						{group.title ? (
							<div className="px-2 py-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
								{group.title}
							</div>
						) : null}
						<SidebarMenu className="gap-0.5">
							{group.items.map((item) => (
								<SidebarMenuItem key={item.to}>
									<SidebarMenuButton
										render={<Link to={item.to} />}
										isActive={isPathActive(pathname, item.to, item.exact)}
									>
										{item.icon ? <item.icon /> : null}
										<span>{item.label}</span>
										{item.badge ? (
											<Badge variant="secondary" className="ml-auto">
												{item.badge}
											</Badge>
										) : null}
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</div>
				</Fragment>
			))}
		</div>
	);
};
