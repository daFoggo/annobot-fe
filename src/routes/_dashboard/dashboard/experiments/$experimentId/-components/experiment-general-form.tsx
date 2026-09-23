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
	useDeleteExperiment,
	useUpdateExperiment,
} from "@/features/experiments";
import { getErrorMessage } from "@/lib/error";

/** Tên experiment và vòng đời của nó (xoá vĩnh viễn). */
export const ExperimentGeneralForm = () => {
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
				payload: { title: String(formData.get("title") ?? "").trim() },
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
			<Card>
				<CardHeader>
					<CardTitle>General Configuration</CardTitle>
					<CardDescription>
						Basic identifying information for this experiment study.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="title">
									Experiment Title <span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="title"
									name="title"
									defaultValue={experiment.title}
									placeholder="e.g. Smart Home Energy Study"
									required
									maxLength={256}
								/>
								<FieldDescription>
									A concise descriptive title for this study. Shown in the
									experiment switcher and across the dashboard.
								</FieldDescription>
							</Field>

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

			<Card className="border-destructive/30 bg-destructive/5">
				<CardHeader>
					<CardTitle className="text-destructive">Danger Zone</CardTitle>
					<CardDescription>
						Irreversible actions that affect this entire experiment.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-0.5">
						<span className="text-sm font-medium text-foreground">
							Delete this experiment
						</span>
						<span className="text-xs text-muted-foreground">
							Removes the experiment, all inquiries, detected cases, and
							annotations.
						</span>
					</div>

					<AlertDialog>
						<AlertDialogTrigger
							render={
								<Button
									type="button"
									variant="destructive"
									size="sm"
									disabled={deleteExperiment.isPending}
								>
									Delete
								</Button>
							}
						/>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This permanently deletes{" "}
									<strong className="text-foreground">
										{experiment.title}
									</strong>{" "}
									and all data collected under it. This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									onClick={handleDelete}
									disabled={deleteExperiment.isPending}
								>
									Delete experiment
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardContent>
			</Card>
		</div>
	);
};
