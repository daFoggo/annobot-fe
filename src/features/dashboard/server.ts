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

/**
 * `GET /dashboard/energy` — per-source power/water series for the consumption
 * chart. When `sourceKeys` is provided the endpoint only returns those sensors
 * (the inquiry-scoped chart); omit it for the whole house.
 */
export const getEnergyChart = async (
	range: EnergyWindow,
	eventType: string = "power_w",
	sourceKeys?: string[],
): Promise<EnergyChart> => {
	const searchParams = new URLSearchParams({
		since: range.since,
		until: range.until,
		bucket: "auto",
		event_type: eventType,
	});
	for (const key of sourceKeys ?? []) {
		searchParams.append("source_keys", key);
	}

	return api.get("dashboard/energy", { searchParams }).json<EnergyChart>();
};
