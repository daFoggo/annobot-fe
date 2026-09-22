import * as z from "zod";
import { InquirySchema } from "@/features/inquiries/schemas";

/**
 * Experiment từ AnnoBot backend (`GET /experiments`).
 *
 * Đây là thực thể cấp cao nhất của app: một experiment tương ứng một "project",
 * và đóng vai trò như "workspace" hiện tại — mọi dữ liệu khác (inquiries,
 * sensors, cases...) đều thuộc về một experiment.
 */
export const ExperimentSchema = z.object({
	id: z.string(),
	owner_id: z.string(),
	title: z.string(),
	ask_window_start: z.string(),
	ask_window_end: z.string(),
	max_asks_per_day: z.number().int().positive().nullable(),
	il_timestep_minutes: z.number().int().positive().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	inquiries: z.array(InquirySchema).default([]),
});

export type Experiment = z.infer<typeof ExperimentSchema>;

/** Phản hồi phân trang theo chuẩn FindResult của backend. */
export const ExperimentFindResultSchema = z.object({
	founds: z.array(ExperimentSchema),
	total_count: z.number().int(),
	page: z.number().int(),
	page_size: z.number().int(),
});

export type ExperimentFindResult = z.infer<typeof ExperimentFindResultSchema>;

export const ExperimentListParamsSchema = z.object({
	page: z.number().int().min(1).optional(),
	page_size: z.number().int().min(1).max(100).optional(),
});

export type ExperimentListParams = z.infer<typeof ExperimentListParamsSchema>;

/** `time` của backend chấp nhận "HH:MM" hoặc "HH:MM:SS". */
const TimeStringSchema = z
	.string()
	.regex(/^\d{2}:\d{2}(:\d{2})?$/, "Expected a HH:MM or HH:MM:SS time");

/** Một inquiry tạo lồng bên trong `POST /experiments`. */
export const InquiryNestedCreateSchema = z.object({
	question: z.string().min(1).max(2048),
	sensor_ids: z.array(z.string()).default([]),
	type: z
		.enum(["appliance", "fact", "performance", "custom"])
		.nullable()
		.default("appliance"),
	goal_gamma: z.string().max(2048).nullable().optional(),
	detection_rule: z.record(z.string(), z.any()).nullable().optional(),
	indicators: z.record(z.string(), z.any()).nullable().optional(),
	annotation_scope: z.record(z.string(), z.any()).nullable().optional(),
});

export type InquiryNestedCreateInput = z.infer<
	typeof InquiryNestedCreateSchema
>;

/**
 * Payload tạo experiment (`POST /experiments`). Chỉ `title` là bắt buộc; các
 * trường còn lại để backend áp default khi bỏ trống.
 */
export const ExperimentCreateSchema = z.object({
	title: z.string().min(1).max(256),
	ask_window_start: TimeStringSchema.optional(),
	ask_window_end: TimeStringSchema.optional(),
	max_asks_per_day: z.number().int().min(1).nullable().optional(),
	il_timestep_minutes: z.number().int().min(1).nullable().optional(),
	inquiries: z.array(InquiryNestedCreateSchema).optional(),
});

export type ExperimentCreateInput = z.infer<typeof ExperimentCreateSchema>;

/** Payload cập nhật experiment (`PATCH /experiments/{id}`) — mọi trường optional. */
export const ExperimentUpdateSchema = ExperimentCreateSchema.partial();

export type ExperimentUpdateInput = z.infer<typeof ExperimentUpdateSchema>;
