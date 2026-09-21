import { Badge } from "@/components/ui/badge";
import type { DashboardProductMenu } from "../types";
import { ProductMenuBar } from "./product-menu-bar";

export interface ProductMenuContentProps {
	menu: DashboardProductMenu;
	/** Class bổ sung cho header (vd chừa chỗ cho nút đóng của sheet). */
	headerClassName?: string;
}

/**
 * Nội dung của một product menu: header (title + badge) rồi tới component menu
 * do route khai báo. Không có nút đóng — affordance quay lại thuộc về section.
 */
export const ProductMenuContent = ({
	menu,
	headerClassName,
}: ProductMenuContentProps) => {
	const Menu = menu.component;

	return (
		<ProductMenuBar.Root>
			<ProductMenuBar.Header className={headerClassName}>
				<h4 className="min-w-0 flex-1 truncate text-sm font-semibold">
					{menu.title}
				</h4>
				{menu.badge ? (
					<Badge variant="secondary" className="uppercase">
						{menu.badge}
					</Badge>
				) : null}
			</ProductMenuBar.Header>
			<ProductMenuBar.Body>
				<Menu />
			</ProductMenuBar.Body>
		</ProductMenuBar.Root>
	);
};
