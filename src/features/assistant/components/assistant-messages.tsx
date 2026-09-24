import {
	IconCheck,
	IconCopy,
	IconThumbDown,
	IconThumbUp,
} from "@tabler/icons-react";
import { type ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { useOptionalAssistantContext } from "../context";
import type { ChatMessage } from "../schemas";

/**
 * Format timestamp sang dạng giờ:phút AM/PM
 */
function formatTime(isoString?: string): string {
	if (!isoString) return "";
	try {
		return new Date(isoString).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return "";
	}
}

/**
 * Opik-style Code Block với thanh tiêu đề ngôn ngữ, nút copy và số dòng ở lề trái
 */
function StreamCodeBlock({
	code,
	language = "text",
}: {
	code: string;
	language?: string;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// ignore
		}
	};

	const codeLines = useMemo(
		() =>
			code
				.trimEnd()
				.split("\n")
				.map((line, index) => ({
					line,
					lineNumber: index + 1,
				})),
		[code],
	);

	return (
		<div className="my-2.5 overflow-hidden rounded-md border border-border bg-card/60 font-mono text-xs shadow-2xs">
			{/* Top bar */}
			<div className="flex h-7 items-center justify-between border-b border-border/60 bg-muted/60 px-2.5 text-xs text-muted-foreground select-none">
				<span className="font-semibold uppercase tracking-wider text-muted-foreground/80">
					{language || "text"}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="xs"
					onClick={handleCopy}
					className="text-muted-foreground hover:text-foreground font-mono"
				>
					{copied ? (
						<>
							<IconCheck className="size-3 text-primary" />
							<span className="text-primary font-medium">Copied</span>
						</>
					) : (
						<>
							<IconCopy className="size-3" />
							<span>Copy</span>
						</>
					)}
				</Button>
			</div>

			{/* Code body with line gutter */}
			<div className="overflow-x-auto p-2">
				<table className="w-full border-collapse">
					<tbody>
						{codeLines.map((item) => (
							<tr
								key={`code-line-${item.lineNumber}`}
								className="leading-relaxed hover:bg-muted/30"
							>
								<td className="w-7 select-none pr-2.5 text-right font-mono text-xs text-muted-foreground/50 border-r border-border/40 align-top">
									{item.lineNumber}
								</td>
								<td className="pl-3 font-mono text-xs text-foreground whitespace-pre break-all">
									{item.line}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

/**
 * Xử lý **bold** và `inline code`
 */
function formatInlineMarkdown(text: string): ReactNode {
	const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

	return parts.map((part, index) => {
		if (part.startsWith("`") && part.endsWith("`")) {
			return (
				<code
					// biome-ignore lint/suspicious/noArrayIndexKey: markdown token position
					key={`inline-code-${index}`}
					className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground font-medium"
				>
					{part.slice(1, -1)}
				</code>
			);
		}
		if (part.startsWith("**") && part.endsWith("**")) {
			return (
				<strong
					// biome-ignore lint/suspicious/noArrayIndexKey: markdown token position
					key={`inline-bold-${index}`}
					className="font-semibold text-foreground"
				>
					{part.slice(2, -2)}
				</strong>
			);
		}
		return part;
	});
}

/**
 * Renderer nội dung stream theo phong cách log/notebook của Opik
 */
function renderMarkdownContent(content: string): ReactNode {
	const lines = content.split("\n");
	const elements: ReactNode[] = [];
	let inCodeBlock = false;
	let codeBlockLang = "text";
	let codeBlockLines: string[] = [];

	lines.forEach((line, idx) => {
		// Code blocks ```
		const codeMatch = line.trim().match(/^```(\w+)?/);
		if (codeMatch) {
			if (inCodeBlock) {
				elements.push(
					<StreamCodeBlock
						// biome-ignore lint/suspicious/noArrayIndexKey: markdown block position
						key={`code-${idx}`}
						language={codeBlockLang}
						code={codeBlockLines.join("\n")}
					/>,
				);
				codeBlockLines = [];
				codeBlockLang = "text";
				inCodeBlock = false;
			} else {
				inCodeBlock = true;
				codeBlockLang = codeMatch[1] ?? "text";
			}
			return;
		}

		if (inCodeBlock) {
			codeBlockLines.push(line);
			return;
		}

		// Empty line
		if (!line.trim()) {
			// biome-ignore lint/suspicious/noArrayIndexKey: markdown line position
			elements.push(<div key={`sp-${idx}`} className="h-1.5" />);
			return;
		}

		// Headings
		if (line.startsWith("### ")) {
			elements.push(
				<h4
					// biome-ignore lint/suspicious/noArrayIndexKey: markdown line position
					key={`h4-${idx}`}
					className="mt-2.5 mb-1 font-semibold text-xs tracking-tight text-foreground"
				>
					{line.replace("### ", "")}
				</h4>,
			);
			return;
		}

		if (line.startsWith("## ")) {
			elements.push(
				<h3
					// biome-ignore lint/suspicious/noArrayIndexKey: markdown line position
					key={`h3-${idx}`}
					className="mt-3 mb-1 font-semibold text-sm tracking-tight text-foreground"
				>
					{line.replace("## ", "")}
				</h3>,
			);
			return;
		}

		// Blockquote
		if (line.startsWith("> ")) {
			elements.push(
				<blockquote
					// biome-ignore lint/suspicious/noArrayIndexKey: markdown line position
					key={`bq-${idx}`}
					className="my-1 border-l-2 border-primary/60 pl-2.5 italic text-muted-foreground"
				>
					{line.replace(/^>\s*/, "")}
				</blockquote>,
			);
			return;
		}

		// Bullet point
		if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
			const text = line.trim().replace(/^[-*]\s+/, "");
			elements.push(
				// biome-ignore lint/suspicious/noArrayIndexKey: markdown line position
				<div key={`li-${idx}`} className="flex items-start gap-2 ml-1 my-1">
					<span className="text-muted-foreground/70 text-xs shrink-0 select-none">
						●
					</span>
					<span className="leading-relaxed">{formatInlineMarkdown(text)}</span>
				</div>,
			);
			return;
		}

		// Numbered list
		const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
		if (numMatch) {
			elements.push(
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: markdown line position
					key={`num-${idx}`}
					className="flex items-start gap-2 ml-1 my-1"
				>
					<span className="text-muted-foreground font-mono text-xs font-semibold shrink-0 select-none">
						{numMatch[1]}.
					</span>
					<span className="leading-relaxed">
						{formatInlineMarkdown(numMatch[2])}
					</span>
				</div>,
			);
			return;
		}

		// Standard line
		elements.push(
			// biome-ignore lint/suspicious/noArrayIndexKey: markdown line position
			<p key={`p-${idx}`} className="my-0.5 leading-relaxed">
				{formatInlineMarkdown(line)}
			</p>,
		);
	});

	if (inCodeBlock && codeBlockLines.length > 0) {
		elements.push(
			<StreamCodeBlock
				key="code-unfinished"
				language={codeBlockLang}
				code={codeBlockLines.join("\n")}
			/>,
		);
	}

	return elements;
}

/**
 * Hiển thị phản hồi của Assistant theo dòng (line-based stream)
 */
function StreamAssistantMessage({
	message,
	isLatest,
	isGenerating,
}: {
	message: ChatMessage;
	isLatest: boolean;
	isGenerating: boolean;
}) {
	const [copied, setCopied] = useState(false);
	const [reaction, setReaction] = useState<"up" | "down" | null>(null);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(message.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// ignore
		}
	};

	return (
		<div className="flex flex-col gap-2 font-mono text-xs">
			{/* Thought / Step indicator */}
			{isLatest && isGenerating && !message.content ? (
				<div className="flex items-center gap-2 text-primary text-xs font-mono py-1 select-none">
					<span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
					<span>Analyzing context...</span>
				</div>
			) : null}

			{/* Main text content */}
			{message.content ? (
				<div className="leading-relaxed text-foreground select-text">
					{renderMarkdownContent(message.content)}
				</div>
			) : isLatest && isGenerating ? (
				<div className="text-muted-foreground italic text-xs py-1">
					Analyzing sensor data...
				</div>
			) : (
				<span className="text-muted-foreground italic">No content</span>
			)}

			{/* Actions footer */}
			{message.content && (
				<div className="flex items-center gap-1 pt-1.5 text-muted-foreground select-none">
					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						onClick={handleCopy}
						className="text-muted-foreground hover:text-foreground"
						title={copied ? "Copied" : "Copy response"}
					>
						{copied ? (
							<IconCheck className="size-3 text-primary" />
						) : (
							<IconCopy className="size-3" />
						)}
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						onClick={() => setReaction(reaction === "up" ? null : "up")}
						className={`hover:text-foreground ${reaction === "up" ? "text-primary" : "text-muted-foreground"}`}
						title="Helpful"
					>
						<IconThumbUp className="size-3" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon-xs"
						onClick={() => setReaction(reaction === "down" ? null : "down")}
						className={`hover:text-foreground ${reaction === "down" ? "text-destructive" : "text-muted-foreground"}`}
						title="Not helpful"
					>
						<IconThumbDown className="size-3" />
					</Button>
				</div>
			)}
		</div>
	);
}

interface ChatTurn {
	id: string;
	userMessage?: ChatMessage;
	assistantMessages: ChatMessage[];
}

/**
 * Nhóm danh sách tin nhắn thành các Turn (lượt hỏi-đáp).
 * Mỗi lượt có câu hỏi người dùng được pin sticky ở đầu và phần phản hồi ở bên dưới.
 */
function groupMessagesIntoTurns(messages: ChatMessage[]): ChatTurn[] {
	const turns: ChatTurn[] = [];
	let currentTurn: ChatTurn | null = null;

	for (const msg of messages) {
		const isUser = msg.role === "user" || msg.direction === "in";
		if (isUser) {
			if (currentTurn) {
				turns.push(currentTurn);
			}
			currentTurn = {
				id: `turn-${msg.id}`,
				userMessage: msg,
				assistantMessages: [],
			};
		} else {
			if (!currentTurn) {
				currentTurn = {
					id: `turn-${msg.id}`,
					assistantMessages: [msg],
				};
			} else {
				currentTurn.assistantMessages.push(msg);
			}
		}
	}

	if (currentTurn) {
		turns.push(currentTurn);
	}

	return turns;
}

export interface AssistantMessagesProps {
	messages?: ChatMessage[];
	isGenerating?: boolean;
	emptyState?: ReactNode;
}

/**
 * Danh sách tin nhắn theo phong cách Stream/Line của Opik:
 * - Không dùng bong bóng chat (bubble) hay avatar bo tròn messenger.
 * - Mỗi câu hỏi của user là một dòng lệnh `> ` được ghim sticky (`top-0`) ở đầu mỗi lượt.
 * - Khi scroll xuống đọc câu trả lời dài, câu hỏi vẫn cố định ở mép trên để người dùng luôn nắm ngữ cảnh.
 * - Khi scroll ngược lên, các lượt trước quay trở lại mượt mà.
 */
export function AssistantMessages({
	messages: propMessages,
	isGenerating: propIsGenerating,
	emptyState,
}: AssistantMessagesProps = {}) {
	const contextValue = useOptionalAssistantContext();

	const messages = propMessages ?? contextValue?.state.messages ?? [];
	const isGenerating =
		propIsGenerating ?? contextValue?.state.isGenerating ?? false;

	const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages]);

	if (messages.length === 0) {
		return (
			<div className="flex flex-col flex-1 min-h-0 bg-background overflow-y-auto">
				{emptyState ?? null}
			</div>
		);
	}

	return (
		<div className="relative flex flex-col flex-1 min-h-0 bg-background select-text">
			<MessageScrollerProvider>
				<MessageScroller className="size-full">
					<MessageScrollerViewport className="p-0 scrollbar-thin">
						<MessageScrollerContent className="gap-0 h-max min-h-full">
							{turns.map((turn, turnIndex) => {
								const isLastTurn = turnIndex === turns.length - 1;
								return (
									<div
										key={turn.id}
										className="relative border-b border-border/30 last:border-b-0 pb-6"
									>
										{/* Pinned Sticky User Prompt Header */}
										{turn.userMessage && (
											<div className="sticky top-0 z-10 flex items-start gap-2.5 bg-muted px-3.5 py-2.5 font-mono text-xs text-foreground group transition-colors">
												<span className="text-primary font-bold select-none shrink-0 text-sm leading-none pt-0.5">
													&gt;
												</span>
												<span className="font-semibold text-foreground flex-1 break-words whitespace-pre-wrap leading-relaxed select-text">
													{turn.userMessage.content}
												</span>
												<span className="text-xs text-muted-foreground/80 shrink-0 select-none pt-0.5 opacity-70 group-hover:opacity-100 transition-opacity font-mono">
													{formatTime(
														turn.userMessage.created_at ??
															turn.userMessage.createdAt ??
															"",
													)}
												</span>
											</div>
										)}

										{/* Assistant Stream Body */}
										<div className="px-3.5 pt-3.5 flex flex-col gap-3 font-mono text-xs">
											{turn.assistantMessages.map((msg, idx) => (
												<StreamAssistantMessage
													key={msg.id}
													message={msg}
													isLatest={
														isLastTurn &&
														idx === turn.assistantMessages.length - 1
													}
													isGenerating={isGenerating}
												/>
											))}
										</div>
									</div>
								);
							})}
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton direction="end" />
				</MessageScroller>
			</MessageScrollerProvider>
		</div>
	);
}
