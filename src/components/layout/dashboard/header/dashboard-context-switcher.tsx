import {
	IconCheck,
	IconLayoutGrid,
	IconSearch,
	IconSelector,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DashboardContextOption {
	value: string;
	label: string;
	description?: string;
}

/**
 * Đường phân cách full-width giữa các nhóm row trong dropdown. Dùng `-mx-1` để
 * bù lại padding của content nên line luôn chạm mép.
 */
export const DashboardContextSwitcherSeparator = () => (
	<div className="-mx-1 my-1 h-px bg-border" aria-hidden />
);

/** Một dòng trong dropdown (option hoặc hành động). Padding đồng nhất `py-1.5`. */
export const DashboardContextSwitcherItem = ({
	icon,
	children,
	onSelect,
}: {
	icon?: ReactNode;
	children: ReactNode;
	onSelect?: () => void;
}) => (
	<button
		type="button"
		onClick={onSelect}
		className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
	>
		{icon}
		<span className="min-w-0 flex-1 truncate">{children}</span>
	</button>
);

export interface DashboardContextSwitcherProps {
	/** Nhãn của nhóm lựa chọn, dùng cho aria-label. */
	label: string;
	value: string;
	options: DashboardContextOption[];
	onValueChange?: (value: string) => void;
	/** Badge hiển thị cạnh giá trị đang chọn (plan, môi trường...). */
	badge?: ReactNode;
	/**
	 * Các dòng hành động thêm ở cuối dropdown (composition). Ngăn cách bằng
	 * `DashboardContextSwitcherSeparator`.
	 */
	footer?: ReactNode;
	/** Nếu có, hiện ô tìm kiếm lọc options trong dropdown. */
	searchPlaceholder?: string;
	emptyMessage?: string;
}

/**
 * Dropdown chọn ngữ cảnh (workspace/project/experiment...), dựng theo hình dáng
 * bộ chọn org/project của Vercel: ô tìm kiếm + danh sách + các hàng hành động.
 * Dùng `Popover` (không phải menu) để ô search nhận được phím gõ bình thường.
 * Mọi row có padding đồng nhất `py-1.5`; phân cách bằng separator full-width.
 */
export const DashboardContextSwitcher = ({
	label,
	value,
	options,
	onValueChange,
	badge,
	footer,
	searchPlaceholder,
	emptyMessage = "No results.",
}: DashboardContextSwitcherProps) => {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const selected = options.find((option) => option.value === value);
	const filtered = query
		? options.filter((option) =>
				option.label.toLowerCase().includes(query.toLowerCase()),
			)
		: options;

	return (
		<div className="flex min-w-0 items-center gap-2">
			<Popover
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) setQuery("");
				}}
			>
				<PopoverTrigger
					render={
						<Button variant="ghost" size="sm" aria-label={label}>
							<IconLayoutGrid className="size-4 text-muted-foreground" />
							<span className="max-w-32 truncate">
								{selected?.label ?? value}
							</span>
							<IconSelector className="text-muted-foreground" />
						</Button>
					}
				/>
				<PopoverContent align="start" className="w-64 gap-0 p-1">
					{searchPlaceholder ? (
						<div className="-mx-1 mb-1 border-b border-border px-1 pb-1">
							<InputGroup>
								<InputGroupAddon>
									<IconSearch />
								</InputGroupAddon>
								<InputGroupInput
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder={searchPlaceholder}
									aria-label={searchPlaceholder}
								/>
							</InputGroup>
						</div>
					) : null}
					<div className="flex min-w-0 flex-col">
						{filtered.length === 0 ? (
							<p className="px-2 py-1.5 text-xs text-muted-foreground">
								{emptyMessage}
							</p>
						) : (
							filtered.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => {
										onValueChange?.(option.value);
										setOpen(false);
									}}
									className={cn(
										"flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
										option.value === value && "bg-accent/60",
									)}
								>
									<span className="min-w-0 flex-1 truncate">
										{option.label}
									</span>
									{option.value === value ? (
										<IconCheck className="size-4 shrink-0" />
									) : null}
								</button>
							))
						)}
						{footer ? (
							<>
								<DashboardContextSwitcherSeparator />
								{footer}
							</>
						) : null}
					</div>
				</PopoverContent>
			</Popover>
			{typeof badge === "string" ? (
				<Badge variant="outline">{badge}</Badge>
			) : (
				badge
			)}
		</div>
	);
};
