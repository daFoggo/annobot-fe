import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
import { ExperimentGeneralForm } from "../-components/experiment-general-form";
import { ExperimentSetupMenu } from "../-components/experiment-setup-menu";

const SetupGeneralPage = () => (
	<DashboardPage
		title="General"
		description="Configure general experiment metadata and manage lifecycle."
	>
		<ExperimentGeneralForm />
	</DashboardPage>
);

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/setup/",
)({
	staticData: {
		breadcrumb: { label: "General" },
		productMenu: { title: "Setup", component: ExperimentSetupMenu },
	},
	component: SetupGeneralPage,
});
