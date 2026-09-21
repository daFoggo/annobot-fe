import type { PropsWithChildren } from "react";
import { createContext, use, useMemo, useState } from "react";

export interface MainScrollContainerState {
	container: HTMLElement | null;
}

export interface MainScrollContainerActions {
	setContainer: (container: HTMLElement | null) => void;
}

export interface MainScrollContainerContextValue {
	state: MainScrollContainerState;
	actions: MainScrollContainerActions;
}

const MainScrollContainerContext =
	createContext<MainScrollContainerContextValue | null>(null);

/**
 * Truy cập vùng cuộn chính của dashboard (`state.container`) và setter của nó.
 * Interface `{ state, actions }` để UI không phụ thuộc cách state được quản lý.
 */
export const useMainScrollContainer = () => {
	const value = use(MainScrollContainerContext);
	if (!value) {
		throw new Error(
			"useMainScrollContainer must be used within MainScrollContainerProvider",
		);
	}
	return value;
};

export const MainScrollContainerProvider = ({
	children,
}: PropsWithChildren) => {
	const [container, setContainer] = useState<HTMLElement | null>(null);
	const value = useMemo<MainScrollContainerContextValue>(
		() => ({ state: { container }, actions: { setContainer } }),
		[container],
	);

	return (
		<MainScrollContainerContext value={value}>
			{children}
		</MainScrollContainerContext>
	);
};
