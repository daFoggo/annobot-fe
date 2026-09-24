import * as z from "zod";

export const AnnotationProgressSchema = z.object({
	required: z.array(z.string()).default([]),
	collected: z.record(z.string(), z.any()).default({}),
	missing: z.array(z.string()).default([]),
	occupant_turns: z.number().nullable().optional(),
	max_occupant_turns: z.number().nullable().optional(),
});
export type AnnotationProgress = z.infer<typeof AnnotationProgressSchema>;

export const CaseSummarySchema = z.object({
	id: z.string(),
	experiment_id: z.string(),
	inquiry_id: z.string(),
	t_start: z.string(),
	t_end: z.string().nullable().optional(),
	status: z.string(),
	detection_key: z.string().nullable().optional(),
	evidence: z.record(z.string(), z.any()).nullable().optional(),
	question: z.string().nullable().optional(),
	duration_minutes: z.number().nullable().optional(),
});
export type CaseSummary = z.infer<typeof CaseSummarySchema>;

export const ThreadSummarySchema = z.object({
	id: z.string(),
	case_id: z.string().nullable().optional(),
	experiment_id: z.string().nullable().optional(),
	inquiry_id: z.string().nullable().optional(),
	status: z.string(),
	created_at: z.string(),
	first_opened_at: z.string().nullable().optional(),
	case: CaseSummarySchema.nullable().optional(),
	progress: AnnotationProgressSchema,
});
export type ThreadSummary = z.infer<typeof ThreadSummarySchema>;

export const ThreadDetailSchema = ThreadSummarySchema.extend({
	annotation_scope: z.record(z.string(), z.any()).default({}),
	evidence: z.record(z.string(), z.any()).nullable().optional(),
	metadata: z.record(z.string(), z.any()).default({}),
});
export type ThreadDetail = z.infer<typeof ThreadDetailSchema>;

export const InboxItemSchema = z.object({
	thread_id: z.string().nullable().optional(),
	case: CaseSummarySchema,
	progress: AnnotationProgressSchema.nullable().optional(),
	proposed: z.record(z.string(), z.any()).nullable().optional(),
	auto_filled_from: z.array(z.string()).default([]),
	opened: z.boolean().default(false),
});
export type InboxItem = z.infer<typeof InboxItemSchema>;

export const InboxResponseSchema = z.object({
	pending: z.array(InboxItemSchema).default([]),
	auto_filled: z.array(InboxItemSchema).default([]),
});
export type InboxResponse = z.infer<typeof InboxResponseSchema>;

export const ChatMessageDirectionSchema = z.enum(["in", "out"]);
export type ChatMessageDirection = z.infer<typeof ChatMessageDirectionSchema>;

export const ChatMessageRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const ChatMessageStatusSchema = z.enum([
	"sending",
	"streaming",
	"done",
	"error",
]);
export type ChatMessageStatus = z.infer<typeof ChatMessageStatusSchema>;

export const ChatMessageSchema = z.object({
	id: z.string(),
	direction: ChatMessageDirectionSchema.default("out").optional(),
	content: z.string(),
	content_json: z.record(z.string(), z.any()).nullable().optional(),
	created_at: z.string().optional(),
	createdAt: z.string().optional(),
	role: ChatMessageRoleSchema.optional(),
	status: ChatMessageStatusSchema.default("done").optional(),
	experimentId: z.string().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const PostMessageRequestSchema = z.object({
	content: z.string().min(1).max(8000),
});
export type PostMessageRequest = z.infer<typeof PostMessageRequestSchema>;

export const PostMessageResponseSchema = z.object({
	message: ChatMessageSchema,
	progress: AnnotationProgressSchema,
	case_status: z.string().nullable().optional(),
});
export type PostMessageResponse = z.infer<typeof PostMessageResponseSchema>;

export const OpenThreadRequestSchema = z.object({
	case_id: z.string(),
	reason: z.string().nullable().optional(),
});
export type OpenThreadRequest = z.infer<typeof OpenThreadRequestSchema>;

export const DeferResponseSchema = z.object({
	thread_id: z.string(),
	case_id: z.string().nullable().optional(),
	status: z.string(),
});
export type DeferResponse = z.infer<typeof DeferResponseSchema>;

export const ListThreadsParamsSchema = z.object({
	status: z.string().optional(),
	experiment_id: z.string().optional(),
	inquiry_id: z.string().optional(),
	case_id: z.string().optional(),
	limit: z.number().int().min(1).max(500).default(100).optional(),
});
export type ListThreadsParams = z.infer<typeof ListThreadsParamsSchema>;

export interface AssistantSuggestedCommand {
	command: string;
	label: string;
	description: string;
	prompt: string;
}

export interface AssistantExperimentContext {
	experimentId?: string;
	title?: string;
	service?: string | null;
	inquiriesCount?: number;
	activeTab?: string;
}
