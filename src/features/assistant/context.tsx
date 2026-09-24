import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { experimentDetailQueryOptions } from "@/features/experiments";
import { useHydrated } from "@/hooks/use-hydrated";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
	AssistantExperimentContext,
	ChatConversation,
	ChatMessage,
} from "./schemas";
import {
	DEFAULT_ASSISTANT_WIDTH,
	useAssistantActiveConversation,
	useAssistantActiveConversationId,
	useAssistantConversations,
	useAssistantIsGenerating,
	useAssistantIsOpen,
	useAssistantStore,
	useAssistantWidth,
} from "./store";

export interface AssistantState {
	isOpen: boolean;
	width: number;
	conversations: ChatConversation[];
	activeConversationId: string;
	activeConversation?: ChatConversation;
	messages: ChatMessage[];
	isGenerating: boolean;
	context?: AssistantExperimentContext;
	inputValue: string;
}

export interface AssistantActions {
	setOpen: (open: boolean) => void;
	toggleOpen: () => void;
	setWidth: (width: number) => void;
	resetWidth: () => void;
	newChat: (experimentId?: string) => string;
	selectConversation: (id: string) => void;
	deleteConversation: (id: string) => void;
	clearActiveChat: () => void;
	setInputValue: (val: string) => void;
	submitInput: () => void;
	sendMessage: (
		content: string,
		context?: AssistantExperimentContext,
	) => Promise<void>;
	stopGenerating: () => void;
	selectPrompt: (prompt: string) => void;
}

export interface AssistantMeta {
	isHydrated: boolean;
	isMobile: boolean;
	inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export interface AssistantContextValue {
	state: AssistantState;
	actions: AssistantActions;
	meta: AssistantMeta;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export interface AssistantProviderProps {
	children: React.ReactNode;
	context?: AssistantExperimentContext;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

/**
 * Provider cho Assistant compound component theo chuẩn Vercel Composition Patterns.
 * Tách biệt State, Actions và Meta để cho phép Dependency Injection và kiểm thử dễ dàng.
 * Hỗ trợ controlled prop `open`, `defaultOpen`, và tự động mở khi ở trang experiment detail, thu gọn khi ở ngoài.
 */
export function AssistantProvider({
	children,
	context: customContext,
	open: propOpen,
	defaultOpen,
	onOpenChange,
}: AssistantProviderProps) {
	const isHydrated = useHydrated();
	const isMobile = useIsMobile();

	const storeIsOpen = useAssistantIsOpen();
	const storeSetOpen = useAssistantStore((s) => s.setOpen);
	const width = useAssistantWidth();
	const isGenerating = useAssistantIsGenerating();
	const conversations = useAssistantConversations();
	const activeConvId = useAssistantActiveConversationId();
	const activeConv = useAssistantActiveConversation();

	const setWidth = useAssistantStore((s) => s.setWidth);
	const newChat = useAssistantStore((s) => s.newChat);
	const selectConversation = useAssistantStore((s) => s.selectConversation);
	const deleteConversation = useAssistantStore((s) => s.deleteConversation);
	const clearActiveChat = useAssistantStore((s) => s.clearActiveChat);
	const sendMessage = useAssistantStore((s) => s.sendMessage);
	const stopGenerating = useAssistantStore((s) => s.stopGenerating);

	// Tự động nhận diện context thí nghiệm hiện tại nếu không được truyền từ props
	const routerState = useRouterState();
	const pathname = routerState?.location?.pathname ?? "";
	const match = pathname.match(/\/experiments\/([^/]+)/);
	const experimentId = match && match[1] !== "new" ? match[1] : undefined;
	const isExperimentDetail = Boolean(experimentId);

	// Quản lý chuyển đổi route: vào experiment detail thì default open, ra ngoài thì default collapse
	const prevScopeRef = useRef<boolean | null>(null);

	useEffect(() => {
		if (propOpen !== undefined) return;

		const prevScope = prevScopeRef.current;
		prevScopeRef.current = isExperimentDetail;

		if (prevScope === null) {
			// Mount lần đầu: ưu tiên defaultOpen nếu có, nếu không thì dựa theo phạm vi experiment detail
			const initialOpen =
				defaultOpen !== undefined ? defaultOpen : isExperimentDetail;
			storeSetOpen(initialOpen);
		} else if (isExperimentDetail !== prevScope) {
			// Khi chuyển vùng giữa ngoài detail và trong detail:
			storeSetOpen(isExperimentDetail);
			onOpenChange?.(isExperimentDetail);
		}
	}, [isExperimentDetail, propOpen, defaultOpen, onOpenChange, storeSetOpen]);

	// Hỗ trợ controlled prop: open
	const isOpen = propOpen !== undefined ? propOpen : storeIsOpen;

	const setOpen = useCallback(
		(nextOpen: boolean) => {
			storeSetOpen(nextOpen);
			onOpenChange?.(nextOpen);
		},
		[storeSetOpen, onOpenChange],
	);

	const toggleOpen = useCallback(() => {
		const next = !isOpen;
		setOpen(next);
	}, [isOpen, setOpen]);

	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLTextAreaElement | null>(null);

	const { data: experiment } = useQuery({
		...experimentDetailQueryOptions(experimentId ?? ""),
		enabled: !!experimentId && !customContext,
	});

	const derivedContext = useMemo<AssistantExperimentContext | undefined>(() => {
		if (customContext) return customContext;
		if (!experimentId) return undefined;
		return {
			experimentId,
			title: experiment?.title,
			service: experiment?.service,
			inquiriesCount: experiment?.inquiries?.length ?? 0,
			activeTab: pathname.includes("/cases")
				? "Cases"
				: pathname.includes("/setup")
					? "Setup"
					: "Overview",
		};
	}, [customContext, experimentId, experiment, pathname]);

	const resetWidth = useCallback(() => {
		setWidth(DEFAULT_ASSISTANT_WIDTH);
	}, [setWidth]);

	const submitInput = useCallback(() => {
		const text = inputValue.trim();
		if (!text || isGenerating) return;
		setInputValue("");
		sendMessage(text, derivedContext);
	}, [inputValue, isGenerating, sendMessage, derivedContext]);

	const selectPrompt = useCallback(
		(prompt: string) => {
			if (prompt.startsWith("/")) {
				sendMessage(prompt, derivedContext);
			} else {
				setInputValue(prompt);
				inputRef.current?.focus();
			}
		},
		[sendMessage, derivedContext],
	);

	// Lắng nghe phím tắt toàn cục Ctrl+J / Cmd+J (Ctrl+B đã thuộc sidebar dashboard)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
				const active = document.activeElement;
				const isInput =
					active instanceof HTMLInputElement ||
					active instanceof HTMLTextAreaElement;
				if (isInput && !active.closest("[data-slot=input-group-control]")) {
					return;
				}
				e.preventDefault();
				toggleOpen();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [toggleOpen]);

	const value = useMemo<AssistantContextValue>(
		() => ({
			state: {
				isOpen,
				width,
				conversations,
				activeConversationId: activeConvId,
				activeConversation: activeConv,
				messages: activeConv?.messages ?? [],
				isGenerating,
				context: derivedContext,
				inputValue,
			},
			actions: {
				setOpen,
				toggleOpen,
				setWidth,
				resetWidth,
				newChat,
				selectConversation,
				deleteConversation,
				clearActiveChat,
				setInputValue,
				submitInput,
				sendMessage,
				stopGenerating,
				selectPrompt,
			},
			meta: {
				isHydrated,
				isMobile,
				inputRef,
			},
		}),
		[
			isOpen,
			width,
			conversations,
			activeConvId,
			activeConv,
			isGenerating,
			derivedContext,
			inputValue,
			setOpen,
			toggleOpen,
			setWidth,
			resetWidth,
			newChat,
			selectConversation,
			deleteConversation,
			clearActiveChat,
			submitInput,
			sendMessage,
			stopGenerating,
			selectPrompt,
			isHydrated,
			isMobile,
		],
	);

	return <AssistantContext value={value}>{children}</AssistantContext>;
}

export function useAssistantContext(): AssistantContextValue {
	const context = useContext(AssistantContext);
	if (!context) {
		throw new Error(
			"useAssistantContext must be used within an <AssistantProvider>",
		);
	}
	return context;
}

export function useOptionalAssistantContext(): AssistantContextValue | null {
	return useContext(AssistantContext);
}
