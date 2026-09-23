import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type { CaseFindResult, CaseListParams } from "./schemas";

/** `GET /cases` — danh sách phân trang cases của một experiment. */
export const listCases = async (
	params: CaseListParams,
): Promise<CaseFindResult> => {
	const searchParams = new URLSearchParams();
	searchParams.set("experiment_id", params.experiment_id);
	if (params.inquiry_id) searchParams.set("inquiry_id", params.inquiry_id);
	if (params.status) searchParams.set("status", params.status);
	if (params.page != null) searchParams.set("page", String(params.page));
	if (params.page_size != null)
		searchParams.set("page_size", String(params.page_size));

	return api.get("cases", { searchParams }).json<CaseFindResult>();
};

/** `POST /experiments/{experimentId}/detect` — trigger detection / backfill. */
export const triggerDetection = async (
	experimentId: string,
	inquiryId?: string,
): Promise<{
	status: string;
	message: string;
	cases_created?: number;
	inquiries?: number;
}> => {
	const searchParams = new URLSearchParams();
	if (inquiryId) searchParams.set("inquiry_id", inquiryId);

	return api
		.post(`experiments/${experimentId}/detect`, { searchParams })
		.json();
};
