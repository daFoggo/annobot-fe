import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { requestLoggerMiddleware } from "@/lib/middleware";
import { getDashboardOverview, getEnergyChart } from "./server";

const TimezoneSchema = z.object({
	tz: z.string().optional(),
});

export const getDashboardOverviewFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(TimezoneSchema)
	.handler(({ data }) => getDashboardOverview(data.tz));

const EnergyWindowSchema = z.object({
	since: z.string(),
	until: z.string(),
	eventType: z.string().optional().default("power_w"),
});

export const getEnergyChartFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(EnergyWindowSchema)
	.handler(({ data }) => getEnergyChart(data, data.eventType));
