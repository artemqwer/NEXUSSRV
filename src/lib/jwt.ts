import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret_min_32_chars!!";
const secret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  sub: string;          // login
  displayName: string;
  role: string;
}

/** Підписуємо JWT (живе 7 днів) */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/** Перевіряємо JWT і повертаємо payload або null */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "nexussrv_token";
