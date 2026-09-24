import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
	AssistantExperimentContext,
	ChatConversation,
	ChatMessage,
} from "./schemas";

export const DEFAULT_ASSISTANT_WIDTH = 384;
export const MIN_ASSISTANT_WIDTH = 320;
export const MAX_ASSISTANT_WIDTH = 720;

interface AssistantState {
	isOpen: boolean;
	width: number;
	conversations: ChatConversation[];
	activeConversationId: string;
	isGenerating: boolean;
	streamingMessageId: string | null;
}

interface AssistantActions {
	setOpen: (open: boolean) => void;
	toggleOpen: () => void;
	setWidth: (width: number) => void;
	newChat: (experimentId?: string) => string;
	selectConversation: (id: string) => void;
	deleteConversation: (id: string) => void;
	clearActiveChat: () => void;
	sendMessage: (
		content: string,
		context?: AssistantExperimentContext,
	) => Promise<void>;
	stopGenerating: () => void;
}

const generateId = () =>
	`msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const generateConvId = () =>
	`conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const now = new Date();
const timeAgo = (minutesAgo: number) =>
	new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();

const initialMessages: ChatMessage[] = [
	// Turn 1: /analyze
	{
		id: "seed-msg-1",
		role: "user",
		content: "/analyze",
		createdAt: timeAgo(140),
		status: "done",
	},
	{
		id: "seed-msg-2",
		role: "assistant",
		content: `### Experiment Telemetry Analysis: Smart Meter Anomaly Trial

Đang đánh giá hiệu suất mô hình trên **1,420 cửa sổ đo telemetry**:

- **Tỉ lệ nhận diện chính xác**: \`94.8%\` (đạt chuẩn SLA yêu cầu)
- **Độ trễ xử lý trung bình**: \`138ms\`
- **Active Inquiries**: 3 sensor triggers đang hoạt động
- **Tình trạng luồng dữ liệu**: Đồng bộ hoàn tất với 0 frame loss

\`\`\`yaml
evaluation_metrics:
  precision: 0.952
  recall: 0.941
  f1_score: 0.946
  false_positives: 14
  inquiries_dispatched: 48
\`\`\`

Mọi chỉ số đều nằm trong ngưỡng an toàn. Các câu hỏi xác thực (inquiries) đã được gửi đúng khung giờ quy định.`,
		createdAt: timeAgo(139),
		status: "done",
	},

	// Turn 2: Natural query
	{
		id: "seed-msg-3",
		role: "user",
		content:
			"Tại sao độ trễ ở inquiry sensor_pressure_spike lại tăng đột biến vào 14:30?",
		createdAt: timeAgo(125),
		status: "done",
	},
	{
		id: "seed-msg-4",
		role: "assistant",
		content: `Qua phân tích span log tại thời điểm **14:30:12**, tôi phát hiện 2 nguyên nhân chính gây tăng độ trễ:

1. **Batch payload kích thước lớn**: Cụm sensor gửi dồn 320 mẫu đo cùng lúc thay vì chu kỳ 50 mẫu tiêu chuẩn.
2. **Rule validation bottleneck**: Indicator rule \`pressure_spike_v2\` phải thực hiện regex match qua toàn bộ mảng dữ liệu thô.

\`\`\`text
[14:30:12.104] WARN sensor_pressure_spike: queue depth exceeded (320 items > 50 max)
[14:30:12.441] INFO evaluation cycle delayed: latency jumped from 110ms to 480ms
[14:30:12.890] SUCCESS batch processed, 2 candidate cases flagged (#C-4091, #C-4092)
\`\`\`

Sau khi batch được xử lý xong, độ trễ đã tự động hạ về mức bình thường (124ms) lúc 14:31.`,
		createdAt: timeAgo(124),
		status: "done",
	},

	// Turn 3: /cases
	{
		id: "seed-msg-5",
		role: "user",
		content: "/cases",
		createdAt: timeAgo(110),
		status: "done",
	},
	{
		id: "seed-msg-6",
		role: "assistant",
		content: `### Danh sách Candidate Cases gần nhất

Hệ thống ghi nhận **3 ca dị thường** trong phiên đo hiện tại:

1. **Case #C-4091** (14:30:12) — \`pressure_spike_warning\` · Độ tin cậy \`0.92\` · *User đã xác nhận*
2. **Case #C-4092** (14:30:15) — \`power_factor_drop\` · Độ tin cậy \`0.87\` · *Chờ phản hồi*
3. **Case #C-4088** (13:15:00) — \`voltage_fluctuation\` · Độ tin cậy \`0.95\` · *Bình thường*

\`\`\`json
{
  "case_id": "C-4091",
  "indicator": "pressure_spike",
  "sensor_id": "SM-WEST-04",
  "peak_reading": 8.42,
  "threshold": 6.0,
  "user_feedback": "confirmed_abnormal"
}
\`\`\``,
		createdAt: timeAgo(109),
		status: "done",
	},

	// Turn 4: Natural query
	{
		id: "seed-msg-7",
		role: "user",
		content: "Đề xuất cập nhật indicator rule để giảm độ trễ xử lý xem nào?",
		createdAt: timeAgo(95),
		status: "done",
	},
	{
		id: "seed-msg-8",
		role: "assistant",
		content: `Để tránh nghẽn hàng đợi khi sensor gửi batch lớn, bạn nên áp dụng kỹ thuật kiểm tra sớm (early exit) kết hợp moving average:

\`\`\`python
# Optimized Rule: Fast Early-Exit Spike Detection
def check_pressure_spike(readings: list[float], threshold: float = 6.0) -> bool:
    # Kiểm tra mẫu mới nhất trước để thoát sớm (giảm 70% thời gian duyệt)
    if readings and readings[-1] > threshold:
        return True
    # Tính moving average chỉ trên 5 mẫu gần nhất
    window = readings[-5:]
    return (sum(window) / len(window)) > threshold
\`\`\`

Cải tiến này giúp giảm thời gian duyệt rule từ \`340ms\` xuống chỉ còn \`18ms\` ngay cả khi hàng đợi đầy.`,
		createdAt: timeAgo(94),
		status: "done",
	},

	// Turn 5: /inquiries
	{
		id: "seed-msg-9",
		role: "user",
		content: "/inquiries",
		createdAt: timeAgo(80),
		status: "done",
	},
	{
		id: "seed-msg-10",
		role: "assistant",
		content: `### Tổng quan Inquiries

Hệ thống đang theo dõi **3 inquiries** trong experiment này:

1. \`pressure_spike_warning\` — kiểm tra áp suất bất thường trên cụm SM-WEST
2. \`power_factor_drop\` — phát hiện suy giảm hệ số công suất kéo dài
3. \`voltage_fluctuation\` — ghi nhận dao động điện áp ngoài biên cho phép

\`\`\`json
{
  "inquiry_id": "inq_pressure_spike",
  "indicator": "pressure_spike_v2",
  "ask_window": "09:00 - 21:00",
  "max_asks_per_day": 10,
  "timestep_minutes": 30
}
\`\`\`

Khung giờ hỏi hiện tại là \`09:00 - 21:00\`, tối đa \`10\` câu mỗi ngày cho mỗi inquiry.`,
		createdAt: timeAgo(79),
		status: "done",
	},

	// Turn 6: Natural comparison query
	{
		id: "seed-msg-11",
		role: "user",
		content:
			"So sánh precision và recall giữa pressure_spike_v1 và v2 trong 7 ngày gần nhất.",
		createdAt: timeAgo(65),
		status: "done",
	},
	{
		id: "seed-msg-12",
		role: "assistant",
		content: `Kết quả đối chiếu hai phiên bản rule trong **7 ngày gần nhất**:

- \`pressure_spike_v1\`: precision \`0.912\`, recall \`0.874\`, false positives \`41\`
- \`pressure_spike_v2\`: precision \`0.952\`, recall \`0.941\`, false positives \`14\`

\`\`\`text
[7d] v1: P=0.912 R=0.874 F1=0.893  (n=312)
[7d] v2: P=0.952 R=0.941 F1=0.946  (n=298)
[7d] delta: +0.040 precision, +0.067 recall, -27 false positives
\`\`\`

Bản v2 cải thiện rõ rệt ở cả hai chiều, chủ yếu nhờ bước early-exit và cửa sổ moving average 5 mẫu. Không ghi nhận regression trên các cụm sensor còn lại.`,
		createdAt: timeAgo(64),
		status: "done",
	},

	// Turn 7: /explain
	{
		id: "seed-msg-13",
		role: "user",
		content: "/explain",
		createdAt: timeAgo(50),
		status: "done",
	},
	{
		id: "seed-msg-14",
		role: "assistant",
		content: `### Cách AnnoBot hoạt động

AnnoBot theo dõi các luồng dữ liệu cảm biến theo thời gian. Khi giá trị đo khớp với **indicator rule** đã định nghĩa trong một inquiry:

1. Sự kiện được ghi nhận thành **candidate case**.
2. Trong **interactive learning window**, AnnoBot gửi câu hỏi xác thực cho người dùng.
3. Câu trả lời được lưu thành annotation ground truth để đánh giá mô hình.

> Ngưỡng, khung giờ hỏi và số câu hỏi tối đa mỗi ngày đều cấu hình được trong tab Setup.`,
		createdAt: timeAgo(49),
		status: "done",
	},

	// Turn 8: Natural multi-line message
	{
		id: "seed-msg-15",
		role: "user",
		content: `Chuẩn bị báo cáo cho team vận hành:
- Tóm tắt tình trạng experiment hiện tại
- Các case đang chờ xác nhận
- Đề xuất bước tiếp theo`,
		createdAt: timeAgo(35),
		status: "done",
	},
	{
		id: "seed-msg-16",
		role: "assistant",
		content: `### Báo cáo nhanh cho team vận hành

**Tình trạng experiment**
- Pipeline ổn định, độ trễ trung bình \`138ms\`, không có frame loss.
- Precision \`0.952\`, recall \`0.941\` trong 7 ngày gần nhất.

**Case đang chờ xác nhận**
- \`#C-4092\` — \`power_factor_drop\` · độ tin cậy \`0.87\` · cần phản hồi trước 21:00.
- 2 case khác đã được xác nhận và đưa vào tập ground truth.

**Đề xuất bước tiếp theo**
1. Xác nhận \`#C-4092\` trong khung giờ hỏi hôm nay.
2. Theo dõi cụm SM-WEST-04 sau khi áp dụng rule v2.
3. Lên lịch rà soát ngưỡng định kỳ vào cuối tuần.`,
		createdAt: timeAgo(34),
		status: "done",
	},

	// Turn 9: /analyze with argument
	{
		id: "seed-msg-17",
		role: "user",
		content: "/analyze window=7d",
		createdAt: timeAgo(20),
		status: "done",
	},
	{
		id: "seed-msg-18",
		role: "assistant",
		content: `### Phân tích 7 ngày gần nhất

- **Tổng số cửa sổ đo**: \`9,840\`
- **Candidate cases**: \`126\` (giảm \`18%\` so với tuần trước)
- **Câu hỏi đã gửi**: \`48\` / \`70\` hạn mức
- **Tỉ lệ phản hồi**: \`92.4%\`

\`\`\`yaml
weekly_summary:
  windows: 9840
  candidate_cases: 126
  confirmed_anomalies: 37
  dismissed: 89
  avg_latency_ms: 138
\`\`\`

Xu hướng đang tốt lên: số case giảm trong khi precision tăng, nghĩa là rule v2 đang lọc nhiễu hiệu quả hơn.`,
		createdAt: timeAgo(19),
		status: "done",
	},

	// Turn 10: Natural follow-up
	{
		id: "seed-msg-19",
		role: "user",
		content: "Có nên tăng ngưỡng pressure_spike từ 6.0 lên 6.5 không?",
		createdAt: timeAgo(5),
		status: "done",
	},
	{
		id: "seed-msg-20",
		role: "assistant",
		content: `Không nên tăng ngay lúc này. Dữ liệu 7 ngày cho thấy:

- Ngưỡng \`6.0\` hiện tạo \`14\` false positives, nhưng có \`3\` ca thật nằm trong dải \`6.0 - 6.4\`.
- Nếu nâng lên \`6.5\`, recall sẽ giảm khoảng \`4-6%\` và bỏ sót các ca áp suất tăng chậm.
- Nguyên nhân nhiễu chính là batch lớn chứ không phải ngưỡng.

\`\`\`text
threshold 6.0 -> TP=61 FP=14 FN=4   (recall 0.938)
threshold 6.5 -> TP=57 FP=9  FN=8   (recall 0.877)
\`\`\`

Đề xuất: giữ ngưỡng \`6.0\`, xử lý batch size trước; nếu nhiễu vẫn cao sau 3 ngày thì cân nhắc \`6.2\` kèm điều kiện duy trì 2 chu kỳ liên tiếp.`,
		createdAt: timeAgo(4),
		status: "done",
	},
];

const createDefaultConversation = (experimentId?: string): ChatConversation => {
	const id = generateConvId();
	return {
		id,
		title: "New chat",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		experimentId,
		messages: [],
	};
};

const initialConversation: ChatConversation = {
	id: "conv-initial-demo",
	title: "Smart Meter Telemetry Analysis",
	createdAt: timeAgo(20),
	updatedAt: timeAgo(1),
	messages: initialMessages,
};

/**
 * Tạo câu trả lời thông minh dựa trên context và câu hỏi của user
 */
function buildContextualResponse(
	content: string,
	context?: AssistantExperimentContext,
): string {
	const trimmed = content.trim().toLowerCase();
	const expName = context?.title || "Active Experiment";
	const tab = context?.activeTab ? ` on the ${context.activeTab} page` : "";

	if (trimmed.startsWith("/analyze")) {
		return `### Experiment Analysis: ${expName}\n\nHere is the analysis for **${expName}**${tab}:\n\n- **Service Type**: \`${context?.service ?? "temporary"}\`\n- **Configured Inquiries**: ${context?.inquiriesCount ?? 0} active inquiries\n- **Status**: Pipeline operating within configured ask window.\n- **Recommendation**: Review flagged anomaly cases in the Cases tab to calibrate sensor indicators.`;
	}

	if (trimmed.startsWith("/cases")) {
		return `### Case Review: ${expName}\n\nAnalyzing recognized cases for **${expName}**:\n\n1. **Detected Cases**: Cases are evaluated against indicator rules.\n2. **Pending Inquiries**: Verification questions will be dispatched during the designated inquiry window.\n3. **Quality Gate**: Annotations are compared with sensor ground truths to compute precision & recall metrics.`;
	}

	if (trimmed.startsWith("/inquiries") || trimmed.startsWith("/inquiry")) {
		return `### Inquiries Overview\n\n- **Total Inquiries**: ${context?.inquiriesCount ?? 0}\n- Inquiries define the specific questions posed to users when sensor thresholds or state transitions trigger.\n- Inquiry types include appliance usage, factual verification, and custom performance markers.`;
	}

	if (trimmed.startsWith("/explain")) {
		return `### System Explanation\n\nAnnoBot monitors multi-sensor temporal streams. When sensor readings match the defined **indicator rules** within an inquiry:\n\n1. An event is logged as an **identified candidate case**.\n2. During the **interactive learning window**, AnnoBot prompts the user with targeted questions.\n3. User answers are stored as validated ground truth annotations for evaluation.`;
	}

	// Default intelligent contextual response
	if (context?.title) {
		return `I am analyzing your query in the context of experiment **"${context.title}"**.\n\nYou asked:\n> "${content}"\n\nBased on the current experiment settings (${context.inquiriesCount ?? 0} inquiries configured), everything is tracked properly. You can run \`/analyze\` to inspect metrics or \`/cases\` to review recent classifications.`;
	}

	return `Thank you for your message!\n\n> "${content}"\n\nI can assist you with:\n- Investigating experiment metrics with \`/analyze\`\n- Inspecting detected cases with \`/cases\`\n- Reviewing inquiries with \`/inquiries\`\n- Explaining sensor indicators with \`/explain\``;
}

let activeAbortController: AbortController | null = null;

export const useAssistantStore = create<AssistantState & AssistantActions>()(
	persist(
		(set, get) => ({
			isOpen: false,
			width: DEFAULT_ASSISTANT_WIDTH,
			conversations: [initialConversation],
			activeConversationId: initialConversation.id,
			isGenerating: false,
			streamingMessageId: null,

			setOpen: (open: boolean) => set({ isOpen: open }),
			toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

			setWidth: (width: number) => {
				const clamped = Math.min(
					Math.max(width, MIN_ASSISTANT_WIDTH),
					MAX_ASSISTANT_WIDTH,
				);
				set({ width: clamped });
			},

			newChat: (experimentId?: string) => {
				if (get().isGenerating) {
					get().stopGenerating();
				}
				const conv = createDefaultConversation(experimentId);
				set((state) => ({
					conversations: [conv, ...state.conversations],
					activeConversationId: conv.id,
					isGenerating: false,
					streamingMessageId: null,
				}));
				return conv.id;
			},

			selectConversation: (id: string) => {
				if (get().isGenerating) {
					get().stopGenerating();
				}
				set({ activeConversationId: id, isGenerating: false });
			},

			deleteConversation: (id: string) => {
				set((state) => {
					const filtered = state.conversations.filter((c) => c.id !== id);
					const nextConvs =
						filtered.length > 0 ? filtered : [createDefaultConversation()];
					const nextActiveId =
						state.activeConversationId === id
							? nextConvs[0].id
							: state.activeConversationId;
					return {
						conversations: nextConvs,
						activeConversationId: nextActiveId,
					};
				});
			},

			clearActiveChat: () => {
				const { activeConversationId, conversations } = get();
				set({
					conversations: conversations.map((conv) =>
						conv.id === activeConversationId
							? {
									...conv,
									title: "New chat",
									messages: [],
									updatedAt: new Date().toISOString(),
								}
							: conv,
					),
					isGenerating: false,
					streamingMessageId: null,
				});
			},

			stopGenerating: () => {
				if (activeAbortController) {
					activeAbortController.abort();
					activeAbortController = null;
				}
				set({ isGenerating: false, streamingMessageId: null });
			},

			sendMessage: async (
				content: string,
				context?: AssistantExperimentContext,
			) => {
				const text = content.trim();
				if (!text) return;

				const { activeConversationId, conversations, isGenerating } = get();
				if (isGenerating) return;

				const existingConv = conversations.find(
					(c) => c.id === activeConversationId,
				);
				const activeConv =
					existingConv ?? createDefaultConversation(context?.experimentId);
				const convId = activeConv.id;

				if (!existingConv) {
					set((s) => ({
						conversations: [activeConv, ...s.conversations],
						activeConversationId: convId,
					}));
				}

				const userMsgId = generateId();
				const userMessage: ChatMessage = {
					id: userMsgId,
					role: "user",
					content: text,
					createdAt: new Date().toISOString(),
					status: "done",
					experimentId: context?.experimentId,
				};

				const botMsgId = generateId();
				const botMessage: ChatMessage = {
					id: botMsgId,
					role: "assistant",
					content: "",
					createdAt: new Date().toISOString(),
					status: "streaming",
					experimentId: context?.experimentId,
				};

				// Cập nhật title của conversation nếu đây là tin nhắn đầu tiên
				const shouldUpdateTitle = activeConv.messages.length === 0;
				const newTitle = shouldUpdateTitle
					? text.length > 28
						? `${text.slice(0, 25)}...`
						: text
					: activeConv.title;

				set((state) => ({
					conversations: state.conversations.map((c) =>
						c.id === convId
							? {
									...c,
									title: newTitle,
									updatedAt: new Date().toISOString(),
									messages: [...c.messages, userMessage, botMessage],
								}
							: c,
					),
					isGenerating: true,
					streamingMessageId: botMsgId,
				}));

				const fullResponse = buildContextualResponse(text, context);
				const controller = new AbortController();
				activeAbortController = controller;

				try {
					// Mô phỏng streaming mượt mà từng chunk
					const chunkSize = 4;
					let currentIdx = 0;

					while (currentIdx < fullResponse.length) {
						if (controller.signal.aborted) {
							break;
						}

						currentIdx = Math.min(currentIdx + chunkSize, fullResponse.length);
						const partial = fullResponse.slice(0, currentIdx);

						set((state) => ({
							conversations: state.conversations.map((c) =>
								c.id === convId
									? {
											...c,
											messages: c.messages.map((m) =>
												m.id === botMsgId
													? {
															...m,
															content: partial,
															status:
																currentIdx >= fullResponse.length
																	? "done"
																	: "streaming",
														}
													: m,
											),
										}
									: c,
							),
						}));

						// Độ trễ ngẫu nhiên giữa các token (15-30ms) để giống LLM streaming
						await new Promise((r) => setTimeout(r, 16 + Math.random() * 14));
					}
				} catch {
					// Fallback on error
				} finally {
					if (activeAbortController === controller) {
						activeAbortController = null;
					}
					set((state) => ({
						isGenerating: false,
						streamingMessageId: null,
						conversations: state.conversations.map((c) =>
							c.id === convId
								? {
										...c,
										messages: c.messages.map((m) =>
											m.id === botMsgId ? { ...m, status: "done" } : m,
										),
									}
								: c,
						),
					}));
				}
			},
		}),
		{
			name: "annobot_assistant_ui_v3",
			partialize: (state) => ({
				isOpen: state.isOpen,
				width: state.width,
				conversations: state.conversations,
				activeConversationId: state.activeConversationId,
			}),
		},
	),
);

// Atomic selectors để tránh re-render không cần thiết theo đúng Handbook 08
export const useAssistantIsOpen = () => useAssistantStore((s) => s.isOpen);
export const useAssistantWidth = () => useAssistantStore((s) => s.width);
export const useAssistantIsGenerating = () =>
	useAssistantStore((s) => s.isGenerating);
export const useAssistantConversations = () =>
	useAssistantStore((s) => s.conversations);
export const useAssistantActiveConversationId = () =>
	useAssistantStore((s) => s.activeConversationId);
export const useAssistantActiveConversation = () =>
	useAssistantStore((s) =>
		s.conversations.find((c) => c.id === s.activeConversationId),
	);
