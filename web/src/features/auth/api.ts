import type { LoginPayload, RegisterPayload, AuthResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }

  return res.json();
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Registration failed');
  }

  return res.json();
}