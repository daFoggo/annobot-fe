import {
	IconChartBar,
	IconChecklist,
	IconChevronRight,
	IconRobot,
	IconSparkles,
	IconTargetArrow,
	IconTool,
	IconUser,
	IconWaveSine,
} from "@tabler/icons-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";
import type {
	SpanDetail,
	SpanKind,
	SpanMessage,
	SpanNode,
	SpanStat,
	SpanStatus,
} from "./types";

/** Icon theo loại span. Màu lấy từ token `--chart-*`, không dùng màu thô. */
const KIND_META: Record<
	SpanKind,
	{ icon: typeof IconWaveSine; color: string; label: string }
> = {
	group: { icon: IconRobot, color: "var(--chart-6)", label: "Agent" },
	detection: {
		icon: IconWaveSine,
		color: "var(--chart-1)",
		label: "Detection",
	},
	indicators: {
		icon: IconChartBar,
		color: "var(--chart-9)",
		label: "Indicator",
	},
	density: { icon: IconTargetArrow, color: "var(--chart-4)", label: "Density" },
	reasoning: {
		icon: IconSparkles,
		color: "var(--chart-6)",
		label: "Reasoning",
	},
	model: { icon: IconSparkles, color: "var(--chart-1)", label: "Model" },
	tool: { icon: IconTool, color: "var(--chart-5)", label: "Tool" },
	annotation: {
		icon: IconChecklist,
		color: "var(--chart-3)",
		label: "Annotation",
	},
};

const STATUS_META: Record<
	SpanStatus,
	{ label: string; variant: "secondary" | "default" | "outline" }
> = {
	done: { label: "Done", variant: "secondary" },
	active: { label: "Active", variant: "default" },
	pending: { label: "Pending", variant: "outline" },
};

export const SpanIcon = ({ kind }: { kind: SpanKind }) => {
	const meta = KIND_META[kind];
	const Icon = meta.icon;
	return (
		<span
			aria-hidden
			className="flex size-5 shrink-0 items-center justify-center rounded-md"
			style={{
				backgroundColor: `color-mix(in oklch, ${meta.color} 18%, transparent)`,
				color: meta.color,
			}}
		>
			<Icon className="size-3.5" />
		</span>
	);
};

/* ------------------------------------------------------------------ */
/* Cột trái — cây span                                                 */
/* ------------------------------------------------------------------ */

interface SpanTreeProps {
	nodes: SpanNode[];
	selectedId: string | null;
	onSelect: (spanId: string) => void;
	/** Tập id đang mở; mặc định mở hết để thấy cấu trúc ngay. */
	defaultOpenIds: string[];
}

const SpanTreeRow = ({
	node,
	depth,
	selectedId,
	onSelect,
	defaultOpenIds,
}: {
	node: SpanNode;
	depth: number;
	selectedId: string | null;
	onSelect: (spanId: string) => void;
	defaultOpenIds: string[];
}) => {
	const hasChildren = Boolean(node.children?.length);
	const selected = node.id === selectedId;

	const row = (
		<span className={cn("flex min-w-0 flex-1 items-center gap-2")}>
			<SpanIcon kind={node.kind} />
			<span className="min-w-0 flex-1 truncate text-sm">{node.title}</span>
			{node.stats && node.stats.length > 0 ? (
				<span className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
					{node.stats.map((entry) => (
						<span key={entry.label} className="font-mono tabular-nums">
							{entry.value}
						</span>
					))}
				</span>
			) : null}
		</span>
	);

	const button = (
		<button
			type="button"
			onClick={() => onSelect(node.id)}
			className={cn(
				"flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-2 text-left transition-colors hover:bg-muted",
				selected && "bg-muted",
			)}
			style={{ paddingLeft: `${depth * 16 + 8}px` }}
		>
			{row}
		</button>
	);

	if (!hasChildren) {
		return <li className="relative">{button}</li>;
	}

	return (
		<li className="relative">
			<Collapsible defaultOpen={defaultOpenIds.includes(node.id)}>
				<div className="flex items-center gap-0.5">
					<CollapsibleTrigger
						render={
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label="Mở/rút gọn nhánh"
								className="ml-0.5 shrink-0"
							/>
						}
					>
						<IconChevronRight className="transition-transform in-data-open:rotate-90" />
					</CollapsibleTrigger>
					{button}
				</div>
				<CollapsibleContent>
					<ul className="border-l border-border/60">
						{node.children?.map((child) => (
							<SpanTreeRow
								key={child.id}
								node={child}
								depth={depth + 1}
								selectedId={selectedId}
								onSelect={onSelect}
								defaultOpenIds={defaultOpenIds}
							/>
						))}
					</ul>
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
};

const SpanTree = ({
	nodes,
	selectedId,
	onSelect,
	defaultOpenIds,
}: SpanTreeProps) => (
	<nav aria-label="Span tree">
		<ul className="flex flex-col gap-0.5">
			{nodes.map((node) => (
				<SpanTreeRow
					key={node.id}
					node={node}
					depth={0}
					selectedId={selectedId}
					onSelect={onSelect}
					defaultOpenIds={defaultOpenIds}
				/>
			))}
		</ul>
	</nav>
);

/* ------------------------------------------------------------------ */
/* Cột phải — chi tiết span                                            */
/* ------------------------------------------------------------------ */

const KeyValueTable = ({ entries }: { entries: SpanStat[] }) => (
	<Table containerClassName="rounded-lg border">
		<TableBody>
			{entries.map((entry) => (
				<TableRow key={entry.label} className="hover:bg-transparent">
					<TableCell className="w-1/3 align-top font-mono text-xs text-muted-foreground">
						{entry.label}
					</TableCell>
					<TableCell className="font-mono text-xs break-all whitespace-normal">
						{entry.value}
					</TableCell>
				</TableRow>
			))}
		</TableBody>
	</Table>
);

const MESSAGE_META: Record<
	SpanMessage["role"],
	{ icon: typeof IconUser; label: string }
> = {
	human: { icon: IconUser, label: "Human" },
	ai: { icon: IconRobot, label: "AI" },
	tool: { icon: IconTool, label: "Tool" },
};

const MessageRow = ({ message }: { message: SpanMessage }) => {
	const meta = MESSAGE_META[message.role];
	const Icon = meta.icon;
	return (
		<TableRow>
			<TableCell className="w-24 align-middle">
				<Badge variant="outline" className="gap-1.5">
					<Icon data-icon="inline-start" />
					{meta.label}
				</Badge>
			</TableCell>
			<TableCell className="text-xs whitespace-normal">
				{message.role === "tool" ? (
					<span className="font-mono text-muted-foreground">
						{message.toolName}
					</span>
				) : (
					message.text
				)}
			</TableCell>
		</TableRow>
	);
};

/** Render `**bold**` mà không cần thư viện markdown. */
const CollapsibleSection = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<Collapsible defaultOpen>
		<CollapsibleTrigger
			render={
				<Button
					variant="ghost"
					size="sm"
					className="w-full justify-start px-0 font-medium text-foreground"
				/>
			}
		>
			<IconChevronRight className="transition-transform in-data-open:rotate-90" />
			{title}
		</CollapsibleTrigger>
		<CollapsibleContent className="pt-2">{children}</CollapsibleContent>
	</Collapsible>
);

const SpanDetailView = ({ detail }: { detail: SpanDetail }) => {
	const meta = STATUS_META[detail.status];

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					<SpanIcon kind={detail.kind} />
					<span className="truncate font-mono text-sm font-medium">
						{detail.title}
					</span>
				</div>
				<Badge variant={meta.variant}>{meta.label}</Badge>
			</div>

			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
				{detail.startedAt ? <span>{detail.startedAt}</span> : null}
				{detail.duration ? (
					<span className="font-mono tabular-nums">{detail.duration}</span>
				) : null}
				{detail.cost ? (
					<span className="font-mono tabular-nums">{detail.cost}</span>
				) : null}
			</div>

			{detail.tags && detail.tags.length > 0 ? (
				<div className="flex flex-wrap items-center gap-1.5">
					{detail.tags.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</div>
			) : null}

			<Tabs defaultValue="messages">
				<TabsList>
					<TabsTrigger value="messages">Messages</TabsTrigger>
					<TabsTrigger value="details">Details</TabsTrigger>
				</TabsList>

				<TabsContent value="messages" className="flex flex-col gap-3 pt-3">
					{detail.messages && detail.messages.length > 0 ? (
						<CollapsibleSection title="LLM messages">
							<Table containerClassName="rounded-lg border">
								<TableHeader>
									<TableRow>
										<TableHead>Vai trò</TableHead>
										<TableHead>Nội dung</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{detail.messages.map((message) => (
										<MessageRow key={message.id} message={message} />
									))}
								</TableBody>
							</Table>
						</CollapsibleSection>
					) : (
						<p className="text-xs text-muted-foreground">
							Span này không có message.
						</p>
					)}
				</TabsContent>

				<TabsContent value="details" className="flex flex-col gap-4 pt-3">
					{detail.input ? (
						<CollapsibleSection title="Input">
							<div className="rounded-lg border bg-muted/40 p-3">
								<p className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
									{detail.input}
								</p>
							</div>
						</CollapsibleSection>
					) : null}

					{detail.output ? (
						<CollapsibleSection title="Output">
							<div className="rounded-lg border p-3">
								<RichText text={detail.output} />
							</div>
						</CollapsibleSection>
					) : null}

					{detail.metadata && detail.metadata.length > 0 ? (
						<CollapsibleSection title="Metadata">
							<KeyValueTable entries={detail.metadata} />
						</CollapsibleSection>
					) : null}

					{detail.tokenUsage && detail.tokenUsage.length > 0 ? (
						<CollapsibleSection title="Token usage">
							<KeyValueTable entries={detail.tokenUsage} />
						</CollapsibleSection>
					) : null}
				</TabsContent>
			</Tabs>
		</div>
	);
};

/* ------------------------------------------------------------------ */
/* Master–detail                                                       */
/* ------------------------------------------------------------------ */

/** Chọn span gốc đầu tiên — giống Opik mở sẵn span agent ngoài cùng. */
const firstSpanId = (nodes: SpanNode[]): string | null => nodes[0]?.id ?? null;

const collectIds = (nodes: SpanNode[]): string[] =>
	nodes.flatMap((node) => [node.id, ...collectIds(node.children ?? [])]);

export interface CaseSpanInspectorProps {
	nodes: SpanNode[];
	details: Record<string, SpanDetail>;
}

/**
 * Span inspector kiểu Opik: cây span bên trái, chi tiết span đang chọn bên
 * phải. Dữ liệu span lấy từ Opik (đã instrument `chat_agent`) — xem
 * `docs/design-system/opik-ui-reference.md` mục 7.
 */
export const CaseSpanInspector = ({
	nodes,
	details,
}: CaseSpanInspectorProps) => {
	const [selectedId, setSelectedId] = React.useState<string | null>(() =>
		firstSpanId(nodes),
	);

	const detail = selectedId ? details[selectedId] : undefined;
	const openIds = React.useMemo(() => collectIds(nodes), [nodes]);

	return (
		<div className="flex h-full min-h-0 flex-col divide-y">
			<ScrollArea className="h-52 shrink-0">
				<div className="p-2">
					<div className="flex items-center justify-between px-1 pb-1.5">
						<span className="text-xs font-medium text-muted-foreground">
							Spans ({collectIds(nodes).length})
						</span>
					</div>
					<SpanTree
						nodes={nodes}
						selectedId={selectedId}
						onSelect={setSelectedId}
						defaultOpenIds={openIds}
					/>
				</div>
			</ScrollArea>

			<ScrollArea className="min-h-0 flex-1">
				{detail ? (
					<SpanDetailView detail={detail} />
				) : (
					<div className="flex h-full items-center justify-center p-6">
						<p className="text-xs text-muted-foreground">
							Chọn một span để xem chi tiết.
						</p>
					</div>
				)}
			</ScrollArea>
		</div>
	);
};

/**
 * Giữ export cũ cho tương thích: cây span đơn giản (không có pane chi tiết).
 * Dùng khi chỉ muốn liệt kê nhánh mà không cần inspector.
 */
export const CaseTraceTree = ({ nodes }: { nodes: SpanNode[] }) => {
	const openIds = React.useMemo(() => collectIds(nodes), [nodes]);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	return (
		<>
			<Separator className="my-2" />
			<SpanTree
				nodes={nodes}
				selectedId={selectedId}
				onSelect={setSelectedId}
				defaultOpenIds={openIds}
			/>
		</>
	);
};
