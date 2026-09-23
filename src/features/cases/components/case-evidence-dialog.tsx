import { IconInfoCircle, IconSparkles } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { indicatorValue } from "../lifecycle";
import type { Case } from "../schemas";

/**
 * Bằng chứng nhận diện của một case: ngưỡng nào đã cắt ra nó, và con số nó đưa
 * ra có khớp với công tơ không.
 *
 * Phần đối chiếu năng lượng là phép kiểm chứng độc lập không cần annotation:
 * `evidence.energy_wh_integrated` là engine tích phân công suất, còn indicator
 * `energy_wh` đọc từ công tơ tích luỹ. Hai nguồn độc lập khớp nhau thì ranh giới
 * `[t_start, t_end]` là đúng. Bản nghiên cứu đo tay được +5…+9% trên 7/9 thiết bị.
 */

interface AppliedParams {
	threshold_method?: string;
	gap_method?: string;
	p_on_w?: number;
	p_off_w?: number;
	gap_max_min?: number;
	dur_min_min?: number;
	dur_max_min?: number | null;
	grid_s?: number;
	gap_hold_h?: number;
}

interface DetectionEvidence {
	applied_params?: AppliedParams;
	flags?: string[];
	uncertainty_s?: number;
	energy_wh_integrated?: number;
	peak_w?: number;
	mean_w?: number;
	n_samples?: number;
	merged_from?: number;
}

const FLAG_LABEL: Record<string, string> = {
	"truncated-start": "Clipped at window start",
	"truncated-end": "Clipped at window end",
	"duration-over-max": "Longer than the outlier cap",
	"energy-over-max": "Above the energy cap",
};

const METHOD_LABEL: Record<string, string> = {
	otsu: "Otsu, auto",
	degenerate: "Could not separate two states",
	"too-few-gaps": "Too few gaps to infer",
};

const num = (value: number | null | undefined, digits = 1) =>
	value == null ? "—" : value.toFixed(digits);

interface CaseEvidenceDialogProps {
	item: Case;
	timeLabel: string;
}

export const CaseEvidenceDialog = ({
	item,
	timeLabel,
}: CaseEvidenceDialogProps) => {
	const evidence = (item.evidence ?? {}) as DetectionEvidence;
	const params = evidence.applied_params ?? {};

	const integrated = evidence.energy_wh_integrated ?? null;
	const metered = indicatorValue(item, "energy_wh");
	const drift =
		integrated != null && metered != null && metered > 0
			? ((integrated - metered) / metered) * 100
			: null;
	// Công tơ chỉ phân giải 0.01 kWh = 10 Wh, nên dưới 50 Wh phần lượng tử hoá
	// lấn át và tỷ lệ lệch không còn ý nghĩa.
	const driftMeaningful = metered != null && metered >= 50;

	return (
		<Dialog>
			<DialogTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label="View detection evidence"
					>
						<IconInfoCircle />
					</Button>
				}
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Detection evidence</DialogTitle>
					<DialogDescription>
						Case {timeLabel}. These are the parameters that produced this
						boundary.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<section className="flex flex-col gap-2">
						<div className="flex items-center justify-between gap-2">
							<h3 className="text-sm font-medium">Thresholds used</h3>
							{params.threshold_method ? (
								<Badge variant="secondary">
									{METHOD_LABEL[params.threshold_method] ??
										params.threshold_method}
								</Badge>
							) : null}
						</div>

						{item.rule_change?.has_changed ? (
							<div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
								<div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300">
									<IconSparkles className="size-3.5 text-amber-500 shrink-0" />
									<span>Detection rule updated at this cycle</span>
								</div>
								<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
									{Object.entries(item.rule_change.diff).map(([key, val]) => (
										<span key={key}>
											<strong className="text-foreground">{key}</strong>:{" "}
											{String(val.from)} &rarr; {String(val.to)}
										</span>
									))}
								</div>
							</div>
						) : item.rule_change?.status === "baseline" ? (
							<div className="rounded-lg border bg-muted/30 p-2 text-xs text-muted-foreground">
								Initial baseline detection parameters for this inquiry.
							</div>
						) : null}

						<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
							<Stat label="p_on" value={`${num(params.p_on_w)} W`} />
							<Stat label="p_off" value={`${num(params.p_off_w)} W`} />
							<Stat label="gap_max" value={`${num(params.gap_max_min)} min`} />
							<Stat label="dur_min" value={`${num(params.dur_min_min)} min`} />
						</dl>
					</section>

					<Separator />

					<section className="flex flex-col gap-2">
						<h3 className="text-sm font-medium">Energy cross-check</h3>
						<p className="text-xs text-muted-foreground">
							Two independent sources: the engine integrating power, and the
							cumulative meter. Agreement means the boundary is right.
						</p>
						<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
							<Stat
								label="Integrated power"
								value={`${num(integrated, 2)} Wh`}
							/>
							<Stat label="Cumulative meter" value={`${num(metered, 2)} Wh`} />
							<Stat
								label="Drift"
								value={
									drift == null
										? "—"
										: `${drift > 0 ? "+" : ""}${drift.toFixed(1)}%`
								}
								hint={
									drift == null
										? undefined
										: driftMeaningful
											? undefined
											: "Case too small; meter resolution dominates"
								}
							/>
						</dl>
					</section>

					<Separator />

					<section className="flex flex-col gap-2">
						<h3 className="text-sm font-medium">Confidence</h3>
						<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
							<Stat
								label="Boundary uncertainty"
								value={
									evidence.uncertainty_s == null
										? "—"
										: `±${evidence.uncertainty_s}s`
								}
							/>
							<Stat label="Samples" value={evidence.n_samples ?? "—"} />
							<Stat
								label="Merged from"
								value={
									evidence.merged_from == null
										? "—"
										: `${evidence.merged_from} runs`
								}
							/>
							<Stat label="Peak" value={`${num(evidence.peak_w)} W`} />
						</dl>
						{evidence.flags && evidence.flags.length > 0 ? (
							<div className="flex flex-wrap gap-1.5">
								{evidence.flags.map((flag) => (
									<Badge key={flag} variant="destructive">
										{FLAG_LABEL[flag] ?? flag}
									</Badge>
								))}
							</div>
						) : (
							<p className="text-xs text-muted-foreground">No warning flags.</p>
						)}
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const Stat = ({
	label,
	value,
	hint,
}: {
	label: string;
	value: string | number;
	hint?: string;
}) => (
	<div className="flex flex-col gap-0.5">
		<dt className="text-xs text-muted-foreground">{label}</dt>
		<dd className="font-mono text-sm tabular-nums">{value}</dd>
		{hint ? (
			<span className="text-xs text-muted-foreground">{hint}</span>
		) : null}
	</div>
);
