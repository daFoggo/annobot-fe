import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DashboardPageProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	actions?: ReactNode;
	/**
	 * `default`: cột nội dung căn giữa (trang cài đặt, form...).
	 * `full`: chiếm trọn chiều ngang (bảng dữ liệu, log explorer...).
	 */
	size?: "default" | "full";
	className?: string;
}

/**
 * Khung một trang trong dashboard: header (title/description/actions) rồi tới
 * nội dung. Tương đương `PageLayout` + `PageHeader` của Supabase Studio.
 */
export const DashboardPage = ({
	title,
	description,
	icon,
	actions,
	size = "default",
	className,
	children,
}: PropsWithChildren<DashboardPageProps>) => (
	<div className="flex min-h-full w-full flex-col items-stretch">
		<div
			className={cn(
				"flex w-full flex-col gap-6",
				size === "full" ? "px-6 py-6" : "mx-auto max-w-6xl px-6 py-10",
				className,
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 items-center gap-4">
					{icon ? <div className="text-muted-foreground">{icon}</div> : null}
					<div className="flex min-w-0 flex-col gap-1">
						<h1 className="truncate text-xl font-semibold tracking-tight">
							{title}
						</h1>
						{description ? (
							<p className="text-sm text-muted-foreground">{description}</p>
						) : null}
					</div>
				</div>
				{actions ? (
					<div className="flex shrink-0 items-center gap-2">{actions}</div>
				) : null}
			</div>
			{children}
		</div>
	</div>
);
