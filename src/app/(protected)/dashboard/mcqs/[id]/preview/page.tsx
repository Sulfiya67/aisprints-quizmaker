import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { McqPreview } from "@/components/mcq/mcq-preview";
import { SiteHeader } from "@/components/site-header";
import { getSessionIdFromCookie } from "@/lib/auth/cookies";
import { SIGN_IN_MESSAGE } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getMcq } from "@/lib/services/mcq";

type PageProps = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { id } = await params;
	const sessionId = await getSessionIdFromCookie();
	const user = await getSessionUser(sessionId);
	const mcq = user ? await getMcq(user.id, id) : null;

	return {
		title: mcq ? `Preview ${mcq.name} | Quiz Maker` : "Preview MCQ | Quiz Maker",
	};
}

export default async function PreviewMcqPage({ params }: PageProps) {
	const sessionId = await getSessionIdFromCookie();
	const user = await getSessionUser(sessionId);

	if (!user) {
		redirect(
			`/sign-in?message=${encodeURIComponent(SIGN_IN_MESSAGE)}`,
		);
	}

	const { id } = await params;
	const mcq = await getMcq(user.id, id);

	if (!mcq) {
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<SiteHeader user={user} />

			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
				<div className="mb-6">
					<h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
						Preview MCQ
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Try answering this question to record a preview attempt.
					</p>
				</div>

				<McqPreview
					mcq={{
						id: mcq.id,
						name: mcq.name,
						question: mcq.question,
						choices: mcq.choices.map(({ id, choiceText }) => ({
							id,
							choiceText,
						})),
					}}
				/>
			</main>
		</div>
	);
}
