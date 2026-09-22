"use client";

import { IconHelp } from "@tabler/icons-react";
import type { ReactNode } from "react";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import type { Inquiry } from "../schemas";
import { InquiryDetailCard } from "./inquiry-detail-card";

/**
 * Danh sách inquiries của một experiment (trang chi tiết / tab Inquiries).
 * Rỗng → empty state có icon và action; có dữ liệu → chuỗi InquiryDetailCard.
 */
export const InquiryList = ({
	inquiries,
	action,
}: {
	inquiries: Inquiry[];
	action?: ReactNode;
}) => {
	if (inquiries.length === 0) {
		return (
			<Empty className="border bg-card shadow-xs">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<IconHelp />
					</EmptyMedia>
					<EmptyTitle>No inquiries yet</EmptyTitle>
					<EmptyDescription>
						Add an inquiry to start studying a service in this experiment.
					</EmptyDescription>
				</EmptyHeader>
				{action ? <EmptyContent>{action}</EmptyContent> : null}
			</Empty>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{inquiries.map((inquiry) => (
				<InquiryDetailCard key={inquiry.id} inquiry={inquiry} />
			))}
		</div>
	);
};
