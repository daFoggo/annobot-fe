import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";
import type * as React from "react";
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
	Questionnaire,
	QuestionnaireActions,
	QuestionnaireChoice,
	QuestionnaireChoiceDescription,
	QuestionnaireChoices,
	QuestionnaireDescription,
	QuestionnaireError,
	QuestionnaireItem,
	QuestionnaireSubmit,
	QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { Separator } from "@/components/ui/separator";
import type {
	AnnotationSummary,
	QcConflict,
	QuestionnaireItemSpec,
} from "./types";

/**
 * Các "rich component" mà case agent có thể đính vào một lượt hội thoại:
 * câu hỏi có lựa chọn (`Questionnaire`), cảnh báo mâu thuẫn (cooperative
 * learning), và tổng kết annotation.
 */

interface CaseQuestionnaireProps {
	items: QuestionnaireItemSpec[];
	onAnswer?: (answers: Record<string, string | string[]>) => void;
}

export const CaseQuestionnaire = ({
	items,
	onAnswer,
}: CaseQuestionnaireProps) => {
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const answers: Record<string, string | string[]> = {};
		for (const item of items) {
			const values = data.getAll(item.name).map((value) => String(value));
			answers[item.name] = item.multiple ? values : (values[0] ?? "");
		}
		onAnswer?.(answers);
	};

	return (
		<Questionnaire items={items} onSubmit={handleSubmit}>
			{items.map((item) => (
				<QuestionnaireItem
					key={item.name}
					name={item.name}
					required={item.required}
				>
					<QuestionnaireTitle>{item.prompt}</QuestionnaireTitle>
					{item.description ? (
						<QuestionnaireDescription>
							{item.description}
						</QuestionnaireDescription>
					) : null}
					<QuestionnaireChoices>
						{item.choices.map((choice) => (
							<QuestionnaireChoice key={choice.value} value={choice.value}>
								<span className="font-medium">{choice.label}</span>
								{choice.description ? (
									<QuestionnaireChoiceDescription>
										{choice.description}
									</QuestionnaireChoiceDescription>
								) : null}
							</QuestionnaireChoice>
						))}
					</QuestionnaireChoices>
					<QuestionnaireError />
				</QuestionnaireItem>
			))}
			<QuestionnaireActions>
				<QuestionnaireSubmit>Gửi</QuestionnaireSubmit>
			</QuestionnaireActions>
		</Questionnaire>
	);
};

export const QcConflictCard = ({ conflict }: { conflict: QcConflict }) => (
	<Card size="sm" className="ring-destructive/30">
		<CardHeader>
			<CardTitle className="flex items-center gap-2 text-sm">
				<IconAlertTriangle className="size-4 text-destructive" />
				Kiểm tra chất lượng
				<Badge variant="destructive">Mâu thuẫn</Badge>
			</CardTitle>
			<CardDescription>{conflict.note}</CardDescription>
		</CardHeader>
		<CardContent className="flex flex-col gap-3">
			<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
				<div className="flex flex-col gap-0.5">
					<dt className="text-xs text-muted-foreground">
						{conflict.field} · bạn khai
					</dt>
					<dd className="font-medium">{conflict.declared}</dd>
				</div>
				<div className="flex flex-col gap-0.5">
					<dt className="text-xs text-muted-foreground">Đo được</dt>
					<dd className="font-medium">{conflict.measured}</dd>
				</div>
			</dl>
			<Separator />
			<div className="flex flex-wrap gap-1.5">
				<Button size="sm" variant="secondary">
					Giữ nguyên
				</Button>
				<Button size="sm" variant="outline">
					Sửa lại
				</Button>
			</div>
		</CardContent>
	</Card>
);

export const AnnotationSummaryCard = ({
	summary,
}: {
	summary: AnnotationSummary;
}) => (
	<Card size="sm">
		<CardHeader>
			<CardTitle className="flex items-center gap-2 text-sm">
				<IconCircleCheck className="size-4 text-primary" />
				Annotation đã ghi
				<Badge variant="secondary">Complete</Badge>
			</CardTitle>
			<CardDescription>
				Case đã đóng và được đưa vào tập tri thức của inquiry.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
				{summary.fields.map((field) => (
					<div
						key={field.label}
						className="flex items-center justify-between gap-4"
					>
						<dt className="text-xs text-muted-foreground">{field.label}</dt>
						<dd className="font-medium">{field.value}</dd>
					</div>
				))}
			</dl>
		</CardContent>
	</Card>
);
