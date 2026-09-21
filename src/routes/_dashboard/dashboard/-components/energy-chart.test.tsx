import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EnergyChart } from "@/features/dashboard";
import { EnergyUsageChart } from "./energy-chart";

class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

globalThis.ResizeObserver =
	ResizeObserverStub as unknown as typeof ResizeObserver;

if (typeof Element.prototype.getAnimations === "undefined") {
	Element.prototype.getAnimations = () => [];
}

const chartData: EnergyChart = {
	bucket: "15 minutes",
	since: "2026-09-21T00:00:00+00:00",
	until: "2026-09-21T01:00:00+00:00",
	event_type: "power_w",
	unit: "W",
	timestamps: [
		"2026-09-21T00:00:00+00:00",
		"2026-09-21T00:15:00+00:00",
		"2026-09-21T00:30:00+00:00",
		"2026-09-21T00:45:00+00:00",
	],
	series: [
		{
			source: "sensor.z4_meeting_plug_tv_power",
			name: "TV",
			zone: "Meeting",
			appliance_name: "tv",
			unit: "W",
			event_type: "power_w",
			data: [0, 120, 60, null],
		},
		{
			source: "sensor.z3_kitchen_plug_fridge_power",
			name: "Fridge",
			zone: "Kitchen",
			appliance_name: "fridge",
			unit: "W",
			event_type: "power_w",
			data: [38, 40, 0, 38],
		},
	],
};

describe("EnergyUsageChart", () => {
	it("renders the legend and the three stat tiles", () => {
		render(<EnergyUsageChart data={chartData} />);

		// Legend lists every series (device names).
		expect(screen.getAllByText("TV").length).toBeGreaterThan(0);
		expect(screen.getByText("Fridge")).toBeTruthy();

		// Stat tiles recompute from the visible, forward-filled series:
		// current = last bucket (60 + 38), peak = 120 + 40.
		expect(screen.getByText("Current")).toBeTruthy();
		expect(screen.getByText("Peak")).toBeTruthy();
		expect(screen.getByText("Top consumer")).toBeTruthy();
		expect(screen.getAllByText("98 W").length).toBeGreaterThan(0);
		expect(screen.getAllByText("160 W").length).toBeGreaterThan(0);
	});

	it("renders an empty state when there is no power data", () => {
		render(
			<EnergyUsageChart data={{ ...chartData, timestamps: [], series: [] }} />,
		);
		expect(screen.getByText("No power data yet")).toBeTruthy();
	});
});
