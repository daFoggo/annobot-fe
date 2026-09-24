import {
	IconCalendarEvent,
	IconChevronLeft,
	IconChevronRight,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { type CaseStage, stageMeta, stageOf } from "../lifecycle";
import type { Case } from "../schemas";
import { StageDot } from "./case-status-badge";

/**
 * Timeline (Gantt) — mỗi hàng là một thiết bị (source), mỗi thanh là một lần
 * chạy `[t_start, t_end]` đặt đúng vị trí và độ dài trên trục thời gian.
 *
 * Case vốn là *khoảng* thời gian, nên đây là cách vẽ đúng bản chất dữ liệu.
 * Cửa sổ hiển thị chọn được 1/3/7 ngày (mặc định 1) + nút ± để di chuyển —
 * thiết bị chạy dày (tủ lạnh ~20 chu kỳ/ngày) cần cửa sổ ngắn mới tách được
 * từng chu kỳ.
 */

const DAY_MS = 86_400_000;
const LABEL_COL = "w-28 sm:w-36";

type WindowDays = 1 | 3 | 7;

/**
 * Trả về epoch ms tại thời điểm 00:00:00 của ngày tương ứng trong timeZone chỉ định.
 */
const getStartOfDay = (timestamp: number, timeZone: string): number => {
	try {
		const fmt = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
		const [year, month, day] = fmt
			.format(new Date(timestamp))
			.split("-")
			.map(Number);
		const approxUtc = Date.UTC(year, month - 1, day);
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone,
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
			hour12: false,
		}).formatToParts(new Date(approxUtc));
		const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
		const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
		const s = Number(parts.find((p) => p.type === "second")?.value ?? 0);
		return approxUtc - (h * 3600 + m * 60 + s) * 1000;
	} catch {
		const d = new Date(timestamp);
		return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	}
};

const clockFmt = (timeZone: string) =>
	new Intl.DateTimeFormat("en-GB", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

const dayFmt = (timeZone: string) =>
	new Intl.DateTimeFormat("en-GB", {
		timeZone,
		day: "2-digit",
		month: "2-digit",
	});

const fullDateFmt = (timeZone: string) =>
	new Intl.DateTimeFormat("en-GB", {
		timeZone,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

const shortDateFmt = (timeZone: string) =>
	new Intl.DateTimeFormat("en-GB", {
		timeZone,
		day: "2-digit",
		month: "2-digit",
	});

const timeFmt = (timeZone: string) =>
	new Intl.DateTimeFormat("en-GB", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

const deviceLabel = (key: string) =>
	key.replace(/^sensor\./, "").replace(/_/g, " ");

const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${Math.round(minutes)} min`;
	const hours = Math.floor(minutes / 60);
	const rest = Math.round(minutes % 60);
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

const num = (value: unknown): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;

interface TipState {
	x: number;
	y: number;
	item: Case;
	device: string;
}

export interface CaseTimelineProps {
	cases: Case[];
	/** IANA zone dùng để hiển thị giờ/ngày. */
	timezone?: string;
	isLoading?: boolean;
	className?: string;
	/** Khi true, các hàng giãn theo chiều cao card (dùng trong grid 2 cột). */
	fillChart?: boolean;
	/** source_key → tên hiển thị (từ sensor của inquiry). */
	deviceNames?: Record<string, string>;
}

export const CaseTimeline = ({
	cases,
	timezone = "UTC",
	isLoading,
	className,
	fillChart = false,
	deviceNames,
}: CaseTimelineProps) => {
	const [windowDays, setWindowDays] = useState<WindowDays>(1);
	const [windowEnd, setWindowEnd] = useState<number | null>(null);
	const [tip, setTip] = useState<TipState | null>(null);

	const windowMs = windowDays * DAY_MS;

	const model = useMemo(() => {
		const dated = cases.filter((item) => item.t_end);
		if (dated.length === 0) return null;

		const starts = dated.map((c) => new Date(c.t_start).getTime());
		const ends = dated.map((c) => new Date(c.t_end as string).getTime());
		const minCaseStart = Math.min(...starts);
		const maxCaseEnd = Math.max(...ends);

		// Căn chỉnh trục thời gian theo đúng ngày lịch (calendar day) trong timezone:
		// - earliestDayStart: 00:00:00 của ngày có case sớm nhất
		// - latestDayEnd: 24:00:00 của ngày có case muộn nhất (tức 00:00:00 ngày hôm sau)
		const earliestDayStart = getStartOfDay(minCaseStart, timezone);
		const latestDayEnd = getStartOfDay(maxCaseEnd, timezone) + DAY_MS;

		const totalSpan = latestDayEnd - earliestDayStart;
		const canPan = totalSpan > windowMs;
		const minEnd = earliestDayStart + windowMs;
		const maxEnd = latestDayEnd;

		// Khi không pan hoặc mới load, neo window ở latestDayEnd (hết ngày mới nhất)
		const end = canPan
			? Math.min(Math.max(windowEnd ?? maxEnd, minEnd), maxEnd)
			: maxEnd;
		const t0 = end - windowMs;
		const t1 = end;
		const span = Math.max(t1 - t0, 1);
		const pct = (ms: number) =>
			Math.min(Math.max(((ms - t0) / span) * 100, 0), 100);

		const visible = dated.filter((c) => {
			const s = new Date(c.t_start).getTime();
			const e = new Date(c.t_end as string).getTime();
			return e >= t0 && s <= t1;
		});

		const byDevice = new Map<string, Case[]>();
		for (const item of visible) {
			const key =
				(item.metadata?.source_key as string | undefined) ?? item.inquiry_id;
			const list = byDevice.get(key);
			if (list) list.push(item);
			else byDevice.set(key, [item]);
		}

		// Gridlines:
		// - 1 ngày: chia 4 khoảng 6h (00:00, 06:00, 12:00, 18:00, 24:00).
		// - Nhiều ngày: mỗi ngày 1 vạch (DD/MM).
		const step = windowDays === 1 ? DAY_MS / 4 : DAY_MS;
		const fmt = windowDays === 1 ? timeFmt(timezone) : dayFmt(timezone);
		const gridlines: { left: number; label: string }[] = [];

		if (windowDays === 1) {
			for (let ms = t0; ms <= t1; ms += step) {
				const left = pct(ms);
				const label = ms === t1 ? "24:00" : fmt.format(new Date(ms));
				gridlines.push({ left, label });
			}
		} else {
			for (let ms = t0; ms <= t1; ms += step) {
				const left = pct(ms);
				gridlines.push({
					left,
					label: ms === t1 ? "" : fmt.format(new Date(ms)),
				});
			}
		}

		const rangeLabel =
			windowDays === 1
				? fullDateFmt(timezone).format(new Date(t0))
				: `${shortDateFmt(timezone).format(new Date(t0))} – ${fullDateFmt(timezone).format(new Date(t1 - 1000))}`;

		return {
			minEnd,
			maxEnd,
			canPan,
			end,
			t0,
			t1,
			pct,
			byDevice,
			devices: [...byDevice.keys()].sort(),
			gridlines,
			rangeLabel,
			total: visible.length,
		};
	}, [cases, windowEnd, windowMs, windowDays, timezone]);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-sm">Extracted cases</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-56 w-full" />
				</CardContent>
			</Card>
		);
	}

	const hasData = model !== null && model.total > 0;
	const shift = (delta: number) => {
		if (!model) return;
		setWindowEnd(
			Math.min(Math.max(model.end + delta, model.minEnd), model.maxEnd),
		);
	};

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<CardTitle className="text-sm">Extracted cases</CardTitle>
						{model?.rangeLabel ? (
							<CardDescription className="font-mono text-xs">
								{model.rangeLabel}
							</CardDescription>
						) : null}
					</div>
					<div className="flex items-center gap-2">
						<Tabs
							value={String(windowDays)}
							onValueChange={(value) => {
								if (value === "1" || value === "3" || value === "7") {
									setWindowDays(Number(value) as WindowDays);
									setWindowEnd(null);
								}
							}}
						>
							<TabsList>
								<TabsTrigger value="1" className="text-xs">
									1 day
								</TabsTrigger>
								<TabsTrigger value="3" className="text-xs">
									3 days
								</TabsTrigger>
							</TabsList>
						</Tabs>
						{hasData && model?.canPan ? (
							<div className="flex items-center gap-0.5">
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									className="text-muted-foreground hover:text-foreground"
									aria-label="Previous window"
									disabled={model.end <= model.minEnd}
									onClick={() => shift(-windowMs)}
								>
									<IconChevronLeft className="size-4" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									className="text-muted-foreground hover:text-foreground"
									aria-label="Next window"
									disabled={model.end >= model.maxEnd}
									onClick={() => shift(windowMs)}
								>
									<IconChevronRight className="size-4" />
								</Button>
							</div>
						) : null}
					</div>
				</div>
			</CardHeader>

			<CardContent
				className={cn("flex flex-col gap-3", fillChart && "min-h-0 flex-1")}
			>
				{!hasData || model === null ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<IconCalendarEvent />
							</EmptyMedia>
							<EmptyTitle>No cases yet</EmptyTitle>
							<EmptyDescription>
								The detection worker runs every 60 seconds and re-scans the last
								7 days. Cases show up here as soon as a device finishes a run.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<>
						<div
							className={cn(
								"flex flex-col gap-1",
								fillChart && "min-h-0 flex-1",
							)}
						>
							<div className="flex items-center gap-2">
								<span className={cn(LABEL_COL, "shrink-0")} />
								<div className="relative h-4 flex-1">
									{model.gridlines.map((line) => {
										if (!line.label) return null;
										const alignClass =
											line.left <= 2
												? "translate-x-0"
												: line.left >= 98
													? "-translate-x-full"
													: "-translate-x-1/2";
										return (
											<span
												key={line.label + line.left}
												className={cn(
													"absolute top-0 font-mono text-[10px] text-muted-foreground tabular-nums select-none",
													alignClass,
												)}
												style={{ left: `${line.left}%` }}
											>
												{line.label}
											</span>
										);
									})}
								</div>
							</div>

							{model.devices.map((source) => (
								<div
									key={source}
									className={cn(
										"flex items-center gap-2",
										fillChart ? "min-h-8 flex-1" : "h-8",
									)}
								>
									<span
										className={cn(
											LABEL_COL,
											"shrink-0 truncate text-xs font-medium text-muted-foreground",
										)}
										title={deviceNames?.[source] ?? deviceLabel(source)}
									>
										{deviceNames?.[source] ?? deviceLabel(source)}
									</span>
									<div className="relative h-full flex-1 overflow-hidden rounded-[3px] bg-muted/20">
										{model.gridlines.map((line) => (
											<span
												key={line.left}
												className="absolute inset-y-0 w-px bg-border/40"
												style={{ left: `${line.left}%` }}
											/>
										))}
										{(model.byDevice.get(source) ?? []).map((item) => (
											<RunBar
												key={item.id}
												item={item}
												device={deviceNames?.[source] ?? deviceLabel(source)}
												left={model.pct(new Date(item.t_start).getTime())}
												right={model.pct(
													new Date(item.t_end as string).getTime(),
												)}
												onHover={setTip}
											/>
										))}
									</div>
								</div>
							))}
						</div>

						<StageLegend cases={cases} />
					</>
				)}
			</CardContent>

			{tip ? <RunTooltip tip={tip} timezone={timezone} /> : null}
		</Card>
	);
};

const RunBar = ({
	item,
	device,
	left,
	right,
	onHover,
}: {
	item: Case;
	device: string;
	left: number;
	right: number;
	onHover: (tip: TipState | null) => void;
}) => {
	const stage = stageOf(item.status);
	const width = Math.max(right - left, 0.6);
	const clampedWidth = Math.min(width, Math.max(100 - left, 0));
	const overMax = (item.evidence?.flags as string[] | undefined)?.includes(
		"duration-over-max",
	);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover-only tooltip target (no keyboard action)
		<div
			data-slot="run-bar"
			className={cn(
				"absolute inset-y-1 rounded-[3px] cursor-default transition-shadow hover:ring-2 hover:ring-ring/60",
				overMax && "ring-1 ring-destructive/70",
			)}
			style={{
				left: `${left}%`,
				width: `${clampedWidth}%`,
				minWidth: "3px",
				backgroundColor: stageMeta(stage).color,
			}}
			onMouseEnter={(event) =>
				onHover({ x: event.clientX, y: event.clientY, item, device })
			}
			onMouseMove={(event) =>
				onHover({ x: event.clientX, y: event.clientY, item, device })
			}
			onMouseLeave={() => onHover(null)}
		/>
	);
};

const RunTooltip = ({ tip, timezone }: { tip: TipState; timezone: string }) => {
	const { item, device } = tip;
	const stage = stageOf(item.status);
	const startMs = new Date(item.t_start).getTime();
	const endMs = new Date(item.t_end as string).getTime();
	const duration = (endMs - startMs) / 60_000;
	const energy = num(item.evidence?.energy_wh_integrated);
	const peak = num(item.evidence?.peak_w);
	const overMax = (item.evidence?.flags as string[] | undefined)?.includes(
		"duration-over-max",
	);

	const flipX =
		typeof window !== "undefined" && tip.x + 280 > window.innerWidth;
	const flipY =
		typeof window !== "undefined" && tip.y + 160 > window.innerHeight;

	return (
		<div
			className={cn(
				"pointer-events-none fixed z-50 grid max-w-64 gap-1 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md transition-transform duration-75",
				flipX ? "-translate-x-full" : "translate-x-0",
				flipY ? "-translate-y-full" : "translate-y-0",
			)}
			style={{
				left: flipX ? Math.max(tip.x - 14, 10) : tip.x + 14,
				top: flipY ? Math.max(tip.y - 14, 10) : tip.y + 14,
			}}
		>
			<span className="font-medium text-popover-foreground">{device}</span>
			<span className="font-mono text-popover-foreground tabular-nums">
				{dayFmt(timezone).format(new Date(startMs))}{" "}
				{clockFmt(timezone).format(new Date(startMs))} –{" "}
				{clockFmt(timezone).format(new Date(endMs))}
			</span>
			<span className="font-mono text-muted-foreground tabular-nums">
				{formatDuration(duration)}
				{energy != null ? ` · ${energy.toFixed(1)} Wh` : ""}
				{peak != null ? ` · peak ${Math.round(peak)} W` : ""}
			</span>
			<span className="flex items-center gap-1.5 text-muted-foreground">
				<StageDot stage={stage} />
				{stageMeta(stage).label}
				{overMax ? " · over max duration" : ""}
			</span>
		</div>
	);
};

const StageLegend = ({ cases }: { cases: Case[] }) => {
	const stages = useMemo(() => {
		const present = new Set<CaseStage>();
		for (const item of cases) if (item.t_end) present.add(stageOf(item.status));
		return [...present];
	}, [cases]);

	if (stages.length === 0) return null;

	return (
		<div className="flex flex-wrap items-center gap-3">
			{stages.map((stage) => (
				<span
					key={stage}
					className="flex items-center gap-1.5 text-xs text-muted-foreground"
				>
					<StageDot stage={stage} />
					{stageMeta(stage).label}
				</span>
			))}
		</div>
	);
};
