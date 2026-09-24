import {
	IconChartBar,
	IconChecklist,
	IconHelp,
	IconListSearch,
	IconSparkles,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOptionalAssistantContext } from "../context";
import type {
	AssistantExperimentContext,
	AssistantSuggestedCommand,
} from "../schemas";

export interface AssistantWelcomeProps {
	context?: AssistantExperimentContext;
	onSelectPrompt?: (prompt: string) => void;
}

const SUGGESTED_COMMANDS: AssistantSuggestedCommand[] = [
	{
		command: "/analyze",
		label: "Analyze Experiment",
		description: "Analyze metrics, detection rates, and performance",
		prompt: "/analyze",
	},
	{
		command: "/cases",
		label: "Review Cases",
		description: "Inspect recognized candidate cases and anomalies",
		prompt: "/cases",
	},
	{
		command: "/inquiries",
		label: "Inquiries & Rules",
		description: "Review active inquiries and sensor triggers",
		prompt: "/inquiries",
	},
	{
		command: "/explain",
		label: "Explain System",
		description: "Learn how AnnoBot detection & learning cycles work",
		prompt: "/explain",
	},
];

export function AssistantWelcome({
	context: propContext,
	onSelectPrompt: propOnSelectPrompt,
}: AssistantWelcomeProps = {}) {
	const ctx = useOptionalAssistantContext();
	const context = propContext ?? ctx?.state.context;
	const onSelectPrompt =
		propOnSelectPrompt ?? ctx?.actions.selectPrompt ?? (() => {});
	return (
		<div className="flex flex-col gap-6 p-4 text-xs font-mono leading-relaxed select-text">
			{/* Intro section matching Opik aesthetic */}
			<div className="space-y-3">
				<p className="text-muted-foreground font-sans text-sm font-medium">
					Investigate experiments, analyze performance, or run actions.
				</p>

				<div className="space-y-1.5 pt-1 text-xs">
					{SUGGESTED_COMMANDS.map((cmd) => (
						<button
							key={cmd.command}
							type="button"
							onClick={() => onSelectPrompt(cmd.prompt)}
							className="group/cmd flex w-full items-baseline gap-1.5 text-left transition-colors hover:text-foreground"
						>
							<span className="text-muted-foreground">Run</span>
							<span className="text-primary font-semibold group-hover/cmd:underline">
								{cmd.command}
							</span>
							<span className="text-muted-foreground/80 truncate">
								to {cmd.description.toLowerCase()}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Context-aware experiment card if on an experiment page */}
			{context?.title ? (
				<div className="rounded-lg border border-border bg-card/50 p-3 space-y-2 font-sans">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-1.5">
							<IconSparkles className="size-3.5 text-primary" />
							<span className="font-semibold text-xs text-foreground truncate">
								{context.title}
							</span>
						</div>
						<Badge variant="outline">{context.service ?? "active"}</Badge>
					</div>

					<p className="text-xs text-muted-foreground">
						Connected to active experiment with {context.inquiriesCount ?? 0}{" "}
						inquiries configured.
					</p>

					<div className="flex flex-wrap gap-1.5 pt-1">
						<Button
							type="button"
							variant="secondary"
							size="xs"
							onClick={() =>
								onSelectPrompt(
									`Give me an executive summary of experiment "${context.title}".`,
								)
							}
						>
							<IconChartBar className="size-3" />
							Summarize experiment
						</Button>
						<Button
							type="button"
							variant="secondary"
							size="xs"
							onClick={() =>
								onSelectPrompt(
									`What are the most recent cases or anomalies detected in "${context.title}"?`,
								)
							}
						>
							<IconListSearch className="size-3" />
							Review anomalies
						</Button>
					</div>
				</div>
			) : (
				/* Generic quick chips */
				<div className="space-y-2 font-sans">
					<span className="text-xs font-medium text-muted-foreground">
						Suggested actions:
					</span>
					<div className="flex flex-wrap gap-1.5">
						<Button
							type="button"
							variant="outline"
							size="xs"
							onClick={() => onSelectPrompt("/analyze")}
						>
							<IconChartBar className="size-3" />
							/analyze
						</Button>
						<Button
							type="button"
							variant="outline"
							size="xs"
							onClick={() => onSelectPrompt("/cases")}
						>
							<IconChecklist className="size-3" />
							/cases
						</Button>
						<Button
							type="button"
							variant="outline"
							size="xs"
							onClick={() => onSelectPrompt("/explain")}
						>
							<IconHelp className="size-3" />
							/explain
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
