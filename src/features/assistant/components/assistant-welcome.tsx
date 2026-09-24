import { IconSparkles } from "@tabler/icons-react";
import { useOptionalAssistantContext } from "../context";
import type { AssistantExperimentContext } from "../schemas";

export interface AssistantWelcomeProps {
	context?: AssistantExperimentContext;
	onSelectPrompt?: (prompt: string) => void;
}

/**
 * Empty state khi thread chưa có tin nhắn. Chỉ hiện thông tin thật từ inbox —
 * không còn lệnh /analyze... mock cũ.
 */
export function AssistantWelcome(_props: AssistantWelcomeProps = {}) {
	const ctx = useOptionalAssistantContext();
	const pendingCount = ctx?.state.pendingCount ?? 0;

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center font-mono text-xs text-muted-foreground">
			<IconSparkles className="size-5 text-primary" />
			<p>Không có hội thoại nào đang mở.</p>
			{pendingCount > 0 ? (
				<p>Bạn có {pendingCount} yêu cầu annotation đang chờ trong inbox.</p>
			) : (
				<p>Câu hỏi annotation mới sẽ xuất hiện tại đây.</p>
			)}
		</div>
	);
}
