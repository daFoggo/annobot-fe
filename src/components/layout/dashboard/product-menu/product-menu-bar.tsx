import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const ProductMenuBarRoot = ({ className, ...props }: ComponentProps<"div">) => (
	<div
		className={cn("flex h-full w-full flex-col bg-sidebar", className)}
		{...props}
	/>
);

const ProductMenuBarHeader = ({
	className,
	...props
}: ComponentProps<"div">) => (
	<div
		className={cn(
			"flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-6",
			className,
		)}
		{...props}
	/>
);

const ProductMenuBarBody = ({ className, ...props }: ComponentProps<"div">) => (
	<div className={cn("min-h-0 grow overflow-y-auto", className)} {...props} />
);

/**
 * Khung sidebar cấp 2 (product menu), dạng compound: `Root` là cột dọc,
 * `Header` cao bằng header chính, `Body` là vùng cuộn được.
 */
export const ProductMenuBar = {
	Root: ProductMenuBarRoot,
	Header: ProductMenuBarHeader,
	Body: ProductMenuBarBody,
};
