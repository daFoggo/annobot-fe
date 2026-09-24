import {
	IconRobot,
	IconThumbDown,
	IconThumbUp,
	IconTools,
	IconWaveSine,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageHeader,
} from "@/components/ui/message";
import { Separator } from "@/components/ui/separator";
import { RichText } from "./rich-text";
import type { CopilotTurn } from "./types";

/** Khối system message: nền tint nhạt, tách hẳn với message thường. */
export const SystemMessage = ({ text }: { text: string }) => (
	<div className="rounded-lg border bg-muted/50 px-3 py-2.5">
		<p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
			{text}
		</p>
	</div>
);

/** Hàng hành động dưới mỗi message agent: feedback + link trace/tool calls. */
const MessageActions = () => (
	<div className="flex items-center gap-0.5">
		<Button variant="ghost" size="icon-xs" aria-label="Phản hồi hữu ích">
			<IconThumbUp />
		</Button>
		<Button variant="ghost" size="icon-xs" aria-label="Phản hồi không hữu ích">
			<IconThumbDown />
		</Button>
		<Separator orientation="vertical" className="mx-1 h-4" />
		<Button variant="ghost" size="xs">
			<IconWaveSine data-icon="inline-start" />
			Trace
		</Button>
		<Button variant="ghost" size="xs">
			<IconTools data-icon="inline-start" />
			Tool calls
		</Button>
	</div>
);

export interface InspectTurnProps {
	turn: CopilotTurn;
}

/**
 * Một lượt trong chế độ "inspect" (kiểu Opik Thread):
 * - agent: prose trần, không bubble, có bold + hàng hành động.
 * - user: vẫn dùng bubble để phân biệt người trả lời.
 */
export const InspectTurn = ({ turn }: InspectTurnProps) => {
	const isUser = turn.role === "user";

	if (isUser) {
		return (
			<Message align="end">
				<MessageAvatar>
					<Avatar size="sm">
						<AvatarFallback>Bạn</AvatarFallback>
					</Avatar>
				</MessageAvatar>
				<MessageContent>
					<Bubble variant="default" align="end">
						<BubbleContent>{turn.text}</BubbleContent>
					</Bubble>
					<MessageFooter>{turn.time}</MessageFooter>
				</MessageContent>
			</Message>
		);
	}

	return (
		<Message align="start">
			<MessageAvatar>
				<Avatar size="sm">
					<AvatarFallback>
						<IconRobot />
					</AvatarFallback>
				</Avatar>
			</MessageAvatar>
			<MessageContent>
				<MessageHeader>AnnoBot</MessageHeader>
				<RichText text={turn.text} />
				<MessageFooter className="flex-wrap gap-2">
					<span className="font-mono tabular-nums">{turn.time}</span>
					<MessageActions />
				</MessageFooter>
			</MessageContent>
		</Message>
	);
};
