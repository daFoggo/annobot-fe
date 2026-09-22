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
	IconSearch,
	IconTemperature,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

function groupDevicesByZone(devices: Device[]): Map<string, Device[]> {
	const map = new Map<string, Device[]>();
	for (const device of devices) {
		const key = device.zone || "Other";
		const list = map.get(key) ?? [];
		list.push(device);
		map.set(key, list);
	}
	return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Bộ chọn Thiết bị 2 cột (Available Devices | Selected Devices),
 * lấy trực tiếp 19 thiết bị vật lý đã gom nhóm từ AnnoBot Backend (`GET /devices`),
 * tự động map toàn bộ sensor_ids của thiết bị vào inquiry.
 */
export const SensorPicker = ({ value, onChange }: SensorPickerProps) => {
	const {
		data: devices,
		isPending,
		isError,
		error,
	} = useQuery(deviceListQueryOptions());
	const [query, setQuery] = useState("");
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

	const allDevices = useMemo(() => devices ?? [], [devices]);

	// Lọc theo search
	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) return allDevices;
		return allDevices.filter(
			(device) =>
				device.name.toLowerCase().includes(needle) ||
				device.zone.toLowerCase().includes(needle) ||
				device.metrics_summary.toLowerCase().includes(needle),
		);
	}, [query, allDevices]);

	// Phân loại Available vs Selected theo presence của sensor_ids trong `value`
	const available = filtered.filter(
		(device) => !device.sensor_ids.some((id) => value.includes(id)),
	);
	const selected = allDevices.filter((device) =>
		device.sensor_ids.some((id) => value.includes(id)),
	);

	const availableByZone = useMemo(
		() => groupDevicesByZone(available),
		[available],
	);
	const selectedByZone = useMemo(
		() => groupDevicesByZone(selected),
		[selected],
	);

	const allZones = useMemo(() => {
		const zones = new Set<string>();
		for (const device of allDevices) zones.add(device.zone || "Other");
		return [...zones].sort();
	}, [allDevices]);

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

	const toggle = (zone: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(zone)) next.delete(zone);
			else next.add(zone);
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
				zones={allZones}
				byZone={availableByZone}
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
				zones={allZones}
				byZone={selectedByZone}
				collapsed={collapsed}
				onToggle={toggle}
				onPick={remove}
				direction="left"
			/>
		</div>
	);
};

const PickerColumn = ({
	title,
	search,
	action,
	emptyMessage,
	zones,
	byZone,
	collapsed,
	onToggle,
	onPick,
	direction,
}: {
	title: string;
	search?: React.ReactNode;
	action?: React.ReactNode;
	emptyMessage: string;
	zones: string[];
	byZone: Map<string, Device[]>;
	collapsed: Set<string>;
	onToggle: (zone: string) => void;
	onPick: (device: Device) => void;
	direction: "left" | "right";
}) => {
	const hasAny = zones.some((zone) => (byZone.get(zone) ?? []).length > 0);

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
					{zones.map((zone) => {
						const items = byZone.get(zone) ?? [];
						if (items.length === 0) return null;
						const isOpen = !collapsed.has(zone);
						return (
							<div key={zone} className="mb-1 last:mb-0">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => onToggle(zone)}
									className="w-full justify-start gap-1.5 px-2 font-medium"
								>
									<IconChevronDown
										className={cn(
											"size-3.5 shrink-0 transition-transform",
											!isOpen && "-rotate-90",
										)}
									/>
									<span className="truncate">{zone}</span>
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

	let Icon = IconBolt;
	if (device.category === "climate") {
		Icon = IconTemperature;
	} else if (device.category === "environment") {
		Icon = IconCloud;
	} else if (device.category === "water") {
		Icon = IconDroplet;
	}

	return (
		<Button
			type="button"
			variant="ghost"
			onClick={onClick}
			className="h-auto w-full items-center justify-start gap-2.5 rounded-lg px-2.5 py-2 text-left font-normal"
		>
			<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
				<Icon className="size-3.5 text-muted-foreground" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 overflow-hidden text-left">
				<span className="truncate text-xs font-medium text-foreground">
					{device.name}
				</span>
				<span className="truncate text-[11px] text-muted-foreground">
					{device.metrics_summary}
				</span>
			</div>
			<Arrow className="size-3.5 shrink-0 text-muted-foreground" />
		</Button>
	);
};
