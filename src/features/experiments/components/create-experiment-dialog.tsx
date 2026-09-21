import { useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/error";
import { useCreateExperiment } from "../queries";

export interface CreateExperimentDialogProps {
	/**
	 * Trigger tuỳ biến. Mặc định là nút "New experiment"; truyền `null` khi dialog
	 * được điều khiển từ bên ngoài (vd từ một item trong dropdown switcher).
	 */
	trigger?: ReactElement | null;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog tạo experiment. Hỗ trợ cả uncontrolled (có trigger) và controlled
 * (`open`/`onOpenChange` + `trigger={null}`) để tái sử dụng ở nhiều chỗ.
 */
export const CreateExperimentDialog = ({
	trigger,
	open,
	onOpenChange,
}: CreateExperimentDialogProps) => {
	const navigate = useNavigate();
	const [internalOpen, setInternalOpen] = useState(false);
	const [title, setTitle] = useState("");
	const createExperiment = useCreateExperiment();
	const canSubmit = title.trim().length > 0;

	const isControlled = open !== undefined;
	const dialogOpen = isControlled ? open : internalOpen;

	const handleOpenChange = (next: boolean) => {
		if (isControlled) {
			onOpenChange?.(next);
		} else {
			setInternalOpen(next);
		}
		if (!next) setTitle("");
	};

	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSubmit) return;

		createExperiment.mutate(
			{ title: title.trim() },
			{
				onSuccess: (experiment) => {
					handleOpenChange(false);
					navigate({
						to: "/dashboard/experiments/$experimentId",
						params: { experimentId: experiment.id },
					});
				},
			},
		);
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
			{trigger === null ? null : (
				<DialogTrigger render={trigger ?? <Button>New experiment</Button>} />
			)}
			<DialogContent>
				<form onSubmit={onSubmit} className="flex flex-col gap-4">
					<DialogHeader>
						<DialogTitle>New experiment</DialogTitle>
						<DialogDescription>
							Give your experiment a name. You can change the details later.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						<Label htmlFor="experiment-title">Title</Label>
						<Input
							id="experiment-title"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="My experiment"
						/>
					</div>
					{createExperiment.isError ? (
						<p className="text-xs text-destructive">
							{getErrorMessage(
								createExperiment.error,
								"Could not create experiment.",
							)}
						</p>
					) : null}
					<DialogFooter>
						<Button
							type="submit"
							disabled={!canSubmit || createExperiment.isPending}
						>
							{createExperiment.isPending ? "Creating…" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
