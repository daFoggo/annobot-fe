import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
import { ExperimentSettingsForm } from "./-components/experiment-settings-form";

const ExperimentSettingsPage = () => (
	<DashboardPage title="Settings" description="Update this experiment.">
		<ExperimentSettingsForm />
	</DashboardPage>
);

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/settings",
)({
	staticData: {
		breadcrumb: { label: "Settings" },
	},
	component: ExperimentSettingsPage,
});
