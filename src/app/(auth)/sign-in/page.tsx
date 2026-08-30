import type { Metadata } from "next";

import { AlertBanner } from "@/components/auth/alert-banner";
import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
	title: "Sign In | Quiz Maker",
};

type SignInPageProps = {
	searchParams: Promise<{
		registered?: string;
		loggedOut?: string;
		message?: string;
	}>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
	const params = await searchParams;

	return (
		<AuthCard
			title="Sign in"
			description="Welcome back. Enter your credentials to continue."
			footer={
				<>
					Don&apos;t have an account?{" "}
					<AuthLink href="/sign-up">Sign Up</AuthLink>
				</>
			}
		>
			{params.registered === "true" ? (
				<AlertBanner message="Account created successfully. Please sign in." />
			) : null}
			{params.loggedOut === "true" ? (
				<AlertBanner message="You have been logged out successfully." />
			) : null}
			{params.message ? (
				<AlertBanner message={params.message} variant="info" />
			) : null}
			<SignInForm />
		</AuthCard>
	);
}
