import bcrypt from 'bcryptjs'

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a random fingerprint for anti-fraud
 */
export function generateFingerprint(ip: string, userAgent: string): string {
    const data = `${ip}-${userAgent}-${Date.now()}`
    return bcrypt.hashSync(data, 10)
}
