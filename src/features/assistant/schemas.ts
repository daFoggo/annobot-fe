import * as z from "zod";

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
	role: ChatMessageRoleSchema,
	content: z.string(),
	createdAt: z.string(),
	status: ChatMessageStatusSchema.default("done"),
	experimentId: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatConversationSchema = z.object({
	id: z.string(),
	title: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	experimentId: z.string().optional(),
	messages: z.array(ChatMessageSchema),
});
export type ChatConversation = z.infer<typeof ChatConversationSchema>;

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
