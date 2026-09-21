import { useMatches, useRouterState } from "@tanstack/react-router";
import type {
	AppPath,
	DashboardNavGroup,
	DashboardSidebarNavComponent,
} from "./types";

/**
 * Nav mặc định của sidebar cấp 1. Để rỗng: sidebar chỉ có nội dung khi section
 * khai báo nav riêng (`staticData.navItems` hoặc `staticData.sidebarNav`).
 */
export const DASHBOARD_NAV: DashboardNavGroup[] = [];

export const isPathActive = (pathname: string, to: AppPath, exact = false) =>
	exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

export const usePathname = () =>
	useRouterState({ select: (state) => state.location.pathname });

/**
 * Nhóm nav hiển thị ở sidebar cấp 1. Ưu tiên `staticData.navItems` của route
 * match sâu nhất (mỗi section có thể khai báo nav riêng); không có thì fallback
 * về `DASHBOARD_NAV` mặc định.
 */
export const useDashboardNavGroups = (): DashboardNavGroup[] =>
	useMatches({
		select: (matches) => {
			for (let index = matches.length - 1; index >= 0; index -= 1) {
				const navItems = matches[index].staticData.navItems;
				if (navItems) return navItems;
			}
			return DASHBOARD_NAV;
		},
	});

/**
 * Component nav tuỳ biến của sidebar cấp 1 (`staticData.sidebarNav`), dùng cho
 * route động. Ưu tiên cao hơn `navItems`; trả `undefined` nếu route không khai báo.
 */
export const useDashboardSidebarNav = ():
	| DashboardSidebarNavComponent
	| undefined =>
	useMatches({
		select: (matches) => {
			for (let index = matches.length - 1; index >= 0; index -= 1) {
				const sidebarNav = matches[index].staticData.sidebarNav;
				if (sidebarNav) return sidebarNav;
			}
			return undefined;
		},
	});
