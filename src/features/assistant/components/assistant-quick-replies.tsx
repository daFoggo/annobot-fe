import { IconClockPause, IconHelpCircle, IconX } from "@tabler/icons-react";
import type React from "react";
import { Button } from "@/components/ui/button";

export interface AssistantQuickRepliesProps {
	options?: string[];
	onSelect: (option: string) => void;
	disabled?: boolean;
	className?: string;
}

function getOptionIcon(option: string): React.ReactNode {
	const lower = option.toLowerCase();
	if (
		lower.includes("later") ||
		lower.includes("defer") ||
		lower.includes("sau")
	) {
		return <IconClockPause className="size-3" />;
	}
	if (
		lower.includes("not relevant") ||
		lower.includes("unrelated") ||
		lower.includes("không liên quan")
	) {
		return <IconX className="size-3" />;
	}
	if (
		lower.includes("not sure") ||
		lower.includes("don't know") ||
		lower.includes("không nhớ") ||
		lower.includes("help")
	) {
		return <IconHelpCircle className="size-3" />;
	}
	return null;
}

export function AssistantQuickReplies({
	options = ["Not sure", "Not relevant", "Decide later"],
	onSelect,
	disabled = false,
	className,
}: AssistantQuickRepliesProps) {
	if (!options || options.length === 0) return null;

	return (
		<div className={className}>
			<div className="flex flex-col gap-1.5 pt-1.5">
				<span className="text-xs font-semibold text-muted-foreground select-none">
					Suggested replies:
				</span>
				<div className="flex flex-wrap items-center gap-1.5">
					{options.map((option) => (
						<Button
							key={option}
							type="button"
							variant="outline"
							size="xs"
							disabled={disabled}
							onClick={() => onSelect(option)}
							className="gap-1 font-mono text-xs text-foreground hover:border-primary hover:text-primary transition-colors select-none"
						>
							{getOptionIcon(option)}
							<span>{option}</span>
						</Button>
					))}
				</div>
			</div>
		</div>
	);
}
