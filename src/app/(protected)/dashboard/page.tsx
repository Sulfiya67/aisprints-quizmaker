import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getSessionIdFromCookie } from "@/lib/auth/cookies";
import { SIGN_IN_MESSAGE } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
	title: "Dashboard | Quiz Maker",
};

function getFirstName(fullName: string): string {
	return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default async function DashboardPage() {
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

			<main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
				<div className="max-w-lg space-y-4 text-center">
					<h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
						Welcome back, {getFirstName(user.fullName)}
					</h1>
					<p className="text-base text-muted-foreground">
						You&apos;re signed in to Quiz Maker as {user.email}.
					</p>
				</div>
			</main>
		</div>
	);
}
