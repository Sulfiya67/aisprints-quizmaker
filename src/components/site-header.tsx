import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { QuizMakerLogo } from "@/components/quiz-maker-logo";
import { buttonVariants } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function getUserInitial(name: string): string {
	return name.trim().charAt(0).toUpperCase() || "?";
}

function BrandMark() {
	return (
		<div className="flex items-center gap-3">
			<div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
				<QuizMakerLogo />
			</div>
			<div>
				<p className="font-semibold leading-none">Quiz Maker</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Create quizzes. Challenge yourself.
				</p>
			</div>
		</div>
	);
}

type SiteHeaderProps = {
	user?: SessionUser | null;
};

export function SiteHeader({ user }: SiteHeaderProps) {
	return (
		<header className="border-b border-border bg-background">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
				<BrandMark />

				{user ? (
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3">
							<div
								className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
								aria-hidden
							>
								{getUserInitial(user.fullName)}
							</div>
							<div className="hidden text-right sm:block">
								<p className="text-sm font-medium leading-none">
									{user.fullName}
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									{user.email}
								</p>
							</div>
						</div>
						<LogoutButton />
					</div>
				) : (
					<div className="flex items-center gap-3">
						<Link
							href="/sign-in"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							Sign In
						</Link>
						<Link
							href="/sign-up"
							className={cn(buttonVariants({ variant: "outline" }))}
						>
							Sign Up
						</Link>
					</div>
				)}
			</div>
		</header>
	);
}
