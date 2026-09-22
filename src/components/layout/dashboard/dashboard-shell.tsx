import { useRouter } from "@tanstack/react-router";
import type { PropsWithChildren, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
	useDashboardNavGroups,
	useDashboardNavKey,
	useDashboardSidebarNav,
} from "./dashboard-nav";
import {
	DashboardShellProvider,
	useDashboardShell,
} from "./dashboard-shell-context";
import { DashboardHeader } from "./header/dashboard-header";
import { DashboardMobileHeader } from "./header/dashboard-mobile-header";
import { ProductMenuContent } from "./product-menu/product-menu-content";
import { ProductMenuSheet } from "./product-menu/product-menu-sheet";
import {
	MainScrollContainerProvider,
	useMainScrollContainer,
} from "./scroll-container";
import { DashboardSidebar } from "./sidebar/dashboard-sidebar";
import { DashboardSidebarNav } from "./sidebar/dashboard-sidebar-nav";

interface DashboardShellFrameProps extends PropsWithChildren {
	className?: string;
}

const DashboardShellFrame = ({
	className,
	children,
}: DashboardShellFrameProps) => (
	<SidebarProvider defaultOpen className={cn("h-svh w-full", className)}>
		<MainScrollContainerProvider>
			<div className="flex h-full w-full flex-col overflow-hidden">
				<a
					href="#dashboard-main"
					className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-1.5 focus:text-sm focus:ring-2 focus:ring-ring"
				>
					Skip to content
				</a>
				{children}
			</div>
		</MainScrollContainerProvider>
	</SidebarProvider>
);

/**
 * Vùng header: mobile bar (`< md`) và desktop header. Cả hai tự lấy user/sign-out
 * từ shell context nên không cần truyền props xuống.
 */
export interface DashboardShellHeaderProps {
	/** Bộ chọn ngữ cảnh trên header desktop (workspace, môi trường...). */
	context?: ReactNode;
	/** Hành động cấp ứng dụng, nằm sau breadcrumb trên header desktop. */
	actions?: ReactNode;
	className?: string;
}

const DashboardShellHeader = ({
	context,
	actions,
	className,
}: DashboardShellHeaderProps) => (
	<div className={cn("shrink-0", className)}>
		<DashboardMobileHeader />
		<DashboardHeader context={context} actions={actions} />
	</div>
);

/** Hàng thân của shell: sidebar │ product menu │ nội dung. */
const DashboardShellBody = ({
	className,
	children,
}: DashboardShellFrameProps) => (
	<div className={cn("flex w-full flex-1 overflow-y-hidden", className)}>
		{children}
	</div>
);

export interface DashboardShellSidebarProps {
	className?: string;
}

/**
 * Sidebar cấp 1: hiển thị nav mà section hiện tại khai báo (`sidebarNav` component
 * hoặc `navItems`). Section không có nav (vd cấp gốc) thì sidebar ẩn hẳn.
 */
const DashboardShellSidebar = ({ className }: DashboardShellSidebarProps) => {
	const groups = useDashboardNavGroups();
	const SidebarNav = useDashboardSidebarNav();
	const navKey = useDashboardNavKey();
	const { state } = useDashboardShell();
	const hasNav = state.hasNav;
	const { setOpen } = useSidebar();
	const prevHasNav = useRef<boolean | null>(null);

	// Không có nav → luôn ẩn sidebar. Có nav → mở, trừ lần mount đầu (tôn trọng
	// trạng thái đã lưu trong cookie).
	useEffect(() => {
		const previous = prevHasNav.current;
		if (previous === hasNav) return;
		prevHasNav.current = hasNav;
		if (!hasNav) {
			setOpen(false);
		} else if (previous !== null) {
			setOpen(true);
		}
	}, [hasNav, setOpen]);

	return (
		<DashboardSidebar
			collapsible={hasNav ? "icon" : "offcanvas"}
			className={className}
		>
			{/* key = route cấp nav → đổi menu (vd vào/ra experiment) thì remount và
			    animate enter; điều hướng trong cùng menu thì không animate. */}
			<div
				key={navKey}
				className="flex min-h-0 flex-1 flex-col animate-in fade-in-0 slide-in-from-left-2 duration-200 ease-out motion-reduce:animate-none"
			>
				{SidebarNav ? <SidebarNav /> : <DashboardSidebarNav groups={groups} />}
			</div>
		</DashboardSidebar>
	);
};

export interface DashboardShellProductMenuProps {
	/** Class cho `aside` trên desktop (đổi bề rộng, bỏ border...). */
	className?: string;
}

/**
 * Product menu (sidebar cấp 2): aside trên desktop và sheet trên mobile. Tự ẩn
 * khi section hiện tại không khai báo `staticData.productMenu`.
 */
const DashboardShellProductMenu = ({
	className,
}: DashboardShellProductMenuProps) => {
	const { state } = useDashboardShell();
	const menu = state.productMenu;

	return (
		<>
			{menu ? (
				<aside
					className={cn("hidden w-64 shrink-0 border-r md:flex", className)}
				>
					<ProductMenuContent menu={menu} />
				</aside>
			) : null}
			<ProductMenuSheet />
		</>
	);
};

/** Vùng cuộn chính. Cũng là nơi reset scroll mỗi khi đổi route. */
const DashboardShellContent = ({
	className,
	children,
}: DashboardShellFrameProps) => {
	const { actions } = useMainScrollContainer();
	const containerRef = useRef<HTMLElement | null>(null);
	const router = useRouter();

	const setRef = useCallback(
		(node: HTMLElement | null) => {
			containerRef.current = node;
			actions.setContainer(node);
		},
		[actions],
	);

	useEffect(
		() =>
			router.subscribe("onResolved", () => {
				containerRef.current?.scrollTo({ top: 0, left: 0 });
			}),
		[router],
	);

	return (
		<main
			id="dashboard-main"
			ref={setRef}
			tabIndex={-1}
			className={cn(
				"flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background outline-hidden",
				className,
			)}
		>
			{children}
		</main>
	);
};

/**
 * Khung dashboard dạng compound (composition pattern):
 *
 * ```
 * <DashboardShell.Provider user={user} onSignOut={...}>
 *   <DashboardShell.Frame>
 *     <DashboardShell.Header context={<ContextSwitcher />} />
 *     <DashboardShell.Body>
 *       <DashboardShell.Sidebar />
 *       <DashboardShell.ProductMenu />
 *       <DashboardShell.Content>{children}</DashboardShell.Content>
 *     </DashboardShell.Body>
 *   </DashboardShell.Frame>
 * </DashboardShell.Provider>
 * ```
 *
 * `Provider` chỉ giữ state (user, product menu, sheet mobile); `Frame` dựng DOM
 * gốc; các part còn lại là UI thuần đọc state từ context. Mọi part nhận
 * `className` để override cục bộ (bề rộng, padding...) mà không cần prop mới.
 * Layout:
 *
 * ```
 * header (full width)
 * ────────────────────────────────
 * sidebar │ product menu │ main
 * ```
 */
export const DashboardShell = {
	Provider: DashboardShellProvider,
	Frame: DashboardShellFrame,
	Header: DashboardShellHeader,
	Body: DashboardShellBody,
	Sidebar: DashboardShellSidebar,
	ProductMenu: DashboardShellProductMenu,
	Content: DashboardShellContent,
};
