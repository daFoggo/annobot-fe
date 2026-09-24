import { beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_ASSISTANT_WIDTH,
	MAX_ASSISTANT_WIDTH,
	MIN_ASSISTANT_WIDTH,
	useAssistantStore,
} from "../store";

describe("useAssistantStore", () => {
	beforeEach(() => {
		useAssistantStore.setState({
			isOpen: true,
			width: DEFAULT_ASSISTANT_WIDTH,
			conversations: [
				{
					id: "test_conv",
					title: "New chat",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					messages: [],
				},
			],
			activeConversationId: "test_conv",
			isGenerating: false,
			streamingMessageId: null,
		});
	});

	it("toggles open state correctly", () => {
		expect(useAssistantStore.getState().isOpen).toBe(true);
		useAssistantStore.getState().toggleOpen();
		expect(useAssistantStore.getState().isOpen).toBe(false);
		useAssistantStore.getState().setOpen(true);
		expect(useAssistantStore.getState().isOpen).toBe(true);
	});

	it("clamps panel width between MIN and MAX limits", () => {
		useAssistantStore.getState().setWidth(200);
		expect(useAssistantStore.getState().width).toBe(MIN_ASSISTANT_WIDTH);

		useAssistantStore.getState().setWidth(1000);
		expect(useAssistantStore.getState().width).toBe(MAX_ASSISTANT_WIDTH);

		useAssistantStore.getState().setWidth(450);
		expect(useAssistantStore.getState().width).toBe(450);
	});

	it("creates new chat and switches active conversation", () => {
		const newId = useAssistantStore.getState().newChat("exp-123");
		const state = useAssistantStore.getState();

		expect(state.activeConversationId).toBe(newId);
		expect(state.conversations.length).toBe(2);
		expect(state.conversations[0].experimentId).toBe("exp-123");
	});

	it("clears active chat without removing conversation", () => {
		useAssistantStore.setState({
			conversations: [
				{
					id: "test_conv",
					title: "Existing chat",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					messages: [
						{
							id: "m1",
							role: "user",
							content: "hello",
							createdAt: new Date().toISOString(),
							status: "done",
						},
					],
				},
			],
			activeConversationId: "test_conv",
		});

		useAssistantStore.getState().clearActiveChat();
		const state = useAssistantStore.getState();
		expect(state.conversations[0].messages).toEqual([]);
		expect(state.conversations[0].title).toBe("New chat");
	});
});
