import { queryOptions } from "@tanstack/react-query";
import { getDashboardOverviewFn, getEnergyChartFn } from "./functions";
import type { EnergyWindow } from "./schemas";

export const dashboardKeys = {
	all: ["dashboard"] as const,
	overview: (tz?: string) =>
		[...dashboardKeys.all, "overview", tz ?? ""] as const,
	energy: (range: EnergyWindow, eventType: string = "power_w") =>
		[...dashboardKeys.all, "energy", range, eventType] as const,
};

/** Query options cho các stat box cấp nhà. */
export const dashboardOverviewQueryOptions = (tz?: string) =>
	queryOptions({
		queryKey: dashboardKeys.overview(tz),
		queryFn: () => getDashboardOverviewFn({ data: { tz } }),
	});

/** Query options cho series công suất/tiêu thụ theo từng thiết bị. */
export const energyChartQueryOptions = (
	range: EnergyWindow,
	eventType: string = "power_w",
) =>
	queryOptions({
		queryKey: dashboardKeys.energy(range, eventType),
		queryFn: () => getEnergyChartFn({ data: { ...range, eventType } }),
	});
