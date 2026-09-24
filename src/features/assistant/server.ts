import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type {
	ChatMessage,
	DeferResponse,
	InboxResponse,
	ListThreadsParams,
	OpenThreadRequest,
	PostMessageRequest,
	PostMessageResponse,
	ThreadDetail,
	ThreadSummary,
} from "./schemas";

/** `GET /chat/inbox` — Lấy danh sách câu hỏi cần trả lời và nhãn tự động đề xuất. */
export const getInbox = async (): Promise<InboxResponse> => {
	return api.get("chat/inbox").json<InboxResponse>();
};

/** `GET /chat/threads` — Lấy danh sách thread hội thoại theo bộ lọc. */
export const listThreads = async (
	params?: ListThreadsParams,
): Promise<ThreadSummary[]> => {
	const searchParams = new URLSearchParams();
	if (params?.status) searchParams.set("status", params.status);
	if (params?.experiment_id)
		searchParams.set("experiment_id", params.experiment_id);
	if (params?.inquiry_id) searchParams.set("inquiry_id", params.inquiry_id);
	if (params?.case_id) searchParams.set("case_id", params.case_id);
	if (params?.limit != null) searchParams.set("limit", String(params.limit));

	return api.get("chat/threads", { searchParams }).json<ThreadSummary[]>();
};

/** `POST /chat/threads` — Mở thread cho một case (hoặc mở lại khi user bấm 'Không đúng'). */
export const openThread = async (
	payload: OpenThreadRequest,
): Promise<ThreadDetail> => {
	return api.post("chat/threads", { json: payload }).json<ThreadDetail>();
};

/** `GET /chat/threads/{threadId}` — Chi tiết thread kèm case context và tiến độ annotation. */
export const getThread = async (threadId: string): Promise<ThreadDetail> => {
	return api.get(`chat/threads/${threadId}`).json<ThreadDetail>();
};

/** `GET /chat/threads/{threadId}/messages` — Lịch sử tin nhắn của thread. */
export const listMessages = async (
	threadId: string,
): Promise<ChatMessage[]> => {
	return api.get(`chat/threads/${threadId}/messages`).json<ChatMessage[]>();
};

/** `POST /chat/threads/{threadId}/messages` — Gửi tin nhắn và nhận phản hồi từ bot. */
export const postMessage = async (
	threadId: string,
	payload: PostMessageRequest,
): Promise<PostMessageResponse> => {
	return api
		.post(`chat/threads/${threadId}/messages`, { json: payload })
		.json<PostMessageResponse>();
};

/** `POST /chat/threads/{threadId}/defer` — Hoãn trả lời case ("Để sau"). */
export const deferThread = async (threadId: string): Promise<DeferResponse> => {
	return api.post(`chat/threads/${threadId}/defer`).json<DeferResponse>();
};
