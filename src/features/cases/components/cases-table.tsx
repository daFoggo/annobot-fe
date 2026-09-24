import { IconInbox } from "@tabler/icons-react";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { durationMinutes, indicatorValue } from "../lifecycle";
import type { Case } from "../schemas";
import { CaseEvidenceDialog } from "./case-evidence-dialog";
import { CaseStatusBadge } from "./case-status-badge";
import { RuleChangeBadge } from "./rule-change-badge";

const stampCache = new Map<string, Intl.DateTimeFormat>();

const stamp = (iso: string, timeZone: string) => {
	let formatter = stampCache.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-GB", {
			timeZone,
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23",
		});
		stampCache.set(timeZone, formatter);
	}
	return formatter.format(new Date(iso)).replace(",", "");
};

const duration = (item: Case) => {
	const minutes = durationMinutes(item);
	if (minutes == null) return "running";
	if (minutes < 60) return `${Math.round(minutes)} min`;
	const hours = Math.floor(minutes / 60);
	const rest = Math.round(minutes % 60);
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

const energy = (item: Case) => {
	const value =
		indicatorValue(item, "energy_wh") ??
		(item.evidence?.energy_wh_integrated as number | undefined) ??
		null;
	if (value == null) return "—";
	return value >= 1000
		? `${(value / 1000).toFixed(2)} kWh`
		: `${value.toFixed(1)} Wh`;
};

const peak = (item: Case) => {
	const value =
		indicatorValue(item, "peak_power_w") ??
		indicatorValue(item, "peak_w") ??
		(item.evidence?.peak_w as number | undefined) ??
		null;
	return value == null ? "—" : `${Math.round(value)} W`;
};

export interface CasesTableProps {
	cases: Case[];
	timezone?: string;
	isLoading?: boolean;
}

/**
 * Detail rows for the cases on the current page. The timeline above answers
 * "when"; this answers "how long, how much, has anyone been asked", and opens
 * the detection evidence behind each boundary.
 *
 * Pagination lives in the route, not here: it is URL state, and the primitive is
 * built around links.
 */
export const CasesTable = ({
	cases,
	timezone = "UTC",
	isLoading,
}: CasesTableProps) => {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-1.5">
				{Array.from({ length: 5 }, (_, index) => index).map((index) => (
					<Skeleton key={index} className="h-9 w-full" />
				))}
			</div>
		);
	}

	if (cases.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<IconInbox />
					</EmptyMedia>
					<EmptyTitle>No cases</EmptyTitle>
					<EmptyDescription>
						Detection re-scans the last 72 hours every minute. If a device has
						run and this is still empty, check the sensors bound to this
						inquiry.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Started</TableHead>
					<TableHead>Duration</TableHead>
					<TableHead>Energy</TableHead>
					<TableHead>Peak</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="w-10" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{cases.map((item) => (
					<TableRow key={item.id}>
						<TableCell className="font-mono tabular-nums">
							{stamp(item.t_start, timezone)}
						</TableCell>
						<TableCell className="font-mono tabular-nums">
							{duration(item)}
						</TableCell>
						<TableCell className="font-mono tabular-nums">
							{energy(item)}
						</TableCell>
						<TableCell className="font-mono tabular-nums">
							{peak(item)}
						</TableCell>
						<TableCell>
							<div className="flex flex-wrap items-center gap-1.5">
								<CaseStatusBadge status={item.status} />
								<RuleChangeBadge
									item={item}
									timeLabel={stamp(item.t_start, timezone)}
								/>
							</div>
						</TableCell>
						<TableCell>
							<CaseEvidenceDialog
								item={item}
								timeLabel={`${stamp(item.t_start, timezone)}${
									item.t_end ? ` - ${stamp(item.t_end, timezone)}` : ""
								}`}
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
