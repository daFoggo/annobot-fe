import { IconSparkles } from "@tabler/icons-react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOptionalAssistantContext } from "../context";
import { useAssistantStore } from "../store";

export function AssistantCollapsedTrigger({
	onOpen,
}: {
	onOpen?: () => void;
} = {}) {
	const ctx = useOptionalAssistantContext();
	const storeToggle = useAssistantStore((s) => s.toggleOpen);
	const toggleOpen = onOpen ?? ctx?.actions.toggleOpen ?? storeToggle;

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<button
						type="button"
						onClick={toggleOpen}
						aria-label="Open AnnoBot Assistant (Ctrl+J)"
						className="group/trigger relative flex h-full w-9 shrink-0 flex-col items-center gap-3 border-l border-border bg-background py-3 transition-colors hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
					/>
				}
			>
				<IconSparkles className="size-4 shrink-0 text-primary transition-transform group-hover/trigger:scale-110" />

				<span className="select-none text-xs font-semibold tracking-wider text-muted-foreground transition-colors [writing-mode:vertical-rl] rotate-180 group-hover/trigger:text-foreground">
					AnnoBot
				</span>
			</TooltipTrigger>
			<TooltipContent side="left" sideOffset={6}>
				Open AnnoBot Assistant <span className="opacity-60">(Ctrl+J)</span>
			</TooltipContent>
		</Tooltip>
	);
}
