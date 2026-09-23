import { IconCalendarEvent } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
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
} from "@/components/ui/chart";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type CaseStage, STAGE_ORDER, stageMeta, stageOf } from "../lifecycle";
import type { Case } from "../schemas";
import { StageDot } from "./case-status-badge";

/**
 * Trục ngang là giờ trong ngày, mỗi hàng là một ngày, mỗi dải là một lần thiết
 * bị chạy.
 *
 * Case là *khoảng* `[t_start, t_end]` chứ không phải điểm, nên hình đúng của nó
 * là dải thời gian, không phải đường. Xếp theo ngày làm lộ ra nhịp sinh hoạt —
 * đúng thứ mà các inquiry đang hỏi ("phòng họp dùng khi nào", "lò vi sóng dùng
 * khung giờ nào").
 */

const HOURS_IN_DAY = 24;

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
	[segment: string]: unknown;
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

const hourLabel = (value: number) =>
	`${String(Math.floor(value)).padStart(2, "0")}:00`;

const formatDuration = (minutes: number) => {
	if (minutes < 60) return `${Math.round(minutes)} min`;
	const hours = Math.floor(minutes / 60);
	const rest = Math.round(minutes % 60);
	return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

/**
 * Cắt mỗi case theo ranh giới ngày rồi gộp các dải chồng nhau.
 *
 * Gộp là cần thiết: trong một inquiry có nhiều cảm biến, hai thiết bị có thể
 * chạy cùng lúc. Vẽ chồng lên nhau trong một hàng sẽ sai, còn đẩy lệch đi thì
 * bóp méo thời gian thật. Dải gộp mang nghĩa "có hoạt động", và tooltip liệt kê
 * đầy đủ các case bên dưới nó.
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
			const row: DayRow = {
				key,
				label: dayLabel(key),
				bands,
				totalMinutes: bands.reduce(
					(sum, band) => sum + (band.end - band.start) * 60,
					0,
				),
			};
			let cursor = 0;
			bands.forEach((band, index) => {
				row[`gap${index}`] = Math.max(band.start - cursor, 0);
				// Sàn 0.1 giờ (6 phút) để một case rất ngắn vẫn nhìn thấy được.
				row[`run${index}`] = Math.max(band.end - band.start, 0.1);
				cursor = band.end;
			});
			return row;
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

const bandColor = (band: Band | undefined) => {
	if (!band) return "transparent";
	return band.stage ? stageMeta(band.stage).color : "var(--muted-foreground)";
};

export interface CaseTimelineProps {
	cases: Case[];
	/** IANA zone dùng để quy đổi "giờ trong ngày". */
	timezone?: string;
	isLoading?: boolean;
	className?: string;
}

export const CaseTimeline = ({
	cases,
	timezone = "UTC",
	isLoading,
	className,
}: CaseTimelineProps) => {
	const [days, setDays] = useState<"7" | "14">("7");

	const allRows = useMemo(() => buildRows(cases, timezone), [cases, timezone]);
	const rows = useMemo(() => allRows.slice(-Number(days)), [allRows, days]);

	const maxBands = rows.reduce(
		(max, row) => Math.max(max, row.bands.length),
		0,
	);
	const segments = Array.from({ length: maxBands }, (_, index) => index);

	const stagesPresent = useMemo(() => {
		const present = new Set<CaseStage>();
		for (const row of rows)
			for (const band of row.bands) if (band.stage) present.add(band.stage);
		return STAGE_ORDER.filter((stage) => present.has(stage));
	}, [rows]);

	const config = useMemo<ChartConfig>(
		() => ({ activity: { label: "Activity" } }),
		[],
	);

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
					One row per day · one band per run · {timezone}
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
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
						<ChartContainer
							config={config}
							className={days === "7" ? "h-56 w-full" : "h-96 w-full"}
						>
							<BarChart
								accessibilityLayer
								layout="vertical"
								data={rows}
								margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
								barCategoryGap="28%"
							>
								<CartesianGrid horizontal={false} />
								<XAxis
									type="number"
									domain={[0, HOURS_IN_DAY]}
									ticks={[0, 6, 12, 18, 24]}
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									tickFormatter={hourLabel}
								/>
								<YAxis
									type="category"
									dataKey="label"
									tickLine={false}
									axisLine={false}
									width={48}
									tickMargin={8}
								/>
								{/*
								 * Không đặt `cursor` thủ công: `ChartContainer` đã tô
								 * `.recharts-rectangle.recharts-tooltip-cursor` bằng `fill-muted`.
								 * Truyền thêm `fillOpacity` chỉ làm vạch highlight mờ tới mức
								 * không còn nhìn thấy khi hover.
								 */}
								<ChartTooltip
									cursor={{
										fill: "var(--accent)",
										stroke: "var(--muted-foreground)",
										strokeOpacity: 0.5,
									}}
									content={<DayTooltip />}
								/>
								{segments.map((index) => [
									<Bar
										key={`gap${index}`}
										dataKey={`gap${index}`}
										stackId="day"
										fill="transparent"
										isAnimationActive={false}
									/>,
									<Bar
										key={`run${index}`}
										dataKey={`run${index}`}
										stackId="day"
										radius={4}
										isAnimationActive={false}
									>
										{rows.map((row) => (
											<Cell key={row.key} fill={bandColor(row.bands[index])} />
										))}
									</Bar>,
								])}
							</BarChart>
						</ChartContainer>

						{stagesPresent.length > 0 ? (
							<div className="flex flex-wrap items-center gap-3">
								{stagesPresent.map((stage) => (
									<span
										key={stage}
										className="flex items-center gap-1.5 text-xs text-muted-foreground"
									>
										<StageDot stage={stage} />
										{stageMeta(stage).label}
									</span>
								))}
							</div>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	);
};

interface DayTooltipProps {
	active?: boolean;
	payload?: { payload: DayRow }[];
}

/** Tooltip theo hàng: tóm tắt cả ngày rồi liệt kê từng lần chạy. */
const DayTooltip = ({ active, payload }: DayTooltipProps) => {
	const row = payload?.[0]?.payload;
	if (!active || !row) return null;

	const caseCount = row.bands.reduce((sum, band) => sum + band.cases.length, 0);

	return (
		<div className="grid min-w-52 gap-2 rounded-lg border border-border bg-popover p-3 text-xs shadow-md">
			<div className="flex items-center justify-between gap-4">
				<span className="font-medium text-popover-foreground">{row.label}</span>
				<span className="font-mono text-muted-foreground tabular-nums">
					{caseCount} runs · {formatDuration(row.totalMinutes)}
				</span>
			</div>
			<div className="grid gap-1">
				{row.bands.slice(0, 6).map((band) => (
					<div
						key={`${band.start}-${band.end}`}
						className="flex items-center justify-between gap-4"
					>
						<span className="flex items-center gap-1.5 text-muted-foreground">
							{band.stage ? <StageDot stage={band.stage} /> : null}
							<span className="font-mono tabular-nums">
								{hhmm(band.start)} – {hhmm(band.end)}
							</span>
						</span>
						<span className="font-mono text-popover-foreground tabular-nums">
							{formatDuration((band.end - band.start) * 60)}
						</span>
					</div>
				))}
				{row.bands.length > 6 ? (
					<span className="text-muted-foreground">
						and {row.bands.length - 6} more
					</span>
				) : null}
			</div>
		</div>
	);
};

const hhmm = (value: number) => {
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
