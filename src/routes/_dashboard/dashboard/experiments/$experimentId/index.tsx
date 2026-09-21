import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { experimentDetailQueryOptions } from "@/features/experiments";

const time = (value: string) => value.slice(0, 5);

const ExperimentOverviewPage = () => {
	const { experimentId } = Route.useParams();
	const { data: experiment } = useSuspenseQuery(
		experimentDetailQueryOptions(experimentId),
	);

	return (
		<DashboardPage title={experiment.title} description="Experiment overview">
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardDescription>Ask window</CardDescription>
						<CardTitle>
							{time(experiment.ask_window_start)} –{" "}
							{time(experiment.ask_window_end)}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Max asks per day</CardDescription>
						<CardTitle>{experiment.max_asks_per_day ?? "—"}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>IL timestep</CardDescription>
						<CardTitle>
							{experiment.il_timestep_minutes
								? `${experiment.il_timestep_minutes} min`
								: "—"}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardDescription>Created</CardDescription>
					<CardTitle className="text-sm font-normal">
						{new Date(experiment.created_at).toLocaleString()}
					</CardTitle>
				</CardHeader>
			</Card>
		</DashboardPage>
	);
};

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/",
)({
	staticData: {
		breadcrumb: { label: "Overview" },
	},
	component: ExperimentOverviewPage,
});
