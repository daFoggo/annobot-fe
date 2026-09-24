import { AssistantCollapsedTrigger } from "./components/assistant-collapsed-trigger";
import { AssistantContextBar } from "./components/assistant-context-bar";
import { AssistantEvidenceCard } from "./components/assistant-evidence-card";
import { AssistantHeader } from "./components/assistant-header";
import { AssistantInbox } from "./components/assistant-inbox";
import { AssistantInput } from "./components/assistant-input";
import { AssistantMessages } from "./components/assistant-messages";
import {
	AssistantDefaultContent,
	AssistantPanel,
	AssistantRoot,
} from "./components/assistant-panel";
import { AssistantQuickReplies } from "./components/assistant-quick-replies";
import { AssistantWelcome } from "./components/assistant-welcome";
import { AssistantProvider } from "./context";

/**
 * Compound Component API cho AnnoBot Assistant theo Vercel Composition Patterns:
 * - Assistant.Provider: Chia sẻ state, actions và meta
 * - Assistant.Root: Khung hiển thị panel và resize handle
 * - Assistant.Header: Tiêu đề, badge tiến độ, quay lại inbox và nút collapse
 * - Assistant.ContextBar: Dải chip experiment / inquiry / case kèm popover
 * - Assistant.EvidenceCard: Thẻ bằng chứng case & telemetry
 * - Assistant.QuickReplies: Các chip gợi ý trả lời nhanh cho occupant
 * - Assistant.Inbox: Danh sách câu hỏi cần trả lời và auto-filled items
 * - Assistant.Messages: Khung cuộn tin nhắn với MessageScroller
 * - Assistant.Welcome: Màn hình chào mừng và gợi ý lệnh nhanh / prompt chips
 * - Assistant.Input: Ô nhập liệu với phím tắt, nút Để sau và Không liên quan
 * - Assistant.Trigger: Nút thu gọn dạng dải dọc 36px kèm badge count
 * - Assistant.Content: Nội dung mặc định (Inbox hoặc Active Thread view)
 * - Assistant.Panel: Drop-in component tiện dụng đóng gói sẵn toàn bộ
 */
export const Assistant = {
	Provider: AssistantProvider,
	Root: AssistantRoot,
	Header: AssistantHeader,
	ContextBar: AssistantContextBar,
	EvidenceCard: AssistantEvidenceCard,
	QuickReplies: AssistantQuickReplies,
	Inbox: AssistantInbox,
	Messages: AssistantMessages,
	Welcome: AssistantWelcome,
	Input: AssistantInput,
	Trigger: AssistantCollapsedTrigger,
	Content: AssistantDefaultContent,
	Panel: AssistantPanel,
};

export type {
	AssistantPanelProps,
	AssistantRootProps,
} from "./components/assistant-panel";
export type {
	AssistantActions,
	AssistantContextValue,
	AssistantMeta,
	AssistantProviderProps,
	AssistantState,
} from "./context";
export {
	useAssistantContext,
	useOptionalAssistantContext,
} from "./context";
export {
	chatKeys,
	inboxQueryOptions,
	threadDetailQueryOptions,
	threadListQueryOptions,
	threadMessagesQueryOptions,
	useDeferThreadMutation,
	useOpenThreadMutation,
	useSendMessageMutation,
} from "./queries";
export type {
	AnnotationProgress,
	AssistantExperimentContext,
	AssistantSuggestedCommand,
	CaseSummary,
	ChatMessage,
	ChatMessageDirection,
	ChatMessageRole,
	ChatMessageStatus,
	DeferResponse,
	InboxItem,
	InboxResponse,
	ListThreadsParams,
	OpenThreadRequest,
	PostMessageRequest,
	PostMessageResponse,
	ThreadDetail,
	ThreadSummary,
} from "./schemas";
export {
	useAssistantActiveThreadId,
	useAssistantIsOpen,
	useAssistantStore,
	useAssistantWidth,
} from "./store";
export {
	AssistantCollapsedTrigger,
	AssistantContextBar,
	AssistantDefaultContent,
	AssistantEvidenceCard,
	AssistantHeader,
	AssistantInbox,
	AssistantInput,
	AssistantMessages,
	AssistantPanel,
	AssistantProvider,
	AssistantQuickReplies,
	AssistantRoot,
	AssistantWelcome,
};
