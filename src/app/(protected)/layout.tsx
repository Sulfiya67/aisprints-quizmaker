import { redirect } from "next/navigation";

import { getSessionIdFromCookie } from "@/lib/auth/cookies";
import { SIGN_IN_MESSAGE } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";

export default async function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const sessionId = await getSessionIdFromCookie();
	const user = await getSessionUser(sessionId);

	if (!user) {
		redirect(
			`/sign-in?message=${encodeURIComponent(SIGN_IN_MESSAGE)}`,
		);
	}

	return <>{children}</>;
}
