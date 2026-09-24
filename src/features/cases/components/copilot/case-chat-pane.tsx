import { IconRobot, IconSend, IconSparkles } from "@tabler/icons-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageHeader,
} from "@/components/ui/message";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
	AnnotationSummaryCard,
	CaseQuestionnaire,
	QcConflictCard,
} from "./case-copilot-rich";
import { InspectTurn } from "./case-inspect-turn";
import type { CopilotTurn, RichBlock } from "./types";

const renderBlock = (
	block: RichBlock,
	onAnswer: (answers: Record<string, string | string[]>) => void,
) => {
	switch (block.kind) {
		case "questionnaire":
			return <CaseQuestionnaire items={block.items} onAnswer={onAnswer} />;
		case "qc-conflict":
			return <QcConflictCard conflict={block.conflict} />;
		case "annotation-summary":
			return <AnnotationSummaryCard summary={block.summary} />;
	}
};

const answersToText = (answers: Record<string, string | string[]>) => {
	const first = Object.values(answers)[0];
	if (Array.isArray(first)) return first.join(", ");
	return first ?? "";
};

const stamp = () =>
	new Date().toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	});

export interface CaseChatPaneProps {
	device: string;
	initialTurns: CopilotTurn[];
	/** Bật khi case đã hoàn tất: ẩn composer, hiện trạng thái đóng. */
	done?: boolean;
}

/**
 * Chat pane: hội thoại với case agent + composer. Agent hiển thị theo kiểu
 * "inspect" (prose + hành động, kiểu Opik); cư dân vẫn dùng bubble. Dữ liệu
 * hiện là mẫu cục bộ; khi có backend thì `initialTurns` đến từ
 * `GET /cases/{id}/messages` và `send` gọi `POST /cases/{id}/chat`.
 */
export const CaseChatPane = ({
	device,
	initialTurns,
	done = false,
}: CaseChatPaneProps) => {
	const [turns, setTurns] = React.useState<CopilotTurn[]>(initialTurns);
	const [draft, setDraft] = React.useState("");

	const send = (text: string) => {
		const value = text.trim();
		if (value.length === 0) return;
		const time = stamp();
		const userTurn: CopilotTurn = {
			id: crypto.randomUUID(),
			role: "user",
			text: value,
			time,
		};
		const agentTurn: CopilotTurn = {
			id: crypto.randomUUID(),
			role: "agent",
			text: "Đã ghi nhận. (Bản mẫu — phản hồi thật sẽ do case agent sinh ra.)",
			time,
		};
		setTurns((current) => [...current, userTurn, agentTurn]);
		setDraft("");
	};

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		send(draft);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			send(draft);
		}
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<MessageScrollerProvider autoScroll>
				<MessageScroller className="min-h-0 flex-1">
					<MessageScrollerViewport>
						<MessageScrollerContent className="p-4">
							<Marker variant="separator">
								<MarkerIcon>
									<IconSparkles />
								</MarkerIcon>
								<MarkerContent>{device}</MarkerContent>
							</Marker>
							{turns.map((turn) => (
								<MessageScrollerItem
									key={turn.id}
									messageId={turn.id}
									scrollAnchor={turn.role === "user"}
								>
									<div className="flex flex-col gap-3">
										<InspectTurn turn={turn} />
										{turn.block
											? renderBlock(turn.block, (answers) =>
													send(answersToText(answers)),
												)
											: null}
									</div>
								</MessageScrollerItem>
							))}
						</MessageScrollerContent>
					</MessageScrollerViewport>
					<MessageScrollerButton />
				</MessageScroller>
			</MessageScrollerProvider>

			{done ? (
				<div className="border-t p-3">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Avatar size="sm">
							<AvatarFallback>
								<IconRobot />
							</AvatarFallback>
						</Avatar>
						Case đã gán nhãn xong. Mở tab Trace để xem lại cách agent kết luận.
					</div>
				</div>
			) : (
				<form className="border-t p-3" onSubmit={handleSubmit}>
					<InputGroup>
						<InputGroupTextarea
							placeholder="Trả lời AnnoBot…"
							value={draft}
							rows={2}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={handleKeyDown}
						/>
						<InputGroupAddon align="block-end" className="justify-between">
							<InputGroupText>
								Enter để gửi · Shift + Enter xuống dòng
							</InputGroupText>
							<InputGroupButton
								type="submit"
								variant="default"
								size="icon-sm"
								aria-label="Gửi"
								disabled={draft.trim().length === 0}
							>
								<IconSend />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</form>
			)}
		</div>
	);
};

/** Bubble cho lượt cư dân, tách riêng để pane chat không tự dựng markup. */
export const UserBubble = ({ text }: { text: string }) => (
	<Message align="end">
		<MessageAvatar>
			<Avatar size="sm">
				<AvatarFallback>Bạn</AvatarFallback>
			</Avatar>
		</MessageAvatar>
		<MessageContent>
			<MessageHeader>Bạn</MessageHeader>
			<Bubble variant="default" align="end">
				<BubbleContent>{text}</BubbleContent>
			</Bubble>
		</MessageContent>
	</Message>
);
