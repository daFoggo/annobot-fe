import { IconFlask, IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMatch, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
	DashboardContextSwitcher,
	DashboardContextSwitcherItem,
	DashboardContextSwitcherSeparator,
	DashboardHeaderDivider,
} from "@/components/layout/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import {
	CreateExperimentDialog,
	experimentListQueryOptions,
} from "@/features/experiments";

/**
 * Bộ chọn experiment trên header — thay cho "workspace" trước đây. Experiment là
 * thực thể cấp cao nhất nên nó chính là ngữ cảnh đang làm việc.
 *
 * Dropdown gồm: ô tìm kiếm, danh sách experiment, và các hàng hành động
 * ("All experiments", "New experiment") — giống bộ chọn org của Vercel.
 */
export const DashboardHeaderContext = () => {
	const navigate = useNavigate();
	const [createOpen, setCreateOpen] = useState(false);
	const {
		data: experiments,
		isPending,
		isError,
	} = useQuery(experimentListQueryOptions());
	const match = useMatch({
		from: "/_dashboard/dashboard/experiments/$experimentId",
		shouldThrow: false,
	});
	const experimentId = match?.params.experimentId;

	// Chỉ hiện switcher khi đang ở trong một experiment (trang danh sách tự chọn).
	if (!experimentId) return null;

	if (isPending) {
		return (
			<>
				<DashboardHeaderDivider className="pl-2" />
				<Skeleton className="h-7 w-32" />
			</>
		);
	}

	if (isError) {
		return (
			<span className="text-xs text-destructive">
				Could not load experiments
			</span>
		);
	}

	const options = (experiments?.founds ?? []).map((experiment) => ({
		value: experiment.id,
		label: experiment.title,
	}));

	return (
		<>
			<DashboardHeaderDivider className="pl-2" />
			<DashboardContextSwitcher
				label="Experiment"
				value={experimentId}
				options={options}
				onValueChange={(id) =>
					navigate({
						to: "/dashboard/experiments/$experimentId",
						params: { experimentId: id },
					})
				}
				searchPlaceholder="Find experiment..."
				emptyMessage="No experiments found."
				footer={
					<>
						<DashboardContextSwitcherItem
							icon={<IconFlask />}
							onSelect={() => navigate({ to: "/dashboard/experiments" })}
						>
							All experiments
						</DashboardContextSwitcherItem>
						<DashboardContextSwitcherSeparator />
						<DashboardContextSwitcherItem
							icon={<IconPlus />}
							onSelect={() => setCreateOpen(true)}
						>
							New experiment
						</DashboardContextSwitcherItem>
					</>
				}
			/>
			<CreateExperimentDialog
				trigger={null}
				open={createOpen}
				onOpenChange={setCreateOpen}
			/>
		</>
	);
};
