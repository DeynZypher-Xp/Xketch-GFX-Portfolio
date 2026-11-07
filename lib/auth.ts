import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@xketch2026";
const AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || "xketch-secret-salt-key-2026";

/**
 * Creates a signed admin token with timestamp and HMAC signature.
 */
export function createAdminToken(): string {
  const timestamp = Date.now().toString();
  const data = `admin:${timestamp}`;
  const hmac = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("hex");
  return Buffer.from(`${data}:${hmac}`).toString("base64");
}

/**
 * Verifies if an admin token is valid and not expired (24 hours validity).
 */
export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [user, timestampStr, signature] = parts;
    if (user !== "admin") return false;

    const timestamp = parseInt(timestampStr, 10);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - timestamp > maxAge) {
      return false; // Token expired
    }

    const expectedData = `admin:${timestampStr}`;
    const expectedHmac = crypto.createHmac("sha256", AUTH_SECRET).update(expectedData).digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

/**
 * Validates the entered password against configured admin password.
 */
export function validateAdminPassword(password: string): boolean {
  if (!password) return false;
  return password === ADMIN_PASSWORD;
}
