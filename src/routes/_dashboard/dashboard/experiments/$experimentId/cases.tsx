import { IconPlayerPlay } from "@tabler/icons-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getMeQueryOptions } from "@/features/auth";
import {
	buildCopilotCase,
	CASE_COLUMNS,
	CASES_OVERVIEW_PAGE_SIZE,
	type CaseColumnId,
	CaseCopilotPanel,
	CaseCopilotProvider,
	CaseCopilotRail,
	type CaseStage,
	CasesSearchInput,
	CasesTable,
	CaseTimeline,
	ColumnsMenu,
	type CopilotCase,
	caseListQueryOptions,
	countByStage,
	durationMinutes,
	filterCases,
	indicatorValue,
	median,
	SAMPLE_QUEUE,
	StageFilter,
	stageOf,
	useTriggerDetection,
} from "@/features/cases";
import {
	EnergyUsageChart,
	energyChartQueryOptions,
	last24hWindow,
	RESOURCE_EVENT_TYPES,
	type ResourceConsumptionType,
} from "@/features/dashboard";
import { inquiryListQueryOptions } from "@/features/inquiries";
import { getSensorIcon } from "@/features/sensors";
import { getErrorMessage } from "@/lib/error";
import { resolveTimezone, useTimezoneStore } from "@/stores/timezone";

const ALL = "all";
const ROWS_PER_PAGE = 10;

/** Both keys optional, otherwise every `Link` to this route must pass search. */
interface CasesSearch {
	inquiry?: string;
	page?: number;
	case?: string;
}

const formatMinutes = (value: number | null) => {
	if (value == null) return "—";
	if (value < 60) return `${Math.round(value)} min`;
	const hours = Math.floor(value / 60);
	const rest = Math.round(value % 60);
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

/**
 * Dãy số trang quanh trang hiện tại, chèn `null` ở chỗ bị cắt để render dấu ba
 * chấm. Thiếu dấu này thì người đọc tưởng các trang ở giữa biến mất.
 */
const pageRange = (current: number, total: number): (number | null)[] => {
	if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

	const pages = new Set([1, total, current]);
	for (const offset of [-1, 1]) {
		const value = current + offset;
		if (value > 1 && value < total) pages.add(value);
	}
	// Giữ đủ 5 ô số ở hai đầu để thanh không nhảy chiều rộng.
	if (current <= 3) pages.add(2).add(3).add(4);
	if (current >= total - 2)
		pages
			.add(total - 1)
			.add(total - 2)
			.add(total - 3);

	const sorted = [...pages]
		.filter((value) => value >= 1 && value <= total)
		.sort((a, b) => a - b);
	const out: (number | null)[] = [];
	let previous = 0;
	for (const value of sorted) {
		if (previous && value - previous > 1) out.push(null);
		out.push(value);
		previous = value;
	}
	return out;
};

const formatEnergy = (wh: number) =>
	wh >= 1000 ? `${(wh / 1000).toFixed(2)} kWh` : `${Math.round(wh)} Wh`;

const ExperimentCasesPage = () => {
	const { experimentId } = Route.useParams();
	const {
		inquiry: inquiryParam,
		page = 1,
		case: caseParam,
	} = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });

	const { data: inquiries } = useSuspenseQuery(
		inquiryListQueryOptions(experimentId),
	);
	const { data: user } = useSuspenseQuery(getMeQueryOptions());
	const tzChoice = useTimezoneStore((state) => state.choice);
	const timezone = resolveTimezone(tzChoice, user?.timezone || "UTC");
	const { range } = Route.useLoaderData();
	const [resourceType, setResourceType] =
		useState<ResourceConsumptionType>("power");

	const selected = inquiryParam ?? ALL;
	const inquiryId = selected === ALL ? undefined : selected;

	const activeInquiry = useMemo(
		() => inquiries.find((item) => item.id === inquiryId) ?? null,
		[inquiries, inquiryId],
	);

	// Sensor source keys của inquiry đang chọn — chart chỉ vẽ các sensor này.
	const inquirySourceKeys = useMemo(
		() => activeInquiry?.sensors.map((sensor) => sensor.source_key) ?? [],
		[activeInquiry],
	);

	// source_key → tên thiết bị, cho nhãn hàng trong timeline.
	const deviceNames = useMemo(() => {
		const map: Record<string, string> = {};
		for (const inquiry of inquiries) {
			for (const sensor of inquiry.sensors) {
				map[sensor.source_key] = sensor.name || sensor.source_key;
			}
		}
		return map;
	}, [inquiries]);

	const {
		data: inquiryChart,
		isPending: chartPending,
		isError: chartError,
		error: chartErrorValue,
	} = useQuery({
		...energyChartQueryOptions(
			range,
			RESOURCE_EVENT_TYPES[resourceType],
			inquirySourceKeys,
		),
		enabled: Boolean(activeInquiry),
	});

	// Câu hỏi của inquiry dài cả dòng nên tab không dùng được. Dropdown thì hợp,
	// nhưng trigger phải là chính tiêu đề card (như select đổi loại tiêu thụ ở
	// energy chart) thì mới đủ chỗ xuống dòng thay vì bị cắt cụt.
	const options = useMemo(
		() => [
			{ value: ALL, label: "All inquiries" },
			...inquiries.map((inquiry) => ({
				value: inquiry.id,
				label: inquiry.question ?? inquiry.id,
			})),
		],
		[inquiries],
	);

	// One request feeds the timeline, the stats and the table. Paging is local,
	// so switching pages is instant and costs nothing.
	const { data, isLoading } = useQuery(
		caseListQueryOptions({
			experiment_id: experimentId,
			inquiry_id: inquiryId,
			page: 1,
			page_size: CASES_OVERVIEW_PAGE_SIZE,
		}),
	);

	const triggerDetection = useTriggerDetection(experimentId);
	const cases = useMemo(() => data?.founds ?? [], [data]);
	const total = data?.total_count ?? 0;
	const truncated = total > CASES_OVERVIEW_PAGE_SIZE;

	// Hàng đợi copilot
	const queue = useMemo<CopilotCase[]>(() => {
		return cases.length > 0 ? cases.map(buildCopilotCase) : SAMPLE_QUEUE;
	}, [cases]);

	const [panelOpen, setPanelOpen] = useState(() => Boolean(caseParam));
	const openId =
		caseParam ?? (panelOpen && queue.length > 0 ? queue[0]?.item.id : null);
	const isOpen = Boolean(openId) || panelOpen;

	const setActiveCase = (nextCaseId: string | null) => {
		setPanelOpen(Boolean(nextCaseId));
		navigate({
			search: (): CasesSearch => ({
				inquiry: inquiryId,
				page: page > 1 ? page : undefined,
				case: nextCaseId ?? undefined,
			}),
			replace: true,
		});
	};

	const handleOpenRail = () => {
		setPanelOpen(true);
		const targetId = caseParam || (queue.length > 0 ? queue[0]?.item.id : null);
		if (targetId) {
			setActiveCase(targetId);
		}
	};

	// Bộ lọc cục bộ trên trang: chỉ áp cho bảng, không đụng timeline/stats.
	const [search, setSearch] = useState("");
	const [stageFilter, setStageFilter] = useState<CaseStage[]>([]);
	const [visibleColumns, setVisibleColumns] = useState<CaseColumnId[]>(() =>
		CASE_COLUMNS.map((column) => column.id),
	);

	const stats = useMemo(() => {
		const durations = cases
			.map(durationMinutes)
			.filter((value): value is number => value != null);
		const energy = cases.reduce((sum, item) => {
			const value =
				indicatorValue(item, "energy_wh") ??
				(item.evidence?.energy_wh_integrated as number | undefined) ??
				0;
			return sum + value;
		}, 0);
		const annotated = cases.filter((item) =>
			["answered", "annotated", "complete"].includes(item.status),
		).length;
		return {
			cases: cases.length,
			medianDuration: median(durations),
			energy,
			annotated,
		};
	}, [cases]);

	// Bảng áp thêm bộ lọc cục bộ (search + giai đoạn) rồi mới phân trang, nên
	// số trang tính lại theo tập đã lọc.
	const filtered = useMemo(() => {
		const bySearch = filterCases(cases, search);
		if (stageFilter.length === 0) return bySearch;
		return bySearch.filter((item) =>
			stageFilter.includes(stageOf(item.status)),
		);
	}, [cases, search, stageFilter]);

	const stageCounts = useMemo(() => countByStage(cases), [cases]);

	const pageCount = Math.max(Math.ceil(filtered.length / ROWS_PER_PAGE), 1);
	const current = Math.min(Math.max(page, 1), pageCount);
	const rows = filtered.slice(
		(current - 1) * ROWS_PER_PAGE,
		current * ROWS_PER_PAGE,
	);

	// PaginationLink renders a real anchor, so each page gets a real href
	// (middle-click, open in new tab) and the click is intercepted for SPA nav.
	const pageHref = (value: number) => {
		const params = new URLSearchParams();
		if (inquiryId) params.set("inquiry", inquiryId);
		if (value > 1) params.set("page", String(value));
		if (caseParam) params.set("case", caseParam);
		const query = params.toString();
		return `/dashboard/experiments/${experimentId}/cases${query ? `?${query}` : ""}`;
	};

	const goToPage = (event: React.MouseEvent, value: number) => {
		event.preventDefault();
		navigate({
			search: (): CasesSearch => ({
				inquiry: inquiryId,
				page: value > 1 ? value : undefined,
				case: caseParam,
			}),
		});
	};

	return (
		<CaseCopilotProvider
			queue={queue}
			activeId={openId}
			onActiveChange={setActiveCase}
		>
			<div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
				{/* Left Workspace */}
				<div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
					<div className="flex w-full flex-col gap-6 px-6 py-6">
						<div className="flex items-start justify-between gap-4">
							<div className="flex min-w-0 flex-col gap-1">
								<h1 className="truncate text-2xl font-semibold tracking-tight">
									Cases
								</h1>
								<p className="text-sm text-muted-foreground">
									Every case is one device run, bounded by the detection engine
									from the power trace.
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={triggerDetection.isPending}
									onClick={() => triggerDetection.mutate(inquiryId)}
								>
									{triggerDetection.isPending ? (
										<Spinner data-icon="inline-start" />
									) : (
										<IconPlayerPlay data-icon="inline-start" />
									)}
									{activeInquiry ? "Run for this inquiry" : "Run detection"}
								</Button>
							</div>
						</div>

						<div className="flex flex-col gap-4">
							<Card>
								<CardHeader>
									<Select
										items={options}
										value={selected}
										onValueChange={(value) =>
											navigate({
												search: (): CasesSearch => ({
													inquiry: value === ALL ? undefined : String(value),
													case: caseParam,
												}),
												replace: true,
											})
										}
									>
										<SelectTrigger className="h-auto w-fit max-w-full items-start whitespace-normal rounded-none border-none bg-transparent p-0 text-left text-base font-semibold tracking-tight shadow-none hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent *:data-[slot=select-value]:line-clamp-none [&_svg]:mt-1 [&_svg]:text-muted-foreground hover:[&_svg]:text-foreground">
											<SelectValue />
										</SelectTrigger>
										<SelectContent
											align="start"
											className="w-auto min-w-80 max-w-xl"
										>
											<SelectGroup>
												{options.map((option) => (
													<SelectItem
														key={option.value}
														value={option.value}
														className="items-start whitespace-normal"
													>
														{option.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
									<CardDescription className="text-xs">
										{activeInquiry?.goal_gamma ??
											"Cases from every inquiry in this experiment."}
									</CardDescription>
								</CardHeader>
								{activeInquiry ? (
									<CardContent className="flex flex-wrap items-center gap-1.5">
										{activeInquiry.sensors.map((sensor) => {
											const Icon = getSensorIcon(
												sensor.source_key,
												sensor.sensor_type,
											);
											return (
												<Badge key={sensor.id} variant="outline">
													<Icon data-icon="inline-start" />
													{sensor.name || sensor.source_key}
												</Badge>
											);
										})}
										{activeInquiry.detection_rule?.type ? (
											<Badge variant="secondary">
												{String(activeInquiry.detection_rule.type)}
											</Badge>
										) : null}
									</CardContent>
								) : null}
							</Card>

							{activeInquiry ? (
								chartError ? (
									<Alert variant="destructive">
										<AlertTitle>Could not load sensor data</AlertTitle>
										<AlertDescription>
											{getErrorMessage(
												chartErrorValue,
												"The chart request failed.",
											)}
										</AlertDescription>
									</Alert>
								) : chartPending || !inquiryChart ? (
									<Skeleton className="h-96 w-full" />
								) : (
									<EnergyUsageChart
										data={inquiryChart}
										resourceType={resourceType}
										onResourceTypeChange={setResourceType}
										timezone={timezone}
									/>
								)
							) : null}

							<Card>
								<CardContent>
									<dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
										<Tile label="Cases" value={String(stats.cases)} />
										<Tile
											label="Median duration"
											value={formatMinutes(stats.medianDuration)}
										/>
										<Tile label="Energy" value={formatEnergy(stats.energy)} />
										<Tile
											label="Annotated"
											value={`${stats.annotated} / ${stats.cases}`}
										/>
									</dl>
								</CardContent>
							</Card>

							<div className="flex flex-col gap-3">
								<CasesSearchInput value={search} onValueChange={setSearch} />
								<StageFilter
									value={stageFilter}
									onValueChange={setStageFilter}
									counts={stageCounts}
								/>
							</div>

							<CaseTimeline
								cases={cases}
								timezone={timezone}
								isLoading={isLoading}
								deviceNames={deviceNames}
							/>

							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Detail</CardTitle>
									<CardDescription className="text-xs">
										{truncated
											? `Showing the ${CASES_OVERVIEW_PAGE_SIZE} most recent of ${total} cases.`
											: "Open the info icon to see which thresholds bounded a case."}
									</CardDescription>
									<CardAction>
										<ColumnsMenu
											visible={visibleColumns}
											onVisibleChange={setVisibleColumns}
										/>
									</CardAction>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<CasesTable
										cases={rows}
										timezone={timezone}
										isLoading={isLoading}
										visibleColumns={visibleColumns}
										activeCaseId={openId ?? undefined}
										onSelect={(item) => setActiveCase(item.id)}
									/>

									{pageCount > 1 ? (
										<Pagination>
											<PaginationContent>
												<PaginationItem>
													<PaginationPrevious
														href={pageHref(Math.max(current - 1, 1))}
														aria-disabled={current <= 1}
														onClick={(event) =>
															goToPage(event, Math.max(current - 1, 1))
														}
													/>
												</PaginationItem>
												{pageRange(current, pageCount).map((value, index) =>
													value == null ? (
														<PaginationItem
															// biome-ignore lint/suspicious/noArrayIndexKey: khoảng trống không có id riêng
															key={`gap-${index}`}
														>
															<PaginationEllipsis />
														</PaginationItem>
													) : (
														<PaginationItem key={value}>
															<PaginationLink
																href={pageHref(value)}
																isActive={value === current}
																onClick={(event) => goToPage(event, value)}
															>
																{value}
															</PaginationLink>
														</PaginationItem>
													),
												)}
												<PaginationItem>
													<PaginationNext
														href={pageHref(Math.min(current + 1, pageCount))}
														aria-disabled={current >= pageCount}
														onClick={(event) =>
															goToPage(event, Math.min(current + 1, pageCount))
														}
													/>
												</PaginationItem>
											</PaginationContent>
										</Pagination>
									) : null}
								</CardContent>
							</Card>
						</div>
					</div>
				</div>

				{/* Right Docked Copilot Panel or Rail */}
				{isOpen ? (
					<div className="w-[420px] 2xl:w-[480px] shrink-0 border-l bg-background flex flex-col h-full min-h-0">
						<CaseCopilotPanel className="h-full" />
					</div>
				) : (
					<div className="shrink-0 border-l bg-background flex flex-col h-full">
						<CaseCopilotRail onOpen={handleOpenRail} />
					</div>
				)}
			</div>
		</CaseCopilotProvider>
	);
};

const Tile = ({ label, value }: { label: string; value: string }) => (
	<div className="flex flex-col gap-0.5">
		<dt className="text-xs text-muted-foreground">{label}</dt>
		<dd className="font-mono text-lg font-semibold tabular-nums">{value}</dd>
	</div>
);

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/cases",
)({
	staticData: {
		breadcrumb: { label: "Cases" },
	},
	validateSearch: (search: Record<string, unknown>): CasesSearch => {
		const next: CasesSearch = {};
		if (typeof search.inquiry === "string") next.inquiry = search.inquiry;
		const page = Number(search.page);
		if (Number.isInteger(page) && page > 1) next.page = page;
		if (typeof search.case === "string") next.case = search.case;
		return next;
	},
	loader: async ({ context, params }) => {
		await context.queryClient.query(
			inquiryListQueryOptions(params.experimentId),
		);
		// Fixed window so the loader-rendered key matches the client chart query.
		return { range: last24hWindow() };
	},
	component: ExperimentCasesPage,
});
