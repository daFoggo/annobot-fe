import { queryOptions } from "@tanstack/react-query";
import { getDashboardOverviewFn, getEnergyChartFn } from "./functions";
import type { EnergyWindow } from "./schemas";

export const dashboardKeys = {
	all: ["dashboard"] as const,
	overview: (tz?: string) =>
		[...dashboardKeys.all, "overview", tz ?? ""] as const,
	energy: (
		range: EnergyWindow,
		eventType: string = "power_w",
		sourceKeys?: string[],
	) =>
		[
			...dashboardKeys.all,
			"energy",
			range,
			eventType,
			sourceKeys ?? [],
		] as const,
};

/** Query options cho các stat box cấp nhà. */
export const dashboardOverviewQueryOptions = (tz?: string) =>
	queryOptions({
		queryKey: dashboardKeys.overview(tz),
		queryFn: () => getDashboardOverviewFn({ data: { tz } }),
	});

/**
 * Query options cho series công suất/tiêu thụ theo từng thiết bị.
 * `sourceKeys` giới hạn chart vào các sensor của một inquiry (bỏ trống = cả nhà).
 */
export const energyChartQueryOptions = (
	range: EnergyWindow,
	eventType: string = "power_w",
	sourceKeys?: string[],
) =>
	queryOptions({
		queryKey: dashboardKeys.energy(range, eventType, sourceKeys),
		queryFn: () =>
			getEnergyChartFn({ data: { ...range, eventType, sourceKeys } }),
	});
