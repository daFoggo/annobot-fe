import { queryOptions } from "@tanstack/react-query";
import { getDashboardOverviewFn, getEnergyChartFn } from "./functions";
import type { EnergyWindow } from "./schemas";

export const dashboardKeys = {
	all: ["dashboard"] as const,
	overview: () => [...dashboardKeys.all, "overview"] as const,
	energy: (range: EnergyWindow) =>
		[...dashboardKeys.all, "energy", range] as const,
};

/** Query options cho các stat box cấp nhà. */
export const dashboardOverviewQueryOptions = () =>
	queryOptions({
		queryKey: dashboardKeys.overview(),
		queryFn: () => getDashboardOverviewFn(),
	});

/** Query options cho series công suất theo từng thiết bị. */
export const energyChartQueryOptions = (range: EnergyWindow) =>
	queryOptions({
		queryKey: dashboardKeys.energy(range),
		queryFn: () => getEnergyChartFn({ data: range }),
	});
