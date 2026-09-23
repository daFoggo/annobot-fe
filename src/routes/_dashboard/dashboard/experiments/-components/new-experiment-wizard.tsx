"use client";

import {
	IconArrowLeft,
	IconArrowRight,
	IconCheck,
	IconPlus,
	IconSparkles,
} from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardPage } from "@/components/layout/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCreateExperiment } from "@/features/experiments";
import { InquiryFormItem, type InquiryFormValues } from "@/features/inquiries";
import { getErrorMessage } from "@/lib/error";
import { cn } from "@/lib/utils";

const toIntOrNull = (value: string): number | null => {
	const raw = value.trim();
	if (!raw) return null;
	const parsed = Number.parseInt(raw, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

interface InquiryDraft extends InquiryFormValues {
	id: string;
}

const createDraft = (): InquiryDraft => ({
	id: crypto.randomUUID(),
	question: "",
	type: "appliance",
	goalGamma: "",
	sensorIds: [],
});

/**
 * Wizard tạo experiment 2 bước:
 *  - Bước 1: cấu hình chung (title, asking window, giới hạn hỏi).
 *  - Bước 2: danh sách inquiries + bộ chọn cảm biến (khối gợi ý AI tạm thời static)
 *    và submit trọn gói qua `useCreateExperiment`.
 */
export const NewExperimentWizard = () => {
	const navigate = useNavigate();
	const createExperiment = useCreateExperiment();
	const [step, setStep] = useState<1 | 2>(1);
	const [serverError, setServerError] = useState<string | null>(null);
	const [inquiries, setInquiries] = useState<InquiryDraft[]>(() => [
		createDraft(),
	]);

	const form = useForm({
		defaultValues: {
			title: "",
			ask_window_start: "09:00",
			ask_window_end: "21:00",
			max_asks_per_day: "10",
			il_timestep_minutes: "30",
		},
	});

	const patchInquiry = useCallback(
		(id: string, patch: Partial<InquiryFormValues>) => {
			setInquiries((prev) =>
				prev.map((inquiry) =>
					inquiry.id === id ? { ...inquiry, ...patch } : inquiry,
				),
			);
		},
		[],
	);

	const removeInquiry = useCallback((id: string) => {
		setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== id));
	}, []);

	const addInquiry = useCallback(() => {
		setInquiries((prev) => [...prev, createDraft()]);
	}, []);

	const handleContinueToStep2 = () => {
		const title = form.state.values.title.trim();
		if (!title) {
			form.validateField("title", "change");
			toast.error("Please provide an experiment title before continuing.");
			return;
		}
		setStep(2);
	};

	const handleCreate = async () => {
		setServerError(null);
		const title = form.state.values.title.trim();
		if (!title) {
			setStep(1);
			toast.error("Please provide an experiment title.");
			return;
		}

		try {
			const experiment = await createExperiment.mutateAsync({
				title,
				ask_window_start: form.state.values.ask_window_start,
				ask_window_end: form.state.values.ask_window_end,
				max_asks_per_day: toIntOrNull(form.state.values.max_asks_per_day),
				il_timestep_minutes: toIntOrNull(form.state.values.il_timestep_minutes),
				inquiries: inquiries.map((inquiry) => ({
					question: inquiry.question.trim(),
					sensor_ids: inquiry.sensorIds,
					type: inquiry.type,
					goal_gamma: inquiry.goalGamma.trim() || null,
				})),
			});
			toast.success("Experiment created successfully!");
			navigate({
				to: "/dashboard/experiments/$experimentId",
				params: { experimentId: experiment.id },
			});
		} catch (error) {
			setServerError(getErrorMessage(error, "Could not create experiment."));
		}
	};

	const hasValidInquiries = useMemo(
		() => inquiries.every((inquiry) => inquiry.question.trim().length > 0),
		[inquiries],
	);

	return (
		<DashboardPage
			title="Create New Experiment"
			description="Configure the listening schedule, then define target inquiry questions and monitored devices."
		>
			<div className="flex w-full flex-col gap-6">
				<Stepper current={step} />

				{step === 1 ? (
					<form
						onSubmit={(event) => {
							event.preventDefault();
							handleContinueToStep2();
						}}
					>
						<Card>
							<CardHeader>
								<CardTitle>General Configuration</CardTitle>
								<CardDescription>
									Set up the active inquiry window and interrogation constraints
									for this study.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<FieldGroup className="gap-6">
									<form.Field
										name="title"
										validators={{
											onChange: ({ value }: { value: string }) =>
												!value.trim()
													? { message: "Title is required" }
													: undefined,
										}}
										children={(field) => {
											const hasError =
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0;
											return (
												<Field data-invalid={hasError}>
													<FieldLabel htmlFor={field.name}>
														Experiment Title{" "}
														<span className="text-destructive">*</span>
													</FieldLabel>
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
													<FieldDescription>
														A concise descriptive title for this study.
													</FieldDescription>
													<FieldError errors={field.state.meta.errors} />
												</Field>
											);
										}}
									/>

									<Field>
										<FieldLabel>Asking Window (Daily Hours)</FieldLabel>
										<div className="grid grid-cols-2 gap-4">
											<form.Field
												name="ask_window_start"
												children={(field) => (
													<Field>
														<FieldLabel
															htmlFor={field.name}
															className="text-xs font-normal text-muted-foreground"
														>
															Start time
														</FieldLabel>
														<Input
															id={field.name}
															type="time"
															value={field.state.value}
															onChange={(event) =>
																field.handleChange(event.target.value)
															}
														/>
													</Field>
												)}
											/>
											<form.Field
												name="ask_window_end"
												children={(field) => (
													<Field>
														<FieldLabel
															htmlFor={field.name}
															className="text-xs font-normal text-muted-foreground"
														>
															End time
														</FieldLabel>
														<Input
															id={field.name}
															type="time"
															value={field.state.value}
															onChange={(event) =>
																field.handleChange(event.target.value)
															}
														/>
													</Field>
												)}
											/>
										</div>
										<FieldDescription>
											AnnoBot will only deliver inquiry questions during this
											daily window.
										</FieldDescription>
									</Field>

									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
														value={field.state.value}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
													/>
													<FieldDescription>
														Daily cap on total interactions.
													</FieldDescription>
												</Field>
											)}
										/>
										<form.Field
											name="il_timestep_minutes"
											children={(field) => (
												<Field>
													<FieldLabel htmlFor={field.name}>
														Interval between questions (min)
													</FieldLabel>
													<Input
														id={field.name}
														type="number"
														min={1}
														value={field.state.value}
														onChange={(event) =>
															field.handleChange(event.target.value)
														}
													/>
													<FieldDescription>
														Minimum cooldown time between prompts.
													</FieldDescription>
												</Field>
											)}
										/>
									</div>
								</FieldGroup>
							</CardContent>
							<CardFooter className="flex justify-end">
								<Button
									type="button"
									onClick={handleContinueToStep2}
									className="gap-2"
								>
									Continue to Inquiries & Devices
									<IconArrowRight className="size-4" />
								</Button>
							</CardFooter>
						</Card>
					</form>
				) : (
					<div className="flex flex-col gap-6">
						<Card size="sm" className="border-dashed bg-muted/30">
							<CardContent className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
								<div className="flex items-center gap-3">
									<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<IconSparkles className="size-4" />
									</div>
									<div className="flex flex-col gap-0.5">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-foreground">
												Auto-generate inquiries
											</span>
											<Badge variant="secondary">Coming soon</Badge>
										</div>
										<p className="text-xs text-muted-foreground">
											Auto-generate sample inquiries and map relevant sensors
											from your connected devices.
										</p>
									</div>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled
									className="shrink-0"
								>
									<IconSparkles data-icon="inline-start" />
									Suggest inquiries
								</Button>
							</CardContent>
						</Card>

						<div className="flex flex-col gap-4">
							{inquiries.map((inquiry, index) => (
								<InquiryFormItem
									key={inquiry.id}
									index={index}
									values={inquiry}
									onChange={(patch) => patchInquiry(inquiry.id, patch)}
									onRemove={() => removeInquiry(inquiry.id)}
									canRemove={inquiries.length > 1}
								/>
							))}
						</div>

						<div className="flex justify-center">
							<Button
								type="button"
								variant="outline"
								onClick={addInquiry}
								className="gap-2 border-dashed"
							>
								<IconPlus className="size-4" />
								Add another inquiry
							</Button>
						</div>

						<Separator />

						{serverError ? (
							<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
								{serverError}
							</div>
						) : null}

						<div className="flex items-center justify-between gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setStep(1)}
								className="gap-2"
							>
								<IconArrowLeft className="size-4" />
								Back to Step 1
							</Button>
							<Button
								type="button"
								onClick={handleCreate}
								disabled={!hasValidInquiries || createExperiment.isPending}
								className="gap-2"
							>
								{createExperiment.isPending
									? "Creating Experiment…"
									: "Create & Start Experiment"}
								<IconCheck className="size-4" />
							</Button>
						</div>
					</div>
				)}
			</div>
		</DashboardPage>
	);
};

const STEPS = [
	{ number: 1, label: "General Configuration" },
	{ number: 2, label: "Inquiries & Devices" },
];

const Stepper = ({ current }: { current: 1 | 2 }) => (
	<nav aria-label="Experiment setup progress" className="w-full">
		<ol className="grid grid-cols-2 gap-4">
			{STEPS.map((step) => {
				const active = step.number === current;
				const done = step.number < current;
				return (
					<li
						key={step.number}
						className={cn(
							"flex items-center gap-3 rounded-xl border p-3 transition-colors",
							active
								? "border-primary bg-primary/5 text-foreground"
								: done
									? "border-border bg-card text-muted-foreground"
									: "border-border/60 bg-muted/20 text-muted-foreground/60",
						)}
					>
						<span
							className={cn(
								"flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
								active
									? "bg-primary text-primary-foreground"
									: done
										? "bg-primary/20 text-primary"
										: "bg-muted text-muted-foreground",
							)}
						>
							{done ? <IconCheck className="size-3.5" /> : step.number}
						</span>
						<div className="flex min-w-0 flex-col">
							<span
								className={cn(
									"text-[10px] font-semibold tracking-wide uppercase",
									active ? "text-primary" : "text-muted-foreground",
								)}
							>
								Step {step.number}
							</span>
							<span className="truncate text-sm font-medium">{step.label}</span>
						</div>
					</li>
				);
			})}
		</ol>
	</nav>
);
