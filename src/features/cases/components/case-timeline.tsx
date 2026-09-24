import { IconCalendarEvent } from "@tabler/icons-react";
import { useMemo, useState } from "react";
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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type CaseStage, stageMeta, stageOf } from "../lifecycle";
import type { Case } from "../schemas";
import { StageDot } from "./case-status-badge";

/**
 * Timeline (Gantt) — mỗi hàng là một thiết bị (source), mỗi thanh là một lần
 * chạy `[t_start, t_end]` đặt đúng vị trí và độ dài trên trục thời gian.
 *
 * Case vốn là *khoảng* thời gian, nên đây là cách vẽ đúng bản chất dữ liệu:
 * thấy được nhịp hoạt động thực tế và chồng lấn giữa các thiết bị. Thanh tô màu
 * theo stage; viền đỏ khi case bị gắn cờ `duration-over-max`.
 */

const DAY_MS = 86_400_000;
const LABEL_COL = "w-28 sm:w-36";

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
	const [days, setDays] = useState<"7" | "14">("7");

	const rows = useMemo(() => {
		const dated = cases.filter((item) => item.t_end);
		if (dated.length === 0) return null;

		const end = Math.max(
			...dated.map((c) => new Date(c.t_end as string).getTime()),
		);
		const t0 = end - Number(days) * DAY_MS;
		const span = end - t0 || 1;
		const visible = dated
			.filter((c) => new Date(c.t_end as string).getTime() >= t0)
			.sort(
				(a, b) => new Date(a.t_start).getTime() - new Date(b.t_start).getTime(),
			);

		const byDevice = new Map<string, Case[]>();
		for (const item of visible) {
			const source =
				(item.metadata?.source_key as string | undefined) ?? item.inquiry_id;
			const list = byDevice.get(source);
			if (list) list.push(item);
			else byDevice.set(source, [item]);
		}

		const pct = (ms: number) =>
			Math.min(Math.max(((ms - t0) / span) * 100, 0), 100);

		const devices = [...byDevice.keys()].sort();
		const gridlines: { left: number; label: string }[] = [];
		const dayFormatter = dayFmt(timezone);
		for (let ms = t0; ms <= end; ms += DAY_MS) {
			gridlines.push({
				left: pct(ms),
				label: dayFormatter.format(new Date(ms)),
			});
		}

		return {
			t0,
			end,
			span,
			byDevice,
			devices,
			pct,
			gridlines,
			total: visible.length,
		};
	}, [cases, days, timezone]);

	const spansMoreThan7Days = useMemo(() => {
		const dated = cases.filter((item) => item.t_end);
		if (dated.length < 2) return false;
		const start = Math.min(...dated.map((c) => new Date(c.t_start).getTime()));
		const end = Math.max(
			...dated.map((c) => new Date(c.t_end as string).getTime()),
		);
		return end - start > 7 * DAY_MS;
	}, [cases]);

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="text-sm">Daily activity</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-56 w-full" />
				</CardContent>
			</Card>
		);
	}

	const hasData = rows !== null && rows.total > 0;

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<CardTitle className="text-sm">Daily activity</CardTitle>
					{spansMoreThan7Days ? (
						<Tabs
							value={days}
							onValueChange={(value) => {
								if (value === "7" || value === "14") setDays(value);
							}}
						>
							<TabsList>
								<TabsTrigger value="7" className="text-xs">
									7 days
								</TabsTrigger>
								<TabsTrigger value="14" className="text-xs">
									14 days
								</TabsTrigger>
							</TabsList>
						</Tabs>
					) : null}
				</div>
				<CardDescription className="font-mono text-xs">
					One row per device · bars are runs · {timezone}
				</CardDescription>
			</CardHeader>

			<CardContent
				className={cn("flex flex-col gap-3", fillChart && "min-h-0 flex-1")}
			>
				{!hasData || rows === null ? (
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
							{/* day label header, aligned with the row tracks */}
							<div className="flex items-center gap-2">
								<span className={cn(LABEL_COL, "shrink-0")} />
								<div className="relative h-4 flex-1">
									{rows.gridlines.map((line) => (
										<span
											key={line.label + line.left}
											className="absolute top-0 font-mono text-[10px] text-muted-foreground tabular-nums"
											style={{ left: `${line.left}%` }}
										>
											{line.label}
										</span>
									))}
								</div>
							</div>

							{rows.devices.map((source) => (
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
									<div className="relative h-full flex-1 rounded-[3px] bg-muted/20">
										{rows.gridlines.map((line) => (
											<span
												key={line.left}
												className="absolute inset-y-0 w-px bg-border/60"
												style={{ left: `${line.left}%` }}
											/>
										))}
										{(rows.byDevice.get(source) ?? []).map((item) => (
											<RunBar
												key={item.id}
												item={item}
												left={rows.pct(new Date(item.t_start).getTime())}
												right={rows.pct(
													new Date(item.t_end as string).getTime(),
												)}
												timezone={timezone}
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
		</Card>
	);
};

const RunBar = ({
	item,
	left,
	right,
	timezone,
}: {
	item: Case;
	left: number;
	right: number;
	timezone: string;
}) => {
	const stage = stageOf(item.status);
	const width = Math.max(right - left, 0.6);
	const overMax = (item.evidence?.flags as string[] | undefined)?.includes(
		"duration-over-max",
	);
	const startMs = new Date(item.t_start).getTime();
	const endMs = new Date(item.t_end as string).getTime();
	const duration = (endMs - startMs) / 60_000;
	const energy = num(item.evidence?.energy_wh_integrated);
	const peak = num(item.evidence?.peak_w);

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<div
						className={cn(
							"absolute inset-y-1 rounded-[3px] cursor-default transition-[box-shadow] hover:ring-2 hover:ring-ring/60",
							overMax && "ring-1 ring-destructive/70",
						)}
						style={{
							left: `${left}%`,
							width: `${width}%`,
							minWidth: "3px",
							backgroundColor: stageMeta(stage).color,
						}}
					/>
				}
			/>
			<TooltipContent side="top" className="text-xs">
				<div className="grid gap-1">
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
			</TooltipContent>
		</Tooltip>
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
