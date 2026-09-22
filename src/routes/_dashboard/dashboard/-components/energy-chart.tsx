import {
	IconChartAreaLine,
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
	CardAction,
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
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EnergyChart } from "@/features/dashboard";
import { cn } from "@/lib/utils";

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

export interface EnergyUsageChartProps {
	data: EnergyChart;
	className?: string;
	/** Effective IANA zone used to format axis/tooltip/header labels. */
	timezone?: string;
}

/**
 * House power chart: stacked total by default, overlay to compare device
 * duty cycles. Legend toggles series, the brush zooms the window, and the
 * three stat tiles recompute from the visible + zoomed slice.
 */
export const EnergyUsageChart = ({
	data,
	className,
	timezone,
}: EnergyUsageChartProps) => {
	const zone = timezone ?? "UTC";
	const [mode, setMode] = useState<ViewMode>("stack");
	const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
	const [range, setRange] = useState<{
		startIndex: number;
		endIndex: number;
	}>();

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

	if (series.length === 0 || data.timestamps.length === 0) {
		return (
			<Card className={cn("h-full", className)}>
				<CardHeader>
					<CardTitle>Power consumption</CardTitle>
					<CardDescription>
						Live power draw per device, from the resampled sensor stream.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-1 items-center">
					<Empty className="border">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<IconChartAreaLine />
							</EmptyMedia>
							<EmptyTitle>No power data yet</EmptyTitle>
							<EmptyDescription>
								Power meters will show up here once the collector has recorded
								activity.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</CardContent>
			</Card>
		);
	}

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
			<CardHeader className="pb-2">
				<CardTitle>Power consumption</CardTitle>
				<CardDescription className="font-mono text-xs">
					Last {windowLabel(data.since, data.until)} ·{" "}
					{bucketLabel(data.bucket)}
				</CardDescription>
				<CardAction>
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
				</CardAction>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-4 overflow-visible">
				<div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/20 p-2.5">
					<div className="flex flex-col gap-0.5 px-3">
						<span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
							Current
						</span>
						<span className="font-mono text-sm font-semibold text-foreground tabular-nums">
							{formatWatts(stats.currentW)}
						</span>
					</div>
					<div className="flex flex-col gap-0.5 px-3">
						<span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
							Peak
						</span>
						<span className="font-mono text-sm font-semibold text-foreground tabular-nums">
							{formatWatts(stats.peakW)}
						</span>
					</div>
					<div className="flex min-w-0 flex-col gap-0.5 px-3">
						<span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
							Top consumer
						</span>
						<span
							className="truncate font-mono text-sm font-semibold text-foreground tabular-nums"
							title={stats.topName}
						>
							{stats.topName}
						</span>
					</div>
				</div>

				<ChartContainer config={config} className="aspect-auto h-80 w-full">
					<ComposedChart
						accessibilityLayer
						data={rows}
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
								value === 0 ? "" : `${value} W`
							}
						/>
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
						{series.map((item, index) =>
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
						)}
						<Brush
							dataKey="ts"
							height={24}
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
					</ComposedChart>
				</ChartContainer>

				<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/10 p-2.5">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<span className="text-[11px] font-mono font-medium tracking-wider text-muted-foreground uppercase">
								Devices
							</span>
							<Badge
								variant="outline"
								className="h-4.5 px-1.5 font-mono text-[10px]"
							>
								{visible.length}/{series.length} active
							</Badge>
						</div>
						<div className="flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={selectAll}
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

					<ScrollArea
						className="scroll-fade-y h-20 w-full overflow-hidden"
						viewportClassName="scroll-fade-y"
					>
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
					</ScrollArea>
				</div>
			</CardContent>
		</Card>
	);
};

const formatWatts = (value: number) =>
	`${Math.round(value).toLocaleString("en-US")} W`;

interface ChartStats {
	currentW: number;
	peakW: number;
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
		return { currentW: 0, peakW: 0, topName: "—" };
	}

	const valueAt = (
		row: Record<string, string | number | null>,
		key: string,
	) => {
		const value = row[key];
		return typeof value === "number" ? value : 0;
	};

	let peakW = 0;
	for (let i = start; i <= end; i += 1) {
		const row = rows[i];
		if (!row) continue;
		let sum = 0;
		for (const item of series) sum += valueAt(row, item.key);
		if (sum > peakW) peakW = sum;
	}

	const lastRow = rows[end];
	let currentW = 0;
	if (lastRow) {
		for (const item of series) currentW += valueAt(lastRow, item.key);
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

	return { currentW, peakW, topName };
};
