import {
	IconChevronLeft,
	IconChevronRight,
	IconInbox,
	IconSparkles,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { useOptionalAssistantContext } from "../context";
import type { InboxItem } from "../schemas";
import { formatCaseStatus, formatCaseTime } from "./assistant-context-bar";

type FilterTab = "all" | "pending" | "auto_filled";

const PAGE_SIZE = 5;

export function AssistantInbox() {
	const ctx = useOptionalAssistantContext();
	const inbox = ctx?.state.inbox;
	const selectThread = ctx?.actions.selectThread;
	const openThreadForCase = ctx?.actions.openThreadForCase;

	const [activeTab, setActiveTab] = useState<FilterTab>("all");
	const [page, setPage] = useState(1);

	const pending = inbox?.pending ?? [];
	const autoFilled = inbox?.auto_filled ?? [];

	const filteredItems: (InboxItem & { type: "pending" | "auto_filled" })[] =
		useMemo(() => {
			const pendingTagged = pending.map((item) => ({
				...item,
				type: "pending" as const,
			}));
			const autoFilledTagged = autoFilled.map((item) => ({
				...item,
				type: "auto_filled" as const,
			}));

			if (activeTab === "pending") return pendingTagged;
			if (activeTab === "auto_filled") return autoFilledTagged;
			return [...pendingTagged, ...autoFilledTagged];
		}, [pending, autoFilled, activeTab]);

	const totalItems = filteredItems.length;
	const totalPages = Math.max(Math.ceil(totalItems / PAGE_SIZE), 1);
	const currentPage = Math.min(Math.max(page, 1), totalPages);

	const paginatedItems = useMemo(() => {
		const start = (currentPage - 1) * PAGE_SIZE;
		return filteredItems.slice(start, start + PAGE_SIZE);
	}, [filteredItems, currentPage]);

	const handleTabChange = (tab: FilterTab) => {
		setActiveTab(tab);
		setPage(1);
	};

	const handleItemClick = (
		item: InboxItem & { type: "pending" | "auto_filled" },
	) => {
		if (item.type === "pending" && item.thread_id) {
			selectThread?.(item.thread_id);
		} else {
			openThreadForCase?.(
				item.case.id,
				item.type === "auto_filled"
					? "Review auto-filled annotation"
					: "Clarify annotation details",
			);
		}
	};

	if (pending.length === 0 && autoFilled.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center p-6 text-center">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<IconInbox className="size-5" />
						</EmptyMedia>
						<EmptyTitle className="text-sm font-semibold">
							Inbox is empty
						</EmptyTitle>
						<EmptyDescription className="text-xs text-muted-foreground">
							All annotation questions have been answered or auto-filled.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Filter Tabs Header */}
			<div className="shrink-0 border-b border-border bg-muted/20 px-3 py-2">
				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant={activeTab === "all" ? "secondary" : "ghost"}
						size="xs"
						onClick={() => handleTabChange("all")}
						className="gap-1 font-mono text-xs"
					>
						<span>All</span>
						<span className="text-muted-foreground">
							({pending.length + autoFilled.length})
						</span>
					</Button>

					<Button
						type="button"
						variant={activeTab === "pending" ? "secondary" : "ghost"}
						size="xs"
						onClick={() => handleTabChange("pending")}
						className="gap-1 font-mono text-xs"
					>
						<span>Awaiting reply</span>
						{pending.length > 0 ? (
							<Badge variant="default">{pending.length}</Badge>
						) : (
							<span className="text-muted-foreground">(0)</span>
						)}
					</Button>

					<Button
						type="button"
						variant={activeTab === "auto_filled" ? "secondary" : "ghost"}
						size="xs"
						onClick={() => handleTabChange("auto_filled")}
						className="gap-1 font-mono text-xs"
					>
						<span>Auto-filled</span>
						<span className="text-muted-foreground">({autoFilled.length})</span>
					</Button>
				</div>
			</div>

			{/* List Items */}
			<div className="flex-1 overflow-y-auto divide-y divide-border/60">
				{paginatedItems.length === 0 ? (
					<div className="p-6 text-center text-xs text-muted-foreground">
						No items in this category.
					</div>
				) : (
					paginatedItems.map((item) => {
						const isPending = item.type === "pending";
						const duration = item.case.duration_minutes
							? `${Math.round(item.case.duration_minutes)}m`
							: null;
						const requiredFields = item.progress?.required ?? [];
						const missingFields = item.progress?.missing ?? [];
						const collected = item.progress?.collected ?? {};
						const requiredCount = requiredFields.length;
						const answeredRequiredCount = requiredFields.filter(
							(field) =>
								!missingFields.includes(field) &&
								field in collected &&
								Boolean(collected[field]),
						).length;

						const peakPower =
							typeof item.case.evidence?.peak_w === "number"
								? `${Math.round(item.case.evidence.peak_w)}W peak`
								: typeof item.case.evidence?.peak_power_w === "number"
									? `${Math.round(item.case.evidence.peak_power_w)}W peak`
									: null;

						const detectionLabel = item.case.detection_key
							? item.case.detection_key
									.replace(/_/g, " ")
									.replace(/\b\w/g, (c) => c.toUpperCase())
							: "Observed Event";

						const proposedEntries = Object.entries(item.proposed ?? {});
						const statusInfo = formatCaseStatus(
							item.case.status ?? (isPending ? "asked" : "auto_filled"),
						);

						return (
							<button
								key={item.thread_id ?? item.case.id}
								type="button"
								onClick={() => handleItemClick(item)}
								className="group flex w-full flex-col gap-1.5 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								{/* Header row: Status + Detection/Peak + Chevron */}
								<div className="flex items-center gap-2">
									<Badge
										variant={statusInfo.variant}
										className="font-mono text-xs shrink-0"
									>
										{statusInfo.label}
									</Badge>

									<span className="font-mono text-xs font-semibold text-foreground truncate">
										{detectionLabel}
										{peakPower ? ` · ${peakPower}` : ""}
									</span>

									<IconChevronRight className="size-4 ml-auto text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground shrink-0" />
								</div>

								{/* Subtitle row: Time + Duration */}
								<div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
									<span>
										{formatCaseTime(item.case.t_start, item.case.t_end)}
									</span>
									{duration ? (
										<span className="text-muted-foreground/80">
											({duration})
										</span>
									) : null}
								</div>

								{/* Question or Proposed label row */}
								{isPending ? (
									<p className="line-clamp-1 text-xs text-foreground/80">
										{item.case.question ??
											"Information requested for this activity episode."}
									</p>
								) : proposedEntries.length > 0 ? (
									<div className="flex flex-wrap items-center gap-1 text-xs">
										<span className="text-muted-foreground">Proposed:</span>
										{proposedEntries.map(([field, value]) => (
											<Badge
												key={field}
												variant="outline"
												className="font-mono text-[10px]"
											>
												{field}={String(value)}
											</Badge>
										))}
									</div>
								) : (
									<p className="text-xs text-muted-foreground">
										Label proposed from similar historical cases.
									</p>
								)}

								{/* Footer row: Accurate fields count or auto-fill info */}
								<div className="flex items-center justify-between text-xs font-mono text-muted-foreground pt-0.5 border-t border-border/30">
									{isPending && requiredCount > 0 ? (
										<span
											className={
												answeredRequiredCount === 0
													? "text-foreground font-medium"
													: ""
											}
										>
											{answeredRequiredCount === 0
												? `${requiredCount} required field${requiredCount > 1 ? "s" : ""} needed`
												: `${answeredRequiredCount}/${requiredCount} completed`}
										</span>
									) : !isPending ? (
										<span className="flex items-center gap-1">
											<IconSparkles className="size-3 text-primary" />
											<span>
												from {item.auto_filled_from.length} similar cases
											</span>
										</span>
									) : (
										<span>Case #{item.case.id.slice(0, 8)}</span>
									)}
								</div>
							</button>
						);
					})
				)}
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 ? (
				<div className="shrink-0 flex items-center justify-between border-t border-border bg-background px-3 py-2 text-xs font-mono select-none">
					<span className="text-muted-foreground">
						Page {currentPage} of {totalPages} ({totalItems} items)
					</span>

					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="outline"
							size="xs"
							disabled={currentPage <= 1}
							onClick={() => setPage((p) => Math.max(p - 1, 1))}
							className="gap-1 font-mono text-xs"
						>
							<IconChevronLeft className="size-3" />
							<span>Prev</span>
						</Button>

						<Button
							type="button"
							variant="outline"
							size="xs"
							disabled={currentPage >= totalPages}
							onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
							className="gap-1 font-mono text-xs"
						>
							<span>Next</span>
							<IconChevronRight className="size-3" />
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
