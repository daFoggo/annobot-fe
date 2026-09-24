import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Case } from "../schemas";
import { CaseTimeline } from "./case-timeline";

afterEach(() => {
	cleanup();
});

const mockCases: Case[] = [
	{
		id: "case-1",
		experiment_id: "exp-1",
		inquiry_id: "inq-1",
		t_start: "2026-09-24T12:00:00Z",
		t_end: "2026-09-24T18:00:00Z",
		status: "complete",
		created_at: "2026-09-24T18:00:00Z",
		updated_at: "2026-09-24T18:00:00Z",
		metadata: {
			source_key: "sensor.refrigerator_power",
		},
		indicators: [],
		asks: [],
	},
];

describe("CaseTimeline", () => {
	it("renders empty state when there are no cases", () => {
		render(<CaseTimeline cases={[]} />);
		expect(screen.getByText("No cases yet")).toBeTruthy();
	});

	it("anchors to calendar day, shows date in CardDescription, and omits boilerplate text", () => {
		render(
			<CaseTimeline
				cases={mockCases}
				timezone="UTC"
				deviceNames={{ "sensor.refrigerator_power": "Refrigerator" }}
			/>,
		);

		expect(screen.getByText("Extracted cases")).toBeTruthy();
		expect(screen.getByText("Refrigerator")).toBeTruthy();

		// Date format DD/MM/YYYY for 2026-09-24
		expect(screen.getByText("24/09/2026")).toBeTruthy();

		// Boilerplate text must NOT exist
		expect(screen.queryByText(/One row per device/)).toBeNull();

		// Gridlines should show standard 6h steps
		expect(screen.getByText("00:00")).toBeTruthy();
		expect(screen.getByText("06:00")).toBeTruthy();
		expect(screen.getByText("12:00")).toBeTruthy();
		expect(screen.getByText("18:00")).toBeTruthy();
		expect(screen.getByText("24:00")).toBeTruthy();
	});

	it("positions the case bar accurately leaving empty trailing space", () => {
		const { container } = render(
			<CaseTimeline cases={mockCases} timezone="UTC" />,
		);

		// Case from 12:00 to 18:00 on a 24h day (00:00 to 24:00):
		// left = (12/24) * 100 = 50%
		// width = (6/24) * 100 = 25%
		const bar = container.querySelector("[data-slot='run-bar']");
		expect(bar).toBeTruthy();
		expect(bar?.getAttribute("style")).toContain("left: 50%");
		expect(bar?.getAttribute("style")).toContain("width: 25%");
	});

	it("displays tooltip on hover with duration and device", () => {
		const { container } = render(
			<CaseTimeline
				cases={mockCases}
				timezone="UTC"
				deviceNames={{ "sensor.refrigerator_power": "Refrigerator" }}
			/>,
		);

		const bar = container.querySelector("[data-slot='run-bar']");
		expect(bar).toBeTruthy();

		fireEvent.mouseEnter(bar as Element, { clientX: 200, clientY: 300 });

		// Tooltip should appear
		expect(screen.getAllByText("Refrigerator").length).toBeGreaterThan(1);
		expect(screen.getByText("6h")).toBeTruthy();

		fireEvent.mouseLeave(bar as Element);
	});
});
