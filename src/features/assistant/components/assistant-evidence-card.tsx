import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CaseSummary } from "../schemas";

export interface AssistantEvidenceCardProps {
	caseData?: CaseSummary | null;
	evidence?: Record<string, unknown> | null;
	className?: string;
}

export function AssistantEvidenceCard({
	caseData,
	evidence,
	className,
}: AssistantEvidenceCardProps) {
	if (!caseData && !evidence) return null;

	const formatTime = (iso?: string | null) => {
		if (!iso) return "";
		try {
			return new Date(iso).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
		} catch {
			return "";
		}
	};

	const startTime = formatTime(caseData?.t_start);
	const endTime = formatTime(caseData?.t_end);
	const duration = caseData?.duration_minutes
		? `${Math.round(caseData.duration_minutes)} min`
		: null;

	const detectionLabel = caseData?.detection_key
		? caseData.detection_key
				.replace(/_/g, " ")
				.replace(/\b\w/g, (c) => c.toUpperCase())
		: "Observed Event";

	const peakPower =
		typeof evidence?.peak_w === "number"
			? `${evidence.peak_w.toFixed(1)} W`
			: typeof evidence?.peak_power_w === "number"
				? `${evidence.peak_power_w.toFixed(1)} W`
				: null;

	const avgPower =
		typeof evidence?.mean_w === "number"
			? `${evidence.mean_w.toFixed(1)} W`
			: typeof evidence?.avg_power_w === "number"
				? `${evidence.avg_power_w.toFixed(1)} W`
				: typeof evidence?.power_w === "number"
					? `${evidence.power_w.toFixed(1)} W`
					: null;

	const energy =
		typeof evidence?.energy_wh_integrated === "number"
			? `${evidence.energy_wh_integrated.toFixed(1)} Wh`
			: typeof evidence?.energy_wh === "number"
				? `${evidence.energy_wh.toFixed(1)} Wh`
				: null;

	const sampleCount =
		typeof evidence?.n_samples === "number" ? `${evidence.n_samples}` : null;

	return (
		<Card size="sm" className={className}>
			<CardHeader className="pb-2">
				<CardTitle className="text-xs font-mono font-medium flex items-center justify-between text-muted-foreground">
					<div className="flex items-center gap-1.5">
						<Badge variant="outline" className="font-mono text-xs">
							{detectionLabel}
						</Badge>
						<span>
							{startTime && endTime
								? `${startTime}–${endTime}`
								: "Episode Window"}
						</span>
					</div>
					{duration ? (
						<span className="font-mono text-foreground font-semibold">
							{duration}
						</span>
					) : null}
				</CardTitle>
			</CardHeader>
			<CardContent className="text-xs font-mono pt-0">
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/50 text-foreground">
					{peakPower ? (
						<div className="flex flex-col">
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								Peak Power
							</span>
							<span className="font-semibold">{peakPower}</span>
						</div>
					) : null}
					{avgPower ? (
						<div className="flex flex-col">
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								Avg Power
							</span>
							<span className="font-semibold">{avgPower}</span>
						</div>
					) : null}
					{energy ? (
						<div className="flex flex-col">
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								Energy
							</span>
							<span className="font-semibold">{energy}</span>
						</div>
					) : null}
					{sampleCount ? (
						<div className="flex flex-col">
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								Samples
							</span>
							<span className="font-semibold">{sampleCount}</span>
						</div>
					) : null}
					{evidence?.temperature != null ? (
						<div className="flex flex-col">
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								Temperature
							</span>
							<span className="font-semibold">
								{String(evidence.temperature)}°C
							</span>
						</div>
					) : null}
					{evidence?.co2 != null ? (
						<div className="flex flex-col">
							<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
								CO₂
							</span>
							<span className="font-semibold">{String(evidence.co2)} ppm</span>
						</div>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
