import {
	IconAdjustmentsHorizontal,
	IconArrowsSort,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconClock,
	IconCopy,
	IconDotsVertical,
	IconFilter,
	IconInbox,
	IconSearch,
	IconSortAscending,
	IconSortDescending,
	IconX,
} from "@tabler/icons-react";
import {
	type ColumnVisibilityState,
	FlexRender,
	type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Inquiry } from "@/features/inquiries";
import { createAppColumnHelper, useAppTable } from "@/hooks/table";
import type { Case } from "../schemas";
import { CaseStatusBadge } from "./case-status-badge";
import { EvidenceDialog } from "./evidence-dialog";

interface CasesTableProps {
	cases: Case[];
	totalCount: number;
	page: number;
	pageSize: number;
	onPageChange: (newPage: number) => void;
	onPageSizeChange?: (newPageSize: number) => void;
	statusFilter?: string;
	onStatusFilterChange?: (status?: string) => void;
	activeInquiry?: Inquiry | null;
	isLoading?: boolean;
	isFetching?: boolean;
}

const formatDate = (isoString: string) => {
	try {
		const d = new Date(isoString);
		return d.toLocaleString("vi-VN", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	} catch {
		return isoString;
	}
};

const formatDuration = (t_start: string, t_end: string) => {
	try {
		const ms = new Date(t_end).getTime() - new Date(t_start).getTime();
		const mins = Math.round(ms / 60000);
		if (mins < 60) return `${mins} phút`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return m > 0 ? `${h}h ${m}p` : `${h}h`;
	} catch {
		return "—";
	}
};

interface ColumnHeaderProps {
	column: {
		getCanSort: () => boolean;
		getIsSorted: () => false | "asc" | "desc";
		toggleSorting: (desc?: boolean) => void;
	};
	title: string;
	className?: string;
}

function ColumnHeader({ column, title, className }: ColumnHeaderProps) {
	if (!column.getCanSort()) {
		return <div className={className}>{title}</div>;
	}

	const isSorted = column.getIsSorted();

	return (
		<div className="flex items-center space-x-1">
			<Button
				variant="ghost"
				size="sm"
				className="-ml-2 h-7 px-2 text-xs font-medium hover:bg-muted/80 data-[state=open]:bg-accent"
				onClick={() => column.toggleSorting(isSorted === "asc")}
			>
				<span>{title}</span>
				{isSorted === "desc" ? (
					<IconSortDescending className="size-3.5 ml-1 text-foreground" />
				) : isSorted === "asc" ? (
					<IconSortAscending className="size-3.5 ml-1 text-foreground" />
				) : (
					<IconArrowsSort className="size-3.5 ml-1 text-muted-foreground/60" />
				)}
			</Button>
		</div>
	);
}

const handleCopy = async (text: string, label: string) => {
	try {
		await navigator.clipboard.writeText(text);
		toast.success(`Đã sao chép ${label}`);
	} catch {
		toast.error("Không thể sao chép vào clipboard");
	}
};

const columnHelper = createAppColumnHelper<Case>();

export const CasesTable = ({
	cases,
	totalCount,
	page,
	pageSize,
	onPageChange,
	onPageSizeChange,
	statusFilter,
	onStatusFilterChange,
	activeInquiry,
	isLoading,
	isFetching,
}: CasesTableProps) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnVisibility, setColumnVisibility] =
		useState<ColumnVisibilityState>({});
	const [globalFilter, setGlobalFilter] = useState("");

	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

	// Lấy danh sách tên indicators xuất hiện trong các cases hiện tại hoặc từ activeInquiry
	const indicatorColumns = useMemo(() => {
		if (
			activeInquiry?.indicators &&
			Object.keys(activeInquiry.indicators).length > 0
		) {
			return Object.keys(activeInquiry.indicators);
		}
		const set = new Set<string>();
		for (const c of cases) {
			for (const ind of c.indicators) {
				set.add(ind.name);
			}
		}
		return Array.from(set);
	}, [cases, activeInquiry]);

	const columns = useMemo(() => {
		const dynamicIndicators = indicatorColumns.map((colName) =>
			columnHelper.accessor(
				(row) => {
					const ind = row.indicators.find((i) => i.name === colName);
					return ind?.value ?? null;
				},
				{
					id: `indicator_${colName}`,
					header: ({ column }) => (
						<div className="flex justify-end">
							<ColumnHeader column={column} title={colName} />
						</div>
					),
					cell: ({ row }) => {
						const ind = row.original.indicators.find((i) => i.name === colName);
						if (ind == null) {
							return <span className="text-muted-foreground">—</span>;
						}
						return (
							<div className="text-right font-mono text-xs">
								<span className="font-semibold">{ind.value}</span>{" "}
								<span className="text-muted-foreground text-[11px]">
									{ind.unit ?? ""}
								</span>
							</div>
						);
					},
					enableSorting: true,
					enableHiding: true,
				},
			),
		);

		return columnHelper.columns([
			columnHelper.accessor("id", {
				header: ({ column }) => (
					<ColumnHeader column={column} title="Mã Case" />
				),
				cell: ({ row }) => {
					const id = row.original.id;
					return (
						<div className="flex items-center gap-1 group/id">
							<span className="font-mono text-xs font-semibold text-muted-foreground group-hover/id:text-foreground transition-colors">
								#{id.slice(0, 8)}
							</span>
							<Button
								variant="ghost"
								size="icon-xs"
								className="opacity-0 group-hover/id:opacity-100 transition-opacity"
								onClick={() => handleCopy(id, "mã Case")}
								title="Sao chép toàn bộ ID"
							>
								<IconCopy className="size-3" />
							</Button>
						</div>
					);
				},
				enableSorting: true,
				enableHiding: true,
			}),
			columnHelper.accessor("t_start", {
				header: ({ column }) => (
					<ColumnHeader column={column} title="Bắt đầu" />
				),
				cell: ({ getValue }) => (
					<span className="text-xs font-mono">{formatDate(getValue())}</span>
				),
				enableSorting: true,
				enableHiding: true,
			}),
			columnHelper.accessor("t_end", {
				header: ({ column }) => (
					<ColumnHeader column={column} title="Kết thúc" />
				),
				cell: ({ getValue }) => (
					<span className="text-xs font-mono">{formatDate(getValue())}</span>
				),
				enableSorting: true,
				enableHiding: true,
			}),
			columnHelper.accessor(
				(row) =>
					new Date(row.t_end).getTime() - new Date(row.t_start).getTime(),
				{
					id: "duration",
					header: ({ column }) => (
						<ColumnHeader column={column} title="Thời lượng" />
					),
					cell: ({ row }) => (
						<span className="inline-flex items-center gap-1 text-xs font-medium">
							<IconClock className="size-3.5 text-muted-foreground" />
							{formatDuration(row.original.t_start, row.original.t_end)}
						</span>
					),
					enableSorting: true,
					enableHiding: true,
				},
			),
			...dynamicIndicators,
			columnHelper.display({
				id: "evidence",
				header: () => (
					<div className="text-center font-medium text-xs">Bằng chứng (D)</div>
				),
				cell: ({ row }) => (
					<div className="flex justify-center">
						<EvidenceDialog
							evidence={row.original.evidence}
							caseId={row.original.id}
						/>
					</div>
				),
				enableHiding: true,
			}),
			columnHelper.accessor("status", {
				header: ({ column }) => (
					<div className="flex justify-center">
						<ColumnHeader column={column} title="Trạng thái" />
					</div>
				),
				cell: ({ getValue }) => (
					<div className="flex justify-center">
						<CaseStatusBadge status={getValue()} />
					</div>
				),
				enableSorting: true,
				enableHiding: true,
			}),
			columnHelper.display({
				id: "actions",
				cell: ({ row }) => {
					const c = row.original;
					return (
						<div className="flex justify-end">
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<Button
											variant="ghost"
											size="icon-xs"
											className="size-7"
											aria-label="Tác vụ"
										>
											<IconDotsVertical className="size-3.5" />
										</Button>
									}
								/>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuLabel>Tác vụ Case</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => handleCopy(c.id, "mã Case")}>
										<IconCopy className="size-4 mr-2" />
										Sao chép mã Case
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() =>
											handleCopy(
												JSON.stringify(c, null, 2),
												"dữ liệu JSON của Case",
											)
										}
									>
										<IconCopy className="size-4 mr-2" />
										Sao chép JSON
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
				enableHiding: false,
			}),
		]);
	}, [indicatorColumns]);

	const table = useAppTable({
		columns,
		data: cases,
		state: {
			sorting,
			columnVisibility,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		manualPagination: true,
	});

	const getColumnLabel = (id: string) => {
		switch (id) {
			case "id":
				return "Mã Case";
			case "t_start":
				return "Bắt đầu";
			case "t_end":
				return "Kết thúc";
			case "duration":
				return "Thời lượng";
			case "evidence":
				return "Bằng chứng (D)";
			case "status":
				return "Trạng thái";
			default:
				if (id.startsWith("indicator_")) {
					return id.replace("indicator_", "");
				}
				return id;
		}
	};

	const filterableColumns = table
		.getAllColumns()
		.filter((col) => col.getCanHide());

	// Tính chỉ số bản ghi hiển thị (1-indexed)
	const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
	const pageEnd = Math.min(page * pageSize, totalCount);

	return (
		<div className="flex flex-col gap-3">
			{/* Toolbar: Search, Status Filter & Column Visibility */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
				<div className="flex flex-wrap items-center gap-2">
					{/* Search input (client filter) */}
					<div className="relative">
						<IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Tìm kiếm chu kỳ..."
							value={globalFilter ?? ""}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className="h-8 w-52 sm:w-64 pl-8 pr-7 text-xs"
						/>
						{globalFilter && (
							<Button
								variant="ghost"
								size="icon-xs"
								className="absolute right-1 top-1/2 -translate-y-1/2 size-5 text-muted-foreground hover:text-foreground"
								onClick={() => setGlobalFilter("")}
							>
								<IconX className="size-3" />
							</Button>
						)}
					</div>

					{/* Server Status Filter */}
					{onStatusFilterChange && (
						<div className="flex items-center gap-1.5">
							<IconFilter className="size-3.5 text-muted-foreground hidden sm:inline-block" />
							<NativeSelect
								size="sm"
								value={statusFilter ?? "all"}
								onChange={(e) => {
									const val = e.target.value;
									onStatusFilterChange(val === "all" ? undefined : val);
								}}
								className="text-xs"
							>
								<NativeSelectOption value="all">
									Tất cả trạng thái
								</NativeSelectOption>
								<NativeSelectOption value="annotation_free">
									Tự động (Không cần nhãn)
								</NativeSelectOption>
								<NativeSelectOption value="pending">
									Chờ duyệt (Pending)
								</NativeSelectOption>
								<NativeSelectOption value="asked">
									Đang hỏi (Asked)
								</NativeSelectOption>
								<NativeSelectOption value="annotated">
									Đã gán nhãn (Annotated)
								</NativeSelectOption>
								<NativeSelectOption value="complete">
									Hoàn thành (Complete)
								</NativeSelectOption>
								<NativeSelectOption value="deferred">
									Tạm hoãn (Deferred)
								</NativeSelectOption>
							</NativeSelect>
						</div>
					)}
				</div>

				{/* Column Visibility Menu */}
				<div className="flex items-center gap-2 self-end sm:self-auto">
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="outline"
									size="sm"
									className="h-8 gap-1.5 text-xs"
								>
									<IconAdjustmentsHorizontal className="size-3.5" />
									Hiển thị cột
								</Button>
							}
						/>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuLabel>Tuỳ chỉnh cột</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{filterableColumns.map((col) => (
								<DropdownMenuCheckboxItem
									key={col.id}
									checked={col.getIsVisible()}
									onCheckedChange={(val) => col.toggleVisibility(!!val)}
								>
									{getColumnLabel(col.id)}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Main Table Container with scroll-fade-x */}
			<div className="rounded-xl border bg-card shadow-xs overflow-hidden">
				<Table containerClassName="scroll-fade-x overflow-x-auto">
					<TableHeader className="bg-muted/40">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										className="h-9 px-3 py-2 text-xs font-semibold"
									>
										{header.isPlaceholder ? null : (
											<FlexRender header={header} />
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
								<TableRow key={`skeleton-${i}`}>
									{table.getVisibleLeafColumns().map((col) => (
										<TableCell key={col.id} className="p-3">
											<Skeleton className="h-4 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="transition-colors hover:bg-muted/40"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="p-3 text-xs">
											<FlexRender cell={cell} />
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={table.getVisibleLeafColumns().length}
									className="h-36 text-center"
								>
									<Empty className="py-6">
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<IconInbox className="size-6 text-muted-foreground" />
											</EmptyMedia>
											<EmptyTitle className="text-sm">
												{globalFilter
													? "Không tìm thấy chu kỳ phù hợp"
													: "Chưa có chu kỳ nào"}
											</EmptyTitle>
											<EmptyDescription className="text-xs">
												{globalFilter
													? `Không có kết quả nào khớp với từ khóa "${globalFilter}".`
													: activeInquiry
														? `Chưa có chu kỳ hoạt động nào khớp với quy tắc nhận diện của câu hỏi "${(activeInquiry.question ?? "này").slice(0, 45)}...".`
														: "Chưa có chu kỳ nào được ghi nhận cho experiment này."}
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 py-1 text-xs text-muted-foreground">
				<div className="flex items-center gap-2">
					<span>
						Hiển thị{" "}
						<span className="font-semibold text-foreground">
							{pageStart}–{pageEnd}
						</span>{" "}
						trên tổng số{" "}
						<span className="font-semibold text-foreground">{totalCount}</span>{" "}
						chu kỳ
					</span>
					{isFetching && !isLoading && (
						<span className="text-[11px] text-muted-foreground animate-pulse">
							(Đang tải lại...)
						</span>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-4">
					{/* Rows per page selector */}
					{onPageSizeChange && (
						<div className="flex items-center gap-1.5">
							<span className="text-xs">Dòng mỗi trang:</span>
							<NativeSelect
								size="sm"
								value={pageSize}
								onChange={(e) => onPageSizeChange(Number(e.target.value))}
								className="text-xs"
							>
								<NativeSelectOption value="10">10</NativeSelectOption>
								<NativeSelectOption value="20">20</NativeSelectOption>
								<NativeSelectOption value="50">50</NativeSelectOption>
								<NativeSelectOption value="100">100</NativeSelectOption>
							</NativeSelect>
						</div>
					)}

					{/* Page index / navigation */}
					<div className="flex items-center gap-1.5">
						<span className="text-xs">
							Trang {page} / {totalPages}
						</span>
						<div className="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon-xs"
								disabled={page <= 1 || isLoading}
								onClick={() => onPageChange(1)}
								title="Trang đầu"
							>
								<IconChevronsLeft className="size-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon-xs"
								disabled={page <= 1 || isLoading}
								onClick={() => onPageChange(page - 1)}
								title="Trang trước"
							>
								<IconChevronLeft className="size-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon-xs"
								disabled={page >= totalPages || isLoading}
								onClick={() => onPageChange(page + 1)}
								title="Trang sau"
							>
								<IconChevronRight className="size-3.5" />
							</Button>
							<Button
								variant="outline"
								size="icon-xs"
								disabled={page >= totalPages || isLoading}
								onClick={() => onPageChange(totalPages)}
								title="Trang cuối"
							>
								<IconChevronsRight className="size-3.5" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
