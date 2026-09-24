import type React from "react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { AssistantProvider, useAssistantContext } from "../context";
import type { AssistantExperimentContext } from "../schemas";
import { AssistantCollapsedTrigger } from "./assistant-collapsed-trigger";
import { AssistantHeader } from "./assistant-header";
import { AssistantInput } from "./assistant-input";
import { AssistantMessages } from "./assistant-messages";
import { AssistantWelcome } from "./assistant-welcome";

export interface AssistantRootProps {
	children?: React.ReactNode;
	className?: string;
}

/**
 * Khung hiển thị của Assistant (Frame/Root container).
 * Hỗ trợ kéo thả thay đổi kích thước (desktop) và hiển thị thu gọn (collapsed strip).
 */
export function AssistantRoot({ children, className }: AssistantRootProps) {
	const ctx = useAssistantContext();
	const { isOpen, width } = ctx.state;
	const { isHydrated, isMobile } = ctx.meta;
	const { setWidth, resetWidth } = ctx.actions;

	const handleMouseDownResize = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			const startX = e.clientX;
			const startWidth = width;

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const deltaX = startX - moveEvent.clientX;
				setWidth(startWidth + deltaX);
			};

			const handleMouseUp = () => {
				window.removeEventListener("mousemove", handleMouseMove);
				window.removeEventListener("mouseup", handleMouseUp);
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
			};

			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
			window.addEventListener("mousemove", handleMouseMove);
			window.addEventListener("mouseup", handleMouseUp);
		},
		[width, setWidth],
	);

	if (!isHydrated) {
		return null;
	}

	if (!isOpen) {
		return <AssistantCollapsedTrigger />;
	}

	return (
		<aside
			aria-label="AnnoBot Assistant"
			style={{
				width: isMobile ? undefined : `${width}px`,
			}}
			className={cn(
				"relative flex flex-col border-l border-border bg-background select-text h-full z-20",
				isMobile
					? "fixed inset-y-0 right-0 z-40 w-full sm:w-96 shadow-2xl"
					: "shrink-0",
				className,
			)}
		>
			{!isMobile && (
				<button
					type="button"
					aria-label="Resize assistant sidebar"
					onMouseDown={handleMouseDownResize}
					onDoubleClick={resetWidth}
					onKeyDown={(e) => {
						if (e.key === "Enter") resetWidth();
					}}
					title="Drag to resize, double-click to reset"
					className="group/resize absolute inset-y-0 -left-1 w-2 cursor-col-resize z-30 flex items-center justify-center focus-visible:outline-hidden p-0 border-0 bg-transparent"
				>
					<div className="h-8 w-1 rounded-full bg-border opacity-0 group-hover/resize:opacity-100 transition-opacity" />
				</button>
			)}
			{children}
		</aside>
	);
}

export interface AssistantPanelProps {
	context?: AssistantExperimentContext;
	children?: React.ReactNode;
	className?: string;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

/**
 * Drop-in component tiện lợi tự động ghép nối Provider + Root + Subcomponents.
 */
export function AssistantPanel({
	context,
	children,
	className,
	open,
	defaultOpen,
	onOpenChange,
}: AssistantPanelProps = {}) {
	return (
		<AssistantProvider
			context={context}
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={onOpenChange}
		>
			<AssistantRoot className={className}>
				{children ?? (
					<>
						<AssistantHeader />
						<AssistantMessages emptyState={<AssistantWelcome />} />
						<AssistantInput />
					</>
				)}
			</AssistantRoot>
		</AssistantProvider>
	);
}
