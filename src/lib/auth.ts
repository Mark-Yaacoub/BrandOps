import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

/**
 * Hash a plain text password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a hash
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Sign a JWT token
 */
export function signJwt(payload: JwtPayload, expiresIn: string = "7d"): string {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload as any, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a random token for password reset
 */
export function generateResetToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a random temporary password
 */
export function generateTempPassword(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(8).toString("hex");
}
