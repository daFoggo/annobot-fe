import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type { DashboardOverview, EnergyChart, EnergyWindow } from "./schemas";

/** `GET /dashboard/overview` — house-level telemetry stat boxes. */
export const getDashboardOverview = async (
	tz?: string,
): Promise<DashboardOverview> =>
	api
		.get("dashboard/overview", {
			searchParams: tz ? { tz } : undefined,
		})
		.json<DashboardOverview>();

/** `GET /dashboard/energy` — per-source power/water series for the consumption chart. */
export const getEnergyChart = async (
	range: EnergyWindow,
	eventType: string = "power_w",
): Promise<EnergyChart> =>
	api
		.get("dashboard/energy", {
			searchParams: {
				since: range.since,
				until: range.until,
				bucket: "auto",
				event_type: eventType,
			},
		})
		.json<EnergyChart>();
