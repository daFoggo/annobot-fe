import * as React from "react";
import type { CopilotCase } from "./types";

interface CaseCopilotContextValue {
	queue: CopilotCase[];
	activeId: string | null;
	activeIndex: number;
	active: CopilotCase | null;
	select: (caseId: string) => void;
	next: () => void;
	previous: () => void;
	close: () => void;
	canNext: boolean;
	canPrevious: boolean;
}

const CaseCopilotContext = React.createContext<CaseCopilotContextValue | null>(
	null,
);

export const useCaseCopilot = () => {
	const context = React.use(CaseCopilotContext);
	if (context === null) {
		throw new Error("useCaseCopilot must be used within CaseCopilotProvider");
	}
	return context;
};

interface CaseCopilotProviderProps {
	queue: CopilotCase[];
	/** Case đang mở; `null` là copilot đóng. Controlled để URL giữ nguồn sự thật. */
	activeId: string | null;
	onActiveChange: (caseId: string | null) => void;
	children: React.ReactNode;
}

/**
 * State của copilot panel được lift lên provider để header (điều hướng hàng
 * đợi), chat pane và trace pane cùng đọc chung một case đang mở. `activeId`
 * do route sở hữu (search param `?case=`) nên deep-link và click hàng đều khớp.
 */
export const CaseCopilotProvider = ({
	queue,
	activeId,
	onActiveChange,
	children,
}: CaseCopilotProviderProps) => {
	const activeIndex = queue.findIndex((entry) => entry.item.id === activeId);
	const active = activeIndex >= 0 ? queue[activeIndex] : null;

	const select = React.useCallback(
		(caseId: string) => onActiveChange(caseId),
		[onActiveChange],
	);

	const next = React.useCallback(() => {
		const index = queue.findIndex((entry) => entry.item.id === activeId);
		if (index < 0 || index >= queue.length - 1) return;
		onActiveChange(queue[index + 1].item.id);
	}, [queue, activeId, onActiveChange]);

	const previous = React.useCallback(() => {
		const index = queue.findIndex((entry) => entry.item.id === activeId);
		if (index <= 0) return;
		onActiveChange(queue[index - 1].item.id);
	}, [queue, activeId, onActiveChange]);

	const close = React.useCallback(() => onActiveChange(null), [onActiveChange]);

	const value = React.useMemo<CaseCopilotContextValue>(
		() => ({
			queue,
			activeId,
			activeIndex,
			active,
			select,
			next,
			previous,
			close,
			canNext: activeIndex >= 0 && activeIndex < queue.length - 1,
			canPrevious: activeIndex > 0,
		}),
		[queue, activeId, activeIndex, active, select, next, previous, close],
	);

	return <CaseCopilotContext value={value}>{children}</CaseCopilotContext>;
};
