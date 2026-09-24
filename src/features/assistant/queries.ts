import {
	keepPreviousData,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { caseKeys } from "@/features/cases/queries";
import {
	deferThreadFn,
	getInboxFn,
	getThreadFn,
	listMessagesFn,
	listThreadsFn,
	openThreadFn,
	postMessageFn,
} from "./functions";
import type {
	ListThreadsParams,
	OpenThreadRequest,
	PostMessageRequest,
} from "./schemas";

export const chatKeys = {
	all: ["chat"] as const,
	inbox: () => [...chatKeys.all, "inbox"] as const,
	threads: () => [...chatKeys.all, "threads"] as const,
	threadList: (params?: ListThreadsParams) =>
		[...chatKeys.threads(), "list", params ?? {}] as const,
	thread: (threadId: string) =>
		[...chatKeys.threads(), "detail", threadId] as const,
	messages: (threadId: string) =>
		[...chatKeys.threads(), "messages", threadId] as const,
};

/** Query options cho Inbox — danh sách câu hỏi cần trả lời và auto_filled. Polling mỗi 30s. */
export const inboxQueryOptions = () =>
	queryOptions({
		queryKey: chatKeys.inbox(),
		queryFn: () => getInboxFn(),
		refetchInterval: 30_000,
		placeholderData: keepPreviousData,
	});

/** Query options cho danh sách thread. */
export const threadListQueryOptions = (params?: ListThreadsParams) =>
	queryOptions({
		queryKey: chatKeys.threadList(params),
		queryFn: () => listThreadsFn({ data: params }),
		staleTime: 10_000,
	});

/** Query options cho chi tiết 1 thread. */
export const threadDetailQueryOptions = (threadId: string) =>
	queryOptions({
		queryKey: chatKeys.thread(threadId),
		queryFn: () => getThreadFn({ data: threadId }),
		enabled: Boolean(threadId),
		staleTime: 10_000,
	});

/** Query options cho lịch sử tin nhắn của 1 thread. */
export const threadMessagesQueryOptions = (threadId: string) =>
	queryOptions({
		queryKey: chatKeys.messages(threadId),
		queryFn: () => listMessagesFn({ data: threadId }),
		enabled: Boolean(threadId),
		staleTime: 5_000,
	});

/** Hook gửi tin nhắn trong thread. */
export const useSendMessageMutation = (threadId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: PostMessageRequest) =>
			postMessageFn({ data: { threadId, payload } }),
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: chatKeys.messages(threadId),
				}),
				queryClient.invalidateQueries({ queryKey: chatKeys.thread(threadId) }),
				queryClient.invalidateQueries({ queryKey: chatKeys.inbox() }),
				queryClient.invalidateQueries({ queryKey: caseKeys.all }),
			]);
		},
		onError: (error) => {
			toast.error(`Could not send message: ${error.message}`);
		},
	});
};

/** Hook hoãn trả lời ("Để sau") cho một thread. */
export const useDeferThreadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (threadId: string) => deferThreadFn({ data: threadId }),
		onSuccess: async (_, threadId) => {
			toast.info("Thread has been deferred.");
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: chatKeys.thread(threadId) }),
				queryClient.invalidateQueries({ queryKey: chatKeys.inbox() }),
				queryClient.invalidateQueries({ queryKey: caseKeys.all }),
			]);
		},
		onError: (error) => {
			toast.error(`Could not defer thread: ${error.message}`);
		},
	});
};

/** Hook mở hoặc mở lại thread cho một case (e.g. từ auto_filled "Không đúng"). */
export const useOpenThreadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: OpenThreadRequest) => openThreadFn({ data: payload }),
		onSuccess: async (data) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: chatKeys.inbox() }),
				queryClient.invalidateQueries({ queryKey: chatKeys.threads() }),
				queryClient.invalidateQueries({ queryKey: caseKeys.all }),
			]);
			return data;
		},
		onError: (error) => {
			toast.error(`Could not open thread: ${error.message}`);
		},
	});
};
