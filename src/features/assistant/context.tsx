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
import {
	inboxQueryOptions,
	threadDetailQueryOptions,
	threadMessagesQueryOptions,
	useDeferThreadMutation,
	useOpenThreadMutation,
	useSendMessageMutation,
} from "./queries";
import type {
	AssistantExperimentContext,
	ChatMessage,
	InboxResponse,
	ThreadDetail,
} from "./schemas";
import {
	DEFAULT_ASSISTANT_WIDTH,
	useAssistantActiveThreadId,
	useAssistantIsOpen,
	useAssistantStore,
	useAssistantWidth,
} from "./store";

export interface AssistantState {
	isOpen: boolean;
	width: number;
	activeThreadId: string | null;
	activeThread?: ThreadDetail;
	messages: ChatMessage[];
	inbox?: InboxResponse;
	pendingCount: number;
	isGenerating: boolean;
	context?: AssistantExperimentContext;
	inputValue: string;
}

export interface AssistantActions {
	setOpen: (open: boolean) => void;
	toggleOpen: () => void;
	setWidth: (width: number) => void;
	resetWidth: () => void;
	selectThread: (id: string | null) => void;
	openThreadForCase: (
		caseId: string,
		reason?: string,
	) => Promise<ThreadDetail | undefined>;
	deferActiveThread: () => Promise<void>;
	setInputValue: (val: string) => void;
	submitInput: () => void;
	sendMessage: (content: string) => Promise<void>;
	stopGenerating: () => void;
	selectPrompt: (prompt: string) => void;
	newChat: () => void;
	clearActiveChat: () => void;
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
 * Hỗ trợ deep link ?thread=, polling inbox 30s, và scope thread đóng băng khi mở thread.
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
	const setWidth = useAssistantStore((s) => s.setWidth);
	const activeThreadId = useAssistantActiveThreadId();
	const setActiveThreadId = useAssistantStore((s) => s.setActiveThreadId);

	// Tự động nhận diện context thí nghiệm hiện tại nếu không được truyền từ props
	const routerState = useRouterState();
	const pathname = routerState?.location?.pathname ?? "";
	const match = pathname.match(/\/experiments\/([^/]+)/);
	const experimentId = match && match[1] !== "new" ? match[1] : undefined;
	const isExperimentDetail = Boolean(experimentId);

	// Deep link ?thread= từ URL
	const search = routerState?.location?.search as
		| Record<string, unknown>
		| undefined;
	const urlThreadId =
		typeof search?.thread === "string" ? search.thread : undefined;

	useEffect(() => {
		if (urlThreadId) {
			setActiveThreadId(urlThreadId);
			storeSetOpen(true);
		}
	}, [urlThreadId, setActiveThreadId, storeSetOpen]);

	// Quản lý chuyển đổi route: vào experiment detail thì default open, ra ngoài thì default collapse
	const prevScopeRef = useRef<boolean | null>(null);

	useEffect(() => {
		if (propOpen !== undefined) return;

		const prevScope = prevScopeRef.current;
		prevScopeRef.current = isExperimentDetail;

		if (prevScope === null) {
			const initialOpen =
				defaultOpen !== undefined ? defaultOpen : isExperimentDetail;
			storeSetOpen(initialOpen);
		} else if (isExperimentDetail !== prevScope) {
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

	// TanStack Query: Inbox
	const { data: inbox } = useQuery(inboxQueryOptions());
	const pendingCount = inbox?.pending?.length ?? 0;

	// TanStack Query: Active Thread Detail & Messages
	const { data: activeThread } = useQuery({
		...threadDetailQueryOptions(activeThreadId ?? ""),
		enabled: Boolean(activeThreadId),
	});

	const { data: threadMessages = [] } = useQuery({
		...threadMessagesQueryOptions(activeThreadId ?? ""),
		enabled: Boolean(activeThreadId),
	});

	// Mutations
	const sendMutation = useSendMessageMutation(activeThreadId ?? "");
	const deferMutation = useDeferThreadMutation();
	const openThreadMutation = useOpenThreadMutation();

	const isGenerating = sendMutation.isPending;

	// Scope: Khi đang trong thread, scope đóng băng theo thread (experiment_id của thread).
	// Khi ở ngoài, scope lấy từ URL hiện tại.
	const effectiveExperimentId = activeThread?.experiment_id ?? experimentId;

	const { data: experiment } = useQuery({
		...experimentDetailQueryOptions(effectiveExperimentId ?? ""),
		enabled: Boolean(effectiveExperimentId) && !customContext,
	});

	const derivedContext = useMemo<AssistantExperimentContext | undefined>(() => {
		if (customContext) return customContext;
		if (!effectiveExperimentId) return undefined;
		return {
			experimentId: effectiveExperimentId,
			title: experiment?.title,
			service: experiment?.service,
			inquiriesCount: experiment?.inquiries?.length ?? 0,
			activeTab: pathname.includes("/cases")
				? "Cases"
				: pathname.includes("/setup")
					? "Setup"
					: "Overview",
		};
	}, [customContext, effectiveExperimentId, experiment, pathname]);

	const resetWidth = useCallback(() => {
		setWidth(DEFAULT_ASSISTANT_WIDTH);
	}, [setWidth]);

	const selectThread = useCallback(
		(id: string | null) => {
			setActiveThreadId(id);
		},
		[setActiveThreadId],
	);

	const openThreadForCase = useCallback(
		async (caseId: string, reason?: string) => {
			const thread = await openThreadMutation.mutateAsync({
				case_id: caseId,
				reason,
			});
			if (thread?.id) {
				setActiveThreadId(thread.id);
				setOpen(true);
			}
			return thread;
		},
		[openThreadMutation, setActiveThreadId, setOpen],
	);

	const deferActiveThread = useCallback(async () => {
		if (!activeThreadId) return;
		await deferMutation.mutateAsync(activeThreadId);
		setActiveThreadId(null);
	}, [activeThreadId, deferMutation, setActiveThreadId]);

	const sendMessage = useCallback(
		async (content: string) => {
			const text = content.trim();
			if (!activeThreadId || !text || sendMutation.isPending) return;
			await sendMutation.mutateAsync({ content: text });
		},
		[activeThreadId, sendMutation],
	);

	const submitInput = useCallback(() => {
		const text = inputValue.trim();
		if (!text || isGenerating) return;
		setInputValue("");
		void sendMessage(text);
	}, [inputValue, isGenerating, sendMessage]);

	const selectPrompt = useCallback(
		(prompt: string) => {
			if (prompt.startsWith("/") && activeThreadId) {
				void sendMessage(prompt);
			} else {
				setInputValue(prompt);
				inputRef.current?.focus();
			}
		},
		[sendMessage, activeThreadId],
	);

	const stopGenerating = useCallback(() => {
		// HTTP request completion or abort placeholder
	}, []);

	const newChat = useCallback(() => {
		setActiveThreadId(null);
	}, [setActiveThreadId]);

	const clearActiveChat = useCallback(() => {
		setActiveThreadId(null);
	}, [setActiveThreadId]);

	// Phím tắt toàn cục Ctrl+J / Cmd+J
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
				activeThreadId,
				activeThread,
				messages: threadMessages,
				inbox,
				pendingCount,
				isGenerating,
				context: derivedContext,
				inputValue,
			},
			actions: {
				setOpen,
				toggleOpen,
				setWidth,
				resetWidth,
				selectThread,
				openThreadForCase,
				deferActiveThread,
				setInputValue,
				submitInput,
				sendMessage,
				stopGenerating,
				selectPrompt,
				newChat,
				clearActiveChat,
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
			activeThreadId,
			activeThread,
			threadMessages,
			inbox,
			pendingCount,
			isGenerating,
			derivedContext,
			inputValue,
			setOpen,
			toggleOpen,
			setWidth,
			resetWidth,
			selectThread,
			openThreadForCase,
			deferActiveThread,
			submitInput,
			sendMessage,
			stopGenerating,
			selectPrompt,
			newChat,
			clearActiveChat,
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
