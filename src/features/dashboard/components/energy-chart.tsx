import {
	IconChartHistogram,
	IconChartLine,
	IconRotate,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import {
	Area,
	Brush,
	CartesianGrid,
	ComposedChart,
	Line,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { EnergyChart, ResourceConsumptionType } from "../schemas";

/** Number of hue tokens available in `styles.css` (`--chart-1..10`). */
const CHART_COLOR_COUNT = 10;

/**
 * Chart config keys must be CSS-identifier safe, but HA entity ids contain
 * dots (`sensor.z1_...`) which are invalid inside a custom-property name.
 * So each series gets a positional key (`s0`, `s1`, …) and the device name
 * lives in the config label.
 */
const colorFor = (index: number) =>
	`var(--chart-${(index % CHART_COLOR_COUNT) + 1})`;

type ViewMode = "stack" | "overlay";

const timeLabelCache = new Map<string, Intl.DateTimeFormat>();

/** Local HH:MM label for a UTC instant, formatted in the display zone.
 *  Formatter instances are cached per zone (Grafana-style) so switching the
 *  timezone only recomputes labels — never the data. */
const timeLabel = (iso: string, timezone: string) => {
	let formatter = timeLabelCache.get(timezone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-GB", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		timeLabelCache.set(timezone, formatter);
	}
	return formatter.format(new Date(iso));
};

/** Human window duration, e.g. "24 hours" / "2 days". */
const windowLabel = (since: string, until: string) => {
	const hours = Math.round(
		(new Date(until).getTime() - new Date(since).getTime()) / 3_600_000,
	);
	if (hours >= 48 && hours % 24 === 0) return `${hours / 24} days`;
	return `${hours} hours`;
};

/** Human label for the bucket resolution, e.g. "15 minutes" → "15-min averages". */
const bucketLabel = (bucket: string) =>
	({
		"1 minute": "1-min averages",
		"5 minutes": "5-min averages",
		"15 minutes": "15-min averages",
		"30 minutes": "30-min averages",
		"1 hour": "hourly averages",
	})[bucket] ?? `${bucket} averages`;

const CONSUMPTION_TYPES = [
	{ value: "power", label: "Power consumption" },
	{ value: "water", label: "Water consumption" },
];

export interface EnergyUsageChartProps {
	data: EnergyChart;
	resourceType?: ResourceConsumptionType;
	onResourceTypeChange?: (type: ResourceConsumptionType) => void;
	className?: string;
	/** Height class for the plot area; defaults to `h-80` (or `h-40` compact). */
	chartAreaClassName?: string;
	/**
	 * `default`: full house chart. `compact`: shorter plot + tighter chrome, for
	 * embedding next to another card (experiment overview).
	 */
	variant?: "default" | "compact";
	/** Effective IANA zone used to format axis/tooltip/header labels. */
	timezone?: string;
}

/**
 * House power/water chart: stacked total by default, overlay to compare device
 * duty cycles. Legend toggles series, the brush zooms the window, and the
 * three stat tiles recompute from the visible + zoomed slice.
 */
export const EnergyUsageChart = ({
	data,
	resourceType = "power",
	onResourceTypeChange,
	className,
	chartAreaClassName,
	variant = "default",
	timezone,
}: EnergyUsageChartProps) => {
	const zone = timezone ?? "UTC";
	const compact = variant === "compact";
	const chartClass = chartAreaClassName ?? (compact ? "h-40" : "h-80");
	const [mode, setMode] = useState<ViewMode>("stack");
	const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
	const [range, setRange] = useState<{
		startIndex: number;
		endIndex: number;
	}>();

	const isWater = resourceType === "water";
	const effectiveUnit = data.unit || (isWater ? "L/min" : "W");
	const resourceTitle = isWater ? "Water consumption" : "Power consumption";

	const series = useMemo(
		() => data.series.map((item, index) => ({ ...item, key: `s${index}` })),
		[data.series],
	);
	const rows = useMemo(() => {
		// The resampled view is sparse: HA only records a row when a value
		// changes, so most buckets are missing (null). Carry the last known
		// value forward (LOCF) so each series is continuous — a gap means "no
		// change", not "no power". Leading nulls stay null (unknown before the
		// first reading).
		const lastKnown: Record<string, number | null> = {};
		return data.timestamps.map((ts, index) => {
			const row: Record<string, string | number | null> = { ts };
			series.forEach((item) => {
				const value = item.data[index];
				if (value != null) {
					// 1 decimal is plenty for watts and keeps the tooltip tidy.
					lastKnown[item.key] = Math.round(value * 10) / 10;
				}
				row[item.key] = lastKnown[item.key] ?? null;
			});
			return row;
		});
	}, [data.timestamps, series]);

	const config = useMemo<ChartConfig>(() => {
		const next: ChartConfig = {};
		series.forEach((item, index) => {
			next[item.key] = { label: item.name, color: colorFor(index) };
		});
		return next;
	}, [series]);

	const headerNode = (
		<CardHeader className="pb-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					{onResourceTypeChange ? (
						<Select
							items={CONSUMPTION_TYPES}
							value={resourceType}
							onValueChange={(val) => {
								if (val === "power" || val === "water") {
									onResourceTypeChange(val);
								}
							}}
						>
							<SelectTrigger
								className={cn(
									"h-auto w-fit border-none bg-transparent p-0 pr-1 gap-1 font-semibold tracking-tight text-foreground shadow-none ring-0 outline-none hover:bg-transparent focus:ring-0 focus-visible:ring-0 focus-visible:border-none focus-visible:outline-none dark:bg-transparent dark:hover:bg-transparent cursor-pointer [&_svg]:size-4 [&_svg]:text-muted-foreground hover:[&_svg]:text-foreground",
									compact ? "text-sm sm:text-base" : "text-base sm:text-lg",
								)}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="start" className="min-w-44">
								<SelectGroup>
									{CONSUMPTION_TYPES.map((t) => (
										<SelectItem key={t.value} value={t.value}>
											{t.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					) : (
						<CardTitle
							className={cn(
								"font-semibold",
								compact ? "text-sm sm:text-base" : "text-base sm:text-lg",
							)}
						>
							{resourceTitle}
						</CardTitle>
					)}
				</div>

				<Tabs
					value={mode}
					onValueChange={(value) => {
						if (value === "stack" || value === "overlay") {
							setMode(value);
						}
					}}
				>
					<TabsList className="h-8">
						<TabsTrigger value="stack" className="gap-1.5 text-xs">
							<IconChartHistogram
								data-icon="inline-start"
								className="size-3.5"
							/>
							Stacked
						</TabsTrigger>
						<TabsTrigger value="overlay" className="gap-1.5 text-xs">
							<IconChartLine data-icon="inline-start" className="size-3.5" />
							Overlay
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			<CardDescription className="font-mono text-xs">
				Last {windowLabel(data.since, data.until)} · {bucketLabel(data.bucket)}
			</CardDescription>
		</CardHeader>
	);

	const hasSeries = series.length > 0 && data.timestamps.length > 0;
	const start = range?.startIndex ?? 0;
	const end = range?.endIndex ?? data.timestamps.length - 1;
	const visible = series.filter((item) => !hidden.has(item.key));

	const stats = computeStats(rows, visible, start, end);

	const toggle = (key: string) => {
		setHidden((prev) => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	};

	const selectAll = () => {
		setHidden(new Set());
	};

	const reset = () => {
		setHidden(new Set());
		setRange(undefined);
	};

	return (
		<Card
			className={cn(
				"flex flex-col border border-border/50 bg-card/60 overflow-visible",
				className,
			)}
		>
			{headerNode}

			<CardContent
				className={cn(
					"flex flex-1 flex-col overflow-visible",
					compact ? "gap-2.5" : "gap-4",
				)}
			>
				<div
					className={cn(
						"grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/20",
						compact ? "p-1.5" : "p-2.5",
					)}
				>
					<div
						className={cn("flex flex-col gap-0.5", compact ? "px-2" : "px-3")}
					>
						<span
							className={cn(
								"font-mono tracking-wider text-muted-foreground uppercase",
								compact ? "text-[10px]" : "text-[11px]",
							)}
						>
							Current
						</span>
						<span
							className={cn(
								"font-mono font-semibold text-foreground tabular-nums",
								compact ? "text-xs" : "text-sm",
							)}
						>
							{hasSeries ? formatUnit(stats.current, effectiveUnit) : "—"}
						</span>
					</div>
					<div
						className={cn("flex flex-col gap-0.5", compact ? "px-2" : "px-3")}
					>
						<span
							className={cn(
								"font-mono tracking-wider text-muted-foreground uppercase",
								compact ? "text-[10px]" : "text-[11px]",
							)}
						>
							Peak
						</span>
						<span
							className={cn(
								"font-mono font-semibold text-foreground tabular-nums",
								compact ? "text-xs" : "text-sm",
							)}
						>
							{hasSeries ? formatUnit(stats.peak, effectiveUnit) : "—"}
						</span>
					</div>
					<div
						className={cn(
							"flex min-w-0 flex-col gap-0.5",
							compact ? "px-2" : "px-3",
						)}
					>
						<span
							className={cn(
								"font-mono tracking-wider text-muted-foreground uppercase",
								compact ? "text-[10px]" : "text-[11px]",
							)}
						>
							Top consumer
						</span>
						<span
							className={cn(
								"truncate font-mono font-semibold text-foreground tabular-nums",
								compact ? "text-xs" : "text-sm",
							)}
							title={hasSeries ? stats.topName : undefined}
						>
							{hasSeries ? stats.topName : "—"}
						</span>
					</div>
				</div>

				<div className={cn("relative aspect-auto w-full", chartClass)}>
					<ChartContainer config={config} className="h-full w-full">
						<ComposedChart
							accessibilityLayer
							data={
								rows.length > 0
									? rows
									: [{ ts: data.since }, { ts: data.until }]
							}
							margin={{ top: 20, right: 16, bottom: 4, left: 4 }}
						>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="ts"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={48}
								interval="preserveStartEnd"
								tickFormatter={(value) => timeLabel(String(value), zone)}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								width={56}
								tickFormatter={(value: number) =>
									value === 0 ? "" : `${value} ${effectiveUnit}`
								}
							/>
							{hasSeries ? (
								<ChartTooltip
									offset={32}
									content={
										<ChartTooltipContent
											indicator="line"
											className="max-h-64 overflow-y-auto"
											labelFormatter={(value) => timeLabel(String(value), zone)}
										/>
									}
								/>
							) : null}
							{hasSeries
								? series.map((item, index) =>
										mode === "stack" ? (
											<Area
												key={item.key}
												dataKey={item.key}
												stackId="total"
												type="stepAfter"
												stroke={colorFor(index)}
												strokeWidth={1}
												fill={colorFor(index)}
												fillOpacity={0.45}
												hide={hidden.has(item.key)}
											/>
										) : (
											<Line
												key={item.key}
												dataKey={item.key}
												type="stepAfter"
												stroke={colorFor(index)}
												strokeWidth={1.5}
												dot={false}
												hide={hidden.has(item.key)}
											/>
										),
									)
								: null}
							{hasSeries ? (
								<Brush
									dataKey="ts"
									height={compact ? 16 : 24}
									travellerWidth={8}
									fill="var(--muted)"
									stroke="var(--border)"
									onChange={(next) => {
										if (
											typeof next?.startIndex === "number" &&
											typeof next?.endIndex === "number"
										) {
											setRange({
												startIndex: next.startIndex,
												endIndex: next.endIndex,
											});
										}
									}}
								/>
							) : null}
						</ComposedChart>
					</ChartContainer>
					{!hasSeries ? (
						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
							<span className="text-xs font-medium text-muted-foreground/60">
								{isWater ? "No water flow data available" : "No power data yet"}
							</span>
						</div>
					) : null}
				</div>

				<div
					className={cn(
						"flex flex-col gap-2 rounded-lg border border-border bg-muted/10",
						compact ? "p-2" : "p-2.5",
					)}
				>
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<span className="text-[11px] font-mono font-medium tracking-wider text-muted-foreground uppercase">
								Devices
							</span>
							<Badge
								variant="outline"
								className="h-4.5 px-1.5 font-mono text-[10px]"
							>
								{hasSeries
									? `${visible.length}/${series.length} active`
									: "0/0 active"}
							</Badge>
						</div>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={selectAll}
								disabled={!hasSeries}
								className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
							>
								All
							</Button>

							<Tooltip>
								<TooltipTrigger
									render={
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={reset}
											disabled={!hasSeries}
											className="size-6 p-0 text-muted-foreground hover:text-foreground"
											aria-label="Reset view"
										>
											<IconRotate className="size-3.5" />
										</Button>
									}
								/>
								<TooltipContent side="top" className="text-xs">
									Reset view
								</TooltipContent>
							</Tooltip>
						</div>
					</div>

					<div
						className={cn(
							"scroll-fade-y w-full overflow-y-auto scrollbar-none",
							compact ? "max-h-14" : "max-h-20",
						)}
					>
						{hasSeries ? (
							<div className="flex flex-wrap items-center gap-1.5 pr-3 py-1">
								{series.map((item, index) => {
									const isHidden = hidden.has(item.key);
									return (
										<button
											key={item.key}
											type="button"
											onClick={() => toggle(item.key)}
											aria-pressed={!isHidden}
											title={item.name}
											className={cn(
												"group flex h-6 max-w-48 items-center gap-1.5 rounded-md border px-2 text-xs transition-all select-none cursor-pointer",
												isHidden
													? "border-transparent bg-muted/30 text-muted-foreground/50 hover:bg-muted/50"
													: "border-border/50 bg-background text-foreground shadow-xs hover:bg-muted/40",
											)}
										>
											<span
												className={cn(
													"size-2 shrink-0 rounded-full transition-opacity",
													isHidden && "opacity-30",
												)}
												style={{ backgroundColor: colorFor(index) }}
											/>
											<span
												className={cn(
													"truncate font-medium",
													isHidden && "line-through opacity-70",
												)}
											>
												{item.name}
											</span>
										</button>
									);
								})}
							</div>
						) : (
							<div className="flex h-16 w-full items-center justify-center text-xs text-muted-foreground">
								{isWater ? "No water meters connected" : "No devices recorded"}
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

const formatUnit = (value: number, unit: string) =>
	`${Math.round(value).toLocaleString("en-US")} ${unit}`;

interface ChartStats {
	current: number;
	peak: number;
	topName: string;
}

/**
 * Stats over the visible series and the brushed slice, computed from the
 * forward-filled rows (same values the chart draws) so a sparse last bucket
 * does not read as 0.
 */
const computeStats = (
	rows: Record<string, string | number | null>[],
	series: { key: string; name: string }[],
	start: number,
	end: number,
): ChartStats => {
	if (series.length === 0 || end < start || rows.length === 0) {
		return { current: 0, peak: 0, topName: "—" };
	}

	const valueAt = (
		row: Record<string, string | number | null>,
		key: string,
	) => {
		const value = row[key];
		return typeof value === "number" ? value : 0;
	};

	let peak = 0;
	for (let i = start; i <= end; i += 1) {
		const row = rows[i];
		if (!row) continue;
		let sum = 0;
		for (const item of series) sum += valueAt(row, item.key);
		if (sum > peak) peak = sum;
	}

	const lastRow = rows[end];
	let current = 0;
	if (lastRow) {
		for (const item of series) current += valueAt(lastRow, item.key);
	}

	let topName = "—";
	let topAvg = -1;
	for (const item of series) {
		let total = 0;
		let count = 0;
		for (let i = start; i <= end; i += 1) {
			const row = rows[i];
			const value = row?.[item.key];
			if (typeof value !== "number") continue;
			total += value;
			count += 1;
		}
		const avg = count > 0 ? total / count : 0;
		if (avg > topAvg) {
			topAvg = avg;
			topName = item.name;
		}
	}

	return { current, peak, topName };
};
