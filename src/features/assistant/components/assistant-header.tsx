import {
	IconArrowLeft,
	IconChevronsRight,
	IconSparkles,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { inquiryListQueryOptions } from "@/features/inquiries";
import { useOptionalAssistantContext } from "../context";
import type { AssistantExperimentContext } from "../schemas";
import { useAssistantStore } from "../store";

export interface AssistantHeaderProps {
	context?: AssistantExperimentContext;
}

export function AssistantHeader(_props: AssistantHeaderProps = {}) {
	const ctx = useOptionalAssistantContext();
	const storeSetOpen = useAssistantStore((s) => s.setOpen);

	const setOpen = ctx?.actions.setOpen ?? storeSetOpen;
	const activeThreadId = ctx?.state.activeThreadId;
	const selectThread = ctx?.actions.selectThread;
	const activeThread = ctx?.state.activeThread;

	const experimentId = activeThread?.experiment_id;
	const inquiryId = activeThread?.inquiry_id;

	const { data: inquiries } = useQuery({
		...inquiryListQueryOptions(experimentId ?? ""),
		enabled: Boolean(
			activeThreadId && experimentId && !activeThread?.case?.question,
		),
	});

	const inquiry = inquiries?.find((item) => item.id === inquiryId);
	const threadTitle =
		activeThread?.case?.question || inquiry?.question || "Annotation Episode";

	return (
		<header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3 bg-background/80 backdrop-blur-xs select-none">
			{/* Left brand & navigation */}
			<div className="flex min-w-0 flex-1 items-center gap-2">
				{activeThreadId ? (
					<>
						<Tooltip>
							<TooltipTrigger
								render={
									<Button
										type="button"
										variant="ghost"
										size="icon-xs"
										onClick={() => selectThread?.(null)}
										aria-label="Back to inbox"
										className="shrink-0"
									/>
								}
							>
								<IconArrowLeft className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
							</TooltipTrigger>
							<TooltipContent side="bottom">Back to inbox</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger
								render={
									<span className="truncate font-mono text-xs font-semibold tracking-tight text-foreground flex-1 cursor-default">
										{threadTitle}
									</span>
								}
							/>
							<TooltipContent
								side="bottom"
								className="max-w-80 font-mono text-xs"
							>
								{threadTitle}
							</TooltipContent>
						</Tooltip>
					</>
				) : (
					<>
						<IconSparkles className="size-4 shrink-0 text-primary" />
						<span className="truncate font-mono text-sm font-semibold tracking-tight text-foreground">
							AnnoBot
						</span>
					</>
				)}
			</div>

			{/* Right actions */}
			<div className="flex shrink-0 items-center gap-1">
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={() => setOpen(false)}
								aria-label="Collapse panel"
							/>
						}
					>
						<IconChevronsRight className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
					</TooltipTrigger>
					<TooltipContent side="bottom">Collapse (Ctrl+J)</TooltipContent>
				</Tooltip>
			</div>
		</header>
	);
}
