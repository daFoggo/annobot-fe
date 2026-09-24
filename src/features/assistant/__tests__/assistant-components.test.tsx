import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AssistantInput } from "../components/assistant-input";
import { AssistantWelcome } from "../components/assistant-welcome";
import { Assistant } from "../index";

describe("AssistantWelcome", () => {
	it("renders commands and context information", () => {
		const onSelectPrompt = vi.fn();
		render(
			<AssistantWelcome
				context={{
					experimentId: "exp-1",
					title: "Smart Meter Trial",
					inquiriesCount: 3,
					service: "temporary",
				}}
				onSelectPrompt={onSelectPrompt}
			/>,
		);

		expect(screen.getByText("Smart Meter Trial")).toBeDefined();
		expect(
			screen.getByText(
				"Investigate experiments, analyze performance, or run actions.",
			),
		).toBeDefined();
		expect(screen.getByText("/analyze")).toBeDefined();
		expect(screen.getByText("/cases")).toBeDefined();
	});

	it("triggers prompt selection callback when clicking command", () => {
		const onSelectPrompt = vi.fn();
		const { container } = render(
			<AssistantWelcome onSelectPrompt={onSelectPrompt} />,
		);

		const cmdBtn = container.querySelector("button");
		expect(cmdBtn).not.toBeNull();
		if (cmdBtn) {
			fireEvent.click(cmdBtn);
		}

		expect(onSelectPrompt).toHaveBeenCalledWith("/analyze");
	});
});

describe("AssistantInput", () => {
	it("renders textarea with placeholder and triggers submit on Enter", () => {
		const onChange = vi.fn();
		const onSubmit = vi.fn();
		const onStop = vi.fn();

		render(
			<AssistantInput
				value="Check metrics"
				onChange={onChange}
				onSubmit={onSubmit}
				onStop={onStop}
				isGenerating={false}
			/>,
		);

		const textarea = screen.getByPlaceholderText(
			"> Ask AnnoBot anything or type / for commands...",
		);
		expect(textarea).toBeDefined();

		fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
		expect(onSubmit).toHaveBeenCalled();
	});
});

describe("AssistantMessages & MessageScrollerProvider", () => {
	it("renders messages without throwing useMessageScroller context error", () => {
		const mockMessages = [
			{
				id: "msg-1",
				role: "user" as const,
				content: "Hello AnnoBot",
				createdAt: new Date().toISOString(),
				status: "done" as const,
			},
			{
				id: "msg-2",
				role: "assistant" as const,
				content: "Hello! How can I assist you with this experiment?",
				createdAt: new Date().toISOString(),
				status: "done" as const,
			},
		];

		// Rendering this verifies that MessageScrollerProvider is correctly configured
		// and no runtime "useMessageScroller must be used within a MessageScroller" error is thrown!
		const { getByText } = render(
			<Assistant.Messages messages={mockMessages} isGenerating={false} />,
		);

		expect(getByText("Hello AnnoBot")).toBeDefined();
		expect(
			getByText("Hello! How can I assist you with this experiment?"),
		).toBeDefined();
	});
});
