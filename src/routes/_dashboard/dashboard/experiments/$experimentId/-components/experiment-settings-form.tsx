import { useSuspenseQuery } from "@tanstack/react-query";
import { useMatch, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	experimentDetailQueryOptions,
	useDeleteExperiment,
	useUpdateExperiment,
} from "@/features/experiments";
import { getErrorMessage } from "@/lib/error";

const time = (value: string) => value.slice(0, 5);

const toIntOrNull = (value: FormDataEntryValue | null): number | null => {
	const raw = String(value ?? "").trim();
	if (!raw) return null;
	const parsed = Number.parseInt(raw, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Form cập nhật experiment và quản trị vòng đời (Danger Zone / Delete).
 */
export const ExperimentSettingsForm = () => {
	const match = useMatch({
		from: "/_dashboard/dashboard/experiments/$experimentId",
		shouldThrow: false,
	});
	const experimentId = match?.params.experimentId ?? "";
	const navigate = useNavigate();
	const { data: experiment } = useSuspenseQuery(
		experimentDetailQueryOptions(experimentId),
	);
	const updateExperiment = useUpdateExperiment();
	const deleteExperiment = useDeleteExperiment();

	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		updateExperiment.mutate(
			{
				id: experimentId,
				payload: {
					title: String(formData.get("title") ?? "").trim(),
					ask_window_start: String(formData.get("ask_window_start") ?? ""),
					ask_window_end: String(formData.get("ask_window_end") ?? ""),
					max_asks_per_day: toIntOrNull(formData.get("max_asks_per_day")),
					il_timestep_minutes: toIntOrNull(formData.get("il_timestep_minutes")),
				},
			},
			{
				onSuccess: () => toast.success("Experiment updated"),
				onError: (error) =>
					toast.error(getErrorMessage(error, "Could not update experiment.")),
			},
		);
	};

	const handleDelete = () => {
		deleteExperiment.mutate(experimentId, {
			onSuccess: () => {
				toast.success("Experiment deleted");
				navigate({ to: "/dashboard/experiments" });
			},
			onError: (error) =>
				toast.error(getErrorMessage(error, "Could not delete experiment.")),
		});
	};

	return (
		<div className="flex max-w-xl flex-col gap-6">
			<form onSubmit={onSubmit} className="flex flex-col gap-5">
				<div className="flex flex-col gap-2">
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						name="title"
						defaultValue={experiment.title}
						required
						maxLength={256}
					/>
				</div>

				<div className="grid gap-5 sm:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor="ask_window_start">Ask window start</Label>
						<Input
							id="ask_window_start"
							name="ask_window_start"
							type="time"
							defaultValue={time(experiment.ask_window_start)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="ask_window_end">Ask window end</Label>
						<Input
							id="ask_window_end"
							name="ask_window_end"
							type="time"
							defaultValue={time(experiment.ask_window_end)}
						/>
					</div>
				</div>

				<div className="grid gap-5 sm:grid-cols-2">
					<div className="flex flex-col gap-2">
						<Label htmlFor="max_asks_per_day">Max asks per day</Label>
						<Input
							id="max_asks_per_day"
							name="max_asks_per_day"
							type="number"
							min={1}
							defaultValue={experiment.max_asks_per_day ?? ""}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="il_timestep_minutes">IL timestep (minutes)</Label>
						<Input
							id="il_timestep_minutes"
							name="il_timestep_minutes"
							type="number"
							min={1}
							defaultValue={experiment.il_timestep_minutes ?? ""}
						/>
					</div>
				</div>

				<div>
					<Button type="submit" disabled={updateExperiment.isPending}>
						{updateExperiment.isPending ? "Saving…" : "Save changes"}
					</Button>
				</div>
			</form>

			<Separator className="my-2" />

			<div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:p-5">
				<div className="flex flex-col gap-1">
					<h3 className="text-sm font-semibold text-destructive">
						Danger Zone
					</h3>
					<p className="text-xs text-muted-foreground">
						Permanently delete this experiment, its inquiries, and all
						associated annotations. This action cannot be undone.
					</p>
				</div>
				<div>
					<AlertDialog>
						<AlertDialogTrigger
							render={
								<Button
									type="button"
									variant="destructive"
									size="sm"
									disabled={deleteExperiment.isPending}
								>
									Delete Experiment
								</Button>
							}
						/>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will permanently delete the experiment{" "}
									<strong className="text-foreground">
										{experiment.title}
									</strong>{" "}
									and all of its inquiries. This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									onClick={handleDelete}
									disabled={deleteExperiment.isPending}
								>
									{deleteExperiment.isPending
										? "Deleting…"
										: "Delete Experiment"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
};
