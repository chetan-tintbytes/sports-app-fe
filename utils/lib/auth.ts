"use client";

// ── Token storage ─────────────────────────────────────────────────────────────

export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

// ── JWT helpers ───────────────────────────────────────────────────────────────

interface JWTPayload {
  user_id: number;
  email: string;
  is_admin: boolean;
  org_id: number;
  exp: number;
  iat: number;
}

function decodePayload(token: string): JWTPayload | null {
  try {
    const payloadBase64 = token.split(".")[1];
    return JSON.parse(atob(payloadBase64)) as JWTPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JWTPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

// ── Primary access ────────────────────────────────────────────────────────────

/**
 * Returns the stored JWT if it exists and hasn't expired.
 * Removes it from storage and returns null if expired.
 */
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = decodePayload(token);
  if (!payload) {
    localStorage.removeItem("token");
    return null;
  }

  if (isTokenExpired(payload)) {
    localStorage.removeItem("token");
    return null;
  }

  return token;
};

export const isAuthenticated = (): boolean => !!getToken();

// ── Claims decoded from the active JWT ───────────────────────────────────────

/**
 * Returns true if the current user is an admin.
 * Every account created via /auth/signup is an admin.
 */
export const getIsAdmin = (): boolean => {
  const token = getToken();
  if (!token) return false;
  const payload = decodePayload(token);
  return payload?.is_admin ?? false;
};

/**
 * Returns the organisation ID encoded in the active JWT.
 * 0 if the user has no organisation yet (should not normally happen after signup).
 */
export const getOrgId = (): number => {
  const token = getToken();
  if (!token) return 0;
  const payload = decodePayload(token);
  return payload?.org_id ?? 0;
};

/**
 * Returns the user ID encoded in the active JWT, or 0 if not authenticated.
 */
export const getUserId = (): number => {
  const token = getToken();
  if (!token) return 0;
  const payload = decodePayload(token);
  return payload?.user_id ?? 0;
};

/**
 * Returns all decoded JWT claims for the active session, or null if not authenticated.
 */
export const getTokenClaims = (): JWTPayload | null => {
  const token = getToken();
  if (!token) return null;
  return decodePayload(token);
};