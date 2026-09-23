import { IconHelp, IconPlayerPlay, IconRefresh } from "@tabler/icons-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardPage } from "@/components/layout/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CasesTable,
	caseListQueryOptions,
	useTriggerDetection,
} from "@/features/cases";
import { inquiryListQueryOptions } from "@/features/inquiries";
import { getSensorIcon } from "@/features/sensors";

const ExperimentCasesPage = () => {
	const { experimentId } = Route.useParams();
	const { data: inquiries } = useSuspenseQuery(
		inquiryListQueryOptions(experimentId),
	);

	// Mặc định chọn inquiry đầu tiên nếu có
	const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
		inquiries.length > 0 ? inquiries[0].id : null,
	);
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const activeInquiry = useMemo(() => {
		if (!selectedInquiryId) return null;
		return inquiries.find((i) => i.id === selectedInquiryId) ?? null;
	}, [inquiries, selectedInquiryId]);

	const { data, isLoading, isFetching } = useQuery(
		caseListQueryOptions({
			experiment_id: experimentId,
			inquiry_id: selectedInquiryId || undefined,
			page,
			page_size: pageSize,
		}),
	);

	const triggerMutation = useTriggerDetection(experimentId);

	const handleInquiryChange = (id: string | null) => {
		setSelectedInquiryId(id);
		setPage(1);
	};

	const handleTriggerDetection = () => {
		triggerMutation.mutate(selectedInquiryId || undefined);
	};

	const cases = data?.founds ?? [];
	const totalCount = data?.total_count ?? 0;

	return (
		<DashboardPage
			title="Cycles & Episodes (Cases)"
			description="Quan sát các chu kỳ hoạt động và sự kiện thực tế được phát hiện từ cảm biến theo từng câu hỏi Inquiry."
			actions={
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={triggerMutation.isPending || isFetching}
						onClick={handleTriggerDetection}
					>
						{triggerMutation.isPending ? (
							<IconRefresh className="size-4 animate-spin mr-1.5" />
						) : (
							<IconPlayerPlay className="size-4 mr-1.5 text-primary" />
						)}
						{selectedInquiryId
							? "Quét lại Inquiry này"
							: "Quét lại toàn bộ (Detect Now)"}
					</Button>
				</div>
			}
		>
			<div className="flex flex-col gap-6">
				{/* Inquiry Selector Tabs */}
				<div className="flex flex-wrap items-center gap-2 border-b pb-3">
					<Button
						variant={selectedInquiryId === null ? "default" : "outline"}
						size="sm"
						className="h-8 rounded-full text-xs"
						onClick={() => handleInquiryChange(null)}
					>
						Tất cả Inquiries
					</Button>
					{inquiries.map((inq, idx) => {
						const isSelected = selectedInquiryId === inq.id;
						return (
							<Button
								key={inq.id}
								variant={isSelected ? "default" : "outline"}
								size="sm"
								className="h-8 rounded-full text-xs gap-1.5 max-w-[280px] truncate"
								onClick={() => handleInquiryChange(inq.id)}
								title={inq.question ?? undefined}
							>
								<span className="font-mono font-semibold">#{idx + 1}</span>
								<span className="truncate">{inq.question}</span>
							</Button>
						);
					})}
				</div>

				{/* Active Inquiry Context Card */}
				{activeInquiry && (
					<Card className="shadow-xs bg-muted/20 border-muted">
						<CardHeader className="py-3 px-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
										<IconHelp className="size-4" />
									</div>
									<CardTitle className="text-sm font-semibold">
										{activeInquiry.question}
									</CardTitle>
								</div>
								{activeInquiry.type && (
									<Badge
										variant="outline"
										className="w-fit text-[11px] uppercase"
									>
										{activeInquiry.type}
									</Badge>
								)}
							</div>
							{activeInquiry.goal_gamma && (
								<CardDescription className="text-xs mt-1">
									Mục tiêu: {activeInquiry.goal_gamma}
								</CardDescription>
							)}
						</CardHeader>
						<CardContent className="pt-0 pb-3 px-4 flex flex-wrap items-center gap-3 text-xs border-t bg-card/40">
							<div className="flex items-center gap-1.5">
								<span className="text-muted-foreground font-medium">
									Cảm biến ({activeInquiry.sensors.length}):
								</span>
								<div className="flex flex-wrap gap-1">
									{activeInquiry.sensors.map((s) => {
										const Icon = getSensorIcon(s.source_key, s.sensor_type);
										return (
											<Badge
												key={s.id}
												variant="secondary"
												className="text-[11px] font-normal gap-1 py-0 px-1.5"
											>
												<Icon className="size-3 text-muted-foreground" />
												{s.name || s.source_key}
											</Badge>
										);
									})}
								</div>
							</div>

							{activeInquiry.detection_rule?.type && (
								<div className="flex items-center gap-1.5">
									<span className="text-muted-foreground font-medium">
										Quy tắc nhận diện:
									</span>
									<span className="font-mono font-semibold text-primary">
										{activeInquiry.detection_rule.type}
									</span>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Cases Table */}
				<CasesTable
					cases={cases}
					totalCount={totalCount}
					page={page}
					pageSize={pageSize}
					onPageChange={setPage}
					activeInquiry={activeInquiry}
					isLoading={isLoading || isFetching}
				/>
			</div>
		</DashboardPage>
	);
};

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/cases",
)({
	staticData: {
		breadcrumb: { label: "Cycles / Cases" },
	},
	loader: async ({ context, params }) => {
		await context.queryClient.query(
			inquiryListQueryOptions(params.experimentId),
		);
	},
	component: ExperimentCasesPage,
});
