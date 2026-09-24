import {
	IconArrowUp,
	IconHelpCircle,
	IconPlayerStopFilled,
} from "@tabler/icons-react";
import { type KeyboardEvent, useRef, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOptionalAssistantContext } from "../context";
import type { AssistantExperimentContext } from "../schemas";

export interface AssistantInputProps {
	value?: string;
	onChange?: (val: string) => void;
	onSubmit?: () => void;
	onStop?: () => void;
	isGenerating?: boolean;
	context?: AssistantExperimentContext;
}

export function AssistantInput({
	value: propValue,
	onChange: propOnChange,
	onSubmit: propOnSubmit,
	onStop: propOnStop,
	isGenerating: propIsGenerating,
	context: propContext,
}: AssistantInputProps = {}) {
	const ctx = useOptionalAssistantContext();
	const localRef = useRef<HTMLTextAreaElement>(null);
	const textareaRef = ctx?.meta.inputRef ?? localRef;

	const [uncontrolledValue, setUncontrolledValue] = useState("");
	const value = propValue ?? ctx?.state.inputValue ?? uncontrolledValue;
	const onChange =
		propOnChange ?? ctx?.actions.setInputValue ?? setUncontrolledValue;
	const onSubmit = propOnSubmit ?? ctx?.actions.submitInput ?? (() => {});
	const onStop = propOnStop ?? ctx?.actions.stopGenerating ?? (() => {});
	const isGenerating = propIsGenerating ?? ctx?.state.isGenerating ?? false;
	const context = propContext ?? ctx?.state.context;

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!isGenerating && value.trim()) {
				onSubmit();
			}
		}
	};

	const canSend = value.trim().length > 0 && !isGenerating;

	return (
		<div className="shrink-0 border-t border-border p-3 bg-background/80 backdrop-blur-xs flex flex-col gap-2">
			{/* Text input area */}
			<InputGroup className="min-h-12 items-end rounded-lg bg-card/60 border border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 transition-all">
				<InputGroupTextarea
					ref={textareaRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={
						context?.title
							? `> Ask about "${context.title}"...`
							: "> Ask AnnoBot anything or type / for commands..."
					}
					rows={1}
					className="max-h-32 text-xs py-2 px-3 leading-relaxed placeholder:text-muted-foreground/70 font-mono"
				/>

				<InputGroupAddon align="inline-end" className="pb-1.5 pr-1.5">
					{isGenerating ? (
						<Tooltip>
							<TooltipTrigger
								render={
									<InputGroupButton
										type="button"
										variant="destructive"
										size="icon-xs"
										onClick={onStop}
										aria-label="Stop generating"
									/>
								}
							>
								<IconPlayerStopFilled className="size-3" />
							</TooltipTrigger>
							<TooltipContent side="top">Stop generating</TooltipContent>
						</Tooltip>
					) : (
						<InputGroupButton
							type="button"
							variant={canSend ? "default" : "ghost"}
							size="icon-xs"
							disabled={!canSend}
							onClick={onSubmit}
							aria-label="Send message"
						>
							<IconArrowUp className="size-3.5" />
						</InputGroupButton>
					)}
				</InputGroupAddon>
			</InputGroup>

			{/* Sub-footer shortcut hints */}
			<div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground select-none font-mono">
				<Tooltip>
					<TooltipTrigger
						render={
							<button
								type="button"
								className="flex items-center gap-1 hover:text-foreground transition-colors cursor-help"
							/>
						}
					>
						<IconHelpCircle className="size-3" />
						<span>? for shortcuts</span>
					</TooltipTrigger>
					<TooltipContent
						side="top"
						className="flex flex-col gap-1 text-[11px] p-2 font-mono"
					>
						<div className="flex items-center justify-between gap-4">
							<span>Send message</span>
							<Kbd>Enter</Kbd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span>New line</span>
							<span className="flex items-center gap-1">
								<Kbd>Shift</Kbd> + <Kbd>Enter</Kbd>
							</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span>Toggle assistant panel</span>
							<span className="flex items-center gap-1">
								<Kbd>Ctrl</Kbd> + <Kbd>J</Kbd>
							</span>
						</div>
					</TooltipContent>
				</Tooltip>

				<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground select-none font-mono">
					<span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
					<span>AnnoBot connected</span>
				</div>
			</div>
		</div>
	);
}
