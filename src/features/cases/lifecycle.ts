import type { Case, CaseStatus } from "./schemas";

/**
 * Case lifecycle: the 11 database statuses folded into 5 observable stages.
 *
 * Detection writes a case as `closed` (an occupant must answer) or
 * `annotation_free` (sensor evidence already answers `Q`). IL moves it to
 * `asked`, then the agent records the annotation and closes it at `complete`.
 * The remaining branches are `deferred` (the neighbourhood is dense enough) and
 * `expired_unanswered` (asked but ignored); both mean "no annotation collected",
 * so they share a stage.
 */
export type CaseStage =
	| "measured"
	| "waiting"
	| "asked"
	| "answered"
	| "dropped";

export interface StageMeta {
	stage: CaseStage;
	/** Nhãn ngắn cho badge. */
	label: string;
	/** Một câu giải thích trạng thái này nghĩa là gì. */
	hint: string;
	/** Token màu cho funnel và chart. Chỉ dùng `--chart-*` và `--muted`. */
	color: string;
}

const STAGE_META: Record<CaseStage, StageMeta> = {
	measured: {
		stage: "measured",
		label: "No answer needed",
		hint: "Sensor evidence already answers the question; nobody is asked.",
		color: "var(--chart-2)",
	},
	waiting: {
		stage: "waiting",
		label: "Awaiting ask",
		hint: "Detected and queued, waiting for its turn to be asked about.",
		color: "var(--chart-4)",
	},
	asked: {
		stage: "asked",
		label: "Asked",
		hint: "The bot sent the question and is waiting for a reply.",
		color: "var(--chart-3)",
	},
	answered: {
		stage: "answered",
		label: "Annotated",
		hint: "The occupant replied; the annotation is attached to this case.",
		color: "var(--chart-1)",
	},
	dropped: {
		stage: "dropped",
		label: "No annotation",
		hint: "Skipped because similar cases exist, or asked and never answered.",
		color: "var(--muted-foreground)",
	},
};

const STATUS_TO_STAGE: Record<CaseStatus, CaseStage> = {
	annotation_free: "measured",
	open: "waiting",
	closed: "waiting",
	pending: "waiting",
	asked: "asked",
	answered: "answered",
	annotated: "answered",
	complete: "answered",
	deferred: "dropped",
	expired_unanswered: "dropped",
	expired_unclosed: "dropped",
};

/**
 * Fixed display order, following the flow: detected -> awaiting -> asked ->
 * annotated, then the two terminal branches. Never re-sorted by count.
 */
export const STAGE_ORDER: readonly CaseStage[] = [
	"waiting",
	"asked",
	"answered",
	"measured",
	"dropped",
] as const;

export const stageOf = (status: CaseStatus): CaseStage =>
	STATUS_TO_STAGE[status] ?? "waiting";

export const stageMeta = (stage: CaseStage): StageMeta => STAGE_META[stage];

/** Count cases per stage, keeping every stage even at zero. */
export const countByStage = (cases: Case[]): Record<CaseStage, number> => {
	const counts: Record<CaseStage, number> = {
		measured: 0,
		waiting: 0,
		asked: 0,
		answered: 0,
		dropped: 0,
	};
	for (const item of cases) counts[stageOf(item.status)] += 1;
	return counts;
};

/** Case duration in minutes; `null` while the case is still open. */
export const durationMinutes = (item: Case): number | null => {
	if (!item.t_end) return null;
	const ms = new Date(item.t_end).getTime() - new Date(item.t_start).getTime();
	return Number.isFinite(ms) ? ms / 60_000 : null;
};

/** Look up one indicator by name, case-insensitively. */
export const indicatorValue = (item: Case, name: string): number | null => {
	const found = item.indicators.find(
		(indicator) => indicator.name.toLowerCase() === name.toLowerCase(),
	);
	return found ? found.value : null;
};

export const median = (values: number[]): number | null => {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[middle - 1] + sorted[middle]) / 2
		: sorted[middle];
};
