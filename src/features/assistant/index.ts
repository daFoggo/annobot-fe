import { AssistantCollapsedTrigger } from "./components/assistant-collapsed-trigger";
import { AssistantHeader } from "./components/assistant-header";
import { AssistantInput } from "./components/assistant-input";
import { AssistantMessages } from "./components/assistant-messages";
import { AssistantPanel, AssistantRoot } from "./components/assistant-panel";
import { AssistantWelcome } from "./components/assistant-welcome";
import { AssistantProvider } from "./context";

/**
 * Compound Component API cho AnnoBot Assistant theo Vercel Composition Patterns:
 * - Assistant.Provider: Chia sẻ state, actions và meta
 * - Assistant.Root: Khung hiển thị panel và resize handle
 * - Assistant.Header: Tiêu đề, badge ngữ cảnh, lịch sử chat và new chat
 * - Assistant.Messages: Khung cuộn tin nhắn với MessageScroller
 * - Assistant.Welcome: Màn hình chào mừng và gợi ý lệnh nhanh / prompt chips
 * - Assistant.Input: Ô nhập liệu với phím tắt và auto-height
 * - Assistant.Trigger: Nút thu gọn dạng dải dọc 36px
 * - Assistant.Panel: Drop-in component tiện dụng đóng gói sẵn toàn bộ
 */
export const Assistant = {
	Provider: AssistantProvider,
	Root: AssistantRoot,
	Header: AssistantHeader,
	Messages: AssistantMessages,
	Welcome: AssistantWelcome,
	Input: AssistantInput,
	Trigger: AssistantCollapsedTrigger,
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
export type {
	AssistantExperimentContext,
	AssistantSuggestedCommand,
	ChatConversation,
	ChatMessage,
} from "./schemas";
export {
	useAssistantActiveConversation,
	useAssistantActiveConversationId,
	useAssistantConversations,
	useAssistantIsGenerating,
	useAssistantIsOpen,
	useAssistantStore,
	useAssistantWidth,
} from "./store";
export {
	AssistantCollapsedTrigger,
	AssistantHeader,
	AssistantInput,
	AssistantMessages,
	AssistantPanel,
	AssistantProvider,
	AssistantRoot,
	AssistantWelcome,
};
