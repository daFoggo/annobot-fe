import {
	IconDevicesBolt,
	IconLayoutGrid,
	IconLayoutList,
	IconPlus,
	IconSearch,
} from "@tabler/icons-react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardPage } from "@/components/layout/dashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	CreateExperimentDialog,
	experimentListQueryOptions,
} from "@/features/experiments";
import { getErrorMessage } from "@/lib/error";
import { ExperimentGrid } from "./-components/experiment-grid";
import { ExperimentList } from "./-components/experiment-list";

const PAGE_SIZE = 12;

type SortOption = "name" | "created" | "updated";
type ViewMode = "grid" | "list";

const SORT_LABELS: Record<SortOption, string> = {
	name: "Sort by name",
	created: "Sort by created",
	updated: "Sort by updated",
};

interface PageItem {
	key: string;
	type: "page" | "ellipsis";
	value?: number;
}

/** Danh sách trang hiển thị trên pagination, có dấu "…" khi số trang lớn. */
const getPageItems = (current: number, total: number): PageItem[] => {
	if (total <= 7) {
		return Array.from({ length: total }, (_, index) => ({
			key: `page-${index + 1}`,
			type: "page" as const,
			value: index + 1,
		}));
	}
	const candidates = new Set([1, total, current - 1, current, current + 1]);
	const pages = [...candidates]
		.filter((page) => page >= 1 && page <= total)
		.sort((a, b) => a - b);

	const items: PageItem[] = [];
	let prev = 0;
	for (const page of pages) {
		if (page - prev > 1) {
			items.push({ key: `gap-${prev}-${page}`, type: "ellipsis" });
		}
		items.push({ key: `page-${page}`, type: "page", value: page });
		prev = page;
	}
	return items;
};

const ExperimentsPage = () => {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortOption>("name");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");

	const { data, isPending, isError, error } = useQuery({
		...experimentListQueryOptions({ page, page_size: PAGE_SIZE }),
		placeholderData: keepPreviousData,
	});

	const total = data?.total_count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	const experiments = (data?.founds ?? [])
		.filter((experiment) =>
			experiment.title.toLowerCase().includes(search.toLowerCase()),
		)
		.sort((a, b) => {
			if (sort === "name") return a.title.localeCompare(b.title);
			if (sort === "created")
				return (
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				);
			return (
				new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
			);
		});

	const firstOnPage = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const lastOnPage = Math.min(page * PAGE_SIZE, total);

	return (
		<DashboardPage
			title="Experiments"
			description="An experiment is your workspace to explore a service — it groups the inquiries, sensors and annotations for one study."
			actions={
				<CreateExperimentDialog
					trigger={
						<Button>
							<IconPlus data-icon="inline-start" />
							New experiment
						</Button>
					}
				/>
			}
		>
			{isPending ? (
				<ExperimentsLoading />
			) : isError ? (
				<Alert variant="destructive">
					<AlertDescription>
						{getErrorMessage(error, "Failed to load experiments.")}
					</AlertDescription>
				</Alert>
			) : (
				<div className="flex flex-col gap-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex flex-wrap items-center gap-3">
							<InputGroup className="w-64">
								<InputGroupAddon align="inline-start">
									<IconSearch data-icon />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search experiments..."
									value={search}
									onChange={(event) => setSearch(event.target.value)}
								/>
							</InputGroup>
							<Select
								value={sort}
								onValueChange={(value) => {
									if (value) setSort(value as SortOption);
								}}
							>
								<SelectTrigger className="w-40">
									{SORT_LABELS[sort]}
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="name">Sort by name</SelectItem>
										<SelectItem value="created">Sort by created</SelectItem>
										<SelectItem value="updated">Sort by updated</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						<Tabs
							value={viewMode}
							onValueChange={(value) => {
								if (value === "grid" || value === "list") {
									setViewMode(value);
								}
							}}
						>
							<TabsList>
								<TabsTrigger value="grid" aria-label="Grid view">
									<IconLayoutGrid data-icon />
								</TabsTrigger>
								<TabsTrigger value="list" aria-label="List view">
									<IconLayoutList data-icon />
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{total === 0 ? (
						<Empty className="border">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<IconDevicesBolt />
								</EmptyMedia>
								<EmptyTitle>No experiments yet</EmptyTitle>
								<EmptyDescription>
									Create an experiment to study a service in your home.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<CreateExperimentDialog
									trigger={
										<Button>
											<IconPlus data-icon="inline-start" />
											New experiment
										</Button>
									}
								/>
							</EmptyContent>
						</Empty>
					) : experiments.length === 0 ? (
						<Empty className="border">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<IconDevicesBolt />
								</EmptyMedia>
								<EmptyTitle>No experiments found</EmptyTitle>
								<EmptyDescription>
									No experiment matches your search.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : viewMode === "grid" ? (
						<ExperimentGrid experiments={experiments} />
					) : (
						<ExperimentList experiments={experiments} />
					)}

					<div className="flex flex-col items-center gap-2">
						<p className="text-xs text-muted-foreground">
							Showing {firstOnPage}–{lastOnPage} of {total}
						</p>
						{totalPages > 1 ? (
							<Pagination>
								<PaginationContent>
									{page > 1 ? (
										<PaginationItem>
											<PaginationPrevious
												onClick={() => setPage(Math.max(1, page - 1))}
											/>
										</PaginationItem>
									) : null}
									{getPageItems(page, totalPages).map((item) => (
										<PaginationItem key={item.key}>
											{item.type === "ellipsis" ? (
												<PaginationEllipsis />
											) : (
												<PaginationLink
													isActive={item.value === page}
													onClick={() => setPage(item.value ?? 1)}
												>
													{item.value}
												</PaginationLink>
											)}
										</PaginationItem>
									))}
									{page < totalPages ? (
										<PaginationItem>
											<PaginationNext
												onClick={() => setPage(Math.min(totalPages, page + 1))}
											/>
										</PaginationItem>
									) : null}
								</PaginationContent>
							</Pagination>
						) : null}
					</div>
				</div>
			)}
		</DashboardPage>
	);
};

const ExperimentsLoading = () => (
	<div className="flex flex-col gap-6">
		<div className="flex flex-wrap items-center justify-between gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-8 w-40" />
			</div>
			<Skeleton className="h-8 w-16" />
		</div>
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-32 rounded-lg" />
		</div>
	</div>
);

export const Route = createFileRoute("/_dashboard/dashboard/experiments/")({
	staticData: {
		breadcrumb: { label: "Experiments" },
	},
	loader: async ({ context }) => {
		await context.queryClient.query(
			experimentListQueryOptions({ page: 1, page_size: PAGE_SIZE }),
		);
	},
	component: ExperimentsPage,
});
