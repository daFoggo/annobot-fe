import {
	IconAdjustmentsHorizontal,
	IconSearch,
	IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type CaseStage, STAGE_ORDER, stageMeta } from "../lifecycle";
import type { Case } from "../schemas";
import { CASE_COLUMNS, type CaseColumnId } from "./cases-table";

/* ------------------------------------------------------------------ */
/* Tìm kiếm                                                            */
/* ------------------------------------------------------------------ */

const haystack = (item: Case) =>
	[
		item.id,
		item.inquiry_id,
		item.detection_key ?? "",
		item.status,
		item.evidence?.applied_params
			? JSON.stringify(item.evidence.applied_params)
			: "",
	]
		.join(" ")
		.toLowerCase();

export const filterCases = (cases: Case[], query: string): Case[] => {
	const needle = query.trim().toLowerCase();
	if (!needle) return cases;
	return cases.filter((item) => haystack(item).includes(needle));
};

interface CasesSearchInputProps {
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
}

export const CasesSearchInput = ({
	value,
	onValueChange,
	placeholder = "Search cases…",
}: CasesSearchInputProps) => (
	<InputGroup className="w-full sm:max-w-xs">
		<InputGroupAddon align="inline-start">
			<IconSearch />
		</InputGroupAddon>
		<InputGroupInput
			placeholder={placeholder}
			value={value}
			onChange={(event) => onValueChange(event.target.value)}
		/>
		{value ? (
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					size="icon-xs"
					aria-label="Xoá tìm kiếm"
					onClick={() => onValueChange("")}
				>
					<IconX />
				</InputGroupButton>
			</InputGroupAddon>
		) : null}
	</InputGroup>
);

/* ------------------------------------------------------------------ */
/* Lọc theo giai đoạn                                                  */
/* ------------------------------------------------------------------ */

interface StageFilterProps {
	/** Rỗng nghĩa là không lọc. */
	value: CaseStage[];
	onValueChange: (value: CaseStage[]) => void;
	counts: Record<CaseStage, number>;
}

/** Chip lọc giai đoạn. Base UI chặn bỏ chọn item cuối cùng của ToggleGroup,
 * nên bao ngoài bằng một nút "Tất cả" để xoá lọc. */
export const StageFilter = ({
	value,
	onValueChange,
	counts,
}: StageFilterProps) => (
	<div className="flex flex-wrap items-center gap-2">
		<ToggleGroup
			multiple
			variant="outline"
			size="sm"
			value={value}
			onValueChange={(next) => onValueChange(next as CaseStage[])}
		>
			{STAGE_ORDER.filter((stage) => counts[stage] > 0).map((stage) => (
				<ToggleGroupItem
					key={stage}
					value={stage}
					aria-label={stageMeta(stage).label}
				>
					{stageMeta(stage).label}
					<Badge variant="secondary" className="ms-1 tabular-nums">
						{counts[stage]}
					</Badge>
				</ToggleGroupItem>
			))}
		</ToggleGroup>
		{value.length > 0 ? (
			<Button variant="ghost" size="sm" onClick={() => onValueChange([])}>
				<IconX data-icon="inline-start" />
				Bỏ lọc
			</Button>
		) : null}
	</div>
);

/* ------------------------------------------------------------------ */
/* Cột hiển thị                                                        */
/* ------------------------------------------------------------------ */

interface ColumnsMenuProps {
	visible: CaseColumnId[];
	onVisibleChange: (visible: CaseColumnId[]) => void;
}

export const ColumnsMenu = ({ visible, onVisibleChange }: ColumnsMenuProps) => {
	const toggle = (id: CaseColumnId, checked: boolean) => {
		const next = checked
			? [...visible, id]
			: visible.filter((column) => column !== id);
		// Luôn giữ cột Started để bảng còn mốc thời gian.
		if (next.length === 0) return;
		onVisibleChange(
			CASE_COLUMNS.filter((column) => next.includes(column.id)).map(
				(c) => c.id,
			),
		);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="outline" size="sm">
						<IconAdjustmentsHorizontal data-icon="inline-start" />
						Cột {visible.length}/{CASE_COLUMNS.length}
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="min-w-44">
				<DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{CASE_COLUMNS.map((column) => (
					<DropdownMenuCheckboxItem
						key={column.id}
						checked={visible.includes(column.id)}
						disabled={column.id === "started"}
						onCheckedChange={(checked) => toggle(column.id, checked === true)}
					>
						{column.label}
					</DropdownMenuCheckboxItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => onVisibleChange(CASE_COLUMNS.map((c) => c.id))}
				>
					Hiện tất cả
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
