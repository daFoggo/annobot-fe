import {
	IconActivityHeartbeat,
	IconAlertTriangle,
	IconBolt,
	IconCheck,
	IconClock,
	IconCopy,
	IconDevices,
	IconPlugConnected,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { DashboardPage } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	dashboardOverviewQueryOptions,
	energyChartQueryOptions,
	type HaHealth,
	last24hWindow,
} from "@/features/dashboard";
import { cn } from "@/lib/utils";
import { EnergyUsageChart } from "./-components/energy-chart";
import { RelativeTime } from "./-components/relative-time";

const STATUS_CONFIG: Record<
	HaHealth["status"],
	{ label: string; iconClass: string }
> = {
	ok: {
		label: "Healthy",
		iconClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
	},
	degraded: {
		label: "Degraded",
		iconClass: "border-amber-500/20 bg-amber-500/10 text-amber-500",
	},
	offline: {
		label: "Offline",
		iconClass: "border-destructive/20 bg-destructive/10 text-destructive",
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
			<TooltipContent side="top" className="text-xs">
				{description}
			</TooltipContent>
		</Tooltip>
	);
};

const HomePage = () => {
	const range = Route.useLoaderData();
	const { data: overview } = useSuspenseQuery(dashboardOverviewQueryOptions());
	const { data: energy } = useSuspenseQuery(energyChartQueryOptions(range));
	const [copied, setCopied] = useState(false);

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
			className="mx-auto max-w-[1440px] flex-1 justify-center px-8 py-8 sm:px-12 lg:px-16 xl:px-20"
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

					<TooltipProvider delay={200}>
						<div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
							<StatBlock
								icon={IconActivityHeartbeat}
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
									<span className="font-mono">
										{overview.devices.active} / {overview.devices.total}
									</span>
								}
								description={`${overview.devices.power_meters} power meters configured`}
							/>
							<StatBlock
								icon={IconPlugConnected}
								label="Active meters"
								value={
									<span className="font-mono">
										{overview.active_power_meters_24h}
									</span>
								}
								description="Power meters active in the last 24 hours"
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
										? "All reporting"
										: `${overview.stale_sources_24h} stale`
								}
								description={`${overview.events_last_24h.toLocaleString("en-US")} events received in the last 24h`}
							/>
						</div>
					</TooltipProvider>
				</div>

				<EnergyUsageChart data={energy} className="lg:col-span-3" />
			</div>
		</DashboardPage>
	);
};

export const Route = createFileRoute("/_dashboard/dashboard/")({
	loader: async ({ context }) => {
		const range = last24hWindow();
		await Promise.all([
			context.queryClient.query(dashboardOverviewQueryOptions()),
			context.queryClient.query(energyChartQueryOptions(range)),
		]);
		return range;
	},
	component: HomePage,
});
