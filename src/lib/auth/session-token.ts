import { getSessionSecret } from "@/lib/auth/env";

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

async function getSigningKey(secret: string): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	return crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

export async function signSessionToken(sessionId: string): Promise<string> {
	const secret = await getSessionSecret();
	if (!secret) {
		throw new Error("SESSION_SECRET is not configured");
	}

	const key = await getSigningKey(secret);
	const encoder = new TextEncoder();
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(sessionId),
	);
	return `${sessionId}.${toBase64(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
	token: string,
): Promise<string | null> {
	const secret = await getSessionSecret();
	if (!secret) {
		return null;
	}

	const separatorIndex = token.lastIndexOf(".");
	if (separatorIndex === -1) {
		return null;
	}

	const sessionId = token.slice(0, separatorIndex);
	const signature = token.slice(separatorIndex + 1);
	if (!sessionId || !signature) {
		return null;
	}

	try {
		const key = await getSigningKey(secret);
		const encoder = new TextEncoder();
		const isValid = await crypto.subtle.verify(
			"HMAC",
			key,
			new Uint8Array(fromBase64(signature)),
			encoder.encode(sessionId),
		);
		return isValid ? sessionId : null;
	} catch {
		return null;
	}
}
