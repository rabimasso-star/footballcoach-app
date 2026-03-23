import { apiFetch } from "@/lib/api";
import type { LoginPayload, RegisterPayload } from "./types";

export function loginRequest(payload: LoginPayload) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerRequest(payload: RegisterPayload) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}