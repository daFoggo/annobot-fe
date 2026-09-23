import { useSuspenseQuery } from "@tanstack/react-query";
import { useMatch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	experimentDetailQueryOptions,
	useUpdateExperiment,
} from "@/features/experiments";
import { getErrorMessage } from "@/lib/error";

const time = (value: string | null | undefined) =>
	value ? value.slice(0, 5) : "";

const toIntOrNull = (value: FormDataEntryValue | null): number | null => {
	const raw = String(value ?? "").trim();
	if (!raw) return null;
	const parsed = Number.parseInt(raw, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Configure asking schedule, daily inquiry cap, and prompt cooldowns.
 */
export const ExperimentInteractionForm = () => {
	const match = useMatch({
		from: "/_dashboard/dashboard/experiments/$experimentId",
		shouldThrow: false,
	});
	const experimentId = match?.params.experimentId ?? "";
	const { data: experiment } = useSuspenseQuery(
		experimentDetailQueryOptions(experimentId),
	);
	const updateExperiment = useUpdateExperiment();

	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		updateExperiment.mutate(
			{
				id: experimentId,
				payload: {
					il_ask_window_start: String(
						formData.get("il_ask_window_start") ?? "",
					),
					il_ask_window_end: String(formData.get("il_ask_window_end") ?? ""),
					il_max_asks_per_day:
						toIntOrNull(formData.get("il_max_asks_per_day")) ?? 10,
					il_timestep_minutes:
						toIntOrNull(formData.get("il_timestep_minutes")) ?? 30,
				},
			},
			{
				onSuccess: () => toast.success("Interaction settings saved"),
				onError: (error) =>
					toast.error(getErrorMessage(error, "Could not save settings.")),
			},
		);
	};

	return (
		<div className="max-w-xl">
			<Card>
				<CardHeader>
					<CardTitle>Interaction & Prompt Schedule</CardTitle>
					<CardDescription>
						Set up the active inquiry window and prompt frequency limits for
						this study.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit}>
						<FieldGroup className="gap-6">
							<Field>
								<FieldLabel>Asking Window (Daily Hours)</FieldLabel>
								<div className="grid grid-cols-2 gap-4">
									<Field>
										<FieldLabel
											htmlFor="il_ask_window_start"
											className="text-xs font-normal text-muted-foreground"
										>
											Start time
										</FieldLabel>
										<Input
											id="il_ask_window_start"
											name="il_ask_window_start"
											type="time"
											defaultValue={
												time(experiment.il_ask_window_start) || "09:00"
											}
										/>
									</Field>
									<Field>
										<FieldLabel
											htmlFor="il_ask_window_end"
											className="text-xs font-normal text-muted-foreground"
										>
											End time
										</FieldLabel>
										<Input
											id="il_ask_window_end"
											name="il_ask_window_end"
											type="time"
											defaultValue={
												time(experiment.il_ask_window_end) || "21:00"
											}
										/>
									</Field>
								</div>
								<FieldDescription>
									AnnoBot will only deliver inquiry questions to occupants
									during this daily window.
								</FieldDescription>
							</Field>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="il_max_asks_per_day">
										Max questions / day
									</FieldLabel>
									<Input
										id="il_max_asks_per_day"
										name="il_max_asks_per_day"
										type="number"
										min={1}
										defaultValue={experiment.il_max_asks_per_day ?? 10}
									/>
									<FieldDescription>
										Daily cap on total interactions. (Defaults to 10 if empty)
									</FieldDescription>
								</Field>

								<Field>
									<FieldLabel htmlFor="il_timestep_minutes">
										Interval between questions (min)
									</FieldLabel>
									<Input
										id="il_timestep_minutes"
										name="il_timestep_minutes"
										type="number"
										min={1}
										defaultValue={experiment.il_timestep_minutes ?? 30}
									/>
									<FieldDescription>
										Minimum cooldown time between prompts. (Defaults to 30 min
										if empty)
									</FieldDescription>
								</Field>
							</div>

							<Field orientation="horizontal" className="pt-2">
								<Button type="submit" disabled={updateExperiment.isPending}>
									{updateExperiment.isPending ? (
										<Spinner data-icon="inline-start" />
									) : null}
									Save changes
								</Button>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};
