"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleLogout() {
		setIsSubmitting(true);

		try {
			const response = await fetch("/api/auth/logout", { method: "POST" });

			if (!response.ok) {
				return;
			}

			router.push("/sign-in?loggedOut=true");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Button
			type="button"
			variant="outline"
			onClick={handleLogout}
			disabled={isSubmitting}
		>
			{isSubmitting ? "Logging out..." : "Log out"}
		</Button>
	);
}
