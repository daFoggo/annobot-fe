import { z } from "zod";
import { SensorSchema } from "@/features/sensors";

/** Các loại inquiry hợp lệ theo backend (`INQUIRY_TYPES`). */
export const InquiryTypeSchema = z.enum([
	"appliance",
	"fact",
	"performance",
	"custom",
]);

export type InquiryType = z.infer<typeof InquiryTypeSchema>;

/** Cấu hình detection rule (D) — `detection_rule` ở dạng object JSONB. */
export const DetectionRuleSchema = z
	.object({
		type: z.string().default("power_cycle"),
		learned: z.record(z.string(), z.any()).nullable().optional(),
	})
	.passthrough();

export type DetectionRule = z.infer<typeof DetectionRuleSchema>;

/** Inquiry từ AnnoBot backend (`GET /inquiries?experiment_id=...`). */
export const InquirySchema = z.object({
	id: z.string(),
	experiment_id: z.string(),
	type: z.string().nullable().optional(),
	question: z.string().nullable().optional(),
	goal_gamma: z.string().nullable().optional(),
	indicators: z.record(z.string(), z.any()).nullable().optional(),
	detection_rule: z.record(z.string(), z.any()).nullable().optional(),
	annotation_scope: z.record(z.string(), z.any()).nullable().optional(),
	created_at: z.string(),
	updated_at: z.string(),
	sensors: z.array(SensorSchema).default([]),
});

export type Inquiry = z.infer<typeof InquirySchema>;

/** Payload tạo inquiry (`POST /inquiries`). */
export const InquiryCreateSchema = z.object({
	experiment_id: z.string().min(1),
	type: InquiryTypeSchema.default("appliance"),
	question: z.string().max(2048).nullable().optional(),
	goal_gamma: z.string().max(2048).nullable().optional(),
	indicators: z.record(z.string(), z.any()).nullable().optional(),
	detection_rule: z.record(z.string(), z.any()).nullable().optional(),
	annotation_scope: z.record(z.string(), z.any()).nullable().optional(),
	sensor_ids: z.array(z.string()).default([]),
});

export type InquiryCreateInput = z.infer<typeof InquiryCreateSchema>;

/** Payload cập nhật inquiry (`PATCH /inquiries/{id}`) — mọi trường optional. */
export const InquiryUpdateSchema = InquiryCreateSchema.partial();

export type InquiryUpdateInput = z.infer<typeof InquiryUpdateSchema>;
