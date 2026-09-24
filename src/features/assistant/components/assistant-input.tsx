import { IconArrowUp, IconPlayerStopFilled } from "@tabler/icons-react";
import type React from "react";
import { useCallback, useMemo, useRef } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOptionalAssistantContext } from "../context";
import { AssistantQuickReplies } from "./assistant-quick-replies";

export interface AssistantInputProps {
	value?: string;
	onChange?: (value: string) => void;
	onSubmit?: () => void;
	onStop?: () => void;
	isGenerating?: boolean;
	placeholder?: string;
	className?: string;
}

export function AssistantInput({
	value: propValue,
	onChange: propOnChange,
	onSubmit: propOnSubmit,
	onStop: propOnStop,
	isGenerating: propIsGenerating,
	placeholder: propPlaceholder,
	className: _className,
}: AssistantInputProps = {}) {
	const ctx = useOptionalAssistantContext();
	const activeThreadId = ctx?.state.activeThreadId;
	const isThreadClosed = ctx?.state.activeThread?.status === "closed";

	const isGenerating = propIsGenerating ?? ctx?.state.isGenerating ?? false;
	const value = propValue ?? ctx?.state.inputValue ?? "";
	const onChange = propOnChange ?? ctx?.actions.setInputValue;
	const onSubmitAction = propOnSubmit ?? ctx?.actions.submitInput;
	const onStop = propOnStop ?? ctx?.actions.stopGenerating;

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const canSend = value.trim().length > 0 && !isGenerating && !isThreadClosed;

	const lastAssistantMessage = useMemo(() => {
		const msgs = ctx?.state.messages ?? [];
		for (let i = msgs.length - 1; i >= 0; i--) {
			const m = msgs[i];
			if (m.role === "assistant" || m.direction === "out") {
				return m;
			}
		}
		return null;
	}, [ctx?.state.messages]);

	const quickReplies = useMemo(() => {
		if (!activeThreadId || isThreadClosed) return [];
		const contentJson = lastAssistantMessage?.content_json;
		if (
			contentJson &&
			Array.isArray(contentJson.suggested_replies) &&
			contentJson.suggested_replies.length > 0
		) {
			return contentJson.suggested_replies as string[];
		}
		return ["Not sure", "Not relevant", "Decide later"];
	}, [activeThreadId, isThreadClosed, lastAssistantMessage]);

	const handleSelectQuickReply = useCallback(
		(reply: string) => {
			if (reply === "Decide later") {
				ctx?.actions.deferActiveThread();
			} else {
				ctx?.actions.sendMessage(reply);
			}
		},
		[ctx?.actions],
	);

	const onSubmit = useCallback(() => {
		if (!canSend) return;
		onSubmitAction?.();
		textareaRef.current?.focus();
	}, [canSend, onSubmitAction]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				onSubmit();
			}
		},
		[onSubmit],
	);

	// If rendered in context without an active thread and no explicit prop value, do not render
	if (!propValue && !activeThreadId && ctx) {
		return null;
	}

	return (
		<div className="shrink-0 border-t border-border p-3 bg-background/80 backdrop-blur-xs flex flex-col gap-2">
			{/* Quick reply suggestion chips */}
			{quickReplies.length > 0 && (
				<AssistantQuickReplies
					options={quickReplies}
					disabled={isGenerating}
					onSelect={handleSelectQuickReply}
				/>
			)}

			{/* Text input area */}
			<InputGroup className="min-h-12 items-end rounded-lg bg-card/60 border border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 transition-all">
				<InputGroupTextarea
					ref={textareaRef}
					value={value}
					onChange={(e) => onChange?.(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={
						propPlaceholder ??
						(activeThreadId
							? "> Type your reply or pick a suggestion above..."
							: "> Ask AnnoBot anything or type / for commands...")
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
							<TooltipContent side="top">Stop</TooltipContent>
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

			{/* Sub-footer keyboard hint */}
			<div className="flex items-center justify-between px-1 text-xs text-muted-foreground select-none font-mono">
				<span className="truncate">Enter to send, Shift+Enter for newline</span>
				<div className="flex items-center gap-1.5 shrink-0 pl-2">
					<span className="size-1.5 rounded-full bg-primary shrink-0" />
					<span>AnnoBot</span>
				</div>
			</div>
		</div>
	);
}
