import type { Case } from "../../schemas";
import type {
	CopilotCase,
	CopilotTurn,
	RichBlock,
	SpanDetail,
	SpanNode,
	SpanStat,
} from "./types";

/**
 * Dữ liệu mẫu cho copilot panel. Chưa nối backend — mục đích là để hình dung
 * luồng trước khi chốt hợp đồng API. Khi tích hợp:
 * - `turns`  ← `GET /cases/{id}/messages`
 * - `trace`  ← span tree từ Opik (đã instrument `chat_agent`)
 * - commit   ← `POST /cases/{id}/annotation`
 */

const DEVICE_NAMES = [
	"Dishwasher",
	"Meeting room",
	"Microwave",
	"Fridge",
	"Kitchen plug",
];

export const getCaseDeviceName = (item: Case, index = 0): string => {
	const sourceKey =
		typeof item.metadata?.source_key === "string"
			? item.metadata.source_key
			: "";
	const key = sourceKey.toLowerCase();
	const id = item.id.toLowerCase();
	if (key.includes("dishwasher") || id.includes("dishwasher"))
		return "Dishwasher";
	if (key.includes("meeting") || id.includes("meeting")) return "Meeting room";
	if (key.includes("tv")) return "TV phòng họp";
	if (key.includes("microwave") || id.includes("microwave")) return "Microwave";
	if (key.includes("fridge") || id.includes("fridge")) return "Fridge";
	if (sourceKey) {
		return sourceKey.replace("sensor.", "").replaceAll("_", " ");
	}
	return DEVICE_NAMES[index % DEVICE_NAMES.length];
};

const formatRange = (startIso: string, endIso: string | null) => {
	try {
		const s = new Date(startIso);
		const startStr = `${s.getUTCHours()}:${String(s.getUTCMinutes()).padStart(2, "0")}`;
		const endStr = endIso
			? (() => {
					const e = new Date(endIso);
					return `${e.getUTCHours()}:${String(e.getUTCMinutes()).padStart(2, "0")}`;
				})()
			: "…";
		const dateStr = `${s.getUTCDate()} tháng ${s.getUTCMonth() + 1} năm ${s.getUTCFullYear()}`;
		return { startStr, endStr, dateStr };
	} catch {
		return { startStr: "9:00", endStr: "9:18", dateStr: "21 tháng 9 năm 2026" };
	}
};

const sampleCase = (
	overrides: Pick<Case, "id" | "status" | "t_start" | "t_end"> & Partial<Case>,
): Case => ({
	experiment_id: "exp-sample",
	inquiry_id: "inq-sample",
	detection_key: "power_cycle",
	evidence: null,
	created_at: overrides.t_start,
	updated_at: overrides.t_end ?? overrides.t_start,
	indicators: [],
	asks: [],
	rule_change: null,
	...overrides,
});

const questionnaire = (prompt: string, labels: string[]): RichBlock => ({
	kind: "questionnaire",
	items: [
		{
			name: "answer",
			required: true,
			prompt,
			description: "Chọn một đáp án, hoặc gõ câu trả lời riêng.",
			choices: labels.map((label) => ({ value: label, label })),
		},
	],
});

const askedTurns = (item: Case): CopilotTurn[] => {
	const { startStr, endStr, dateStr } = formatRange(item.t_start, item.t_end);
	const device = getCaseDeviceName(item);
	const peak =
		item.evidence?.peak_w != null ? `${item.evidence.peak_w} W` : "105.2 W";
	const reason =
		item.asks?.[0]?.reason || "No annotated cases yet for this inquiry.";

	return [
		{
			id: `${item.id}-sys`,
			role: "agent",
			time: startStr,
			text: `[system] Bắt đầu hỏi annotation mới. Lý do trigger: ${reason}`,
		},
		{
			id: `${item.id}-a1`,
			role: "agent",
			time: startStr,
			text: `Hệ thống đã quan sát được từ **${device}** tại phòng họp, trong khoảng thời gian từ **${startStr} đến ${endStr}** sáng ngày **${dateStr}**. Trong thời gian này, công suất điện được ghi nhận có dấu hiệu bất thường với mức tiêu thụ lên tới **${peak}**.\n\nXin hỏi bạn vào thời điểm này, bạn có thể cho biết mình đang làm gì không?`,
			block: questionnaire(
				"Bạn đang làm gì trong phòng họp vào thời điểm này?",
				["Họp dự án", "Giao ban / Báo cáo tuần", "Làm việc riêng", "Khác"],
			),
		},
	];
};

const completeTurns = (item: Case): CopilotTurn[] => {
	const { startStr, endStr } = formatRange(item.t_start, item.t_end);
	const device = getCaseDeviceName(item);
	const peak =
		item.evidence?.peak_w != null ? `${item.evidence.peak_w} W` : "105.2 W";
	const energy =
		item.evidence?.energy_wh_integrated != null
			? `${item.evidence.energy_wh_integrated} Wh`
			: "15.8 Wh";

	return [
		{
			id: `${item.id}-a1`,
			role: "agent",
			time: startStr,
			text: `Hệ thống đã quan sát được từ **${device}**, thời gian **${startStr} đến ${endStr}** (${energy}, đỉnh ${peak}).`,
			block: questionnaire("Bạn đang làm gì trong thời điểm này?", [
				"Họp dự án",
				"Làm việc cá nhân",
				"Khác",
			]),
		},
		{
			id: `${item.id}-u1`,
			role: "user",
			time: endStr,
			text: "Họp dự án",
		},
		{
			id: `${item.id}-a2`,
			role: "agent",
			time: endStr,
			text: "Đã ghi nhận annotation cho case này.",
			block: {
				kind: "annotation-summary",
				summary: {
					fields: [
						{ label: "Mục đích", value: "Họp dự án" },
						{ label: "Thiết bị", value: device },
						{ label: "Thời gian", value: `${startStr} → ${endStr}` },
						{ label: "Công suất đỉnh", value: peak },
					],
				},
			},
		},
	];
};

/* ------------------------------------------------------------------ */
/* Span tree — phản chiếu trace thật của `chat_agent` trên Opik        */
/* ------------------------------------------------------------------ */

const stat = (label: string, value: string): SpanStat => ({ label, value });

const buildTrace = (item: Case, done: boolean): SpanNode[] => {
	const agentId = `${item.id}-chat_agent`;
	const modelEarlyId = `${item.id}-model-early`;
	const modelLateId = `${item.id}-model-late`;

	return [
		{
			id: agentId,
			kind: "group",
			title: "chat_agent",
			status: done ? "done" : "active",
			detail: "langchain_create_agent · gpt-4o-mini",
			stats: [stat("duration", done ? "6.4s" : "3.1s"), stat("cost", "<$0.01")],
			children: [
				{
					id: modelEarlyId,
					kind: "model",
					title: "model",
					status: "done",
					stats: [stat("duration", "3.6s")],
					children: [
						{
							id: `${modelEarlyId}-openai`,
							kind: "model",
							title: "ChatOpenAI",
							status: "done",
							detail: "openai/gpt-4o-mini",
							stats: [stat("duration", "3.5s"), stat("tokens", "#1764")],
						},
					],
				},
				{
					id: `${item.id}-tools-1`,
					kind: "tool",
					title: "tools",
					status: "done",
					stats: [stat("duration", "0.005s")],
					children: [
						{
							id: `${item.id}-get_documents_index`,
							kind: "tool",
							title: "get_documents_index",
							status: "done",
							stats: [stat("duration", "0.001s")],
						},
					],
				},
				{
					id: `${item.id}-tools-2`,
					kind: "tool",
					title: "tools",
					status: "done",
					stats: [stat("duration", "0.02s")],
					children: [
						{
							id: `${item.id}-get_case_context`,
							kind: "tool",
							title: "get_case_context",
							status: "done",
							stats: [stat("duration", "0.02s")],
						},
					],
				},
				{
					id: `${item.id}-tools-3`,
					kind: "tool",
					title: "tools",
					status: "done",
					stats: [stat("duration", "0.03s")],
					children: [
						{
							id: `${item.id}-get_sensor_metadata`,
							kind: "tool",
							title: "get_sensor_metadata",
							status: "done",
							stats: [stat("duration", "0.02s")],
						},
					],
				},
				{
					id: `${item.id}-tools-4`,
					kind: "tool",
					title: "tools",
					status: "done",
					stats: [stat("duration", "0.03s")],
					children: [
						{
							id: `${item.id}-get_cycle_raw_events`,
							kind: "tool",
							title: "get_cycle_raw_events",
							status: "done",
							stats: [stat("duration", "0.03s")],
						},
					],
				},
				{
					id: modelLateId,
					kind: "model",
					title: "model",
					status: done ? "done" : "pending",
					stats: [stat("duration", done ? "2.7s" : "—")],
					children: [
						{
							id: `${modelLateId}-openai`,
							kind: "model",
							title: "ChatOpenAI",
							status: done ? "done" : "pending",
							detail: "openai/gpt-4o-mini",
							stats: [stat("tokens", "#19525")],
						},
					],
				},
			],
		},
	];
};

const buildSpanDetails = (
	item: Case,
	done: boolean,
): Record<string, SpanDetail> => {
	const agentId = `${item.id}-chat_agent`;
	const modelEarlyId = `${item.id}-model-early`;

	return {
		[agentId]: {
			id: agentId,
			kind: "group",
			title: "chat_agent",
			status: done ? "done" : "active",
			startedAt: "23 Sep 2026, 12:46 PM",
			duration: done ? "6.4s" : "3.1s",
			cost: "<$0.01",
			tags: ["chat_agent", "il", "start"],
			input:
				"[system] Bắt đầu hỏi annotation mới. Lý do trigger: Không có case tương tự nào đã được gán nhãn cho inquiry này.",
			output:
				"Hệ thống đã quan sát được từ **Cảm biến Điện** tại phòng họp, trong khoảng thời gian từ **9:00 đến 9:18** sáng ngày **21 tháng 9 năm 2026**. Trong thời gian này, công suất điện được ghi nhận có dấu hiệu bất thường với mức tiêu thụ lên tới **105.2 W**.\n\nXin hỏi bạn vào thời điểm này, bạn có thể cho biết mình đang làm gì không?",
			metadata: [
				stat("providers", "openai"),
				stat("model", "gpt-4o-mini"),
				stat("created_from", "langchain"),
				stat("ls_integration", "langchain_create_agent"),
				stat("lc_agent_name", "chat_agent"),
				stat("thread_id", "7086301357:2026-09-23 08:30:00+00:00"),
			],
			tokenUsage: [
				stat("completion_tokens", "164"),
				stat("prompt_tokens", "1600"),
				stat("total_tokens", "1764"),
			],
			messages: [
				{
					id: `${item.id}-m1`,
					role: "human",
					text: "[system] Bắt đầu hỏi annotation mới.",
				},
				{
					id: `${item.id}-m2`,
					role: "ai",
					text: "Gọi tool để nạp ngữ cảnh case.",
				},
				{
					id: `${item.id}-m3`,
					role: "tool",
					toolName: "get_documents_index",
				},
				{
					id: `${item.id}-m4`,
					role: "tool",
					toolName: "get_case_context",
				},
				{
					id: `${item.id}-m5`,
					role: "tool",
					toolName: "get_sensor_metadata",
				},
				{
					id: `${item.id}-m6`,
					role: "tool",
					toolName: "get_cycle_raw_events",
				},
				{
					id: `${item.id}-m7`,
					role: "ai",
					text: "Hỏi cư dân về hoạt động trong khoảng 9:00–9:18.",
				},
			],
		},
		[modelEarlyId]: {
			id: modelEarlyId,
			kind: "model",
			title: "model",
			status: "done",
			duration: "3.6s",
			tags: ["model"],
			metadata: [
				stat("model", "openai/gpt-4o-mini"),
				stat("created_from", "langchain"),
			],
			tokenUsage: [stat("total_tokens", "1764")],
		},
		[`${item.id}-get_documents_index`]: {
			id: `${item.id}-get_documents_index`,
			kind: "tool",
			title: "get_documents_index",
			status: "done",
			duration: "0.001s",
			tags: ["tool", "rag"],
			input: "{ query: 'inquiry_guidelines_occupancy' }",
			output: "{ found: 3, top_document: 'meeting_room_guidelines.md' }",
			metadata: [
				stat("tool", "get_documents_index"),
				stat("status", "success"),
			],
		},
		[`${item.id}-get_case_context`]: {
			id: `${item.id}-get_case_context`,
			kind: "tool",
			title: "get_case_context",
			status: "done",
			duration: "0.02s",
			tags: ["tool", "context"],
			input: `{\n  "case_id": "${item.id}",\n  "experiment_id": "${item.experiment_id}"\n}`,
			output: `{\n  "device": "${getCaseDeviceName(item)}",\n  "t_start": "${item.t_start}",\n  "t_end": "${item.t_end ?? "—"}",\n  "peak_w": ${item.evidence?.peak_w ?? 105.2}\n}`,
			metadata: [stat("tool", "get_case_context"), stat("status", "success")],
		},
		[`${item.id}-get_sensor_metadata`]: {
			id: `${item.id}-get_sensor_metadata`,
			kind: "tool",
			title: "get_sensor_metadata",
			status: "done",
			duration: "0.02s",
			tags: ["tool", "sensors"],
			input: `{\n  "source_key": "${item.metadata?.source_key || "sensor.z4_meeting_plug_tv_power"}"\n}`,
			output:
				'{\n  "name": "Z4 Meeting Plug TV Power",\n  "sensor_type": "power_meter",\n  "unit": "W"\n}',
			metadata: [
				stat("tool", "get_sensor_metadata"),
				stat("status", "success"),
			],
		},
		[`${item.id}-get_cycle_raw_events`]: {
			id: `${item.id}-get_cycle_raw_events`,
			kind: "tool",
			title: "get_cycle_raw_events",
			status: "done",
			duration: "0.03s",
			tags: ["tool", "telemetry"],
			input: `{\n  "start": "${item.t_start}",\n  "end": "${item.t_end ?? "—"}",\n  "n_samples": 18\n}`,
			output:
				'{\n  "mean_w": 52.72,\n  "peak_w": 105.2,\n  "uncertainty_s": 60\n}',
			metadata: [
				stat("tool", "get_cycle_raw_events"),
				stat("status", "success"),
			],
		},
	};
};

/** Biến một case thật thành entry copilot với hội thoại + trace mẫu. */
export const buildCopilotCase = (item: Case, index = 0): CopilotCase => {
	const done =
		item.status === "complete" ||
		item.status === "annotated" ||
		item.status === "answered";
	return {
		item,
		device: getCaseDeviceName(item, index),
		turns: done ? completeTurns(item) : askedTurns(item),
		trace: buildTrace(item, done),
		spanDetails: buildSpanDetails(item, done),
	};
};

/** Hàng đợi mẫu, dùng khi chưa có case thật để xem thử giao diện. */
export const SAMPLE_QUEUE: CopilotCase[] = [
	buildCopilotCase(
		sampleCase({
			id: "case-dishwasher",
			status: "asked",
			t_start: "2026-09-24T12:05:00.000Z",
			t_end: "2026-09-24T12:45:00.000Z",
		}),
		0,
	),
	buildCopilotCase(
		sampleCase({
			id: "case-meeting",
			status: "asked",
			t_start: "2026-09-24T16:00:00.000Z",
			t_end: "2026-09-24T16:18:00.000Z",
		}),
		1,
	),
	buildCopilotCase(
		sampleCase({
			id: "case-microwave",
			status: "complete",
			t_start: "2026-09-24T12:05:00.000Z",
			t_end: "2026-09-24T12:12:00.000Z",
		}),
		2,
	),
];
