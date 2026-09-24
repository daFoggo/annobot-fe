import {
	IconArrowRight,
	IconHelpCircle,
	IconPlayerPlay,
	IconSettings,
} from "@tabler/icons-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardPage } from "@/components/layout/dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemSeparator,
	ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getMeQueryOptions } from "@/features/auth";
import {
	CASES_OVERVIEW_PAGE_SIZE,
	CaseFunnel,
	CaseTimeline,
	caseListQueryOptions,
	countByStage,
	useTriggerDetection,
} from "@/features/cases";
import {
	EnergyUsageChart,
	energyChartQueryOptions,
	last24hWindow,
	RESOURCE_EVENT_TYPES,
	type ResourceConsumptionType,
} from "@/features/dashboard";
import { experimentDetailQueryOptions } from "@/features/experiments";
import { inquiryListQueryOptions } from "@/features/inquiries";
import { getErrorMessage } from "@/lib/error";
import { cn } from "@/lib/utils";
import { resolveTimezone, useTimezoneStore } from "@/stores/timezone";

const day = (value: string | null | undefined) =>
	value ? new Date(value).toLocaleDateString("en-GB") : null;

const DAY_MS = 86_400_000;

/**
 * Chu kỳ lắng nghe `T` của experiment: khoảng thời gian nó được phép thu dữ
 * liệu. Đây là **thời gian trôi qua**, không phải tiến độ công việc — thanh bar
 * chạy kể cả khi không có case nào được nhận diện, nên nhãn phải nói rõ điều đó.
 */
interface Period {
	state: "scheduled" | "running" | "ended";
	elapsedDays: number;
	totalDays: number;
	remainingDays: number;
	percent: number;
}

const readPeriod = (
	start?: string | null,
	end?: string | null,
): Period | null => {
	if (!start || !end) return null;
	const from = new Date(start).getTime();
	const to = new Date(end).getTime();
	if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;

	const now = Date.now();
	const totalDays = Math.max(Math.round((to - from) / DAY_MS), 1);
	const elapsedMs = Math.min(Math.max(now - from, 0), to - from);
	const elapsedDays = Math.min(
		Math.max(Math.ceil(elapsedMs / DAY_MS), 0),
		totalDays,
	);

	return {
		state: now < from ? "scheduled" : now > to ? "ended" : "running",
		elapsedDays,
		totalDays,
		remainingDays: Math.max(totalDays - elapsedDays, 0),
		percent: (elapsedMs / (to - from)) * 100,
	};
};

const PERIOD_LABEL: Record<Period["state"], string> = {
	scheduled: "Not started",
	running: "Running",
	ended: "Ended",
};

const ExperimentOverviewPage = () => {
	const { experimentId } = Route.useParams();
	const { data: experiment } = useSuspenseQuery(
		experimentDetailQueryOptions(experimentId),
	);
	const { data: user } = useSuspenseQuery(getMeQueryOptions());
	const tzChoice = useTimezoneStore((state) => state.choice);
	const timezone = resolveTimezone(tzChoice, user?.timezone || "UTC");
	const { range } = Route.useLoaderData();
	const [resourceType, setResourceType] =
		useState<ResourceConsumptionType>("power");

	const { data: inquiries = [] } = useQuery(
		inquiryListQueryOptions(experimentId),
	);
	const { data, isLoading } = useQuery(
		caseListQueryOptions({
			experiment_id: experimentId,
			page: 1,
			page_size: CASES_OVERVIEW_PAGE_SIZE,
		}),
	);
	const triggerDetection = useTriggerDetection(experimentId);

	// Chỉ vẽ chart cho các sensor được gán cho bất kỳ inquiry nào của experiment.
	const inquirySourceKeys = useMemo(() => {
		const keys = new Set<string>();
		for (const inquiry of inquiries) {
			for (const sensor of inquiry.sensors) keys.add(sensor.source_key);
		}
		return [...keys];
	}, [inquiries]);

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
		data: energyChart,
		isPending: chartPending,
		isError: chartError,
		error: chartErrorValue,
	} = useQuery({
		...energyChartQueryOptions(
			range,
			RESOURCE_EVENT_TYPES[resourceType],
			inquirySourceKeys,
		),
		enabled: inquirySourceKeys.length > 0,
	});

	const cases = useMemo(() => data?.founds ?? [], [data]);
	const byInquiry = useMemo(() => {
		const map = new Map<string, typeof cases>();
		for (const item of cases) {
			const list = map.get(item.inquiry_id);
			if (list) list.push(item);
			else map.set(item.inquiry_id, [item]);
		}
		return map;
	}, [cases]);

	const period = readPeriod(experiment.starts_at, experiment.ends_at);
	const from = day(experiment.starts_at);
	const to = day(experiment.ends_at);

	return (
		<DashboardPage
			size="full"
			title={experiment.title}
			description={
				from && to
					? `Listening period ${from} to ${to}`
					: "No listening period set for this experiment."
			}
			actions={
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={triggerDetection.isPending}
						onClick={() => triggerDetection.mutate(undefined)}
					>
						{triggerDetection.isPending ? (
							<Spinner data-icon="inline-start" />
						) : (
							<IconPlayerPlay data-icon="inline-start" />
						)}
						Run detection
					</Button>
					<Button
						size="sm"
						render={
							<Link
								to="/dashboard/experiments/$experimentId/setup"
								params={{ experimentId }}
							/>
						}
					>
						<IconSettings data-icon="inline-start" />
						Setup
					</Button>
				</div>
			}
		>
			<div className="flex flex-col gap-4">
				<div className={cn("grid gap-4", period && "lg:grid-cols-2")}>
					{period ? (
						<Card>
							<CardHeader>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<CardTitle className="text-sm">Listening period</CardTitle>
									<Badge
										variant={
											period.state === "running" ? "default" : "secondary"
										}
									>
										{PERIOD_LABEL[period.state]}
									</Badge>
								</div>
								<CardDescription className="text-xs">
									Time the experiment is allowed to collect data. It is elapsed
									time, not a measure of how much has been detected.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-2">
								<Progress value={period.percent} />
								<div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-muted-foreground tabular-nums">
									<span>
										Day {period.elapsedDays} of {period.totalDays}
									</span>
									<span>
										{period.state === "ended"
											? "finished"
											: period.state === "scheduled"
												? `starts ${from}`
												: `${period.remainingDays} days left`}
									</span>
								</div>
							</CardContent>
						</Card>
					) : null}

					<CaseFunnel cases={cases} />
				</div>

				<div
					className={cn(
						"grid gap-4",
						inquirySourceKeys.length > 0 && "lg:grid-cols-2",
					)}
				>
					{inquirySourceKeys.length > 0 ? (
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
						) : chartPending || !energyChart ? (
							<Skeleton className="h-96 w-full" />
						) : (
							<EnergyUsageChart
								data={energyChart}
								resourceType={resourceType}
								onResourceTypeChange={setResourceType}
								variant="compact"
								timezone={timezone}
							/>
						)
					) : null}

					<CaseTimeline
						cases={cases}
						timezone={timezone}
						isLoading={isLoading}
						fillChart
						deviceNames={deviceNames}
					/>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">By inquiry</CardTitle>
						<CardDescription className="text-xs">
							Each inquiry has its own sensors and detection rule, so each
							yields a different number of cases.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{inquiries.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<IconHelpCircle />
									</EmptyMedia>
									<EmptyTitle>No inquiries yet</EmptyTitle>
									<EmptyDescription>
										An experiment needs at least one inquiry with sensors before
										detection has anything to find.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button
										render={
											<Link
												to="/dashboard/experiments/$experimentId/setup/inquiries"
												params={{ experimentId }}
											/>
										}
									>
										Add an inquiry
									</Button>
								</EmptyContent>
							</Empty>
						) : (
							<ItemGroup>
								{inquiries.map((inquiry, index) => {
									const own = byInquiry.get(inquiry.id) ?? [];
									const counts = countByStage(own);
									return (
										<div key={inquiry.id}>
											{index > 0 ? <ItemSeparator /> : null}
											<Item size="sm">
												<ItemContent>
													<ItemTitle>{inquiry.question}</ItemTitle>
													<ItemDescription>
														{inquiry.sensors.length === 0
															? "No sensors bound"
															: inquiry.sensors
																	.map((s) => s.name || s.source_key)
																	.join(" · ")}
													</ItemDescription>
													<div className="flex flex-wrap items-center gap-1.5">
														<Badge variant="secondary">
															{own.length} cases
														</Badge>
														{counts.waiting > 0 ? (
															<Badge variant="outline">
																{counts.waiting} awaiting
															</Badge>
														) : null}
														{counts.answered > 0 ? (
															<Badge>{counts.answered} annotated</Badge>
														) : null}
													</div>
												</ItemContent>
												<ItemActions>
													<Button
														variant="ghost"
														size="sm"
														render={
															<Link
																to="/dashboard/experiments/$experimentId/cases"
																params={{ experimentId }}
																search={{ inquiry: inquiry.id }}
															/>
														}
													>
														Cases
														<IconArrowRight data-icon="inline-end" />
													</Button>
												</ItemActions>
											</Item>
										</div>
									);
								})}
							</ItemGroup>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardPage>
	);
};

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/",
)({
	staticData: {
		breadcrumb: { label: "Overview" },
	},
	loader: async ({ context, params }) => {
		await Promise.all([
			context.queryClient.query(
				experimentDetailQueryOptions(params.experimentId),
			),
			context.queryClient.query(inquiryListQueryOptions(params.experimentId)),
		]);
		// Fixed window so the loader-rendered key matches the client chart query.
		return { range: last24hWindow() };
	},
	component: ExperimentOverviewPage,
});
