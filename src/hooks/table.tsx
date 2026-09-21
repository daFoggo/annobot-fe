import {
	columnFilteringFeature,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	createTableHook,
	filterFns,
	globalFilteringFeature,
	rowPaginationFeature,
	rowSortingFeature,
	sortFns,
	tableFeatures,
} from "@tanstack/react-table";

/* Table defaults chung toàn app (docs/12_tanstack_table.md) — client-side row
 * models: sorting + filtering + pagination. Dùng cho list admin vừa phải. */
const features = tableFeatures({
	rowSortingFeature,
	rowPaginationFeature,
	columnFilteringFeature,
	globalFilteringFeature,
	sortedRowModel: createSortedRowModel(),
	filteredRowModel: createFilteredRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	sortFns,
	filterFns,
});

const { useAppTable, createAppColumnHelper } = createTableHook({
	features,
	debugTable: false,
	enableSortingRemoval: false,
});

/* Server-side table: KHÔNG dùng client row models — chỉ state/API pagination.
 * Dữ liệu đã phân trang server (Supabase .range), dùng manualPagination. */
const serverFeatures = tableFeatures({
	rowPaginationFeature,
});

const {
	useAppTable: useAppServerTable,
	createAppColumnHelper: createAppServerColumnHelper,
} = createTableHook({
	features: serverFeatures,
	debugTable: false,
});

export {
	createAppColumnHelper,
	createAppServerColumnHelper,
	useAppServerTable,
	useAppTable,
};
