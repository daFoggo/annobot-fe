import { IconCalendarEvent } from "@tabler/icons-react";
import { Fragment, useMemo, useState } from "react";
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
 * Heatmap ngày × giờ: mỗi hàng là một ngày, mỗi ô là một giờ, độ đậm thể hiện số
 * phút có thiết bị chạy trong giờ đó.
 *
 * Case là *khoảng* `[t_start, t_end]`, nên thay vì vẽ dải chồng nhau (dễ rối và
 * lệch khi nhiều thiết bị chạy song song), ta cộng dồn thời lượng hoạt động vào
 * từng ô giờ. Nhịp sinh hoạt — "phòng họp dùng khung giờ nào" — hiện ra rõ hơn
 * nhiều, và data thưa vẫn nhìn được.
 */

const HOURS_IN_DAY = 24;
const HOURS = Array.from({ length: HOURS_IN_DAY }, (_, hour) => hour);
const GRID_COLUMNS = `2.75rem repeat(${HOURS_IN_DAY}, minmax(0, 1fr))`;

/** Mức đậm theo số phút hoạt động trong một ô giờ. */
const LEVEL_CLASSES = [
	"bg-muted/40",
	"bg-primary/20",
	"bg-primary/40",
	"bg-primary/65",
	"bg-primary/90",
] as const;

const levelFor = (minutes: number) => {
	if (minutes <= 0) return 0;
	if (minutes < 10) return 1;
	if (minutes < 25) return 2;
	if (minutes < 45) return 3;
	return 4;
};

interface Band {
	/** Giờ bắt đầu trong ngày, dạng thập phân (9.5 = 09:30). */
	start: number;
	end: number;
	cases: Case[];
	/** `null` khi dải gộp nhiều case ở các giai đoạn khác nhau. */
	stage: CaseStage | null;
}

interface DayRow {
	key: string;
	label: string;
	bands: Band[];
	totalMinutes: number;
}

interface HourCell {
	minutes: number;
	runs: Band[];
}

const zonedFormatter = new Map<string, Intl.DateTimeFormat>();

const partsOf = (iso: string, timeZone: string) => {
	let formatter = zonedFormatter.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		});
		zonedFormatter.set(timeZone, formatter);
	}
	const parts = formatter.formatToParts(new Date(iso));
	const pick = (type: string) =>
		parts.find((part) => part.type === type)?.value ?? "0";
	return {
		day: `${pick("year")}-${pick("month")}-${pick("day")}`,
		hour: Number(pick("hour")) + Number(pick("minute")) / 60,
	};
};

const dayLabel = (key: string) => {
	const [, month, day] = key.split("-");
	return `${day}/${month}`;
};

const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${Math.round(minutes)} min`;
	const hours = Math.floor(minutes / 60);
	const rest = Math.round(minutes % 60);
	return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

const hhmm = (value: number) => {
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * Cắt mỗi case theo ranh giới ngày rồi gộp các dải chồng nhau. Gộp là cần thiết:
 * trong một inquiry có nhiều cảm biến, hai thiết bị có thể chạy cùng lúc; dải gộp
 * mang nghĩa "có hoạt động", còn tooltip liệt kê đầy đủ các case bên dưới nó.
 */
const buildRows = (cases: Case[], timeZone: string): DayRow[] => {
	const perDay = new Map<string, Band[]>();

	for (const item of cases) {
		if (!item.t_end) continue;
		const from = partsOf(item.t_start, timeZone);
		const to = partsOf(item.t_end, timeZone);
		const stage = stageOf(item.status);

		if (from.day === to.day) {
			push(perDay, from.day, {
				start: from.hour,
				end: to.hour,
				cases: [item],
				stage,
			});
			continue;
		}
		// Qua nửa đêm: cắt thành hai dải để mỗi dải nằm gọn trong một hàng.
		push(perDay, from.day, {
			start: from.hour,
			end: HOURS_IN_DAY,
			cases: [item],
			stage,
		});
		push(perDay, to.day, { start: 0, end: to.hour, cases: [item], stage });
	}

	return [...perDay.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, raw]) => {
			const bands = mergeOverlapping(raw);
			return {
				key,
				label: dayLabel(key),
				bands,
				totalMinutes: bands.reduce(
					(sum, band) => sum + (band.end - band.start) * 60,
					0,
				),
			};
		});
};

const push = (map: Map<string, Band[]>, day: string, band: Band) => {
	const list = map.get(day);
	if (list) list.push(band);
	else map.set(day, [band]);
};

const mergeOverlapping = (bands: Band[]): Band[] => {
	const sorted = [...bands].sort((a, b) => a.start - b.start);
	const merged: Band[] = [];

	for (const band of sorted) {
		const previous = merged[merged.length - 1];
		if (previous && band.start <= previous.end) {
			previous.end = Math.max(previous.end, band.end);
			previous.cases = [...previous.cases, ...band.cases];
			previous.stage = previous.stage === band.stage ? previous.stage : null;
			continue;
		}
		merged.push({ ...band, cases: [...band.cases] });
	}
	return merged;
};

/** Tổng phút hoạt động và các lần chạy rơi vào một ô giờ. */
const cellFor = (bands: Band[], hour: number): HourCell => {
	const runs = bands.filter((band) => band.start < hour + 1 && band.end > hour);
	let minutes = 0;
	for (const band of runs) {
		const from = Math.max(band.start, hour);
		const to = Math.min(band.end, hour + 1);
		if (to > from) minutes += (to - from) * 60;
	}
	return { minutes, runs };
};

export interface CaseTimelineProps {
	cases: Case[];
	/** IANA zone dùng để quy đổi "giờ trong ngày". */
	timezone?: string;
	isLoading?: boolean;
	className?: string;
	/** Khi true, heatmap giãn theo chiều cao card (dùng trong grid 2 cột). */
	fillChart?: boolean;
}

export const CaseTimeline = ({
	cases,
	timezone = "UTC",
	isLoading,
	className,
	fillChart = false,
}: CaseTimelineProps) => {
	const [days, setDays] = useState<"7" | "14">("7");

	const allRows = useMemo(() => buildRows(cases, timezone), [cases, timezone]);
	const rows = useMemo(() => allRows.slice(-Number(days)), [allRows, days]);

	const cellsByDay = useMemo(() => {
		const map = new Map<string, HourCell[]>();
		for (const row of rows) {
			map.set(
				row.key,
				Array.from({ length: HOURS_IN_DAY }, (_, hour) =>
					cellFor(row.bands, hour),
				),
			);
		}
		return map;
	}, [rows]);

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

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<CardTitle className="text-sm">Daily activity</CardTitle>
					{/* Chỉ hiện khi dữ liệu đủ dài để hai lựa chọn khác nhau thật. */}
					{allRows.length > 7 ? (
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
					One row per day · shading = active minutes · {timezone}
				</CardDescription>
			</CardHeader>

			<CardContent
				className={cn("flex flex-col gap-3", fillChart && "min-h-0 flex-1")}
			>
				{rows.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<IconCalendarEvent />
							</EmptyMedia>
							<EmptyTitle>No cases yet</EmptyTitle>
							<EmptyDescription>
								The detection worker runs every 60 seconds and re-scans the last
								72 hours. Cases show up here as soon as a device finishes a run.
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
							<div
								className="grid gap-0.5"
								style={{ gridTemplateColumns: GRID_COLUMNS }}
							>
								<span aria-hidden />
								{HOURS.map((hour) => (
									<span
										key={hour}
										className="text-center font-mono text-[10px] text-muted-foreground tabular-nums"
									>
										{hour % 6 === 0 ? String(hour).padStart(2, "0") : ""}
									</span>
								))}
							</div>

							<div
								className={cn("grid gap-0.5", fillChart && "min-h-0 flex-1")}
								style={{
									gridTemplateColumns: GRID_COLUMNS,
									gridTemplateRows: `repeat(${rows.length}, minmax(1.25rem, 1fr))`,
								}}
							>
								{rows.map((row) => (
									<Fragment key={row.key}>
										<span className="flex items-center justify-end pr-1 font-mono text-[10px] text-muted-foreground tabular-nums">
											{row.label}
										</span>
										{HOURS.map((hour) => (
											<HeatCell
												key={hour}
												row={row}
												hour={hour}
												cell={
													cellsByDay.get(row.key)?.[hour] ?? {
														minutes: 0,
														runs: [],
													}
												}
											/>
										))}
									</Fragment>
								))}
							</div>
						</div>

						<div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
							<span className="mr-0.5">Less</span>
							{([1, 2, 3, 4] as const).map((level) => (
								<span
									key={level}
									className={cn("size-3 rounded-[3px]", LEVEL_CLASSES[level])}
								/>
							))}
							<span className="ml-0.5">More</span>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
};

const HeatCell = ({
	row,
	hour,
	cell,
}: {
	row: DayRow;
	hour: number;
	cell: HourCell;
}) => {
	const level = levelFor(cell.minutes);
	const base = cn("h-full w-full rounded-[3px]", LEVEL_CLASSES[level]);

	if (level === 0) {
		return <div className={base} aria-hidden />;
	}

	const stages = [
		...new Set(
			cell.runs
				.map((run) => run.stage)
				.filter((stage): stage is CaseStage => Boolean(stage)),
		),
	];

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<div
						className={cn(
							base,
							"cursor-default transition-shadow hover:ring-2 hover:ring-ring/60",
						)}
					/>
				}
			/>
			<TooltipContent side="top" className="text-xs">
				<div className="grid gap-1">
					<span className="font-medium text-popover-foreground">
						{row.label} · {hhmm(hour)}–{hhmm(hour + 1)}
					</span>
					<span className="font-mono text-muted-foreground tabular-nums">
						{formatDuration(cell.minutes)} active · {cell.runs.length} run
						{cell.runs.length > 1 ? "s" : ""}
					</span>
					{stages.length > 0 ? (
						<span className="flex flex-wrap items-center gap-2">
							{stages.map((stage) => (
								<span
									key={stage}
									className="flex items-center gap-1 text-muted-foreground"
								>
									<StageDot stage={stage} />
									{stageMeta(stage).label}
								</span>
							))}
						</span>
					) : null}
					<span className="grid gap-0.5">
						{cell.runs.slice(0, 4).map((band) => (
							<span
								key={`${band.start}-${band.end}`}
								className="font-mono text-muted-foreground tabular-nums"
							>
								{hhmm(band.start)} – {hhmm(band.end)} ·{" "}
								{formatDuration((band.end - band.start) * 60)}
							</span>
						))}
						{cell.runs.length > 4 ? (
							<span className="text-muted-foreground">
								and {cell.runs.length - 4} more
							</span>
						) : null}
					</span>
				</div>
			</TooltipContent>
		</Tooltip>
	);
};
