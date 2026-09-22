import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/error";
import { useCreateExperiment } from "../queries";

const toIntOrNull = (value: string): number | null => {
	const raw = value.trim();
	if (!raw) return null;
	const parsed = Number.parseInt(raw, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

export interface CreateExperimentDialogProps {
	/**
	 * Trigger tuỳ biến. Mặc định là nút "New experiment"; truyền `null` khi dialog
	 * được điều khiển từ bên ngoài (vd từ một item trong dropdown switcher).
	 */
	trigger?: ReactElement | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog tạo experiment. Hỗ trợ cả uncontrolled (có trigger) và controlled
 * (`open`/`onOpenChange` + `trigger={null}`) để tái sử dụng ở nhiều chỗ.
 */
export const CreateExperimentDialog = ({
	trigger,
	open,
	onOpenChange,
}: CreateExperimentDialogProps) => {
	const navigate = useNavigate();
	const [internalOpen, setInternalOpen] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const createExperiment = useCreateExperiment();

	const isControlled = open !== undefined;
	const dialogOpen = isControlled ? open : internalOpen;

	const form = useForm({
		defaultValues: {
			title: "",
			ask_window_start: "09:00",
			ask_window_end: "21:00",
			max_asks_per_day: "10",
			il_timestep_minutes: "30",
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			try {
				const experiment = await createExperiment.mutateAsync({
					title: value.title.trim(),
					ask_window_start: value.ask_window_start,
					ask_window_end: value.ask_window_end,
					max_asks_per_day: toIntOrNull(value.max_asks_per_day),
					il_timestep_minutes: toIntOrNull(value.il_timestep_minutes),
				});
				handleOpenChange(false);
				navigate({
					to: "/dashboard/experiments/$experimentId",
					params: { experimentId: experiment.id },
				});
			} catch (error) {
				setServerError(getErrorMessage(error, "Could not create experiment."));
			}
		},
	});

	const handleOpenChange = (next: boolean) => {
		if (isControlled) {
			onOpenChange?.(next);
		} else {
			setInternalOpen(next);
		}
		if (!next) {
			form.reset();
			setServerError(null);
			createExperiment.reset();
		}
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			{trigger === null ? null : (
				<DialogTrigger render={trigger ?? <Button>New experiment</Button>} />
			)}
			<DialogContent>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
					className="flex flex-col gap-4"
				>
					<DialogHeader>
						<DialogTitle>New experiment</DialogTitle>
						<DialogDescription>
							Create an experiment to study a service in your home.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup className="gap-4">
						<form.Field
							name="title"
							validators={{
								onChange: ({ value }: { value: string }) =>
									!value.trim() ? { message: "Title is required" } : undefined,
							}}
							children={(field) => {
								const hasError =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<Field data-invalid={hasError}>
										<FieldLabel htmlFor={field.name}>Title</FieldLabel>
										<Input
											id={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="e.g. Smart Home Energy Study"
											aria-invalid={hasError}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						/>

						<Field>
							<FieldLabel>Asking hours</FieldLabel>
							<div className="grid grid-cols-2 gap-4">
								<form.Field
									name="ask_window_start"
									children={(field) => (
										<Input
											type="time"
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									)}
								/>
								<form.Field
									name="ask_window_end"
									children={(field) => (
										<Input
											type="time"
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									)}
								/>
							</div>
						</Field>

						<div className="grid grid-cols-2 gap-4">
							<form.Field
								name="max_asks_per_day"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											Max questions / day
										</FieldLabel>
										<Input
											id={field.name}
											type="number"
											min={1}
											placeholder="10"
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							/>
							<form.Field
								name="il_timestep_minutes"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											Question interval (min)
										</FieldLabel>
										<Input
											id={field.name}
											type="number"
											min={1}
											placeholder="30"
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
									</Field>
								)}
							/>
						</div>
					</FieldGroup>

					{serverError ? (
						<p className="text-xs text-destructive">{serverError}</p>
					) : null}

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => (
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									disabled={isSubmitting}
									onClick={() => handleOpenChange(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Creating…" : "Create experiment"}
								</Button>
							</DialogFooter>
						)}
					/>
				</form>
			</DialogContent>
		</Dialog>
	);
};
