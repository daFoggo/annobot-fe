import {
	IconCheck,
	IconChevronsRight,
	IconClock,
	IconPlus,
	IconSparkles,
	IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOptionalAssistantContext } from "../context";
import type { AssistantExperimentContext } from "../schemas";
import {
	useAssistantActiveConversation,
	useAssistantActiveConversationId,
	useAssistantConversations,
	useAssistantStore,
} from "../store";

export interface AssistantHeaderProps {
	context?: AssistantExperimentContext;
}

export function AssistantHeader({
	context: propContext,
}: AssistantHeaderProps = {}) {
	const ctx = useOptionalAssistantContext();
	const storeSetOpen = useAssistantStore((s) => s.setOpen);
	const storeNewChat = useAssistantStore((s) => s.newChat);
	const storeSelectConv = useAssistantStore((s) => s.selectConversation);
	const storeDeleteConv = useAssistantStore((s) => s.deleteConversation);
	const storeConversations = useAssistantConversations();
	const storeActiveConvId = useAssistantActiveConversationId();
	const storeActiveConv = useAssistantActiveConversation();

	const setOpen = ctx?.actions.setOpen ?? storeSetOpen;
	const newChat = ctx?.actions.newChat ?? storeNewChat;
	const selectConversation = ctx?.actions.selectConversation ?? storeSelectConv;
	const deleteConversation = ctx?.actions.deleteConversation ?? storeDeleteConv;
	const conversations = ctx?.state.conversations ?? storeConversations;
	const activeConvId = ctx?.state.activeConversationId ?? storeActiveConvId;
	const activeConv = ctx?.state.activeConversation ?? storeActiveConv;
	const context = propContext ?? ctx?.state.context;

	const handleNewChat = () => {
		newChat(context?.experimentId);
	};

	return (
		<header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-3 bg-background/80 backdrop-blur-xs select-none">
			{/* Left brand & context */}
			<div className="flex min-w-0 flex-1 items-center gap-2">
				<IconSparkles className="size-4 shrink-0 text-primary" />
				<div className="flex min-w-0 flex-col">
					<span className="truncate font-mono text-sm font-semibold leading-tight tracking-tight text-foreground">
						AnnoBot
					</span>
					<span
						className="truncate font-mono text-xs leading-tight text-muted-foreground"
						title={context?.title ?? activeConv?.title ?? "New chat"}
					>
						{context?.title ?? activeConv?.title ?? "New chat"}
					</span>
				</div>
			</div>

			{/* Right actions */}
			<div className="flex shrink-0 items-center gap-1">
				{/* History dropdown */}
				<DropdownMenu>
					<Tooltip>
						<TooltipTrigger
							render={
								<DropdownMenuTrigger
									render={
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											aria-label="Conversation history"
										/>
									}
								/>
							}
						>
							<IconClock className="size-4 text-muted-foreground" />
						</TooltipTrigger>
						<TooltipContent side="bottom">History</TooltipContent>
					</Tooltip>

					<DropdownMenuContent align="end" className="w-64">
						<DropdownMenuGroup>
							<DropdownMenuLabel className="font-semibold">
								Recent Conversations
							</DropdownMenuLabel>
							<DropdownMenuSeparator />

							{conversations.length === 0 ? (
								<div className="p-2 text-center text-xs text-muted-foreground">
									No history yet
								</div>
							) : (
								conversations.map((conv) => {
									const isActive = conv.id === activeConvId;
									return (
										<div
											key={conv.id}
											className="group flex items-center justify-between px-1 py-0.5 rounded-sm hover:bg-muted"
										>
											<DropdownMenuItem
												className="flex-1 truncate text-xs cursor-pointer"
												onClick={() => selectConversation(conv.id)}
											>
												{isActive ? (
													<IconCheck className="size-3 text-primary shrink-0 mr-1.5" />
												) : null}
												<span className="truncate">{conv.title}</span>
											</DropdownMenuItem>

											{conversations.length > 1 ? (
												<Button
													type="button"
													variant="ghost"
													size="icon-xs"
													className="opacity-0 group-hover:opacity-100 hover:text-destructive size-5 p-0"
													onClick={(e) => {
														e.stopPropagation();
														deleteConversation(conv.id);
													}}
													title="Delete conversation"
												>
													<IconTrash className="size-3" />
												</Button>
											) : null}
										</div>
									);
								})
							)}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* New Chat button */}
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								onClick={handleNewChat}
								aria-label="New chat"
							/>
						}
					>
						<IconPlus className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
					</TooltipTrigger>
					<TooltipContent side="bottom">New chat</TooltipContent>
				</Tooltip>

				{/* Separator */}
				<Separator
					orientation="vertical"
					className="mx-1 h-4 my-auto self-center data-vertical:h-4 data-vertical:self-center"
				/>

				{/* Collapse button (Opik >> style) */}
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
					<TooltipContent side="bottom">
						Collapse <span className="opacity-60">(Ctrl+J)</span>
					</TooltipContent>
				</Tooltip>
			</div>
		</header>
	);
}
