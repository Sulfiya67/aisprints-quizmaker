import { cn } from "@/lib/utils";

type AlertBannerProps = {
	message: string;
	variant?: "success" | "info";
};

export function AlertBanner({ message, variant = "success" }: AlertBannerProps) {
	return (
		<div
			role="status"
			className={cn(
				"rounded-lg border px-3 py-2 text-sm",
				variant === "success" &&
					"border-primary/30 bg-primary/5 text-foreground",
				variant === "info" &&
					"border-border bg-muted text-foreground",
			)}
		>
			{message}
		</div>
	);
}
