import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { type CaseStage, stageMeta, stageOf } from "../lifecycle";
import type { CaseStatus } from "../schemas";

interface CaseStatusBadgeProps {
	status: CaseStatus;
}

/**
 * Badge trạng thái case. Hình dạng và typography do `Badge` quyết định — ở đây
 * chỉ chọn `variant`. Chấm màu mang trạng thái vòng đời (semantic, không phải
 * trang trí) và luôn đi kèm nhãn chữ, nên không bao giờ truyền nghĩa bằng riêng
 * màu sắc.
 */
export const CaseStatusBadge = ({ status }: CaseStatusBadgeProps) => {
	const meta = stageMeta(stageOf(status));

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Badge variant="outline" className="gap-1.5">
						<StageDot stage={meta.stage} />
						{meta.label}
					</Badge>
				}
			/>
			<TooltipContent side="top" className="max-w-64">
				{meta.hint}
			</TooltipContent>
		</Tooltip>
	);
};

/** Chấm tròn mang màu của giai đoạn. Shape thuần, không có primitive tương ứng. */
export const StageDot = ({ stage }: { stage: CaseStage }) => (
	<span
		aria-hidden
		className="size-1.5 shrink-0 rounded-full"
		style={{ backgroundColor: stageMeta(stage).color }}
	/>
);
