/**
 * Phase 5 auth verification script — run against `npm run preview` (http://127.0.0.1:8787).
 */
const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:8787";
const email = `phase5-${Date.now()}@example.com`;
const password = "SecureP@ss1";

const results = [];

function test(name, condition) {
	results.push({ name, pass: Boolean(condition) });
}

async function request(path, options = {}) {
	const response = await fetch(`${base}${path}`, {
		redirect: "manual",
		...options,
	});
	const text = await response.text();
	let json = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = null;
	}
	return { response, json, text };
}

function getSetCookie(response) {
	const headers = response.headers;
	if (typeof headers.getSetCookie === "function") {
		return headers.getSetCookie();
	}
	const raw = headers.get("set-cookie");
	return raw ? [raw] : [];
}

function cookieHeader(setCookies) {
	return setCookies
		.map((entry) => entry.split(";")[0])
		.join("; ");
}

async function main() {
	// Validation: empty sign-up
	let { response, json } = await request("/api/auth/sign-up", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({}),
	});
	test("Sign-up empty fields returns 400", response.status === 400);
	test("Full name required message", json?.errors?.fullName === "Full Name is required.");
	test("Email required message", json?.errors?.email === "Email Address is required.");

	// Invalid email
	({ response, json } = await request("/api/auth/sign-up", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			fullName: "Jane",
			email: "bad",
			password,
			confirmPassword: password,
		}),
	}));
	test("Invalid email format message", json?.errors?.email === "Please enter a valid email address.");

	// Weak password
	({ response, json } = await request("/api/auth/sign-up", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			fullName: "Jane",
			email: "weak@example.com",
			password: "weak",
			confirmPassword: "weak",
		}),
	}));
	test("Password rules message", json?.errors?.password === "Password does not meet the required rules.");

	// Password mismatch
	({ response, json } = await request("/api/auth/sign-up", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			fullName: "Jane Doe",
			email: "mismatch@example.com",
			password,
			confirmPassword: "SecureP@ss2",
		}),
	}));
	test("Passwords mismatch message", json?.errors?.confirmPassword === "Passwords do not match.");

	// Sign-up success
	const signUpBody = {
		fullName: "Jane Doe",
		email,
		password,
		confirmPassword: password,
	};
	({ response, json } = await request("/api/auth/sign-up", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(signUpBody),
	}));
	test("Sign-up success 201", response.status === 201);
	test(
		"Sign-up success message",
		json?.message === "Account created successfully. Please sign in.",
	);

	// Duplicate email
	({ response, json } = await request("/api/auth/sign-up", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(signUpBody),
	}));
	test("Duplicate email 409", response.status === 409);
	test(
		"Duplicate email message",
		json?.error === "An account already exists with this email address.",
	);

	// Invalid sign-in
	({ response, json } = await request("/api/auth/sign-in", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password: "WrongPass1!" }),
	}));
	test("Invalid credentials 401", response.status === 401);
	test("Invalid credentials message", json?.error === "Invalid email or password.");

	// Sign-in success
	({ response, json } = await request("/api/auth/sign-in", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	}));
	const signInCookies = getSetCookie(response);
	const sessionCookie = cookieHeader(signInCookies);
	test("Sign-in success 200", response.status === 200);
	test("Sign-in redirect path", json?.redirect === "/dashboard");
	test(
		"HttpOnly session cookie set",
		signInCookies.some((c) => c.startsWith("quizmaker_session=") && c.includes("HttpOnly")),
	);

	// Session endpoint
	({ response, json } = await request("/api/auth/session", {
		headers: { Cookie: sessionCookie },
	}));
	test("Session returns user", json?.user != null);
	test("Session user has fullName", json?.user?.fullName === "Jane Doe");
	test(
		"Session response excludes password fields",
		!("password" in (json?.user ?? {})) && !("password_hash" in (json?.user ?? {})),
	);

	// Dashboard when logged in
	({ response } = await request("/dashboard", {
		headers: { Cookie: sessionCookie },
	}));
	test("Dashboard accessible when logged in", response.status === 200);

	// Logout
	({ response, json } = await request("/api/auth/logout", {
		method: "POST",
		headers: { Cookie: sessionCookie },
	}));
	const logoutCookies = getSetCookie(response);
	const clearedCookie = cookieHeader(logoutCookies);
	test("Logout success", response.status === 200);
	test(
		"Logout message",
		json?.message === "You have been logged out successfully.",
	);
	test("Logout redirect", json?.redirect === "/sign-in");

	// Session after logout
	({ response, json } = await request("/api/auth/session", {
		headers: { Cookie: clearedCookie || sessionCookie },
	}));
	test("Session null after logout", json?.user == null);

	// Dashboard after logout
	({ response } = await request("/dashboard", {
		headers: { Cookie: clearedCookie || sessionCookie },
	}));
	test("Dashboard redirects when logged out", response.status >= 300 && response.status < 400);
	const location = response.headers.get("location") ?? "";
	test(
		"Redirect includes sign-in message",
		location.includes("/sign-in") && location.includes("message="),
	);

	// Unauthenticated dashboard
	({ response } = await request("/dashboard"));
	test("Unauthenticated dashboard redirect", response.status >= 300 && response.status < 400);

	// Sign-in empty password message
	({ response, json } = await request("/api/auth/sign-in", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: "a@b.com", password: "" }),
	}));
	test("Sign-in password required message", json?.errors?.password === "Password is required.");

	const failed = results.filter((r) => !r.pass);
	for (const result of results) {
		console.log(`${result.pass ? "PASS" : "FAIL"} ${result.name}`);
	}
	console.log(`\n${results.length - failed.length}/${results.length} passed`);
	process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
