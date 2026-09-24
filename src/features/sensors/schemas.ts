import { z } from "zod";

/** Cảm biến từ AnnoBot backend (`GET /sensors`). */
export const SensorSchema = z.object({
	id: z.string(),
	source_key: z.string(),
	name: z.string(),
	sensor_type: z.string(),
	unit: z.string(),
	zone: z.string().nullable(),
	appliance_name: z.string().nullable(),
	is_active: z.boolean(),
	/** Readings constant over the lookback (dead plug / mis-map) — excluded from detection. */
	is_stale: z.boolean().optional().default(false),
	created_at: z.string(),
	updated_at: z.string(),
});

export type Sensor = z.infer<typeof SensorSchema>;

/** Cảm biến thành phần thuộc thiết bị vật lý. */
export const DeviceSensorItemSchema = z.object({
	id: z.string(),
	source_key: z.string(),
	name: z.string(),
	sensor_type: z.string(),
	unit: z.string(),
	event_type: z.string().nullable().optional(),
	is_active: z.boolean(),
});

export type DeviceSensorItem = z.infer<typeof DeviceSensorItemSchema>;

/** Thiết bị vật lý tổng hợp từ AnnoBot backend (`GET /devices`). */
export const DeviceSchema = z.object({
	id: z.string(),
	name: z.string(),
	zone: z.string(),
	category: z.enum(["plug", "climate", "environment", "water", "other"]),
	primary_sensor_id: z.string(),
	metrics_summary: z.string(),
	sensor_ids: z.array(z.string()),
	sensors: z.array(DeviceSensorItemSchema),
});

export type Device = z.infer<typeof DeviceSchema>;
