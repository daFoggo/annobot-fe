import {
	IconChevronLeft,
	IconChevronRight,
	IconClock,
	IconInbox,
} from "@tabler/icons-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Inquiry } from "@/features/inquiries";
import type { Case } from "../schemas";
import { CaseStatusBadge } from "./case-status-badge";
import { EvidenceDialog } from "./evidence-dialog";

interface CasesTableProps {
	cases: Case[];
	totalCount: number;
	page: number;
	pageSize: number;
	onPageChange: (newPage: number) => void;
	activeInquiry?: Inquiry | null;
	isLoading?: boolean;
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

export const CasesTable = ({
	cases,
	totalCount,
	page,
	pageSize,
	onPageChange,
	activeInquiry,
	isLoading,
}: CasesTableProps) => {
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

	if (!isLoading && cases.length === 0) {
		return (
			<Empty className="border rounded-xl p-8 bg-card">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<IconInbox className="size-6 text-muted-foreground" />
					</EmptyMedia>
					<EmptyTitle>Chưa phát hiện chu kỳ nào</EmptyTitle>
					<EmptyDescription>
						{activeInquiry
							? `Chưa có chu kỳ hoạt động nào khớp với quy tắc nhận diện của câu hỏi "${(activeInquiry.question ?? "này").slice(0, 45)}...".`
							: "Chưa có chu kỳ nào được ghi nhận cho experiment này."}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<p className="text-xs text-muted-foreground">
						Bạn có thể bấm &quot;Chạy nhận diện (Detect Now)&quot; ở trên để hệ
						thống quét lại dữ liệu cảm biến mới nhất.
					</p>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="rounded-xl border bg-card shadow-xs overflow-hidden">
				<Table>
					<TableHeader className="bg-muted/30">
						<TableRow>
							<TableHead className="w-[100px]">Mã Case</TableHead>
							<TableHead className="min-w-[150px]">Bắt đầu</TableHead>
							<TableHead className="min-w-[150px]">Kết thúc</TableHead>
							<TableHead className="w-[110px]">Thời lượng</TableHead>
							{indicatorColumns.map((col) => (
								<TableHead key={col} className="min-w-[110px] text-right">
									{col}
								</TableHead>
							))}
							<TableHead className="w-[140px] text-center">
								Bằng chứng (D)
							</TableHead>
							<TableHead className="w-[160px] text-center">
								Trạng thái
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{cases.map((c) => {
							const indicatorMap = new Map(
								c.indicators.map((i) => [i.name, i]),
							);

							return (
								<TableRow key={c.id}>
									<TableCell className="font-mono text-xs text-muted-foreground font-semibold">
										#{c.id.slice(0, 8)}
									</TableCell>
									<TableCell className="text-xs">
										{formatDate(c.t_start)}
									</TableCell>
									<TableCell className="text-xs">
										{formatDate(c.t_end)}
									</TableCell>
									<TableCell className="text-xs font-medium">
										<span className="inline-flex items-center gap-1">
											<IconClock className="size-3.5 text-muted-foreground" />
											{formatDuration(c.t_start, c.t_end)}
										</span>
									</TableCell>
									{indicatorColumns.map((col) => {
										const ind = indicatorMap.get(col);
										return (
											<TableCell
												key={col}
												className="text-right font-mono text-xs"
											>
												{ind != null ? (
													<span>
														{ind.value} {ind.unit ?? ""}
													</span>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</TableCell>
										);
									})}
									<TableCell className="text-center">
										<EvidenceDialog evidence={c.evidence} caseId={c.id} />
									</TableCell>
									<TableCell className="text-center">
										<CaseStatusBadge status={c.status} />
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls */}
			<div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
				<div>
					Tổng số:{" "}
					<span className="font-semibold text-foreground">{totalCount}</span>{" "}
					chu kỳ (Trang {page} / {totalPages})
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1 || isLoading}
						onClick={() => onPageChange(page - 1)}
					>
						<IconChevronLeft className="size-4 mr-1" />
						Trước
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= totalPages || isLoading}
						onClick={() => onPageChange(page + 1)}
					>
						Sau
						<IconChevronRight className="size-4 ml-1" />
					</Button>
				</div>
			</div>
		</div>
	);
};
