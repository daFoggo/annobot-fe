import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	type CaseStage,
	countByStage,
	STAGE_ORDER,
	stageMeta,
} from "../lifecycle";
import type { Case } from "../schemas";
import { StageDot } from "./case-status-badge";

/**
 * Vòng đời case đọc thành một dòng, thay cho bốn thẻ KPI cũ. Bốn thẻ đó chỉ đọc
 * lại cấu hình vừa nhập; cái này nói experiment đang tắc ở đâu.
 */

const reading = (counts: Record<CaseStage, number>, total: number): string => {
	if (total === 0)
		return "No cases detected yet. Check the sensors and the detection window.";
	if (counts.answered > 0)
		return `${counts.answered} annotations collected. Density uses them to ask less next time.`;
	if (counts.asked > 0) return "A question is out, waiting for a reply.";
	if (counts.waiting > 0)
		return `${counts.waiting} cases queued. IL asks on its own cadence, inside the ask window.`;
	if (counts.dropped > 0)
		return "Every case was skipped or expired without an answer.";
	return "Every case closed itself: sensor evidence already answers the question.";
};

export interface CaseFunnelProps {
	cases: Case[];
	className?: string;
}

export const CaseFunnel = ({ cases, className }: CaseFunnelProps) => {
	const counts = countByStage(cases);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="text-sm">Case lifecycle</CardTitle>
				<CardDescription className="text-xs">
					{reading(counts, cases.length)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
					{STAGE_ORDER.map((stage) => {
						const meta = stageMeta(stage);
						return (
							<Tooltip key={stage}>
								<TooltipTrigger
									render={
										<div className="flex flex-col gap-0.5 text-left">
											<dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
												<StageDot stage={stage} />
												{meta.label}
											</dt>
											<dd className="font-mono text-lg font-semibold tabular-nums">
												{counts[stage]}
											</dd>
										</div>
									}
								/>
								<TooltipContent side="bottom" className="max-w-64">
									{meta.hint}
								</TooltipContent>
							</Tooltip>
						);
					})}
				</dl>
			</CardContent>
		</Card>
	);
};
