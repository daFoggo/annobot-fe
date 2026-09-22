import { Link } from "@tanstack/react-router";
import type { Experiment } from "@/features/experiments";
import { ExperimentCard } from "./experiment-card";

export interface ExperimentGridProps {
	experiments: Experiment[];
}

export const ExperimentGrid = ({ experiments }: ExperimentGridProps) => {
	if (experiments.length === 0) return null;

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{experiments.map((experiment) => (
				<Link
					key={experiment.id}
					to="/dashboard/experiments/$experimentId"
					params={{ experimentId: experiment.id }}
					className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<ExperimentCard experiment={experiment} />
				</Link>
			))}
		</div>
	);
};
