import type { Case } from "../../schemas";

/** Một lượt hội thoại giữa agent và cư dân trong copilot panel. */
export interface CopilotTurn {
	id: string;
	role: "agent" | "user";
	text: string;
	time: string;
	/** Khối UI sinh động đính kèm dưới bong bóng (chips, cảnh báo QC, tổng kết). */
	block?: RichBlock;
}

export interface QuestionnaireChoiceSpec {
	value: string;
	label: string;
	description?: string;
}

/** Một câu hỏi agent đặt ra, render bằng `Questionnaire` của shadcn. */
export interface QuestionnaireItemSpec {
	name: string;
	required: boolean;
	multiple?: boolean;
	prompt: string;
	description?: string;
	choices: QuestionnaireChoiceSpec[];
}

export interface QcConflict {
	field: string;
	declared: string;
	measured: string;
	note: string;
}

export interface AnnotationSummary {
	fields: { label: string; value: string }[];
}

export type RichBlock =
	| { kind: "questionnaire"; items: QuestionnaireItemSpec[] }
	| { kind: "qc-conflict"; conflict: QcConflict }
	| { kind: "annotation-summary"; summary: AnnotationSummary };

/* ------------------------------------------------------------------ */
/* Span inspector (Opik-style master–detail)                           */
/* ------------------------------------------------------------------ */

/**
 * Loại span quyết định icon + màu. Giữ đúng bộ ngữ nghĩa của vòng đời case
 * (detection → indicators → density → reasoning → annotation) cộng thêm ba
 * nhóm span của agent (model / tool / group) để phản chiếu cây trace thật.
 */
export type SpanKind =
	| "group"
	| "detection"
	| "indicators"
	| "density"
	| "reasoning"
	| "model"
	| "tool"
	| "annotation";

export type SpanStatus = "done" | "active" | "pending";

export interface SpanStat {
	label: string;
	value: string;
}

export interface SpanNode {
	id: string;
	kind: SpanKind;
	title: string;
	status: SpanStatus;
	/** Dòng mô tả ngắn dưới tiêu đề. */
	detail?: string;
	/** Chỉ số hiển thị cùng hàng (duration, cost, #id…). */
	stats?: SpanStat[];
	children?: SpanNode[];
}

/** Chi tiết một span, hiển thị ở pane bên phải khi chọn node trên cây. */
export interface SpanDetail {
	id: string;
	kind: SpanKind;
	title: string;
	status: SpanStatus;
	/** Dòng meta: thời điểm, duration, id, cost. */
	startedAt?: string;
	duration?: string;
	cost?: string;
	/** Tag chip dưới meta row. */
	tags?: string[];
	/** Payload thô của input. */
	input?: string;
	/** Output đã diễn giải; `**đậm**` được render thành bold. */
	output?: string;
	/** Metadata dạng các cặp key/value (hiển thị như YAML). */
	metadata?: SpanStat[];
	/** Thống kê token. */
	tokenUsage?: SpanStat[];
	/** Danh sách message LLM theo vai trò. */
	messages?: SpanMessage[];
}

export interface SpanMessage {
	id: string;
	role: "human" | "ai" | "tool";
	/** Tên tool khi role = "tool". */
	toolName?: string;
	text?: string;
}

/**
 * Một case trong hàng đợi copilot, kèm dữ liệu hội thoại + trace để dựng UI.
 * Khi nối backend, `turns` đến từ `GET /cases/{id}/messages` và `trace` từ
 * Opik (span tree) — xem `docs/design-system/opik-ui-reference.md` mục 7.
 */
export interface CopilotCase {
	item: Case;
	/** Tên thiết bị hiển thị ở header panel. */
	device: string;
	turns: CopilotTurn[];
	trace: SpanNode[];
	/** Chi tiết theo span id, tra khi chọn node trên cây. */
	spanDetails: Record<string, SpanDetail>;
}
