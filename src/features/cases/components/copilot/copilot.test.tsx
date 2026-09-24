import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseCopilotProvider } from "./case-copilot-context";
import { CaseCopilotPanel } from "./case-copilot-panel";
import { CaseQuestionnaire } from "./case-copilot-rich";
import { CaseSpanInspector } from "./case-trace-tree";
import { SAMPLE_QUEUE } from "./mock";
import type { QuestionnaireItemSpec, SpanDetail, SpanNode } from "./types";

class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

globalThis.ResizeObserver =
	ResizeObserverStub as unknown as typeof ResizeObserver;

class IntersectionObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
}

globalThis.IntersectionObserver =
	IntersectionObserverStub as unknown as typeof IntersectionObserver;

if (typeof Element.prototype.getAnimations === "undefined") {
	Element.prototype.getAnimations = () => [];
}

Element.prototype.scrollTo = () => {};

afterEach(() => {
	cleanup();
});

const items: QuestionnaireItemSpec[] = [
	{
		name: "answer",
		required: true,
		prompt: "Bạn dùng chế độ nào?",
		choices: [
			{ value: "eco", label: "Eco" },
			{ value: "intensive", label: "Intensive" },
		],
	},
];

describe("CaseQuestionnaire", () => {
	it("renders the prompt and each choice as a radio", () => {
		render(<CaseQuestionnaire items={items} />);

		expect(screen.getByText("Bạn dùng chế độ nào?")).toBeTruthy();
		expect(screen.getByRole("radio", { name: /Eco/ })).toBeTruthy();
		expect(screen.getByRole("radio", { name: /Intensive/ })).toBeTruthy();
	});
});

describe("CaseSpanInspector", () => {
	it("renders the span tree and the selected span detail", () => {
		const nodes: SpanNode[] = [
			{
				id: "sp-agent",
				kind: "group",
				title: "chat_agent",
				status: "done",
				children: [
					{
						id: "sp-tool",
						kind: "tool",
						title: "get_case_context",
						status: "done",
					},
				],
			},
		];
		const details: Record<string, SpanDetail> = {
			"sp-agent": {
				id: "sp-agent",
				kind: "group",
				title: "chat_agent",
				status: "done",
				tags: ["chat_agent", "il"],
				output: "Xin hỏi bạn **đang làm gì**?",
				messages: [
					{ id: "m1", role: "human", text: "bat dau" },
					{ id: "m2", role: "tool", toolName: "get_case_context" },
				],
			},
		};

		render(<CaseSpanInspector nodes={nodes} details={details} />);

		// Span gốc được chọn sẵn nên tên xuất hiện cả ở cây lẫn tiêu đề chi tiết.
		expect(screen.getAllByText("chat_agent").length).toBeGreaterThan(0);
		// Cây span hiển thị node con (tool).
		expect(screen.getAllByText("get_case_context").length).toBeGreaterThan(0);

		fireEvent.click(screen.getByRole("tab", { name: /Details/ }));
		expect(screen.getByText("đang làm gì")).toBeTruthy();
	});
});

describe("CaseCopilotPanel", () => {
	it("shows the active case and walks the queue", () => {
		const Harness = () => {
			const [activeId, setActiveId] = React.useState<string | null>(
				SAMPLE_QUEUE[0]?.item.id ?? null,
			);
			return (
				<CaseCopilotProvider
					queue={SAMPLE_QUEUE}
					activeId={activeId}
					onActiveChange={setActiveId}
				>
					<CaseCopilotPanel />
				</CaseCopilotProvider>
			);
		};

		render(<Harness />);

		expect(screen.getAllByText("Dishwasher").length).toBeGreaterThan(0);

		fireEvent.click(screen.getByRole("button", { name: "Case kế tiếp" }));
		expect(screen.getAllByText("Meeting room").length).toBeGreaterThan(0);

		fireEvent.click(screen.getByRole("tab", { name: /Trace/ }));
		expect(screen.getAllByText("chat_agent").length).toBeGreaterThan(0);
	});
});
