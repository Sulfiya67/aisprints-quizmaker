import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { McqForm } from "@/components/mcq/mcq-form";
import { SiteHeader } from "@/components/site-header";
import { getSessionIdFromCookie } from "@/lib/auth/cookies";
import { SIGN_IN_MESSAGE } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
	title: "Create MCQ | Quiz Maker",
};

export default async function NewMcqPage() {
	const sessionId = await getSessionIdFromCookie();
	const user = await getSessionUser(sessionId);

	if (!user) {
		redirect(
			`/sign-in?message=${encodeURIComponent(SIGN_IN_MESSAGE)}`,
		);
	}

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<SiteHeader user={user} />

			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
				<div className="mb-6">
					<h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
						Create MCQ
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Add a new multiple-choice question with answer choices.
					</p>
				</div>

				<McqForm mode="create" />
			</main>
		</div>
	);
}
