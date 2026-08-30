"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { AuthCard } from "@/components/auth/auth-card";

export default function SignOutPage() {
	const router = useRouter();
	const hasStarted = useRef(false);

	useEffect(() => {
		if (hasStarted.current) {
			return;
		}
		hasStarted.current = true;

		async function signOut() {
			try {
				await fetch("/api/auth/logout", { method: "POST" });
			} finally {
				router.replace("/sign-in?loggedOut=true");
			}
		}

		void signOut();
	}, [router]);

	return (
		<AuthCard
			title="Signing you out"
			description="Clearing your session and returning you to sign in."
		>
			<p className="text-center text-sm text-muted-foreground">
				Please wait a moment…
			</p>
		</AuthCard>
	);
}
