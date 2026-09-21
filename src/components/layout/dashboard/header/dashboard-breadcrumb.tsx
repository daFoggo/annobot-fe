import { Link, useMatches } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { Fragment } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { AppPath, DashboardIcon } from "../types";

export interface DashboardCrumbItem {
	label: string;
	to?: AppPath;
	icon?: DashboardIcon;
}

/**
 * Các mắt xích breadcrumb dựng từ `staticData.breadcrumb` của route match.
 * Không có crumb mặc định — cấp gốc trả về mảng rỗng.
 */
export const useDashboardBreadcrumbs = (): DashboardCrumbItem[] =>
	useMatches({
		select: (matches) =>
			matches.flatMap((match): DashboardCrumbItem[] => {
				const crumb = match.staticData.breadcrumb;
				if (!crumb) return [];
				const label = crumb.getLabel
					? crumb.getLabel(match.loaderData)
					: crumb.label;
				return label ? [{ label, to: crumb.to, icon: crumb.icon }] : [];
			}),
	});

/**
 * Component actions tuỳ biến hiển thị cạnh breadcrumb, khai báo qua
 * `staticData.breadcrumbActions`.
 */
export const useDashboardBreadcrumbActions = (): ComponentType | undefined =>
	useMatches({
		select: (matches) => {
			for (let index = matches.length - 1; index >= 0; index -= 1) {
				const actions = matches[index].staticData.breadcrumbActions;
				if (actions) return actions;
			}
			return undefined;
		},
	});

export interface DashboardBreadcrumbProps {
	/**
	 * Nội dung thêm vào cạnh breadcrumb (nút, link...). Route thường inject qua
	 * `staticData.breadcrumbActions` — component gốc chỉ lo composition.
	 */
	children?: ReactNode;
}

/**
 * Breadcrumb + slot cho actions. Chỉ render khi route khai báo crumb hoặc truyền
 * `children`; ở cấp gốc (không có gì) trả `null` để header chỉ còn logo.
 */
export const DashboardBreadcrumb = ({ children }: DashboardBreadcrumbProps) => {
	const items = useDashboardBreadcrumbs();

	if (items.length === 0 && !children) return null;

	return (
		<div className="flex min-w-0 items-center gap-3">
			{items.length > 0 ? (
				<Breadcrumb className="min-w-0">
					<BreadcrumbList className="flex-nowrap gap-1.5">
						{items.map((item, index) => {
							const isLast = index === items.length - 1;
							const to = item.to;
							const Icon = item.icon;

							return (
								<Fragment key={`${to ?? "leaf"}-${item.label}`}>
									<BreadcrumbItem className="flex min-w-0 items-center gap-1.5">
										{Icon ? (
											<Icon className="size-3.5 shrink-0 text-muted-foreground" />
										) : null}
										{isLast || !to ? (
											<BreadcrumbPage className="truncate">
												{item.label}
											</BreadcrumbPage>
										) : (
											<BreadcrumbLink
												render={<Link to={to} />}
												className="truncate"
											>
												{item.label}
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
									{!isLast && <BreadcrumbSeparator className="shrink-0" />}
								</Fragment>
							);
						})}
					</BreadcrumbList>
				</Breadcrumb>
			) : null}
			{children}
		</div>
	);
};
