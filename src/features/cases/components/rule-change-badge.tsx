import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Case, RuleChange } from "../schemas";

const PARAM_LABELS: Record<string, { label: string; unit?: string }> = {
	p_on_w: { label: "Turn-on threshold (P_on)", unit: "W" },
	p_off_w: { label: "Turn-off threshold (P_off)", unit: "W" },
	gap_max_min: { label: "Max gap between runs", unit: "min" },
	dur_min_min: { label: "Minimum duration", unit: "min" },
	dur_max_min: { label: "Maximum duration", unit: "min" },
	threshold_method: { label: "Threshold algorithm" },
	gap_method: { label: "Gap algorithm" },
	grid_s: { label: "Grid resolution", unit: "s" },
	energy_min_wh: { label: "Minimum energy", unit: "Wh" },
	energy_max_wh: { label: "Maximum energy", unit: "Wh" },
};

const formatValue = (key: string, val: unknown) => {
	if (val == null) return "—";
	const unit = PARAM_LABELS[key]?.unit;
	if (typeof val === "number") {
		return unit ? `${val} ${unit}` : `${val}`;
	}
	return String(val);
};

const formatDelta = (from: unknown, to: unknown, unit?: string) => {
	if (typeof from === "number" && typeof to === "number") {
		const diff = to - from;
		const sign = diff > 0 ? "+" : "";
		const formatted = diff.toFixed(2).replace(/\.?0+$/, "");
		return (
			<span
				className={
					diff > 0
						? "text-emerald-600 dark:text-emerald-400 font-medium"
						: diff < 0
							? "text-rose-600 dark:text-rose-400 font-medium"
							: "text-muted-foreground"
				}
			>
				{sign}
				{formatted} {unit ?? ""}
			</span>
		);
	}
	return <span className="text-muted-foreground">Updated</span>;
};

export interface RuleChangeBadgeProps {
	item: Case;
	timeLabel?: string;
}

export const RuleChangeBadge = ({ item, timeLabel }: RuleChangeBadgeProps) => {
	const ruleChange: RuleChange | null | undefined = item.rule_change;
	const [open, setOpen] = useState(false);

	if (!ruleChange?.has_changed) {
		return null;
	}

	const diffEntries = Object.entries(ruleChange.diff ?? {});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button
						variant="ghost"
						size="xs"
						className="h-5 px-1.5 text-[11px] font-medium border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300 gap-1 rounded-full cursor-pointer transition-colors"
						title="Detection rule changed at this cycle. Click to inspect changes."
					>
						<IconSparkles className="size-3 text-amber-500 shrink-0" />
						<span>Rule Changed</span>
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
							<IconSparkles className="size-4" />
						</div>
						<DialogTitle>Detection Rule Transition</DialogTitle>
					</div>
					<DialogDescription>
						{timeLabel ? `At cycle ${timeLabel}: ` : ""}
						The cycle detector applied new parameters starting from this case.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 py-1">
					<div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
						Cases prior to this point used earlier parameters. This shift
						reflects automatic re-calibration or an operator update to the
						inquiry's detection rule.
					</div>

					<div className="rounded-md border overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/40 text-xs">
									<TableHead>Parameter</TableHead>
									<TableHead>Previous Cycle</TableHead>
									<TableHead className="w-6 p-0" />
									<TableHead>New Parameter</TableHead>
									<TableHead className="text-right">Change</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className="text-xs">
								{diffEntries.map(([key, delta]) => {
									const meta = PARAM_LABELS[key] ?? { label: key };
									return (
										<TableRow key={key}>
											<TableCell className="font-medium text-foreground">
												{meta.label}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground">
												{formatValue(key, delta.from)}
											</TableCell>
											<TableCell className="p-0 text-center text-muted-foreground">
												<IconArrowRight className="size-3 inline-block opacity-60" />
											</TableCell>
											<TableCell className="font-mono font-medium text-foreground">
												{formatValue(key, delta.to)}
											</TableCell>
											<TableCell className="text-right font-mono">
												{formatDelta(delta.from, delta.to, meta.unit)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
