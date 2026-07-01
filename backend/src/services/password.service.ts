/**
 * password.service.ts
 * ─────────────────────────────────────────────────────────────
 * Bcrypt password hashing & verification utility.
 *
 * Uses bcryptjs (pure-JS, no native compilation required).
 * Salt rounds = 12 (OWASP-recommended minimum is 10).
 * ─────────────────────────────────────────────────────────────
 */
import bcrypt from "bcryptjs";

/** Number of bcrypt salt rounds — higher = slower but more secure */
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt.
 *
 * @param plaintext - The raw password entered by the user
 * @returns A bcrypt hash string (e.g. "$2a$12$...")
 */
export async function hashPassword(plaintext: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(plaintext, salt);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 *
 * @param plaintext - The raw password entered by the user
 * @param hash      - The stored bcrypt hash from the database
 * @returns `true` if the password matches the hash, `false` otherwise
 */
export async function verifyPassword(
    plaintext: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
}
