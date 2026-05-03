import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { AuthUser } from "@memelli/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 12;

// ─── JWT ─────────────────────────────────────────────────────────────────────

export function signToken(payload: AuthUser, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: (expiresIn || JWT_EXPIRES_IN) as any });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export function decodeToken(token: string): AuthUser | null {
  try {
    return jwt.decode(token) as AuthUser;
  } catch {
    return null;
  }
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Middleware helpers ────────────────────────────────────────────────────────

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function requireRole(user: AuthUser, roles: AuthUser["role"][]): boolean {
  return roles.includes(user.role);
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === "ADMIN" || user.role === "SUPER_ADMIN";
}

export type { AuthUser };
