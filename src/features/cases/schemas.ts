import * as z from "zod";

export const CaseIndicatorSchema = z.object({
	name: z.string(),
	value: z.number(),
	unit: z.string().nullable().optional(),
});

export type CaseIndicator = z.infer<typeof CaseIndicatorSchema>;

export const CaseAskSchema = z.object({
	/** Nullable ở DB: chỉ `decision` là NOT NULL. */
	policy: z.string().nullable().optional(),
	decision: z.string(),
	reason: z.string().nullable().optional(),
});

export type CaseAsk = z.infer<typeof CaseAskSchema>;

/**
 * Trạng thái case theo `ck_cases_status` của backend.
 *
 * `closed` là trạng thái một case mới sinh ra khi inquiry có trường
 * `required` trong `A` — detection engine ghi thẳng vào đó. `open` và
 * `expired_unclosed` thuộc về streaming detector cũ và không còn ai ghi,
 * nhưng vẫn nằm trong constraint nên vẫn phải parse được.
 */
export const CaseStatusSchema = z.enum([
	"open",
	"closed",
	"answered",
	"expired_unanswered",
	"expired_unclosed",
	"annotation_free",
	"pending",
	"asked",
	"annotated",
	"complete",
	"deferred",
]);

export type CaseStatus = z.infer<typeof CaseStatusSchema>;

export const RuleChangeDiffEntrySchema = z.object({
	from: z.any().nullable().optional(),
	to: z.any().nullable().optional(),
});

export const RuleChangeSchema = z.object({
	has_changed: z.boolean(),
	status: z.enum(["baseline", "changed", "same"]),
	diff: z.record(z.string(), RuleChangeDiffEntrySchema).default({}),
	prev_params: z.record(z.string(), z.any()).nullable().optional(),
});

export type RuleChange = z.infer<typeof RuleChangeSchema>;

export const CaseSchema = z.object({
	id: z.string(),
	experiment_id: z.string(),
	inquiry_id: z.string(),
	t_start: z.string(),
	/** Null khi case chưa kết thúc (streaming detector cũ). */
	t_end: z.string().nullable(),
	detection_key: z.string().nullable().optional(),
	status: CaseStatusSchema,
	/** `applied_params`, `flags`, `uncertainty_s`, `energy_wh_integrated`, … */
	evidence: z.record(z.string(), z.any()).nullable().optional(),
	created_at: z.string(),
	updated_at: z.string(),
	indicators: z.array(CaseIndicatorSchema).default([]),
	asks: z.array(CaseAskSchema).default([]),
	rule_change: RuleChangeSchema.nullable().optional(),
});

export type Case = z.infer<typeof CaseSchema>;

export const CaseFindResultSchema = z.object({
	founds: z.array(CaseSchema),
	total_count: z.number().int(),
	page: z.number().int(),
	page_size: z.number().int(),
});

export type CaseFindResult = z.infer<typeof CaseFindResultSchema>;

export const CaseListParamsSchema = z.object({
	experiment_id: z.string(),
	inquiry_id: z.string().optional(),
	status: z.string().optional(),
	page: z.number().int().min(1).default(1),
	page_size: z.number().int().min(1).max(100).default(10),
});

export type CaseListParams = z.infer<typeof CaseListParamsSchema>;
