import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { McqTable } from "@/components/mcq/mcq-table";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getSessionIdFromCookie } from "@/lib/auth/cookies";
import { SIGN_IN_MESSAGE } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";
import { listMcqs } from "@/lib/services/mcq";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Dashboard | Quiz Maker",
};

export default async function DashboardPage() {
	const sessionId = await getSessionIdFromCookie();
	const user = await getSessionUser(sessionId);

	if (!user) {
		redirect(
			`/sign-in?message=${encodeURIComponent(SIGN_IN_MESSAGE)}`,
		);
	}

	const mcqs = await listMcqs(user.id);

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<SiteHeader user={user} />

			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
							Multiple-choice questions
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Create, edit, preview, and delete your questions.
						</p>
					</div>

					<Link
						href="/dashboard/mcqs/new"
						className={cn(buttonVariants({ variant: "default" }))}
					>
						Create MCQ
					</Link>
				</div>

				<McqTable mcqs={mcqs} />
			</main>
		</div>
	);
}
