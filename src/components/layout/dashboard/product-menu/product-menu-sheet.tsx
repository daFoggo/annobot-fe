import { IconMenu2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useDashboardShell } from "../dashboard-shell-context";
import { ProductMenuContent } from "./product-menu-content";

/**
 * Nút mở product menu trên mobile. Tự ẩn nếu section hiện tại không có menu —
 * nhờ vậy nơi dùng không cần truyền cờ `hasProductMenu`.
 */
export const ProductMenuSheetTrigger = () => {
	const { state, actions } = useDashboardShell();
	if (!state.productMenu) return null;

	return (
		<Button
			variant="outline"
			size="icon-sm"
			onClick={actions.openProductMenuSheet}
			aria-label="Open section menu"
		>
			<IconMenu2 />
		</Button>
	);
};

/** Product menu dạng sheet cho mobile, điều khiển qua shell context. */
export const ProductMenuSheet = () => {
	const { state, actions } = useDashboardShell();
	const menu = state.productMenu;
	if (!menu) return null;

	return (
		<Sheet
			open={state.isProductMenuSheetOpen}
			onOpenChange={actions.setProductMenuSheetOpen}
		>
			<SheetContent side="left" className="w-72 bg-sidebar p-0 md:hidden">
				<SheetHeader className="sr-only">
					<SheetTitle>{menu.title}</SheetTitle>
					<SheetDescription>Section navigation</SheetDescription>
				</SheetHeader>
				<ProductMenuContent menu={menu} headerClassName="pr-12" />
			</SheetContent>
		</Sheet>
	);
};
