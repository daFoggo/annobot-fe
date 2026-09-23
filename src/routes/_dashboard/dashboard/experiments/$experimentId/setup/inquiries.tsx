import {
	IconHelpCircle,
	IconPencil,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardPage } from "@/components/layout/dashboard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	type Inquiry,
	inquiryListQueryOptions,
	useDeleteInquiry,
} from "@/features/inquiries";
import { getSensorIcon } from "@/features/sensors";
import { getErrorMessage } from "@/lib/error";
import { AddInquiryDialog } from "../-components/add-inquiry-dialog";
import { EditInquiryDialog } from "../-components/edit-inquiry-dialog";
import { ExperimentSetupMenu } from "../-components/experiment-setup-menu";

const requiredFields = (scope: Inquiry["annotation_scope"]) =>
	Object.entries(scope ?? {})
		.filter(([, value]) => String(value).toLowerCase() === "required")
		.map(([key]) => key.replace(/_$/, ""));

const formatLearned = (rule: Inquiry["detection_rule"]) => {
	const learned = rule?.learned as Record<string, unknown> | null | undefined;
	if (!learned) return null;
	const on = learned.power_on_threshold_w;
	const off = learned.power_off_threshold_w;
	if (typeof on !== "number" || typeof off !== "number") return null;
	return `P_on ${on} W · P_off ${off} W`;
};

const formatDetectionType = (type: string | undefined | null) => {
	if (!type || type === "power_cycle") return "Power Cycle Detection";
	if (type === "state_change") return "State Change Detection";
	return type;
};

const Row = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
		<span className="w-36 shrink-0 text-xs font-medium text-muted-foreground">
			{label}
		</span>
		<div className="flex flex-wrap items-center gap-1.5">{children}</div>
	</div>
);

const InquiryCard = ({ inquiry }: { inquiry: Inquiry }) => {
	const deleteInquiry = useDeleteInquiry();
	const [editOpen, setEditOpen] = useState(false);

	const required = requiredFields(inquiry.annotation_scope);
	const learned = formatLearned(inquiry.detection_rule);
	const ruleType = formatDetectionType(
		inquiry.detection_rule?.type as string | undefined,
	);

	const handleDelete = () => {
		deleteInquiry.mutate(inquiry.id, {
			onSuccess: () => toast.success("Inquiry deleted"),
			onError: (error) =>
				toast.error(getErrorMessage(error, "Could not delete inquiry.")),
		});
	};

	return (
		<Card className="transition-colors hover:border-border">
			<CardHeader className="gap-2">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="flex flex-col gap-1">
						<CardTitle className="text-base font-semibold leading-snug">
							{inquiry.question}
						</CardTitle>
						{inquiry.goal_gamma ? (
							<CardDescription className="text-xs">
								<span className="font-medium text-foreground/80">Goal:</span>{" "}
								{inquiry.goal_gamma}
							</CardDescription>
						) : null}
					</div>

					<div className="flex items-center gap-2">
						{inquiry.type ? (
							<Badge variant="secondary" className="capitalize">
								{inquiry.type}
							</Badge>
						) : null}

						<Button
							type="button"
							variant="outline"
							size="icon-xs"
							onClick={() => setEditOpen(true)}
							aria-label="Edit inquiry"
						>
							<IconPencil className="size-3.5" />
						</Button>

						<AlertDialog>
							<AlertDialogTrigger
								render={
									<Button
										type="button"
										variant="outline"
										size="icon-xs"
										className="text-muted-foreground hover:text-destructive hover:border-destructive/40"
										aria-label="Delete inquiry"
										disabled={deleteInquiry.isPending}
									>
										<IconTrash className="size-3.5" />
									</Button>
								}
							/>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to delete{" "}
										<strong className="text-foreground">
											"{inquiry.question}"
										</strong>
										? Detection for this inquiry will stop.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										variant="destructive"
										onClick={handleDelete}
										disabled={deleteInquiry.isPending}
									>
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			</CardHeader>

			<CardContent className="flex flex-col gap-2.5 pt-0">
				<Row label="Assigned Sensors">
					{inquiry.sensors.length === 0 ? (
						<span className="text-xs text-muted-foreground">
							No sensors bound yet
						</span>
					) : (
						inquiry.sensors.map((sensor) => {
							const Icon = getSensorIcon(sensor.source_key, sensor.sensor_type);
							return (
								<Badge key={sensor.id} variant="outline" className="gap-1.5">
									<Icon
										data-icon="inline-start"
										className="size-3 text-muted-foreground"
									/>
									<span>{sensor.name || sensor.source_key}</span>
								</Badge>
							);
						})
					)}
				</Row>

				<Row label="Detection Rule">
					<Badge variant="outline">{ruleType}</Badge>
					{learned ? (
						<Badge variant="secondary" className="font-mono text-[11px]">
							{learned}
						</Badge>
					) : (
						<span className="text-xs text-muted-foreground">
							(Thresholds auto-calibrated from runtime telemetry)
						</span>
					)}
				</Row>

				<Row label="Occupant Response">
					{required.length === 0 ? (
						<span className="text-xs text-muted-foreground">
							Auto-resolved (no occupant answers required)
						</span>
					) : (
						<div className="flex flex-wrap items-center gap-1.5">
							{required.map((field) => (
								<Badge key={field} variant="outline" className="text-xs">
									{field}
								</Badge>
							))}
							<span className="text-xs text-muted-foreground">
								required upon case trigger
							</span>
						</div>
					)}
				</Row>
			</CardContent>

			<EditInquiryDialog
				inquiry={inquiry}
				open={editOpen}
				onOpenChange={setEditOpen}
			/>
		</Card>
	);
};

const SetupInquiriesPage = () => {
	const { experimentId } = Route.useParams();
	const { data: inquiries } = useSuspenseQuery(
		inquiryListQueryOptions(experimentId),
	);

	return (
		<DashboardPage
			title="Inquiries"
			description="Define target questions, monitored sensors, cycle detection rules, and occupant response expectations."
			actions={
				<AddInquiryDialog
					experimentId={experimentId}
					trigger={
						<Button size="sm">
							<IconPlus data-icon="inline-start" />
							Add inquiry
						</Button>
					}
				/>
			}
		>
			{inquiries.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<IconHelpCircle />
						</EmptyMedia>
						<EmptyTitle>No inquiries defined</EmptyTitle>
						<EmptyDescription>
							Add an inquiry question and bind monitored sensors to begin
							automatic detection.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : (
				<div className="flex flex-col gap-4">
					{inquiries.map((inquiry) => (
						<InquiryCard key={inquiry.id} inquiry={inquiry} />
					))}
				</div>
			)}
		</DashboardPage>
	);
};

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/setup/inquiries",
)({
	staticData: {
		breadcrumb: { label: "Inquiries" },
		productMenu: { title: "Setup", component: ExperimentSetupMenu },
	},
	loader: async ({ context, params }) => {
		await context.queryClient.query(
			inquiryListQueryOptions(params.experimentId),
		);
	},
	component: SetupInquiriesPage,
});
