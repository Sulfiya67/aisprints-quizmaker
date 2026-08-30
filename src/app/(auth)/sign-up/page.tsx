import type { Metadata } from "next";

import { AuthCard, AuthLink } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
	title: "Sign Up | Quiz Maker",
};

export default function SignUpPage() {
	return (
		<AuthCard
			title="Create an account"
			description="Sign up to start creating and taking quizzes."
			footer={
				<>
					Already have an account? <AuthLink href="/sign-in">Sign In</AuthLink>
				</>
			}
		>
			<SignUpForm />
		</AuthCard>
	);
}
