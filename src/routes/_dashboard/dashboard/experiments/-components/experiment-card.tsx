import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Experiment } from "@/features/experiments";
import { ExperimentIcon } from "@/features/experiments";

const time = (value: string | null | undefined) =>
	value ? value.slice(0, 5) : "—";

export interface ExperimentCardProps {
	experiment: Experiment;
}

export const ExperimentCard = ({ experiment }: ExperimentCardProps) => (
	<Card className="h-full">
		<CardHeader>
			<CardTitle className="flex items-center gap-2">
				<ExperimentIcon className="size-5 shrink-0 text-muted-foreground" />
				<span className="truncate">{experiment.title}</span>
			</CardTitle>
		</CardHeader>
		<CardContent className="text-xs text-muted-foreground">
			{experiment.il_timestep_minutes
				? `Asks every ${experiment.il_timestep_minutes} min`
				: "No fixed question interval"}
		</CardContent>
		<CardFooter className="text-xs text-muted-foreground">
			{experiment.il_max_asks_per_day
				? `${experiment.il_max_asks_per_day} asks/day`
				: "Unlimited asks"}{" "}
			&middot; {time(experiment.il_ask_window_start)}–
			{time(experiment.il_ask_window_end)}
		</CardFooter>
	</Card>
);
