import {
	IconAlertCircle,
	IconBell,
	IconChevronRight,
	IconInbox,
	IconSparkles,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InboxItem } from "@/features/assistant";
import { useOptionalAssistantContext } from "@/features/assistant";
import { cn } from "@/lib/utils";

function formatCaseTime(t_start?: string, t_end?: string | null): string {
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

function formatRelativeDate(t_start?: string): string {
	if (!t_start) return "";
	try {
		const date = new Date(t_start);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	} catch {
		return "";
	}
}

type TabType = "all" | "pending" | "auto_filled";

export function DashboardNotificationMenu() {
	const ctx = useOptionalAssistantContext();
	const inbox = ctx?.state.inbox;
	const pendingCount = ctx?.state.pendingCount ?? 0;
	const setOpen = ctx?.actions.setOpen;
	const selectThread = ctx?.actions.selectThread;
	const openThreadForCase = ctx?.actions.openThreadForCase;

	const [popoverOpen, setPopoverOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<TabType>("all");

	const pending = inbox?.pending ?? [];
	const autoFilled = inbox?.auto_filled ?? [];
	const totalNotifications = pending.length + autoFilled.length;

	const displayedItems = useMemo(() => {
		if (activeTab === "pending") return pending;
		if (activeTab === "auto_filled") return autoFilled;
		return [...pending, ...autoFilled];
	}, [activeTab, pending, autoFilled]);

	const handleItemClick = (item: InboxItem) => {
		setPopoverOpen(false);
		if (item.thread_id) {
			selectThread?.(item.thread_id);
			setOpen?.(true);
		} else if (item.case.id) {
			openThreadForCase?.(item.case.id, "Answer annotation inquiry");
			setOpen?.(true);
		}
	};

	return (
		<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
			<Tooltip>
				<TooltipTrigger
					render={
						<PopoverTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									size="icon-xs"
									aria-label="Notifications"
									className="relative"
								/>
							}
						/>
					}
				>
					<IconBell className="size-4 text-muted-foreground" />
					{pendingCount > 0 ? (
						<span
							aria-hidden
							className="absolute top-1 right-1 size-2 bg-destructive rounded-full"
						/>
					) : null}
				</TooltipTrigger>
				<TooltipContent side="bottom">
					Notifications {pendingCount > 0 ? `(${pendingCount} pending)` : ""}
				</TooltipContent>
			</Tooltip>

			<PopoverContent
				align="end"
				className="w-80 sm:w-96 flex flex-col gap-0 p-0 overflow-hidden"
			>
				{/* Vercel-style Top Tabs Header */}
				<div className="flex items-center justify-between border-b border-border bg-background px-3 pt-2.5 pb-2">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => setActiveTab("all")}
							className={cn(
								"relative pb-2 text-xs font-medium transition-colors hover:text-foreground flex items-center gap-1.5 focus-visible:outline-none",
								activeTab === "all"
									? "text-foreground"
									: "text-muted-foreground",
							)}
						>
							<span>Inbox</span>
							<span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono leading-none text-muted-foreground">
								{totalNotifications}
							</span>
							{activeTab === "all" ? (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
							) : null}
						</button>

						<button
							type="button"
							onClick={() => setActiveTab("pending")}
							className={cn(
								"relative pb-2 text-xs font-medium transition-colors hover:text-foreground flex items-center gap-1.5 focus-visible:outline-none",
								activeTab === "pending"
									? "text-foreground"
									: "text-muted-foreground",
							)}
						>
							<span>Awaiting reply</span>
							{pending.length > 0 ? (
								<span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-xs font-mono leading-none">
									{pending.length}
								</span>
							) : null}
							{activeTab === "pending" ? (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
							) : null}
						</button>

						{autoFilled.length > 0 ? (
							<button
								type="button"
								onClick={() => setActiveTab("auto_filled")}
								className={cn(
									"relative pb-2 text-xs font-medium transition-colors hover:text-foreground flex items-center gap-1.5 focus-visible:outline-none",
									activeTab === "auto_filled"
										? "text-foreground"
										: "text-muted-foreground",
								)}
							>
								<span>Auto-filled</span>
								<span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-mono leading-none text-muted-foreground">
									{autoFilled.length}
								</span>
								{activeTab === "auto_filled" ? (
									<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
								) : null}
							</button>
						) : null}
					</div>
				</div>

				{/* Flat, border-divided list rows (Vercel style) */}
				<ScrollArea className="max-h-96">
					{displayedItems.length === 0 ? (
						<div className="flex items-center justify-center p-6">
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<IconInbox className="size-4" />
									</EmptyMedia>
									<EmptyTitle className="text-xs font-semibold">
										No notifications
									</EmptyTitle>
									<EmptyDescription className="text-xs">
										{activeTab === "pending"
											? "No pending action items."
											: activeTab === "auto_filled"
												? "No auto-filled cases."
												: "All inquiries have been answered or resolved."}
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						</div>
					) : (
						<div className="divide-y divide-border/60">
							{displayedItems.map((item: InboxItem) => {
								const isPending =
									!item.auto_filled_from || item.auto_filled_from.length === 0;
								const duration = item.case.duration_minutes
									? `${Math.round(item.case.duration_minutes)}m`
									: null;
								const requiredCount = item.progress?.required?.length ?? 0;
								const collectedCount = Object.keys(
									item.progress?.collected ?? {},
								).length;

								return (
									<button
										key={item.thread_id ?? item.case.id}
										type="button"
										onClick={() => handleItemClick(item)}
										className="group flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									>
										{/* Left status icon badge */}
										<div
											className={cn(
												"size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
												isPending
													? "bg-primary/10 text-primary"
													: "bg-muted text-muted-foreground",
											)}
										>
											{isPending ? (
												<IconAlertCircle className="size-3.5" />
											) : (
												<IconSparkles className="size-3.5" />
											)}
										</div>

										{/* Content body */}
										<div className="flex flex-1 flex-col gap-1 min-w-0">
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-1.5 min-w-0 truncate">
													<span className="font-medium text-xs text-foreground truncate">
														{formatCaseTime(item.case.t_start, item.case.t_end)}
													</span>
													{duration ? (
														<span className="text-muted-foreground/60 font-mono text-xs shrink-0">
															({duration})
														</span>
													) : null}
												</div>

												<div className="flex items-center gap-1.5 shrink-0 text-muted-foreground font-mono text-xs">
													{isPending ? (
														<>
															<span
																aria-hidden="true"
																className="size-1.5 rounded-full bg-primary"
															/>
															<span className="sr-only">Awaiting reply</span>
														</>
													) : null}
													<span>{formatRelativeDate(item.case.t_start)}</span>
												</div>
											</div>

											<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
												{item.case.question ??
													"Information requested for this activity episode."}
											</p>

											<div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground font-mono">
												{isPending && requiredCount > 0 ? (
													<span>
														{collectedCount}/{requiredCount} fields collected
													</span>
												) : !isPending ? (
													<span>
														Auto-filled from {item.auto_filled_from.length}{" "}
														similar cases
													</span>
												) : (
													<span>Case #{item.case.id.slice(0, 8)}</span>
												)}
											</div>
										</div>

										<IconChevronRight className="size-4 text-muted-foreground/40 self-center transition-transform group-hover:translate-x-0.5 group-hover:text-foreground shrink-0" />
									</button>
								);
							})}
						</div>
					)}
				</ScrollArea>

				{/* Vercel-style clean bottom footer */}
				<div className="border-t border-border bg-muted/20 p-2 flex items-center justify-center">
					<button
						type="button"
						onClick={() => {
							setPopoverOpen(false);
							setOpen?.(true);
						}}
						className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-1 px-3 rounded-md hover:bg-muted focus-visible:outline-none"
					>
						View all in AnnoBot (Ctrl+J) →
					</button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
