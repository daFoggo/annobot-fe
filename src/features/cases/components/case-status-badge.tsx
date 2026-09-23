import { Badge } from "@/components/ui/badge";
import type { Case } from "../schemas";

interface CaseStatusBadgeProps {
	status: Case["status"];
}

export const CaseStatusBadge = ({ status }: CaseStatusBadgeProps) => {
	switch (status) {
		case "annotation_free":
			return (
				<Badge
					variant="outline"
					className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
				>
					Tự động đóng (Closed)
				</Badge>
			);
		case "pending":
			return (
				<Badge
					variant="outline"
					className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
				>
					Chờ gán nhãn (Pending)
				</Badge>
			);
		case "asked":
			return (
				<Badge
					variant="outline"
					className="border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400"
				>
					Đang hỏi (Asked)
				</Badge>
			);
		case "annotated":
		case "complete":
			return (
				<Badge
					variant="outline"
					className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
				>
					Đã gán nhãn (Done)
				</Badge>
			);
		case "deferred":
			return (
				<Badge
					variant="outline"
					className="border-border text-muted-foreground"
				>
					Tạm hoãn (Deferred)
				</Badge>
			);
		default:
			return <Badge variant="outline">{status}</Badge>;
	}
};
