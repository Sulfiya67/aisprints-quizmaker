export type UserRecord = {
	id: string;
	full_name: string;
	email: string;
	password_hash: string;
	created_at: string;
	updated_at: string;
};

export type PublicUser = {
	id: string;
	fullName: string;
	email: string;
};

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function toPublicUser(user: UserRecord): PublicUser {
	return {
		id: user.id,
		fullName: user.full_name,
		email: user.email,
	};
}

export async function createUser(
	db: D1Database,
	input: { fullName: string; email: string; passwordHash: string },
): Promise<UserRecord> {
	const email = normalizeEmail(input.email);

	const result = await db
		.prepare(
			`INSERT INTO users (full_name, email, password_hash)
       VALUES (?1, ?2, ?3)
       RETURNING id, full_name, email, password_hash, created_at, updated_at`,
		)
		.bind(input.fullName.trim(), email, input.passwordHash)
		.all<UserRecord>();

	const user = result.results[0];
	if (!user) {
		throw new Error("Failed to create user");
	}

	return user;
}

export async function findUserByEmail(
	db: D1Database,
	email: string,
): Promise<UserRecord | null> {
	const result = await db
		.prepare(
			`SELECT id, full_name, email, password_hash, created_at, updated_at
       FROM users
       WHERE email = ?1`,
		)
		.bind(normalizeEmail(email))
		.all<UserRecord>();

	return result.results[0] ?? null;
}

export async function findUserById(
	db: D1Database,
	id: string,
): Promise<UserRecord | null> {
	const result = await db
		.prepare(
			`SELECT id, full_name, email, password_hash, created_at, updated_at
       FROM users
       WHERE id = ?1`,
		)
		.bind(id)
		.all<UserRecord>();

	return result.results[0] ?? null;
}

export function isUniqueConstraintError(error: unknown): boolean {
	return (
		error instanceof Error &&
		(error.message.includes("UNIQUE constraint failed") ||
			error.message.includes("SQLITE_CONSTRAINT_UNIQUE"))
	);
}
