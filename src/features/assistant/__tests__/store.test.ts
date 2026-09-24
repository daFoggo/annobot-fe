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
			activeThreadId: null,
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

	it("resets width to default", () => {
		useAssistantStore.getState().setWidth(500);
		expect(useAssistantStore.getState().width).toBe(500);
		useAssistantStore.getState().resetWidth();
		expect(useAssistantStore.getState().width).toBe(DEFAULT_ASSISTANT_WIDTH);
	});

	it("sets active thread id", () => {
		expect(useAssistantStore.getState().activeThreadId).toBeNull();
		useAssistantStore.getState().setActiveThreadId("thread-123");
		expect(useAssistantStore.getState().activeThreadId).toBe("thread-123");
		useAssistantStore.getState().setActiveThreadId(null);
		expect(useAssistantStore.getState().activeThreadId).toBeNull();
	});
});
