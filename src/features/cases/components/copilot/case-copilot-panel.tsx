import {
	IconChevronLeft,
	IconChevronRight,
	IconClock,
	IconListCheck,
	IconMessageCircle,
	IconRobot,
	IconWaveSine,
} from "@tabler/icons-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CaseStatusBadge } from "../case-status-badge";
import { CaseChatPane } from "./case-chat-pane";
import { useCaseCopilot } from "./case-copilot-context";
import { CaseSpanInspector } from "./case-trace-tree";

const isDone = (status: string) =>
	status === "complete" || status === "annotated" || status === "answered";

const QueueNav = () => {
	const { activeIndex, queue, next, previous, canNext, canPrevious } =
		useCaseCopilot();

	return (
		<div className="flex shrink-0 items-center gap-1">
			<Button
				variant="outline"
				size="icon-xs"
				aria-label="Case trước"
				disabled={!canPrevious}
				onClick={previous}
			>
				<IconChevronLeft />
			</Button>
			<Badge variant="secondary" className="font-mono tabular-nums">
				{queue.length === 0 ? 0 : activeIndex + 1} / {queue.length}
			</Badge>
			<Button
				variant="outline"
				size="icon-xs"
				aria-label="Case kế tiếp"
				disabled={!canNext}
				onClick={next}
			>
				<IconChevronRight />
			</Button>
		</div>
	);
};

const SessionMenu = () => {
	const { queue, active, select } = useCaseCopilot();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon-xs" aria-label="Lịch sử case" />
				}
			>
				<IconClock />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-56">
				<DropdownMenuLabel>Hàng đợi hôm nay</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{queue.length === 0 ? (
					<DropdownMenuItem disabled>Không có case nào</DropdownMenuItem>
				) : (
					queue.map((entry) => (
						<DropdownMenuItem
							key={entry.item.id}
							onClick={() => select(entry.item.id)}
						>
							<span className="flex min-w-0 flex-1 items-center gap-2">
								<span className="truncate">{entry.device}</span>
								{entry.item.id === active?.item.id ? (
									<Badge variant="secondary" className="ms-auto">
										Đang mở
									</Badge>
								) : null}
							</span>
						</DropdownMenuItem>
					))
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const CaseCopilotHeader = () => {
	const { active, close } = useCaseCopilot();

	return (
		<header className="flex items-center justify-between gap-2 px-3 py-2.5">
			<div className="flex min-w-0 items-center gap-2">
				<span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
					<IconRobot className="size-4" />
				</span>
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-sm font-medium">
						Annotation copilot
					</span>
					<span className="truncate text-xs text-muted-foreground">
						{active ? active.device : "Chưa chọn case"}
					</span>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-0.5">
				<QueueNav />
				<SessionMenu />
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label="Đóng copilot"
					onClick={close}
				>
					<IconChevronRight />
				</Button>
			</div>
		</header>
	);
};

/**
 * Trạng thái thu gọn: dải dọc mảnh, vẫn giữ nút mở + tên panel xoay 90°
 * (lấy ý từ rail của Ollie trong Opik).
 */
export const CaseCopilotRail = ({ onOpen }: { onOpen: () => void }) => (
	<aside className="flex h-full w-10 flex-col items-center gap-2 border-l bg-background py-2">
		<Button
			variant="ghost"
			size="icon-xs"
			aria-label="Mở copilot"
			onClick={onOpen}
		>
			<IconChevronLeft />
		</Button>
		<span className="flex flex-1 items-center justify-center">
			<span className="rotate-180 font-mono text-xs tracking-wide text-muted-foreground [writing-mode:vertical-rl]">
				Annotation copilot
			</span>
		</span>
	</aside>
);

/** Đếm ngược rồi tự sang case kế — "Queue Autopilot". */
const AutopilotBanner = () => {
	const { active, next, canNext } = useCaseCopilot();
	const activeCaseId = active?.item.id ?? null;
	const [seconds, setSeconds] = React.useState(3);

	React.useEffect(() => {
		setSeconds(3);
		if (!activeCaseId || !canNext) return;
		const timer = window.setInterval(() => {
			setSeconds((current) => {
				if (current <= 1) {
					window.clearInterval(timer);
					next();
					return 0;
				}
				return current - 1;
			});
		}, 1000);
		return () => window.clearInterval(timer);
	}, [activeCaseId, canNext, next]);

	if (!active || !canNext) return null;

	return (
		<div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-2 text-xs">
			<span className="text-muted-foreground">
				Đã gán nhãn xong · chuyển case kế sau{" "}
				<span className="font-mono tabular-nums text-foreground">
					{seconds}s
				</span>
			</span>
			<Button variant="ghost" size="xs" onClick={next}>
				Đi ngay
			</Button>
		</div>
	);
};

export const CaseCopilotPanel = ({ className }: { className?: string }) => {
	const { active } = useCaseCopilot();
	const done = active ? isDone(active.item.status) : false;

	return (
		<aside
			className={cn(
				"flex h-full min-h-0 flex-col overflow-hidden bg-background",
				className,
			)}
		>
			<CaseCopilotHeader />
			<Separator />
			{active ? (
				<>
					{done ? <AutopilotBanner /> : null}
					<Tabs defaultValue="chat" className="min-h-0 flex-1">
						<div className="flex items-center justify-between gap-2 px-3 pt-3">
							<TabsList>
								<TabsTrigger value="chat">
									<IconMessageCircle data-icon="inline-start" />
									Chat
								</TabsTrigger>
								<TabsTrigger value="trace">
									<IconListCheck data-icon="inline-start" />
									Trace
								</TabsTrigger>
							</TabsList>
							<CaseStatusBadge status={active.item.status} />
						</div>
						<TabsContent value="chat" className="flex min-h-0 flex-col">
							<CaseChatPane
								key={active.item.id}
								device={active.device}
								initialTurns={active.turns}
								done={done}
							/>
						</TabsContent>
						<TabsContent value="trace" className="min-h-0">
							<CaseSpanInspector
								key={active.item.id}
								nodes={active.trace}
								details={active.spanDetails}
							/>
						</TabsContent>
					</Tabs>
				</>
			) : (
				<Empty className="flex-1">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<IconWaveSine />
						</EmptyMedia>
						<EmptyTitle>Chưa chọn case</EmptyTitle>
						<EmptyDescription>
							Chọn một case trong danh sách để bắt đầu gán nhãn.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</aside>
	);
};
