/**
 * Render `**bold**` cho prose của agent (kiểu Output trong Opik). Cố tình không
 * kéo thêm markdown parser: chỉ hỗ trợ một cặp dấu `**` trên mỗi đoạn.
 */
export const RichText = ({ text }: { text: string }) => {
	// Tách xen kẽ đoạn thường / đoạn đậm; khoá dựa trên nội dung nên ổn định
	// qua các lần render (không dùng index).
	const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

	return (
		<p className="text-sm leading-relaxed whitespace-pre-wrap">
			{parts.map((part) =>
				part.startsWith("**") && part.endsWith("**") ? (
					<strong key={part} className="font-semibold">
						{part.slice(2, -2)}
					</strong>
				) : (
					<span key={part}>{part}</span>
				),
			)}
		</p>
	);
};
