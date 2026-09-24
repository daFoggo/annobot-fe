import {
	IconAlertTriangle,
	IconBolt,
	IconCheck,
	IconClock,
	IconCopy,
	IconDevices,
	IconPlugConnected,
	IconProgressAlert,
	IconProgressCheck,
	IconProgressX,
} from "@tabler/icons-react";
import {
	keepPreviousData,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { DashboardPage } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMeQueryOptions } from "@/features/auth";
import {
	dashboardOverviewQueryOptions,
	EnergyUsageChart,
	energyChartQueryOptions,
	type HaHealth,
	last24hWindow,
	RESOURCE_EVENT_TYPES,
	type ResourceConsumptionType,
} from "@/features/dashboard";

import { cn } from "@/lib/utils";
import { resolveTimezone, useTimezoneStore } from "@/stores/timezone";
import { RelativeTime } from "./-components/relative-time";

const STATUS_CONFIG: Record<
	HaHealth["status"],
	{
		label: string;
		icon: ComponentType<{ className?: string }>;
		iconClass: string;
	}
> = {
	ok: {
		label: "Healthy",
		icon: IconProgressCheck,
		iconClass: "text-emerald-500",
	},
	degraded: {
		label: "Degraded",
		icon: IconProgressAlert,
		iconClass: "text-amber-500",
	},
	offline: {
		label: "Offline",
		icon: IconProgressX,
		iconClass: "text-destructive",
	},
};

interface StatBlockProps {
	icon: ComponentType<{ className?: string }>;
	label: string;
	value: ReactNode;
	description?: string;
	iconClassName?: string;
}

/** Supabase-style unboxed telemetry stat: icon plate + uppercase mono label + prominent value, hint in tooltip. */
const StatBlock = ({
	icon: Icon,
	label,
	value,
	description,
	iconClassName,
}: StatBlockProps) => {
	const block = (
		<div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40 cursor-default">
			<div
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-md border border-border/40 bg-muted/40 text-muted-foreground",
					iconClassName,
				)}
			>
				<Icon className="size-4.5" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<span className="text-[10px] font-mono font-medium tracking-wider text-muted-foreground uppercase leading-tight">
					{label}
				</span>
				<span className="truncate text-sm font-semibold text-foreground leading-snug">
					{value}
				</span>
			</div>
		</div>
	);

	if (!description) return block;

	return (
		<Tooltip>
			<TooltipTrigger render={block} />
			<TooltipContent side="right">{description}</TooltipContent>
		</Tooltip>
	);
};

const HomePage = () => {
	const range = Route.useLoaderData();
	const { data: user } = useSuspenseQuery(getMeQueryOptions());
	const tzChoice = useTimezoneStore((state) => state.choice);
	const [copied, setCopied] = useState(false);

	const userTz = user?.timezone || "UTC";
	const effectiveTz = resolveTimezone(tzChoice, userTz);

	const [resourceType, setResourceType] =
		useState<ResourceConsumptionType>("power");

	// Overview is tz-sensitive (energy_today uses the zone's local midnight),
	// but switching timezone must not blank the page: refetch in the background
	// and keep showing the previous stats (Grafana-style) until fresh data lands.
	const { data: overview } = useQuery({
		...dashboardOverviewQueryOptions(effectiveTz),
		placeholderData: keepPreviousData,
	});
	const { data: initialEnergy } = useSuspenseQuery(
		energyChartQueryOptions(range, "power_w"),
	);
	const { data: consumptionData } = useQuery({
		...energyChartQueryOptions(range, RESOURCE_EVENT_TYPES[resourceType]),
		placeholderData: keepPreviousData,
	});

	// Loader prefetches overview, so this only guards the (unreachable) no-cache
	// path; placeholderData keeps stats visible while a tz change refetches.
	if (!overview) {
		return (
			<DashboardPage
				size="full"
				className="mx-auto max-w-360 flex-1 justify-center px-8 py-8 sm:px-12 lg:px-16 xl:px-20"
			>
				<Skeleton className="h-96 w-full" />
			</DashboardPage>
		);
	}

	const haUrl = overview.ha_url;
	const statusConfig = STATUS_CONFIG[overview.ha_health.status];

	const copyHaUrl = async () => {
		if (!haUrl) return;
		try {
			await navigator.clipboard.writeText(haUrl);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API unavailable (insecure context) — nothing to do.
		}
	};

	return (
		<DashboardPage
			size="full"
			className="mx-auto max-w-360 flex-1 justify-center px-8 py-8 sm:px-12 lg:px-16 xl:px-20"
		>
			<div className="grid min-h-0 flex-1 items-center gap-8 lg:grid-cols-5 xl:gap-12">
				<div className="flex flex-col justify-center gap-5 self-center lg:col-span-2">
					<div className="flex flex-col gap-1.5">
						<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
							I-Smart Building
						</h1>
						{haUrl ? (
							<div className="flex items-center gap-2">
								<a
									href={haUrl}
									target="_blank"
									rel="noreferrer"
									className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground select-all"
								>
									{haUrl}
								</a>
								<Button
									variant="outline"
									size="sm"
									className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
									onClick={copyHaUrl}
								>
									{copied ? (
										<IconCheck className="size-3 text-emerald-500" />
									) : (
										<IconCopy className="size-3" />
									)}
									<span>{copied ? "Copied" : "Copy"}</span>
								</Button>
							</div>
						) : null}
					</div>

					<div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
						<StatBlock
							icon={statusConfig.icon}
							iconClassName={statusConfig.iconClass}
							label="Status"
							value={statusConfig.label}
							description={
								overview.ha_health.latency_ms != null
									? `Latency: ${overview.ha_health.latency_ms} ms`
									: undefined
							}
						/>
						<StatBlock
							icon={IconDevices}
							label="Devices"
							value={
								<span className="font-mono">{overview.devices.total}</span>
							}
							description={`${overview.devices.power_devices ?? 11} power, ${overview.devices.climate_devices ?? 6} climate, ${overview.devices.environment_devices ?? 2} environment devices configured`}
						/>
						<StatBlock
							icon={IconPlugConnected}
							label="Active devices"
							value={
								<span className="font-mono">
									{overview.active_power_devices_24h ??
										overview.active_power_meters_24h}{" "}
									/{" "}
									{overview.devices.power_devices ??
										overview.devices.power_meters}
								</span>
							}
							description={`${overview.active_power_devices_24h ?? overview.active_power_meters_24h} of ${overview.devices.power_devices ?? overview.devices.power_meters} power devices active in the last 24 hours`}
						/>
						<StatBlock
							icon={IconBolt}
							label="Energy today"
							value={
								overview.energy_today_kwh != null ? (
									<span className="font-mono">
										{overview.energy_today_kwh} kWh
									</span>
								) : (
									"—"
								)
							}
							description="Total energy consumed since local midnight"
						/>
						<StatBlock
							icon={IconClock}
							label="Last data"
							value={<RelativeTime value={overview.last_data_at} />}
							description={
								overview.last_sync_at
									? `Last telemetry received · Synced ${overview.last_sync_at}`
									: "Last telemetry received"
							}
						/>
						<StatBlock
							icon={IconAlertTriangle}
							label="Collection"
							value={
								overview.stale_sources_24h === 0
									? "All sources reporting"
									: `${overview.stale_sources_24h} not reporting`
							}
							description={`${overview.events_last_24h.toLocaleString("en-US")} events received in the last 24h`}
						/>
						{overview.stale_sensors > 0 ? (
							<StatBlock
								icon={IconAlertTriangle}
								iconClassName="text-amber-500"
								label="Stale sensors"
								value={
									<span className="font-mono">{overview.stale_sensors}</span>
								}
								description="Reporting a constant value for days (dead plug or mis-mapped entity). Excluded from detection."
							/>
						) : null}
					</div>
				</div>

				<EnergyUsageChart
					data={consumptionData ?? initialEnergy}
					resourceType={resourceType}
					onResourceTypeChange={setResourceType}
					timezone={effectiveTz}
					className="lg:col-span-3"
				/>
			</div>
		</DashboardPage>
	);
};

export const Route = createFileRoute("/_dashboard/dashboard/")({
	loader: async ({ context }) => {
		const range = last24hWindow();
		const user = await context.queryClient.query(getMeQueryOptions());
		const tz = user?.timezone || undefined;
		await Promise.all([
			context.queryClient.query(dashboardOverviewQueryOptions(tz)),
			context.queryClient.query(energyChartQueryOptions(range)),
		]);
		return range;
	},
	component: HomePage,
});
