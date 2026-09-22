import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type {
	Inquiry,
	InquiryCreateInput,
	InquiryUpdateInput,
} from "./schemas";

/** `GET /inquiries?experiment_id=...` — danh sách inquiry của một experiment. */
export const listInquiries = async (experimentId: string): Promise<Inquiry[]> =>
	api
		.get("inquiries", { searchParams: { experiment_id: experimentId } })
		.json<Inquiry[]>();

/** `POST /inquiries`. */
export const createInquiry = async (
	payload: InquiryCreateInput,
): Promise<Inquiry> => api.post("inquiries", { json: payload }).json<Inquiry>();

/** `PATCH /inquiries/{id}`. */
export const updateInquiry = async (
	id: string,
	payload: InquiryUpdateInput,
): Promise<Inquiry> =>
	api.patch(`inquiries/${id}`, { json: payload }).json<Inquiry>();

/** `DELETE /inquiries/{id}`. */
export const deleteInquiry = async (id: string): Promise<void> => {
	await api.delete(`inquiries/${id}`);
};
