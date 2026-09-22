import { createFileRoute } from "@tanstack/react-router";
import { sensorListQueryOptions } from "@/features/sensors";
import { NewExperimentWizard } from "./-components/new-experiment-wizard";

export const Route = createFileRoute("/_dashboard/dashboard/experiments/new")({
	staticData: {
		breadcrumb: [
			{ label: "Experiments", to: "/dashboard/experiments" },
			{ label: "New experiment" },
		],
	},
	loader: async ({ context }) => {
		// SensorPicker cần danh sách cảm biến ngay ở bước 2 — prefetch critical.
		await context.queryClient.query(sensorListQueryOptions());
	},
	component: NewExperimentWizard,
});
