"use client";

import {
	IconBolt,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconCloud,
	IconDroplet,
	IconLayersIntersect,
	IconSearch,
	IconTemperature,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getErrorMessage } from "@/lib/error";
import { cn } from "@/lib/utils";
import { deviceListQueryOptions } from "../queries";
import type { Device } from "../schemas";

export interface SensorPickerProps {
	value: string[];
	onChange: (ids: string[]) => void;
}

export type GroupBy = "zone" | "type";

export const TYPE_CONFIG: Record<
	string,
	{ label: string; icon: typeof IconBolt; badgeClass: string }
> = {
	power: {
		label: "Power",
		icon: IconBolt,
		badgeClass:
			"bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
	},
	climate: {
		label: "Climate",
		icon: IconTemperature,
		badgeClass:
			"bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
	},
	environment: {
		label: "Environment",
		icon: IconCloud,
		badgeClass:
			"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
	},
	multiple: {
		label: "Multiple",
		icon: IconLayersIntersect,
		badgeClass:
			"bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
	},
	water: {
		label: "Water",
		icon: IconDroplet,
		badgeClass:
			"bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
	},
};

function normalizeCategory(category: string): string {
	if (category === "plug") return "power";
	return category || "other";
}

function groupDevices(
	devices: Device[],
	groupBy: GroupBy,
): Map<string, Device[]> {
	const map = new Map<string, Device[]>();
	for (const device of devices) {
		let key: string;
		if (groupBy === "zone") {
			key = device.zone || "Unknown Area";
		} else {
			const cat = normalizeCategory(device.category);
			key = TYPE_CONFIG[cat]?.label
				? `${TYPE_CONFIG[cat].label} Devices`
				: "Other Devices";
		}
		const list = map.get(key) ?? [];
		list.push(device);
		map.set(key, list);
	}
	return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Bộ chọn Thiết bị 2 cột (Available Devices | Selected Devices),
 * phân loại theo cả 2 chiều: Zone (Khu vực) và Type (Loại thiết bị: Power, Climate, Environment, Multiple).
 */
export const SensorPicker = ({ value, onChange }: SensorPickerProps) => {
	const {
		data: devices,
		isPending,
		isError,
		error,
	} = useQuery(deviceListQueryOptions());
	const [query, setQuery] = useState("");
	const [groupBy, setGroupBy] = useState<GroupBy>("zone");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

	const allDevices = useMemo(() => devices ?? [], [devices]);

	// Lọc theo search và theo typeFilter
	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase();
		return allDevices.filter((device) => {
			const cat = normalizeCategory(device.category);
			if (typeFilter !== "all" && cat !== typeFilter) {
				return false;
			}
			if (!needle) return true;
			return (
				device.name.toLowerCase().includes(needle) ||
				device.zone.toLowerCase().includes(needle) ||
				cat.toLowerCase().includes(needle) ||
				device.metrics_summary.toLowerCase().includes(needle)
			);
		});
	}, [query, allDevices, typeFilter]);

	// Phân loại Available vs Selected theo presence của sensor_ids trong `value`
	const available = filtered.filter(
		(device) => !device.sensor_ids.some((id) => value.includes(id)),
	);
	const selected = allDevices.filter((device) =>
		device.sensor_ids.some((id) => value.includes(id)),
	);

	const availableGroups = useMemo(
		() => groupDevices(available, groupBy),
		[available, groupBy],
	);
	const selectedGroups = useMemo(
		() => groupDevices(selected, groupBy),
		[selected, groupBy],
	);

	const allGroupKeys = useMemo(
		() => [...groupDevices(allDevices, groupBy).keys()].sort(),
		[allDevices, groupBy],
	);

	if (isPending) {
		return (
			<div className="grid grid-cols-2 gap-4">
				<Skeleton className="h-72 w-full" />
				<Skeleton className="h-72 w-full" />
			</div>
		);
	}

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					{getErrorMessage(error, "Could not load devices.")}
				</AlertDescription>
			</Alert>
		);
	}

	const toggle = (key: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const add = (device: Device) => {
		onChange([...new Set([...value, ...device.sensor_ids])]);
	};

	const remove = (device: Device) => {
		const toRemove = new Set(device.sensor_ids);
		onChange(value.filter((id) => !toRemove.has(id)));
	};

	const addAll = () => {
		const allIds = available.flatMap((d) => d.sensor_ids);
		onChange([...new Set([...value, ...allIds])]);
	};

	const removeAll = () => {
		const toRemove = new Set(selected.flatMap((d) => d.sensor_ids));
		onChange(value.filter((id) => !toRemove.has(id)));
	};

	return (
		<div className="flex flex-col gap-3">
			{/* Controls: Type Filter Chips + Group By Switcher */}
			<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-1.5">
				{/* Type Filter Chips */}
				<div className="flex items-center gap-1">
					{[
						{ value: "all", label: "All" },
						{ value: "power", label: "Power" },
						{ value: "climate", label: "Climate" },
						{ value: "environment", label: "Environment" },
						{ value: "multiple", label: "Multiple" },
					].map((filter) => {
						const count =
							filter.value === "all"
								? allDevices.length
								: allDevices.filter(
										(d) => normalizeCategory(d.category) === filter.value,
									).length;
						if (count === 0 && filter.value !== "all") return null;
						const isSelected = typeFilter === filter.value;
						return (
							<Button
								key={filter.value}
								type="button"
								variant={isSelected ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setTypeFilter(filter.value)}
								className={cn(
									"h-6 px-2 text-xs rounded-md cursor-pointer",
									isSelected
										? "bg-foreground/10 text-foreground font-semibold shadow-2xs"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{filter.label} ({count})
							</Button>
						);
					})}
				</div>

				{/* Group By Selector */}
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span className="font-mono text-[10px] tracking-wider uppercase">
						Group by:
					</span>
					<ToggleGroup
						variant="outline"
						size="sm"
						spacing={0}
						value={[groupBy]}
						onValueChange={(val) => {
							if (val[0]) setGroupBy(val[0] as GroupBy);
						}}
						className="h-6"
					>
						<ToggleGroupItem value="zone" className="h-6 px-2 text-xs">
							Zone
						</ToggleGroupItem>
						<ToggleGroupItem value="type" className="h-6 px-2 text-xs">
							Type
						</ToggleGroupItem>
					</ToggleGroup>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<PickerColumn
					title={`Available Devices (${available.length})`}
					search={
						<InputGroup className="h-7">
							<InputGroupAddon align="inline-start">
								<IconSearch data-icon />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search devices..."
								value={query}
								onChange={(event) => setQuery(event.target.value)}
							/>
						</InputGroup>
					}
					action={
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={addAll}
										disabled={available.length === 0}
										aria-label="Move all to selected"
									>
										<IconChevronsRight />
									</Button>
								}
							/>
							<TooltipContent>Move all to selected</TooltipContent>
						</Tooltip>
					}
					emptyMessage={
						available.length === 0 ? "All devices selected" : "No devices found"
					}
					groupKeys={allGroupKeys}
					groupedMap={availableGroups}
					collapsed={collapsed}
					onToggle={toggle}
					onPick={add}
					direction="right"
				/>
				<PickerColumn
					title={`Selected Devices (${selected.length})`}
					action={
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={removeAll}
										disabled={selected.length === 0}
										aria-label="Move all to available"
									>
										<IconChevronsLeft />
									</Button>
								}
							/>
							<TooltipContent>Move all to available</TooltipContent>
						</Tooltip>
					}
					emptyMessage="No devices selected"
					groupKeys={allGroupKeys}
					groupedMap={selectedGroups}
					collapsed={collapsed}
					onToggle={toggle}
					onPick={remove}
					direction="left"
				/>
			</div>
		</div>
	);
};

const PickerColumn = ({
	title,
	search,
	action,
	emptyMessage,
	groupKeys,
	groupedMap,
	collapsed,
	onToggle,
	onPick,
	direction,
}: {
	title: string;
	search?: React.ReactNode;
	action?: React.ReactNode;
	emptyMessage: string;
	groupKeys: string[];
	groupedMap: Map<string, Device[]>;
	collapsed: Set<string>;
	onToggle: (groupKey: string) => void;
	onPick: (device: Device) => void;
	direction: "left" | "right";
}) => {
	const hasAny = groupKeys.some(
		(key) => (groupedMap.get(key) ?? []).length > 0,
	);

	return (
		<div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
			<div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
				<span className="text-sm font-medium text-muted-foreground">
					{title}
				</span>
				{action}
			</div>
			{search ? (
				<div className="shrink-0 border-b px-3 py-2">{search}</div>
			) : null}
			<ScrollArea className="h-64" viewportClassName="scroll-fade">
				<div className="flex flex-col p-2.5">
					{groupKeys.map((key) => {
						const items = groupedMap.get(key) ?? [];
						if (items.length === 0) return null;
						const isOpen = !collapsed.has(key);
						return (
							<div key={key} className="mb-1 last:mb-0">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => onToggle(key)}
									className="w-full justify-start gap-1.5 px-2 font-medium"
								>
									<IconChevronDown
										className={cn(
											"size-3.5 shrink-0 transition-transform",
											!isOpen && "-rotate-90",
										)}
									/>
									<span className="truncate">{key}</span>
									<span className="text-xs text-muted-foreground">
										({items.length})
									</span>
								</Button>
								{isOpen ? (
									<div className="flex flex-col gap-1 py-1 pl-2 pr-1">
										{items.map((device) => (
											<DeviceRow
												key={device.id}
												device={device}
												direction={direction}
												onClick={() => onPick(device)}
											/>
										))}
									</div>
								) : null}
							</div>
						);
					})}
					{!hasAny ? (
						<p className="py-4 text-center text-xs text-muted-foreground">
							{emptyMessage}
						</p>
					) : null}
				</div>
			</ScrollArea>
		</div>
	);
};

const DeviceRow = ({
	device,
	direction,
	onClick,
}: {
	device: Device;
	direction: "left" | "right";
	onClick: () => void;
}) => {
	const Arrow = direction === "right" ? IconChevronRight : IconChevronLeft;
	const cat = normalizeCategory(device.category);
	const config = TYPE_CONFIG[cat] ?? {
		label: "Device",
		icon: IconBolt,
		badgeClass: "bg-muted text-muted-foreground",
	};
	const Icon = config.icon;

	return (
		<Button
			type="button"
			variant="ghost"
			onClick={onClick}
			className="h-auto w-full items-center justify-start gap-2.5 rounded-lg px-2.5 py-2 text-left font-normal cursor-pointer"
		>
			<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
				<Icon className="size-3.5 text-muted-foreground" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 overflow-hidden text-left">
				<div className="flex w-full items-center gap-1.5 overflow-hidden">
					<span className="truncate text-xs font-medium text-foreground">
						{device.name}
					</span>
					<Badge
						variant="outline"
						className={cn(
							"h-4 shrink-0 px-1 py-0 font-mono text-[9px] uppercase tracking-wider",
							config.badgeClass,
						)}
					>
						{config.label}
					</Badge>
				</div>
				<span className="truncate text-[11px] text-muted-foreground">
					{device.zone || "Unknown Area"} · {device.metrics_summary}
				</span>
			</div>
			<Arrow className="size-3.5 shrink-0 text-muted-foreground" />
		</Button>
	);
};
