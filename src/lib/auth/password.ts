const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function toBase64(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await deriveKey(password, salt);
	return `pbkdf2:sha256:${PBKDF2_ITERATIONS}:${toBase64(salt)}:${toBase64(hash)}`;
}

export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	const parts = storedHash.split(":");
	if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
		return false;
	}

	const iterations = Number.parseInt(parts[2] ?? "", 10);
	if (!Number.isFinite(iterations) || iterations <= 0) {
		return false;
	}

	const salt = fromBase64(parts[3] ?? "");
	const expectedHash = fromBase64(parts[4] ?? "");
	const actualHash = await deriveKey(password, salt, iterations);

	if (actualHash.length !== expectedHash.length) {
		return false;
	}

	let mismatch = 0;
	for (let i = 0; i < actualHash.length; i++) {
		mismatch |= (actualHash[i] ?? 0) ^ (expectedHash[i] ?? 0);
	}

	return mismatch === 0;
}

async function deriveKey(
	password: string,
	salt: Uint8Array,
	iterations = PBKDF2_ITERATIONS,
): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const saltBytes = new Uint8Array(salt);
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: saltBytes,
			iterations,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_BYTES * 8,
	);

	return new Uint8Array(derivedBits);
}
