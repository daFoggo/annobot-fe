import { Badge } from "@/components/ui/badge";
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
	if (counts.auto_filled > 0)
		return `${counts.auto_filled} annotations proposed by neighbourhood propagation.`;
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
	const total = cases.length;

	return (
		<Card className={className}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="text-sm font-semibold">
						Case lifecycle
					</CardTitle>
					<Badge variant="secondary" className="font-mono text-xs shrink-0">
						{total} {total === 1 ? "episode" : "episodes"}
					</Badge>
				</div>
				<CardDescription className="text-xs">
					{reading(counts, total)}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{/* Segmented multi-stage progress bar */}
				<div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60 gap-0.5">
					{total === 0 ? (
						<div className="h-full w-full bg-muted/80 rounded-full" />
					) : (
						STAGE_ORDER.map((stage) => {
							const count = counts[stage];
							if (count === 0) return null;
							const pct = (count / total) * 100;
							const meta = stageMeta(stage);
							return (
								<Tooltip key={stage}>
									<TooltipTrigger
										render={
											<div
												style={{
													width: `${pct}%`,
													backgroundColor: meta.color,
												}}
												className="h-full transition-all hover:opacity-85 cursor-pointer first:rounded-l-full last:rounded-r-full"
											/>
										}
									/>
									<TooltipContent
										side="top"
										className="max-w-64 font-mono text-xs"
									>
										<span className="font-semibold">{meta.label}</span>: {count}{" "}
										({Math.round(pct)}%)
										<div className="text-muted-foreground text-2xs mt-0.5 font-sans">
											{meta.hint}
										</div>
									</TooltipContent>
								</Tooltip>
							);
						})
					)}
				</div>

				{/* Responsive wrap pill badges */}
				<div className="flex flex-wrap items-center gap-2 pt-0.5">
					{STAGE_ORDER.map((stage) => {
						const meta = stageMeta(stage);
						const count = counts[stage];
						const pct = total > 0 ? Math.round((count / total) * 100) : 0;
						return (
							<Tooltip key={stage}>
								<TooltipTrigger
									render={
										<div
											className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition-colors cursor-default select-none ${
												count > 0
													? "border-border/80 bg-muted/30 hover:bg-muted/60"
													: "border-border/40 bg-muted/10 opacity-70 hover:opacity-100"
											}`}
										>
											<StageDot stage={stage} />
											<span className="text-muted-foreground whitespace-nowrap">
												{meta.label}
											</span>
											<span className="font-mono font-semibold text-foreground tabular-nums ml-0.5">
												{count}
											</span>
										</div>
									}
								/>
								<TooltipContent side="bottom" className="max-w-64">
									<div className="flex flex-col gap-0.5 text-xs">
										<div className="font-semibold text-foreground">
											{meta.label}: {count} ({pct}%)
										</div>
										<div className="text-muted-foreground font-sans">
											{meta.hint}
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
};
