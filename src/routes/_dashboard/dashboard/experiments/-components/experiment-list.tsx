import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import type { Experiment } from "@/features/experiments";
import { ExperimentIcon } from "@/features/experiments";

const time = (value: string) => value.slice(0, 5);

export interface ExperimentListProps {
	experiments: Experiment[];
}

export const ExperimentList = ({ experiments }: ExperimentListProps) => {
	if (experiments.length === 0) return null;

	return (
		<ItemGroup>
			{experiments.map((experiment) => (
				<Link
					key={experiment.id}
					to="/dashboard/experiments/$experimentId"
					params={{ experimentId: experiment.id }}
				>
					<Item variant="muted">
						<ItemMedia variant="icon">
							<ExperimentIcon className="text-muted-foreground" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>{experiment.title}</ItemTitle>
							<ItemDescription>
								{experiment.max_asks_per_day
									? `${experiment.max_asks_per_day} asks/day`
									: "Unlimited asks"}{" "}
								&middot; {time(experiment.ask_window_start)} –{" "}
								{time(experiment.ask_window_end)}
							</ItemDescription>
						</ItemContent>
						<Badge variant="secondary">
							{new Date(experiment.created_at).toLocaleDateString()}
						</Badge>
					</Item>
				</Link>
			))}
		</ItemGroup>
	);
};
