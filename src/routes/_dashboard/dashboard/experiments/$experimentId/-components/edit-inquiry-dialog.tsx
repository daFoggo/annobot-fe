"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
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
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Inquiry, useUpdateInquiry } from "@/features/inquiries";
import type { InquiryType } from "@/features/inquiries/schemas";
import { SensorPicker } from "@/features/sensors";
import { getErrorMessage } from "@/lib/error";

const TYPE_OPTIONS: InquiryType[] = [
	"appliance",
	"fact",
	"performance",
	"custom",
];

export interface EditInquiryDialogProps {
	inquiry: Inquiry;
	trigger?: React.ReactElement;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export const EditInquiryDialog = ({
	inquiry,
	trigger,
	open: controlledOpen,
	onOpenChange: setControlledOpen,
}: EditInquiryDialogProps) => {
	const updateInquiry = useUpdateInquiry();
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;
	const setOpen = isControlled
		? (setControlledOpen ?? (() => {}))
		: setUncontrolledOpen;

	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			question: inquiry.question ?? "",
			type: (inquiry.type as InquiryType) || "appliance",
			goalGamma: inquiry.goal_gamma ?? "",
			sensorIds: inquiry.sensors.map((s) => s.id),
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			try {
				await updateInquiry.mutateAsync({
					id: inquiry.id,
					payload: {
						question: value.question.trim(),
						type: value.type,
						goal_gamma: value.goalGamma.trim() || null,
						sensor_ids: value.sensorIds,
					},
				});
				toast.success("Inquiry updated successfully");
				handleClose();
			} catch (error) {
				setServerError(getErrorMessage(error, "Could not update inquiry."));
			}
		},
	});

	const handleClose = () => {
		setOpen(false);
		setServerError(null);
		updateInquiry.reset();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) handleClose();
				else setOpen(true);
			}}
		>
			{trigger ? <DialogTrigger render={trigger} /> : null}
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Edit Inquiry</DialogTitle>
					<DialogDescription>
						Update question wording, inquiry category, operational goals, or
						assigned sensors.
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div className="max-h-[70vh] min-h-0 scrollbar-none scroll-fade overflow-y-auto mb-2">
						<FieldGroup className="gap-4">
							<form.Field
								name="question"
								validators={{
									onChange: ({ value }: { value: string }) =>
										!value.trim()
											? { message: "Question is required" }
											: undefined,
								}}
								children={(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field data-invalid={hasError}>
											<FieldLabel htmlFor={field.name}>
												Question <span className="text-destructive">*</span>
											</FieldLabel>
											<Input
												id={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												placeholder="e.g. Which washing mode saves the most energy?"
												aria-invalid={hasError}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									);
								}}
							/>

							<form.Field
								name="type"
								children={(field) => (
									<Field>
										<FieldLabel>Inquiry Type</FieldLabel>
										<Select
											value={field.state.value}
											onValueChange={(value) => {
												if (value) field.handleChange(value as InquiryType);
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent align="start">
												<SelectGroup>
													{TYPE_OPTIONS.map((type) => (
														<SelectItem
															key={type}
															value={type}
															className="capitalize"
														>
															{type}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									</Field>
								)}
							/>

							<form.Field
								name="goalGamma"
								children={(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>
											Operational Goal
										</FieldLabel>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="Optional — e.g. Reduce washing energy consumption"
										/>
										<FieldDescription>
											The desired operational outcome this inquiry drives
											towards.
										</FieldDescription>
									</Field>
								)}
							/>

							<form.Field
								name="sensorIds"
								children={(field) => (
									<Field>
										<FieldLabel>Assigned Devices / Sensors</FieldLabel>
										<SensorPicker
											value={field.state.value}
											onChange={(sensorIds) => field.handleChange(sensorIds)}
										/>
									</Field>
								)}
							/>
						</FieldGroup>

						{serverError ? (
							<p className="mt-3 text-xs text-destructive">{serverError}</p>
						) : null}
					</div>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
						children={([canSubmit, isSubmitting]) => (
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									disabled={isSubmitting}
									onClick={handleClose}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Saving…" : "Save changes"}
								</Button>
							</DialogFooter>
						)}
					/>
				</form>
			</DialogContent>
		</Dialog>
	);
};
