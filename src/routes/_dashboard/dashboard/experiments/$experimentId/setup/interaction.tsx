import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
import { ExperimentInteractionForm } from "../-components/experiment-interaction-form";
import { ExperimentSetupMenu } from "../-components/experiment-setup-menu";

const SetupInteractionPage = () => (
	<DashboardPage
		title="Interaction"
		description="Set the daily asking hours and prompt limits for occupant interactions."
	>
		<ExperimentInteractionForm />
	</DashboardPage>
);

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/setup/interaction",
)({
	staticData: {
		breadcrumb: { label: "Interaction" },
		productMenu: { title: "Setup", component: ExperimentSetupMenu },
	},
	component: SetupInteractionPage,
});
