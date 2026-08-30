import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
				<div className="max-w-lg space-y-4 text-center">
					<Badge
						variant="secondary"
						className="rounded-full px-3 py-1 text-xs font-normal"
					>
						Get started
					</Badge>
					<h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
						Turn your knowledge into a challenge
					</h1>
					<p className="text-base text-muted-foreground">
						Create and take quizzes, test yourself, and see what you can achieve.
					</p>
					<div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
						<Link
							href="/sign-in"
							className={cn(buttonVariants({ size: "lg" }), "min-w-36")}
						>
							Sign In
						</Link>
						<Link
							href="/sign-up"
							className={cn(buttonVariants({ size: "lg" }), "min-w-36")}
						>
							Sign Up
						</Link>
					</div>
				</div>
			</main>
		</div>
	);
}
