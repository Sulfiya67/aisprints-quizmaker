/**
 * MCQ Phase 5 verification — run against `npm run preview` (http://127.0.0.1:8787).
 *
 * Creates two users to verify ownership isolation, then exercises MCQ CRUD,
 * validation, attempts, and auth edge cases via the API.
 */
const base = process.env.PREVIEW_URL ?? "http://127.0.0.1:8787";
const password = "SecureP@ss1";
const stamp = Date.now();
const userAEmail = `mcq-a-${stamp}@example.com`;
const userBEmail = `mcq-b-${stamp}@example.com`;

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

async function signUpAndSignIn(email, fullName) {
	await request("/api/auth/sign-up", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			fullName,
			email,
			password,
			confirmPassword: password,
		}),
	});

	const { response, json } = await request("/api/auth/sign-in", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	return {
		cookie: cookieHeader(getSetCookie(response)),
		ok: response.status === 200 && json?.redirect === "/dashboard",
	};
}

function validMcqBody(overrides = {}) {
	return {
		name: "Capital cities",
		question: "What is the capital of France?",
		choices: [
			{ choiceText: "Paris", isCorrect: true },
			{ choiceText: "Lyon", isCorrect: false },
		],
		...overrides,
	};
}

async function main() {
	// Unauthenticated MCQ API
	let { response, json } = await request("/api/mcqs");
	test("Unauthenticated list returns 401", response.status === 401);
	test(
		"Unauthenticated error message",
		json?.error === "Please sign in to continue.",
	);

	// Dashboard redirect when logged out
	({ response } = await request("/dashboard"));
	test("Dashboard redirects when logged out", response.status >= 300 && response.status < 400);

	const userA = await signUpAndSignIn(userAEmail, "Alice Author");
	test("User A sign-in succeeds", userA.ok);

	const userB = await signUpAndSignIn(userBEmail, "Bob Other");
	test("User B sign-in succeeds", userB.ok);

	// Validation: one choice
	({ response, json } = await request("/api/mcqs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify(
			validMcqBody({
				choices: [{ choiceText: "Only", isCorrect: true }],
			}),
		),
	}));
	test("One choice returns 400", response.status === 400);
	test(
		"One choice error message",
		json?.errors?.choices === "At least 2 choices are required.",
	);

	// Validation: seven choices
	({ response, json } = await request("/api/mcqs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify(
			validMcqBody({
				choices: Array.from({ length: 7 }, (_, index) => ({
					choiceText: `Choice ${index + 1}`,
					isCorrect: index === 0,
				})),
			}),
		),
	}));
	test("Seven choices returns 400", response.status === 400);
	test(
		"Seven choices error message",
		json?.errors?.choices === "You can add up to 6 choices.",
	);

	// Validation: no correct choice
	({ response, json } = await request("/api/mcqs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify(
			validMcqBody({
				choices: [
					{ choiceText: "Paris", isCorrect: false },
					{ choiceText: "Lyon", isCorrect: false },
				],
			}),
		),
	}));
	test("No correct choice returns 400", response.status === 400);
	test(
		"No correct choice error message",
		json?.errors?.choices === "Select exactly one correct answer.",
	);

	// Validation: two correct choices
	({ response, json } = await request("/api/mcqs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify(
			validMcqBody({
				choices: [
					{ choiceText: "Paris", isCorrect: true },
					{ choiceText: "Lyon", isCorrect: true },
				],
			}),
		),
	}));
	test("Two correct choices returns 400", response.status === 400);
	test(
		"Two correct choices error message",
		json?.errors?.choices === "Only one choice can be marked correct.",
	);

	// Create MCQ
	({ response, json } = await request("/api/mcqs", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify(validMcqBody()),
	}));
	test("Create MCQ returns 201", response.status === 201);
	test("Create MCQ has id", typeof json?.id === "string" && json.id.length > 0);
	test("Create MCQ has two choices", json?.choices?.length === 2);

	const mcqId = json?.id;
	const correctChoiceId = json?.choices?.find((c) => c.isCorrect)?.id;
	const wrongChoiceId = json?.choices?.find((c) => !c.isCorrect)?.id;

	// List MCQs
	({ response, json } = await request("/api/mcqs", {
		headers: { Cookie: userA.cookie },
	}));
	test("List MCQs returns 200", response.status === 200);
	test("List includes created MCQ", json?.mcqs?.some((m) => m.id === mcqId));

	// Dashboard accessible
	({ response } = await request("/dashboard", {
		headers: { Cookie: userA.cookie },
	}));
	test("Dashboard accessible when logged in", response.status === 200);

	// User B cannot access User A's MCQ
	({ response, json } = await request(`/api/mcqs/${mcqId}`, {
		headers: { Cookie: userB.cookie },
	}));
	test("Cross-user GET returns 404", response.status === 404);
	test("Cross-user GET message", json?.error === "Question not found.");

	({ response } = await request(`/api/mcqs/${mcqId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Cookie: userB.cookie,
		},
		body: JSON.stringify(validMcqBody({ name: "Hijacked" })),
	}));
	test("Cross-user PUT returns 404", response.status === 404);

	({ response } = await request(`/api/mcqs/${mcqId}`, {
		method: "DELETE",
		headers: { Cookie: userB.cookie },
	}));
	test("Cross-user DELETE returns 404", response.status === 404);

	// Correct attempt
	({ response, json } = await request(`/api/mcqs/${mcqId}/attempts`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify({ selectedChoiceId: correctChoiceId }),
	}));
	test("Correct attempt returns 201", response.status === 201);
	test("Correct attempt isCorrect true", json?.isCorrect === true);
	test("Correct attempt message", json?.message === "Correct!");

	// Incorrect attempt
	({ response, json } = await request(`/api/mcqs/${mcqId}/attempts`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify({ selectedChoiceId: wrongChoiceId }),
	}));
	test("Incorrect attempt returns 201", response.status === 201);
	test("Incorrect attempt isCorrect false", json?.isCorrect === false);
	test("Incorrect attempt message", json?.message === "Incorrect.");

	// Update MCQ
	({ response, json } = await request(`/api/mcqs/${mcqId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Cookie: userA.cookie,
		},
		body: JSON.stringify(
			validMcqBody({
				name: "Updated capitals",
				question: "What is the capital of Germany?",
				choices: [
					{ choiceText: "Berlin", isCorrect: true },
					{ choiceText: "Munich", isCorrect: false },
					{ choiceText: "Hamburg", isCorrect: false },
				],
			}),
		),
	}));
	test("Update MCQ returns 200", response.status === 200);
	test("Update MCQ name changed", json?.name === "Updated capitals");
	test("Update MCQ has three choices", json?.choices?.length === 3);

	// Delete MCQ
	({ response, json } = await request(`/api/mcqs/${mcqId}`, {
		method: "DELETE",
		headers: { Cookie: userA.cookie },
	}));
	test("Delete MCQ returns 200", response.status === 200);
	test(
		"Delete MCQ message",
		json?.message === "Question deleted successfully.",
	);

	({ response, json } = await request(`/api/mcqs/${mcqId}`, {
		headers: { Cookie: userA.cookie },
	}));
	test("Deleted MCQ GET returns 404", response.status === 404);

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
