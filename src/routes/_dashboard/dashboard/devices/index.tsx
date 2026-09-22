import { IconDeviceDesktop } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/layout/dashboard";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

/** Trang Devices — chưa có luồng dữ liệu, chỉ là nơi chứa menu tạm thời. */
const DevicesPage = () => (
	<DashboardPage
		title="Devices"
		description="Manage the devices that collect sensor data for your studies."
	>
		<Empty className="border">
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<IconDeviceDesktop />
				</EmptyMedia>
				<EmptyTitle>No devices yet</EmptyTitle>
				<EmptyDescription>
					Devices will appear here once they are connected to your workspace.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	</DashboardPage>
);

export const Route = createFileRoute("/_dashboard/dashboard/devices/")({
	staticData: {
		breadcrumb: { label: "Devices" },
	},
	component: DevicesPage,
});
