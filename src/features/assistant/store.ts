import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_ASSISTANT_WIDTH = 384;
export const MIN_ASSISTANT_WIDTH = 320;
export const MAX_ASSISTANT_WIDTH = 720;

export interface AssistantUIState {
	isOpen: boolean;
	width: number;
	activeThreadId: string | null;
}

export interface AssistantUIActions {
	setOpen: (open: boolean) => void;
	toggleOpen: () => void;
	setWidth: (width: number) => void;
	resetWidth: () => void;
	setActiveThreadId: (id: string | null) => void;
}

export type AssistantStore = AssistantUIState & AssistantUIActions;

export const useAssistantStore = create<AssistantStore>()(
	persist(
		(set) => ({
			isOpen: false,
			width: DEFAULT_ASSISTANT_WIDTH,
			activeThreadId: null,

			setOpen: (open) => set({ isOpen: open }),
			toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
			setWidth: (width) =>
				set({
					width: Math.min(
						Math.max(width, MIN_ASSISTANT_WIDTH),
						MAX_ASSISTANT_WIDTH,
					),
				}),
			resetWidth: () => set({ width: DEFAULT_ASSISTANT_WIDTH }),
			setActiveThreadId: (activeThreadId) => set({ activeThreadId }),
		}),
		{
			name: "annobot_assistant_ui",
			partialize: (state) => ({
				width: state.width,
			}),
		},
	),
);

// Atomic selector hooks for performance optimization
export const useAssistantIsOpen = () => useAssistantStore((s) => s.isOpen);
export const useAssistantWidth = () => useAssistantStore((s) => s.width);
export const useAssistantActiveThreadId = () =>
	useAssistantStore((s) => s.activeThreadId);
