import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
import {
	CreateExperimentDialog,
	experimentListQueryOptions,
} from "@/features/experiments";
import { ExperimentList } from "./-components/experiment-list";

const ExperimentsPage = () => {
	const { data: experiments } = useSuspenseQuery(experimentListQueryOptions());

	return (
		<DashboardPage
			title="Experiments"
			description="An experiment is your workspace — it groups the questions, sensors and annotations for one study."
			actions={<CreateExperimentDialog />}
		>
			<ExperimentList experiments={experiments} />
		</DashboardPage>
	);
};

export const Route = createFileRoute("/_dashboard/dashboard/experiments/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(experimentListQueryOptions()),
	component: ExperimentsPage,
});
