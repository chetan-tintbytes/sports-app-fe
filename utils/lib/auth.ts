"use client";

export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payloadBase64 = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    if (!decodedPayload.exp) return null;
    const isExpired = decodedPayload.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem("token");
      return null;
    }
    return token;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};