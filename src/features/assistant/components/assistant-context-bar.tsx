import {
	IconCheck,
	IconChevronDown,
	IconCircleDot,
	IconInfoCircle,
	IconSparkles,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { experimentDetailQueryOptions } from "@/features/experiments";
import { useOptionalAssistantContext } from "../context";

export function formatCaseStatus(status?: string | null): {
	label: string;
	variant: "default" | "secondary" | "outline";
} {
	switch (status) {
		case "asked":
		case "pending":
			return { label: "Awaiting reply", variant: "secondary" };
		case "complete":
			return { label: "Completed", variant: "default" };
		case "auto_filled":
			return { label: "Auto-filled", variant: "secondary" };
		case "closed":
			return { label: "Queued", variant: "outline" };
		case "expired_unanswered":
			return { label: "Expired", variant: "outline" };
		case "annotation_free":
			return { label: "Annotation-free", variant: "outline" };
		default:
			return { label: status ?? "Awaiting reply", variant: "secondary" };
	}
}

export function formatCaseTime(
	t_start?: string,
	t_end?: string | null,
): string {
	if (!t_start) return "Episode";
	try {
		const start = new Date(t_start);
		const dateStr = start.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
		const startStr = start.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		if (!t_end) return `${dateStr}, ${startStr}`;
		const end = new Date(t_end);
		const endStr = end.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		return `${dateStr}, ${startStr}–${endStr}`;
	} catch {
		return "Episode";
	}
}

export function AssistantContextBar() {
	const ctx = useOptionalAssistantContext();
	const thread = ctx?.state.activeThread;

	const experimentId = thread?.experiment_id;
	const caseData = thread?.case;
	const progress = thread?.progress;

	const { data: experiment } = useQuery({
		...experimentDetailQueryOptions(experimentId ?? ""),
		enabled: Boolean(experimentId),
	});

	if (!thread) return null;

	const requiredFields = progress?.required ?? [];
	const missingFields = progress?.missing ?? [];
	const collected = progress?.collected ?? {};
	const requiredCount = requiredFields.length;
	const answeredRequiredCount = requiredFields.filter(
		(field) =>
			!missingFields.includes(field) &&
			field in collected &&
			Boolean(collected[field]),
	).length;

	const duration = caseData?.duration_minutes
		? `${Math.round(caseData.duration_minutes)}m`
		: null;

	const peakPower =
		typeof caseData?.evidence?.peak_w === "number"
			? `${Math.round(caseData.evidence.peak_w)}W`
			: typeof caseData?.evidence?.peak_power_w === "number"
				? `${Math.round(caseData.evidence.peak_power_w)}W`
				: null;

	const statusInfo = formatCaseStatus(caseData?.status);

	return (
		<div className="shrink-0 border-b border-border bg-muted/20 px-3 py-1.5 flex items-center justify-between gap-2 select-none text-xs">
			{/* Left: Required fields status */}
			<div className="flex items-center gap-1.5 min-w-0 flex-wrap">
				{requiredFields.length > 0 ? (
					<>
						{requiredFields.map((field) => {
							const isCollected =
								field in collected &&
								!missingFields.includes(field) &&
								Boolean(collected[field]);
							const val = collected[field];

							return isCollected ? (
								<Badge
									key={field}
									variant="default"
									className="gap-1 font-mono text-xs"
								>
									<IconCheck className="size-3 text-primary-foreground" />
									<span className="font-semibold">{field}:</span>
									<span className="truncate max-w-[120px]">{String(val)}</span>
								</Badge>
							) : (
								<Badge
									key={field}
									variant="outline"
									className="gap-1 font-mono text-xs border-primary/40 bg-primary/5 text-foreground"
								>
									<IconCircleDot className="size-3 text-primary animate-pulse" />
									<span className="font-semibold">{field}</span>
									<span className="text-amber-500 font-semibold text-2xs uppercase">
										needed
									</span>
								</Badge>
							);
						})}

						{requiredCount > 1 ? (
							<span className="font-mono text-xs text-muted-foreground">
								({answeredRequiredCount}/{requiredCount})
							</span>
						) : null}
					</>
				) : (
					<span className="font-mono text-xs text-muted-foreground italic">
						Annotation-free
					</span>
				)}
			</div>

			{/* Right: Details Popover */}
			<div className="flex items-center gap-1.5 shrink-0">
				<Popover>
					<PopoverTrigger
						render={
							<Button
								type="button"
								variant="ghost"
								size="xs"
								className="h-6 gap-1 px-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
							>
								<IconInfoCircle className="size-3.5" />
								<span className="hidden sm:inline">Details</span>
								<IconChevronDown className="size-3 opacity-60" />
							</Button>
						}
					/>
					<PopoverContent
						align="end"
						className="w-80 flex flex-col gap-3 p-3 font-mono text-xs"
					>
						{/* Experiment info */}
						{experiment?.title ? (
							<div className="flex flex-col gap-1 pb-2 border-b border-border/60">
								<span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
									Experiment
								</span>
								<div className="flex items-center gap-1.5 text-foreground font-medium">
									<IconSparkles className="size-3.5 text-primary shrink-0" />
									<span className="truncate">{experiment.title}</span>
								</div>
							</div>
						) : null}

						{/* Episode telemetry & evidence */}
						<div className="flex flex-col gap-1.5">
							<span className="text-muted-foreground text-2xs uppercase tracking-wider font-semibold">
								Observed Episode
							</span>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div className="col-span-2">
									<span className="text-muted-foreground text-2xs block">
										Time Window
									</span>
									<span className="text-foreground font-medium">
										{formatCaseTime(caseData?.t_start, caseData?.t_end)}
									</span>
								</div>
								<div>
									<span className="text-muted-foreground text-2xs block">
										Detection
									</span>
									<span className="text-foreground font-medium truncate block capitalize">
										{caseData?.detection_key
											? caseData.detection_key.replace(/_/g, " ")
											: "Activity Episode"}
									</span>
								</div>
								{peakPower ? (
									<div>
										<span className="text-muted-foreground text-2xs block">
											Peak Power
										</span>
										<span className="text-foreground font-medium">
											{peakPower}
										</span>
									</div>
								) : null}
								{duration ? (
									<div>
										<span className="text-muted-foreground text-2xs block">
											Duration
										</span>
										<span className="text-foreground font-medium">
											{duration}
										</span>
									</div>
								) : null}
								<div>
									<span className="text-muted-foreground text-2xs block">
										Status
									</span>
									<span className="text-foreground font-medium">
										{statusInfo.label}
									</span>
								</div>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
}
