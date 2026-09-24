import { useRouter } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { AuthUser } from "@/features/auth";
import { useDashboardNavGroups, useDashboardSidebarNav } from "./dashboard-nav";
import { useProductMenu } from "./product-menu/use-product-menu";
import type { DashboardProductMenu } from "./types";

export interface DashboardShellState {
	user: AuthUser;
	isSigningOut: boolean;
	productMenu: DashboardProductMenu | undefined;
	isProductMenuSheetOpen: boolean;
	/** Section hiện tại có nav cho sidebar cấp 1 hay không. */
	hasNav: boolean;
}

export interface DashboardShellActions {
	signOut: () => void;
	setProductMenuSheetOpen: (open: boolean) => void;
	openProductMenuSheet: () => void;
}

export interface DashboardShellContextValue {
	state: DashboardShellState;
	actions: DashboardShellActions;
}

export const DashboardShellContext =
	createContext<DashboardShellContextValue | null>(null);

/**
 * Truy cập state/actions của dashboard shell. UI chỉ biết interface này, không
 * biết state được quản lý bằng gì (useState ở provider).
 */
export const useDashboardShell = () => {
	const value = use(DashboardShellContext);
	if (!value) {
		throw new Error(
			"useDashboardShell must be used within <DashboardShell.Provider>",
		);
	}
	return value;
};

/**
 * Truy cập state/actions của dashboard shell, trả về null nếu nằm ngoài provider.
 */
export const useOptionalDashboardShell = () => use(DashboardShellContext);

export interface DashboardShellProviderProps {
	user: AuthUser;
	isSigningOut?: boolean;
	onSignOut: () => void;
}

/**
 * Nơi duy nhất quản lý state của shell: user/sign-out (inject từ route), product
 * menu của section hiện tại (đọc từ router), và trạng thái mở sheet product menu
 * trên mobile. Các sibling (header trigger, sheet) chia sẻ qua context.
 */
export const DashboardShellProvider = ({
	user,
	isSigningOut = false,
	onSignOut,
	children,
}: PropsWithChildren<DashboardShellProviderProps>) => {
	const productMenu = useProductMenu();
	const router = useRouter();
	const sidebarNav = useDashboardSidebarNav();
	const navGroups = useDashboardNavGroups();
	const hasNav = Boolean(sidebarNav) || navGroups.length > 0;
	const [isProductMenuSheetOpen, setProductMenuSheetOpen] = useState(false);

	// Đóng sheet product menu sau khi điều hướng trên mobile.
	useEffect(
		() =>
			router.subscribe("onResolved", () => {
				setProductMenuSheetOpen(false);
			}),
		[router],
	);

	const openProductMenuSheet = useCallback(
		() => setProductMenuSheetOpen(true),
		[],
	);

	const value = useMemo<DashboardShellContextValue>(
		() => ({
			state: {
				user,
				isSigningOut,
				productMenu,
				isProductMenuSheetOpen,
				hasNav,
			},
			actions: {
				signOut: onSignOut,
				setProductMenuSheetOpen,
				openProductMenuSheet,
			},
		}),
		[
			user,
			isSigningOut,
			productMenu,
			isProductMenuSheetOpen,
			hasNav,
			onSignOut,
			openProductMenuSheet,
		],
	);

	return (
		<DashboardShellContext value={value}>{children}</DashboardShellContext>
	);
};
