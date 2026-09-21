import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type { DashboardOverview, EnergyChart, EnergyWindow } from "./schemas";

/** `GET /dashboard/overview` — house-level telemetry stat boxes. */
export const getDashboardOverview = async (): Promise<DashboardOverview> =>
	api.get("dashboard/overview").json<DashboardOverview>();

/** `GET /dashboard/energy` — per-source power series for the energy chart. */
export const getEnergyChart = async (
	range: EnergyWindow,
): Promise<EnergyChart> =>
	api
		.get("dashboard/energy", {
			searchParams: {
				since: range.since,
				until: range.until,
				bucket: "auto",
				event_type: "power_w",
			},
		})
		.json<EnergyChart>();
