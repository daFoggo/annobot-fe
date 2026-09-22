import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
import { InquiryList, inquiryListQueryOptions } from "@/features/inquiries";
import { AddInquiryDialog } from "./-components/add-inquiry-dialog";

const ExperimentInquiriesPage = () => {
	const { experimentId } = Route.useParams();
	const { data: inquiries } = useSuspenseQuery(
		inquiryListQueryOptions(experimentId),
	);

	return (
		<DashboardPage
			title="Inquiries"
			description="The questions this experiment studies and their assigned sensors."
			actions={<AddInquiryDialog experimentId={experimentId} />}
		>
			<InquiryList
				inquiries={inquiries}
				action={<AddInquiryDialog experimentId={experimentId} />}
			/>
		</DashboardPage>
	);
};

export const Route = createFileRoute(
	"/_dashboard/dashboard/experiments/$experimentId/inquiries",
)({
	staticData: {
		breadcrumb: { label: "Inquiries" },
	},
	loader: async ({ context, params }) => {
		await context.queryClient.query(
			inquiryListQueryOptions(params.experimentId),
		);
	},
	component: ExperimentInquiriesPage,
});
