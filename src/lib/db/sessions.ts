export type SessionRecord = {
	id: string;
	user_id: string;
	expires_at: string;
	created_at: string;
};

export type SessionWithUser = SessionRecord & {
	full_name: string;
	email: string;
};

function isExpired(expiresAt: string): boolean {
	return new Date(expiresAt).getTime() <= Date.now();
}

export async function createSessionRecord(
	db: D1Database,
	userId: string,
	expiresAt: Date,
): Promise<SessionRecord> {
	const result = await db
		.prepare(
			`INSERT INTO sessions (user_id, expires_at)
       VALUES (?1, ?2)
       RETURNING id, user_id, expires_at, created_at`,
		)
		.bind(userId, expiresAt.toISOString())
		.all<SessionRecord>();

	const session = result.results[0];
	if (!session) {
		throw new Error("Failed to create session");
	}

	return session;
}

export async function findValidSessionWithUser(
	db: D1Database,
	sessionId: string,
): Promise<SessionWithUser | null> {
	const result = await db
		.prepare(
			`SELECT s.id, s.user_id, s.expires_at, s.created_at, u.full_name, u.email
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.id = ?1`,
		)
		.bind(sessionId)
		.all<SessionWithUser>();

	const session = result.results[0];
	if (!session || isExpired(session.expires_at)) {
		if (session) {
			await deleteSessionRecord(db, sessionId);
		}
		return null;
	}

	return session;
}

export async function deleteSessionRecord(
	db: D1Database,
	sessionId: string,
): Promise<void> {
	await db.prepare(`DELETE FROM sessions WHERE id = ?1`).bind(sessionId).run();
}

export async function deleteSessionsForUser(
	db: D1Database,
	userId: string,
): Promise<void> {
	await db
		.prepare(`DELETE FROM sessions WHERE user_id = ?1`)
		.bind(userId)
		.run();
}
