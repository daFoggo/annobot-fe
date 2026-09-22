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
import { useCreateInquiry } from "@/features/inquiries";
import type { InquiryType } from "@/features/inquiries/schemas";
import { SensorPicker } from "@/features/sensors";
import { getErrorMessage } from "@/lib/error";

const TYPE_OPTIONS: InquiryType[] = [
	"appliance",
	"fact",
	"performance",
	"custom",
];

export interface AddInquiryDialogProps {
	experimentId: string;
	trigger?: React.ReactElement;
}

/**
 * Dialog thêm một inquiry mới vào experiment đã có (trang Inquiries).
 * Submit qua `useCreateInquiry`; thành công thì toast + đóng.
 * Tuân thủ shadcn Scrollable Content + Sticky Footer: Header & Footer cố định,
 * nội dung cuộn bên trong ScrollArea với hiệu ứng scroll-fade.
 */
export const AddInquiryDialog = ({
	experimentId,
	trigger,
}: AddInquiryDialogProps) => {
	const createInquiry = useCreateInquiry();
	const [open, setOpen] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			question: "",
			type: "appliance" as InquiryType,
			goalGamma: "",
			sensorIds: [] as string[],
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			try {
				await createInquiry.mutateAsync({
					experiment_id: experimentId,
					question: value.question.trim(),
					type: value.type,
					goal_gamma: value.goalGamma.trim() || null,
					sensor_ids: value.sensorIds,
				});
				toast.success("Inquiry added");
				handleClose();
			} catch (error) {
				setServerError(getErrorMessage(error, "Could not add inquiry."));
			}
		},
	});

	const handleClose = () => {
		setOpen(false);
		setServerError(null);
		createInquiry.reset();
		form.reset();
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			handleClose();
		} else {
			setOpen(true);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger render={trigger ?? <Button>Add Inquiry</Button>} />
			<DialogContent className=" sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add Inquiry</DialogTitle>
					<DialogDescription>
						Add a new inquiry to study a service in this experiment.
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
											<FieldLabel htmlFor={field.name}>Question (Q)</FieldLabel>
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
										<FieldLabel>Type</FieldLabel>
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
											Operational goal (Γ)
										</FieldLabel>
										<Input
											id={field.name}
											value={field.state.value}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
											placeholder="Optional"
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
										<FieldLabel>Assigned Devices (S)</FieldLabel>
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
									{isSubmitting ? "Adding…" : "Add inquiry"}
								</Button>
							</DialogFooter>
						)}
					/>
				</form>
			</DialogContent>
		</Dialog>
	);
};
