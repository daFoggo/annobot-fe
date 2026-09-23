import { IconFileCode, IconInfoCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface AppliedParams {
	threshold_method?: string;
	p_on_w?: number;
	p_off_w?: number;
	gap_max_min?: number;
	dur_min_min?: number;
	dur_max_min?: number;
	grid_s?: number;
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

interface EvidenceDialogProps {
	evidence?: Record<string, unknown> | null;
	caseId: string;
}

export const EvidenceDialog = ({ evidence, caseId }: EvidenceDialogProps) => {
	if (!evidence) {
		return (
			<span className="text-xs text-muted-foreground italic">
				Không có bằng chứng
			</span>
		);
	}

	const typedEvidence = evidence as unknown as DetectionEvidence;
	const params = typedEvidence.applied_params ?? {};
	const flags = typedEvidence.flags ?? [];

	return (
		<Dialog>
			<DialogTrigger render={<Button variant="outline" size="sm" />}>
				<IconFileCode className="size-3.5 mr-1" />
				Bằng chứng (Evidence)
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-base">
						<IconInfoCircle className="size-5 text-primary" />
						Bằng chứng Nhận diện Chu kỳ
					</DialogTitle>
					<DialogDescription className="font-mono text-xs">
						Case #{caseId.slice(0, 8)}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 text-xs">
					<div className="rounded-lg border bg-muted/40 p-3 space-y-2">
						<div className="font-semibold text-foreground text-xs uppercase tracking-wider">
							Tham số thuật toán tự học (Learned Params)
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div>
								<span className="text-muted-foreground">
									Thuật toán ngưỡng:
								</span>{" "}
								<span className="font-medium font-mono">
									{params.threshold_method ?? "otsu"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Ngưỡng BẬT (p_on):
								</span>{" "}
								<span className="font-medium font-mono">
									{params.p_on_w != null ? `${params.p_on_w} W` : "—"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Ngưỡng TẮT (p_off):
								</span>{" "}
								<span className="font-medium font-mono">
									{params.p_off_w != null ? `${params.p_off_w} W` : "—"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Gap tối đa:</span>{" "}
								<span className="font-medium font-mono">
									{params.gap_max_min != null
										? `${params.gap_max_min} phút`
										: "—"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Min / Max duration:
								</span>{" "}
								<span className="font-medium font-mono">
									{params.dur_min_min ?? "—"} / {params.dur_max_min ?? "—"} min
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Bước lưới (Grid):</span>{" "}
								<span className="font-medium font-mono">
									{params.grid_s != null ? `${params.grid_s}s` : "60s"}
								</span>
							</div>
						</div>
					</div>

					<div className="rounded-lg border bg-muted/40 p-3 space-y-2">
						<div className="font-semibold text-foreground text-xs uppercase tracking-wider">
							Đặc trưng chu kỳ đo đạc
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div>
								<span className="text-muted-foreground">
									Điện tích phân (Engine):
								</span>{" "}
								<span className="font-medium font-mono text-primary">
									{typedEvidence.energy_wh_integrated != null
										? `${typedEvidence.energy_wh_integrated} Wh`
										: "—"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Độ bất định thời gian:
								</span>{" "}
								<span className="font-medium font-mono">
									±{typedEvidence.uncertainty_s ?? 60}s
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Công suất đỉnh (Peak):
								</span>{" "}
								<span className="font-medium font-mono">
									{typedEvidence.peak_w != null
										? `${typedEvidence.peak_w} W`
										: "—"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Công suất TB (Mean):
								</span>{" "}
								<span className="font-medium font-mono">
									{typedEvidence.mean_w != null
										? `${typedEvidence.mean_w} W`
										: "—"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">Số mẫu quan sát:</span>{" "}
								<span className="font-medium font-mono">
									{typedEvidence.n_samples ?? "—"}
								</span>
							</div>
							<div>
								<span className="text-muted-foreground">
									Gộp từ số đoạn ON:
								</span>{" "}
								<span className="font-medium font-mono">
									{typedEvidence.merged_from ?? 1}
								</span>
							</div>
						</div>
					</div>

					{flags.length > 0 && (
						<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-400">
							<span className="font-semibold">Flags cảnh báo:</span>{" "}
							<span className="font-mono">{flags.join(", ")}</span>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};
