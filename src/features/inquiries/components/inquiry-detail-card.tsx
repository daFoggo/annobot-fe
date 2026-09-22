"use client";

import { IconHelp, IconSparkles } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSensorIcon } from "@/features/sensors";
import type { Inquiry } from "../schemas";

interface LearnedParams {
	pOn: number;
	pOff: number;
	gap: number;
}

function extractLearned(
	rule: Record<string, unknown> | null | undefined,
): LearnedParams | null {
	if (!rule) return null;
	const learned = rule.learned as Record<string, unknown> | null | undefined;
	if (!learned) return null;
	const pOn = learned.power_on_threshold_w;
	const pOff = learned.power_off_threshold_w;
	const gap = learned.max_gap_min;
	if (
		typeof pOn !== "number" ||
		typeof pOff !== "number" ||
		typeof gap !== "number"
	) {
		return null;
	}
	return { pOn, pOff, gap };
}

/**
 * Card chi tiết một inquiry: câu hỏi Q, badge loại, mục tiêu Γ, các sensor
 * đã gán dạng tag, và thông báo AI Calibrated nếu `detection_rule.learned` có.
 */
export const InquiryDetailCard = ({ inquiry }: { inquiry: Inquiry }) => {
	const type = inquiry.type ?? "appliance";
	const learned = extractLearned(inquiry.detection_rule);

	return (
		<Card>
			<CardHeader className="gap-2">
				<CardTitle className="flex items-start justify-between gap-3">
					<span className="flex min-w-0 items-center gap-2">
						<IconHelp className="size-4 shrink-0 text-muted-foreground" />
						<span className="truncate">
							{inquiry.question || "Untitled inquiry"}
						</span>
					</span>
					<Badge variant="secondary" className="shrink-0 capitalize">
						{type}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{inquiry.goal_gamma ? (
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-foreground">Goal Γ:</span>{" "}
						{inquiry.goal_gamma}
					</p>
				) : null}

				{learned ? (
					<div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
						<IconSparkles className="size-3.5 shrink-0 text-amber-500" />
						<span>
							AI Calibrated: On &gt; {learned.pOn}W, Off &lt; {learned.pOff}W,
							Max gap {learned.gap}m
						</span>
					</div>
				) : null}

				{inquiry.sensors.length > 0 ? (
					<div className="flex flex-wrap gap-1.5">
						{inquiry.sensors.map((sensor) => {
							const Icon = getSensorIcon(sensor.source_key, sensor.sensor_type);
							return (
								<Badge
									key={sensor.id}
									variant="outline"
									className="gap-1.5 py-1"
								>
									<Icon className="size-3" />
									<span className="max-w-40 truncate">{sensor.name}</span>
								</Badge>
							);
						})}
					</div>
				) : (
					<p className="text-xs text-muted-foreground">No sensors assigned.</p>
				)}
			</CardContent>
		</Card>
	);
};
