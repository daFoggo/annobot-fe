import { IconFlask } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
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
import type { Experiment } from "@/features/experiments";
import { CreateExperimentDialog } from "@/features/experiments";

const time = (value: string) => value.slice(0, 5);

const summarize = (experiment: Experiment) =>
	`Max ${experiment.max_asks_per_day ?? "—"} asks/day · every ${
		experiment.il_timestep_minutes ?? "—"
	} min`;

export interface ExperimentListProps {
	experiments: Experiment[];
}

export const ExperimentList = ({ experiments }: ExperimentListProps) => {
	if (experiments.length === 0) {
		return (
			<Empty className="border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<IconFlask />
					</EmptyMedia>
					<EmptyTitle>No experiments yet</EmptyTitle>
					<EmptyDescription>
						Create your first experiment to get started.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<CreateExperimentDialog />
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{experiments.map((experiment) => (
				<Link
					key={experiment.id}
					to="/dashboard/experiments/$experimentId"
					params={{ experimentId: experiment.id }}
					className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<Card className="h-full transition-colors hover:border-ring">
						<CardHeader>
							<CardTitle className="truncate">{experiment.title}</CardTitle>
							<CardDescription>
								Ask window {time(experiment.ask_window_start)}–
								{time(experiment.ask_window_end)}
							</CardDescription>
						</CardHeader>
						<CardContent className="text-xs text-muted-foreground">
							{summarize(experiment)}
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
};
