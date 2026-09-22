import * as z from "zod";

/**
 * Dashboard telemetry from the AnnoBot backend (`GET /dashboard/overview`).
 *
 * This is house-level health, not per-inquiry analysis: HA connectivity,
 * sensor catalog summary, activity (power meters used in the last 24h) and
 * collection health (sources that went silent).
 */
export const HaHealthSchema = z.object({
	status: z.enum(["ok", "degraded", "offline"]),
	latency_ms: z.number().nullable(),
	checked_at: z.string(),
});

export const DevicesSummarySchema = z.object({
	total: z.number().int(),
	active: z.number().int(),
	power_meters: z.number().int(),
	water_meters: z.number().int().optional().default(0),
});

export const DashboardOverviewSchema = z.object({
	ha_health: HaHealthSchema,
	ha_url: z.string().nullable(),
	devices: DevicesSummarySchema,
	active_power_meters_24h: z.number().int(),
	stale_sources_24h: z.number().int(),
	energy_today_kwh: z.number().nullable(),
	water_today_l: z.number().nullable().optional(),
	last_data_at: z.string().nullable(),
	last_sync_at: z.string().nullable(),
	events_last_24h: z.number().int(),
});

export type DashboardOverview = z.infer<typeof DashboardOverviewSchema>;
export type HaHealth = z.infer<typeof HaHealthSchema>;
export type DevicesSummary = z.infer<typeof DevicesSummarySchema>;

export type ResourceConsumptionType = "power" | "water";

export const RESOURCE_EVENT_TYPES: Record<ResourceConsumptionType, string> = {
	power: "power_w",
	water: "water_flow",
};

/**
 * Energy chart payload (`GET /dashboard/energy`): a uniform timestamp axis
 * plus one series per power meter, aligned index-by-index with the axis
 * (`null` = no data for that bucket).
 */
export const EnergySeriesSchema = z.object({
	source: z.string(),
	name: z.string(),
	zone: z.string().nullable(),
	appliance_name: z.string().nullable(),
	unit: z.string(),
	event_type: z.string(),
	data: z.array(z.number().nullable()),
});

export const EnergyChartSchema = z.object({
	bucket: z.string(),
	since: z.string(),
	until: z.string(),
	event_type: z.string(),
	unit: z.string(),
	timestamps: z.array(z.string()),
	series: z.array(EnergySeriesSchema),
});

export type EnergyChart = z.infer<typeof EnergyChartSchema>;
export type EnergySeries = z.infer<typeof EnergySeriesSchema>;

/** Query window passed to the energy endpoint. */
export interface EnergyWindow {
	since: string;
	until: string;
}

/** Rolling 24h window, aligned to the minute so the loader and the component
 *  build the exact same query key. */
export const last24hWindow = (): EnergyWindow => {
	const until = new Date();
	until.setSeconds(0, 0);
	const since = new Date(until.getTime() - 24 * 60 * 60 * 1000);
	return { since: since.toISOString(), until: until.toISOString() };
};
