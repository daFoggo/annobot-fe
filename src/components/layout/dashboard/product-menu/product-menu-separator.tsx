import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Divider giữa các nhóm trong product menu (sidebar cấp 2). Inset để thẳng hàng
 * với nội dung thay vì tràn hết chiều ngang, đồng bộ với `SidebarSeparator` ở
 * sidebar cấp 1.
 *
 * `data-horizontal:w-auto` phải override `w-full` của `Separator`; nếu không,
 * `mx-*` sẽ đẩy đường kẻ tràn qua mép phải (xem `SidebarSeparator`).
 */
export const ProductMenuSeparator = ({ className }: { className?: string }) => (
	<Separator className={cn("mx-4 data-horizontal:w-auto", className)} />
);
