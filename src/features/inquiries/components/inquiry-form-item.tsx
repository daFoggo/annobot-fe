"use client";

import { IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SensorPicker } from "@/features/sensors";
import type { InquiryType } from "../schemas";

export const INQUIRY_TYPE_OPTIONS: InquiryType[] = [
	"appliance",
	"fact",
	"performance",
	"custom",
];

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
	appliance: "Appliance",
	fact: "Fact",
	performance: "Performance",
	custom: "Custom",
};

export interface InquiryFormValues {
	question: string;
	type: InquiryType;
	goalGamma: string;
	sensorIds: string[];
}

export interface InquiryFormItemProps {
	index: number;
	values: InquiryFormValues;
	onChange: (patch: Partial<InquiryFormValues>) => void;
	onRemove: () => void;
	canRemove: boolean;
}

/**
 * Form chỉnh sửa một inquiry trong wizard: câu hỏi Q, loại, mục tiêu Γ và
 * bộ chọn cảm biến S. Controlled từ phía cha (wizard giữ danh sách inquiries).
 * Tuân thủ chuẩn composition của Card (CardHeader, CardTitle, CardAction, CardContent).
 */
export const InquiryFormItem = ({
	index,
	values,
	onChange,
	onRemove,
	canRemove,
}: InquiryFormItemProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Inquiry #{index + 1}</CardTitle>
				<CardAction>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onRemove}
						disabled={!canRemove}
						aria-label={`Remove inquiry ${index + 1}`}
					>
						<IconTrash />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
					<Field>
						<FieldLabel htmlFor={`inquiry-${index}-question`}>
							Question <span className="text-destructive">*</span>
						</FieldLabel>
						<Input
							id={`inquiry-${index}-question`}
							value={values.question}
							onChange={(event) => onChange({ question: event.target.value })}
							placeholder="e.g. Which washing mode saves the most energy?"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor={`inquiry-${index}-type`}>
							Inquiry Type
						</FieldLabel>
						<Select
							value={values.type}
							onValueChange={(value) => {
								if (value) onChange({ type: value as InquiryType });
							}}
						>
							<SelectTrigger id={`inquiry-${index}-type`} className="w-full">
								<SelectValue>
									{INQUIRY_TYPE_LABELS[values.type] ?? values.type}
								</SelectValue>
							</SelectTrigger>
							<SelectContent align="start">
								<SelectGroup>
									{INQUIRY_TYPE_OPTIONS.map((type) => (
										<SelectItem key={type} value={type}>
											{INQUIRY_TYPE_LABELS[type]}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field>
				</div>

				<Field>
					<FieldLabel htmlFor={`inquiry-${index}-goal`}>
						Operational Goal
					</FieldLabel>
					<Input
						id={`inquiry-${index}-goal`}
						value={values.goalGamma}
						onChange={(event) => onChange({ goalGamma: event.target.value })}
						placeholder="Optional — e.g. Reduce washing energy consumption"
					/>
					<FieldDescription>
						The desired operational outcome this inquiry drives towards.
					</FieldDescription>
				</Field>

				<Field>
					<div className="flex items-center justify-between pb-1">
						<FieldLabel>Assigned Devices / Sensors</FieldLabel>
						<span className="text-xs text-muted-foreground">
							{values.sensorIds.length} selected
						</span>
					</div>
					<SensorPicker
						value={values.sensorIds}
						onChange={(sensorIds) => onChange({ sensorIds })}
					/>
				</Field>
			</CardContent>
		</Card>
	);
};
