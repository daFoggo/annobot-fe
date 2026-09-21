import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isPathActive, usePathname } from "../dashboard-nav";
import type { DashboardNavGroup, DashboardNavItem } from "../types";

/** Một cấp menu trong stack drill-down. */
interface NavLevel {
	key: string;
	/** Rỗng ở cấp gốc (không có nút back). */
	title: string;
	groups: DashboardNavGroup[];
}

/** Vị trí của panel so với cấp đang mở — quyết định hướng fade/trượt. */
type PanelState = "active" | "before" | "after";

const isItemActive = (pathname: string, item: DashboardNavItem): boolean => {
	if (item.children) {
		return item.children.some((group) =>
			group.items.some((child) => isItemActive(pathname, child)),
		);
	}
	return item.to ? isPathActive(pathname, item.to, item.exact) : false;
};

interface NavItemProps {
	item: DashboardNavItem;
	pathname: string;
	onOpen: (item: DashboardNavItem) => void;
}

const NavItem = ({ item, pathname, onOpen }: NavItemProps) => {
	const Icon = item.icon;

	// Item có menu con → nút drill-down, không phải link.
	if (item.children) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					onClick={() => onOpen(item)}
					isActive={isItemActive(pathname, item)}
					tooltip={item.label}
				>
					<Icon />
					<span className="min-w-0 flex-1 truncate">{item.label}</span>
					<IconChevronRight className="text-muted-foreground group-data-[collapsible=icon]:hidden" />
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	if (!item.to) return null;

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				render={<Link to={item.to} />}
				isActive={isPathActive(pathname, item.to, item.exact)}
				tooltip={item.label}
			>
				<Icon />
				<span>{item.label}</span>
				{item.badge ? (
					<Badge variant="secondary" className="ml-auto">
						{item.badge}
					</Badge>
				) : null}
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
};

interface NavLevelPanelProps {
	level: NavLevel;
	isRoot: boolean;
	state: PanelState;
	pathname: string;
	onBack: () => void;
	onOpen: (item: DashboardNavItem) => void;
}

const NavLevelPanel = ({
	level,
	isRoot,
	state,
	pathname,
	onBack,
	onOpen,
}: NavLevelPanelProps) => (
	<div
		aria-hidden={state !== "active"}
		className={cn(
			"absolute inset-0 no-scrollbar flex flex-col overflow-y-auto transition duration-200 ease-out",
			state === "active" && "translate-x-0 opacity-100",
			state === "before" && "pointer-events-none -translate-x-3 opacity-0",
			state === "after" && "pointer-events-none translate-x-3 opacity-0",
		)}
	>
		{!isRoot ? (
			<div className="flex items-center gap-1 p-2">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={onBack}
					aria-label="Back"
				>
					<IconChevronLeft />
				</Button>
				<span className="min-w-0 flex-1 truncate text-center text-sm font-medium">
					{level.title}
				</span>
				<span className="size-7 shrink-0" aria-hidden />
			</div>
		) : null}
		{level.groups.map((group, index) => (
			<Fragment key={group.key}>
				{index > 0 && !group.title ? <SidebarSeparator /> : null}
				<SidebarGroup className="gap-0.5">
					{group.title ? (
						<SidebarGroupLabel>{group.title}</SidebarGroupLabel>
					) : null}
					<SidebarMenu className="gap-1">
						{group.items.map((item) => (
							<NavItem
								key={item.to ?? item.label}
								item={item}
								pathname={pathname}
								onOpen={onOpen}
							/>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</Fragment>
		))}
	</div>
);

export interface DashboardSidebarNavProps {
	groups: DashboardNavGroup[];
}

/**
 * Menu điều hướng của sidebar cấp 1 dạng drill-down (kiểu Vercel): item có
 * `children` sẽ chuyển sang một cấp con có nút back, thay vì mở accordion.
 *
 * Các cấp là những panel chồng nhau (absolute). Cấp đang mở ở giữa, cấp cha
 * lệch nhẹ sang trái và mờ đi, cấp con lệch nhẹ sang phải rồi trượt vào —
 * chuyển cảnh nhẹ (trượt 12px + fade 200ms) thay vì đẩy hẳn cả menu.
 */
export const DashboardSidebarNav = ({ groups }: DashboardSidebarNavProps) => {
	const pathname = usePathname();
	const [nav, setNav] = useState<{ levels: NavLevel[]; index: number }>(() => ({
		levels: [{ key: "root", title: "", groups }],
		index: 0,
	}));
	// Cấp mới cần mount ở trạng thái lệch rồi flip sang "active" ở frame sau để
	// có hiệu ứng enter (nếu mount thẳng vào "active" thì sẽ không animate).
	const [entering, setEntering] = useState(false);

	// Đổi section (nav khác) thì quay về cấp gốc.
	useEffect(() => {
		setNav({ levels: [{ key: "root", title: "", groups }], index: 0 });
	}, [groups]);

	useEffect(() => {
		if (!entering) return;
		let inner = 0;
		const outer = requestAnimationFrame(() => {
			inner = requestAnimationFrame(() => setEntering(false));
		});
		return () => {
			cancelAnimationFrame(outer);
			cancelAnimationFrame(inner);
		};
	}, [entering]);

	const openLevel = (item: DashboardNavItem) => {
		setNav((prev) => ({
			levels: [
				...prev.levels.slice(0, prev.index + 1),
				{
					key: `${prev.index + 1}:${item.to ?? item.label}`,
					title: item.label,
					groups: item.children ?? [],
				},
			],
			index: prev.index + 1,
		}));
		setEntering(true);
	};

	const goBack = () =>
		setNav((prev) => ({ ...prev, index: Math.max(0, prev.index - 1) }));

	return (
		<div className="relative min-h-0 w-full flex-1 overflow-hidden">
			{nav.levels.map((level, index) => (
				<NavLevelPanel
					key={level.key}
					level={level}
					isRoot={index === 0}
					state={
						index === nav.index
							? entering
								? "after"
								: "active"
							: index < nav.index
								? "before"
								: "after"
					}
					pathname={pathname}
					onBack={goBack}
					onOpen={openLevel}
				/>
			))}
		</div>
	);
};
