import {
	IconArrowRight,
	IconCalendarTime,
	IconClock,
	IconCpu,
	IconHelp,
	IconPlus,
	IconSettings,
} from "@tabler/icons-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
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
import { experimentDetailQueryOptions } from "@/features/experiments";
import { inquiryListQueryOptions } from "@/features/inquiries";
import { getSensorIcon } from "@/features/sensors";

const time = (value: string) => value.slice(0, 5);

const ExperimentOverviewPage = () => {
	const { experimentId } = Route.useParams();
	const { data: experiment } = useSuspenseQuery(
		experimentDetailQueryOptions(experimentId),
	);
	const { data: inquiries = [] } = useQuery(
		inquiryListQueryOptions(experimentId),
	);

	const uniqueSensorsCount = new Set(
		inquiries.flatMap((inquiry) => inquiry.sensors.map((sensor) => sensor.id)),
	).size;

	return (
		<DashboardPage
			title={experiment.title}
			description="Experiment overview, scheduled inquiry window, and monitored sensors."
			actions={
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						render={
							<Link
								to="/dashboard/experiments/$experimentId/settings"
								params={{ experimentId }}
							/>
						}
					>
						<IconSettings className="size-4" />
						Settings
					</Button>
					<Button
						size="sm"
						render={
							<Link
								to="/dashboard/experiments/$experimentId/inquiries"
								params={{ experimentId }}
							/>
						}
					>
						<IconPlus className="size-4" />
						Add Inquiry
					</Button>
				</div>
			}
		>
			<div className="flex flex-col gap-6">
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card className="shadow-xs">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="font-medium text-xs">
								Inquiries
							</CardDescription>
							<div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
								<IconHelp className="size-4" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{inquiries.length}</div>
							<p className="text-xs text-muted-foreground mt-1">
								Active questions configured
							</p>
						</CardContent>
					</Card>

					<Card className="shadow-xs">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="font-medium text-xs">
								Assigned Sensors
							</CardDescription>
							<div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
								<IconCpu className="size-4" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{uniqueSensorsCount}</div>
							<p className="text-xs text-muted-foreground mt-1">
								Distinct hardware feeds
							</p>
						</CardContent>
					</Card>

					<Card className="shadow-xs">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="font-medium text-xs">
								Ask Window
							</CardDescription>
							<div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
								<IconClock className="size-4" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{time(experiment.ask_window_start)} –{" "}
								{time(experiment.ask_window_end)}
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Daily prompt schedule
							</p>
						</CardContent>
					</Card>

					<Card className="shadow-xs">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardDescription className="font-medium text-xs">
								Cadence & Quota
							</CardDescription>
							<div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
								<IconCalendarTime className="size-4" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{experiment.il_timestep_minutes ?? 30}m
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								Max {experiment.max_asks_per_day ?? "—"} asks/day
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-base font-semibold">Configured Inquiries</h3>
							<p className="text-xs text-muted-foreground">
								Target questions and services evaluated during this experiment.
							</p>
						</div>
						{inquiries.length > 0 ? (
							<Button
								variant="ghost"
								size="sm"
								className="gap-1.5 text-xs text-primary"
								render={
									<Link
										to="/dashboard/experiments/$experimentId/inquiries"
										params={{ experimentId }}
									/>
								}
							>
								View all in inquiries tab
								<IconArrowRight className="size-3.5" />
							</Button>
						) : null}
					</div>

					{inquiries.length === 0 ? (
						<Empty className="border bg-card shadow-xs">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<IconHelp />
								</EmptyMedia>
								<EmptyTitle>No inquiries added yet</EmptyTitle>
								<EmptyDescription>
									Add questions and bind device sensors to begin tracking and
									annotating episodes.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button
									render={
										<Link
											to="/dashboard/experiments/$experimentId/inquiries"
											params={{ experimentId }}
										/>
									}
								>
									<IconPlus className="size-4" />
									Configure Inquiries
								</Button>
							</EmptyContent>
						</Empty>
					) : (
						<div className="grid gap-3 sm:grid-cols-2">
							{inquiries.slice(0, 4).map((inquiry) => (
								<Card key={inquiry.id} className="shadow-xs">
									<CardHeader className="gap-1.5 pb-2">
										<div className="flex items-start justify-between gap-2">
											<span className="text-sm font-semibold leading-tight line-clamp-2">
												{inquiry.question}
											</span>
											<Badge
												variant="secondary"
												className="shrink-0 text-[10px] capitalize"
											>
												{inquiry.type ?? "appliance"}
											</Badge>
										</div>
										{inquiry.goal_gamma ? (
											<p className="text-xs text-muted-foreground line-clamp-1">
												<span className="font-medium text-foreground">
													Goal:
												</span>{" "}
												{inquiry.goal_gamma}
											</p>
										) : null}
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex flex-wrap gap-1">
											{inquiry.sensors.length > 0 ? (
												inquiry.sensors.slice(0, 3).map((sensor) => {
													const Icon = getSensorIcon(
														sensor.source_key,
														sensor.sensor_type,
													);
													return (
														<Badge
															key={sensor.id}
															variant="outline"
															className="gap-1 py-0.5 text-[11px]"
														>
															<Icon className="size-3" />
															<span className="max-w-28 truncate">
																{sensor.name}
															</span>
														</Badge>
													);
												})
											) : (
												<span className="text-xs text-muted-foreground italic">
													No sensors assigned
												</span>
											)}
											{inquiry.sensors.length > 3 ? (
												<Badge variant="outline" className="py-0.5 text-[11px]">
													+{inquiry.sensors.length - 3} more
												</Badge>
											) : null}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>

				<Card className="shadow-xs">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold">
							Metadata & Details
						</CardTitle>
						<CardDescription className="text-xs">
							Internal identifiers and timestamp history
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 text-xs sm:grid-cols-3">
						<div>
							<span className="text-muted-foreground">Experiment ID</span>
							<p className="font-mono text-foreground font-medium truncate mt-0.5">
								{experiment.id}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">Created at</span>
							<p className="text-foreground font-medium mt-0.5">
								{new Date(experiment.created_at).toLocaleString()}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">Last updated</span>
							<p className="text-foreground font-medium mt-0.5">
								{new Date(experiment.updated_at).toLocaleString()}
							</p>
						</div>
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
	},
	component: ExperimentOverviewPage,
});
