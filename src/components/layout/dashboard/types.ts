import type { LinkProps } from "@tanstack/react-router";
import type { ComponentType } from "react";

/**
 * Mọi đường dẫn hợp lệ trong app — derive từ `LinkProps` của router nên luôn
 * đồng bộ với route tree: thêm/xóa/đổi route là `to` trong nav bị type-check
 * ngay tại thời điểm compile.
 */
export type AppPath = NonNullable<LinkProps<"/">["to"]>;

export type DashboardIcon = ComponentType<{ className?: string }>;

/**
 * Component nav cho sidebar cấp 1, khai báo qua `staticData.sidebarNav`. Dùng khi
 * nav cần route động (params từ URL) mà `staticData.navItems` không biểu diễn được.
 */
export type DashboardSidebarNavComponent = ComponentType;

/** Một mục của sidebar cấp 1 (icon rail). */
export interface DashboardNavItem {
	label: string;
	/** Bỏ trống khi item là drill-down (chỉ có `children`). */
	to?: AppPath;
	icon: DashboardIcon;
	exact?: boolean;
	badge?: string;
	/**
	 * Có `children` → item là drill-down: click sẽ trượt sang một menu con
	 * (có nút back + title) thay vì expand accordion.
	 */
	children?: DashboardNavGroup[];
}

/** Sidebar cấp 1 được chia nhóm, mỗi nhóm cách nhau bằng separator (không có label). */
export interface DashboardNavGroup {
	key: string;
	/** Label tuỳ chọn — dùng làm tiêu đề nhóm trong menu con (vd "COMPUTE"). */
	title?: string;
	items: DashboardNavItem[];
}

/** Một mắt xích của breadcrumb, khai báo qua `staticData.breadcrumb`. */
export interface DashboardCrumb {
	/** Label tĩnh. Bỏ trống nếu suy ra động bằng `getLabel`. */
	label?: string;
	to?: AppPath;
	/** Suy ra label từ loaderData của route (vd tên experiment). */
	getLabel?: (loaderData: unknown) => string | undefined;
	/** Icon hiển thị trước label (dùng chung với switcher...). */
	icon?: DashboardIcon;
}

/** Một mục trong product menu (sidebar cấp 2). */
export interface DashboardProductMenuItem {
	label: string;
	to: AppPath;
	icon?: DashboardIcon;
	badge?: string;
	exact?: boolean;
}

export interface DashboardProductMenuGroup {
	key: string;
	title?: string;
	items: DashboardProductMenuItem[];
}

/**
 * Product menu của một section, khai báo qua `staticData.productMenu` trên
 * route layout của section đó. `component` là một component ở module scope
 * (identity ổn định) nên shell render trực tiếp, không cần portal.
 */
export interface DashboardProductMenu {
	title: string;
	badge?: string;
	component: ComponentType;
}
