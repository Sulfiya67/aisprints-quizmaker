import Link from "next/link";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type AuthCardProps = {
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
};

export function AuthCard({
	title,
	description,
	children,
	footer,
}: AuthCardProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description ? (
						<CardDescription>{description}</CardDescription>
					) : null}
				</CardHeader>
				<CardContent className="flex flex-col gap-4">{children}</CardContent>
				{footer ? (
					<div className="border-t px-(--card-spacing) py-3 text-center text-sm text-muted-foreground">
						{footer}
					</div>
				) : null}
			</Card>
		</div>
	);
}

export function AuthLink({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className="font-medium text-primary underline-offset-4 hover:underline"
		>
			{children}
		</Link>
	);
}
