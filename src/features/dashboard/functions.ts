import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { requestLoggerMiddleware } from "@/lib/middleware";
import { getDashboardOverview, getEnergyChart } from "./server";

export const getDashboardOverviewFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.handler(() => getDashboardOverview());

const EnergyWindowSchema = z.object({
	since: z.string(),
	until: z.string(),
});

export const getEnergyChartFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(EnergyWindowSchema)
	.handler(({ data }) => getEnergyChart(data));
