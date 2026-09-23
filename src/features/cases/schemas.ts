import * as z from "zod";

export const CaseIndicatorSchema = z.object({
	name: z.string(),
	value: z.number(),
	unit: z.string().nullable().optional(),
});

export type CaseIndicator = z.infer<typeof CaseIndicatorSchema>;

export const CaseAskSchema = z.object({
	policy: z.string(),
	decision: z.string(),
	reason: z.string().nullable().optional(),
});

export type CaseAsk = z.infer<typeof CaseAskSchema>;

export const CaseSchema = z.object({
	id: z.string(),
	experiment_id: z.string(),
	inquiry_id: z.string(),
	t_start: z.string(),
	t_end: z.string(),
	detection_key: z.string().nullable().optional(),
	status: z.enum([
		"annotation_free",
		"pending",
		"asked",
		"annotated",
		"complete",
		"deferred",
	]),
	evidence: z.record(z.string(), z.any()).nullable().optional(),
	created_at: z.string(),
	updated_at: z.string(),
	indicators: z.array(CaseIndicatorSchema).default([]),
	asks: z.array(CaseAskSchema).default([]),
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
